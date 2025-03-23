import db from "../models/index.js"; // Import db từ models
import util from "./common.js"; // Import db từ models
import { Op, Sequelize } from 'sequelize'; // Import Op và Sequelize từ sequelize để sử dụng các hàm tổng hợp
const { ImportOrders, ImportOrderDetails, Book, OrderStatusLogs, Fault, Stock, User, Category, Author, Publisher, Cart, Bin, BookBin } = db; // Destructure các model cần thiết

//#region ADD
export const getDashboardData = async (req, res) => {
    try {
        // Lấy thời gian hiện tại để tính toán dữ liệu gần đây
        const currentDate = new Date();
        const lastMonthDate = new Date();
        lastMonthDate.setMonth(lastMonthDate.getMonth() - 1);
        
        // 1. Thống kê người dùng
        const totalUsers = await User.count();
        const totalActiveUsers = await User.count({ where: { Status: 'Active' } });
        const totalInactiveUsers = await User.count({ where: { Status: 'Inactive' } });
        const recentUsers = await User.count({
            where: {
                Created_date: {
                    [Op.gte]: lastMonthDate
                }
            }
        });
        
        const usersByRole = await User.findAll({
            attributes: ['Role', [Sequelize.fn('COUNT', Sequelize.col('UserId')), 'count']],
            group: ['Role']
        });
        
        // 2. Thống kê sách
        const totalBooks = await Book.count();
        const totalBookQuantity = await Stock.sum('Quantity');
        
        const booksByCategory = await Book.findAll({
            include: [{
                model: Category,
                attributes: ['CategoryName']
            }],
            attributes: ['CategoryId', [Sequelize.fn('COUNT', Sequelize.col('BookId')), 'count']],
            group: ['CategoryId', 'Category.CategoryName'],
            raw: true,
            nest: true
        });
        
        const recentBooks = await Book.count({
            where: {
                Created_date: {
                    [Op.gte]: lastMonthDate
                }
            }
        });
        
        // 3. Thống kê đơn nhập hàng
        const totalImportOrders = await ImportOrders.count();
        const newImportOrders = await ImportOrders.count({ where: { Status: 'New' } });
        const approvedImportOrders = await ImportOrders.count({ where: { Status: 'Approve' } });
        const receivedImportOrders = await ImportOrders.count({ where: { Status: 'Receive' } });
        const approveImportOrders = await ImportOrders.count({ where: { Status: 'ApproveImport' } });
        
        const recentImportOrders = await ImportOrders.count({
            where: {
                ImportDate: {
                    [Op.gte]: lastMonthDate
                }
            }
        });
        
        // Tổng giá trị đơn nhập hàng
        const totalImportValue = await ImportOrderDetails.findOne({
            attributes: [[Sequelize.fn('SUM', Sequelize.literal('Quantity * Price')), 'totalValue']],
            raw: true
        });
        
        // 4. Thống kê tồn kho
        const lowStockItems = await Stock.count({
            where: Sequelize.literal('Quantity < MinStockQuantity AND MinStockQuantity > 0')
        });
        
        const overStockItems = await Stock.count({
            where: Sequelize.literal('Quantity > MaxStockQuantity AND MaxStockQuantity > 0')
        });
        
        // Sách có số lượng tồn kho nhiều nhất
        const topStockedBooks = await Stock.findAll({
            include: [{
                model: Book,
                attributes: ['Title']
            }],
            order: [['Quantity', 'DESC']],
            limit: 5,
            raw: true,
            nest: true
        });
        
        // 5. Thống kê lỗi
        const totalFaults = await Fault.count();
        const recentFaults = await Fault.count({
            where: {
                FaultDate: {
                    [Op.gte]: lastMonthDate
                }
            }
        });
        
        // 6. Thống kê bin
        const totalBins = await Bin.count();
        const availableBins = await Bin.count({
            where: Sequelize.literal('Quantity_Current < Quantity_Max')
        });
        const fullBins = await Bin.count({
            where: Sequelize.literal('Quantity_Current >= Quantity_Max')
        });
        
        // 7. Phân bổ sách trong bin
        const booksInBins = await BookBin.count({ distinct: true, col: 'BookId' });
        
        // 8. Thống kê nhà xuất bản và tác giả
        const totalPublishers = await Publisher.count();
        const totalAuthors = await Author.count();
        const totalCategories = await Category.count();
        
        // Tổng hợp tất cả thông tin
        const dashboardData = {
            usersStats: {
                totalUsers,
                totalActiveUsers,
                totalInactiveUsers,
                recentUsers,
                usersByRole
            },
            booksStats: {
                totalBooks,
                totalBookQuantity,
                recentBooks,
                booksByCategory
            },
            importOrdersStats: {
                totalImportOrders,
                newImportOrders,
                approvedImportOrders,
                receivedImportOrders,
                approveImportOrders,
                recentImportOrders,
                totalImportValue: totalImportValue?.totalValue || 0
            },
            stockStats: {
                totalStockQuantity: totalBookQuantity,
                lowStockItems,
                overStockItems,
                topStockedBooks
            },
            faultsStats: {
                totalFaults,
                recentFaults
            },
            binsStats: {
                totalBins,
                availableBins,
                fullBins,
                booksInBins
            },
            metadataStats: {
                totalPublishers,
                totalAuthors,
                totalCategories
            }
        };
        
        // Trả về phản hồi thành công
        res.status(200).json({
            message: 'OK',
            data: dashboardData
        });
    } catch (error) {
        console.error('Dashboard data error:', error);
        res.status(500).json({
            message: 'Đã xảy ra lỗi khi lấy dữ liệu dashboard!',
            error: error.message,
        });
    }
};
