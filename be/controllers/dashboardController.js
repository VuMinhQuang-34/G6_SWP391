import db from "../models/index.js"; // Import db từ models
import util from "./common.js"; // Import db từ models
import { Op, Sequelize } from 'sequelize'; // Import Op và Sequelize từ sequelize để sử dụng các hàm tổng hợp
const {
    ImportOrders,
    ImportOrderDetails,
    ExportOrders,
    ExportOrderDetails,
    Book,
    User,
    Role,
    Category,
    Stock,
    Fault,
    OrderStatusLogs,
    Bin,
    BookBin,
    Shelf,
    Warehouse
} = db; // Destructure các model cần thiết

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
                Created_Date: {
                    [Op.gte]: lastMonthDate
                }
            }
        });

        // Thống kê người dùng theo vai trò - không sử dụng include
        // Lấy tất cả người dùng và roles riêng biệt, sau đó map thủ công
        const allUsers = await User.findAll({
            attributes: ['userId', 'roleId'],
            raw: true
        });
        const allRoles = await Role.findAll({
            attributes: ['roleId', 'Role_Name'],
            raw: true
        });

        // Map dữ liệu và đếm theo vai trò
        const rolesMap = allRoles.reduce((acc, role) => {
            acc[role.roleId] = role.Role_Name;
            return acc;
        }, {});

        const usersByRoleCount = allUsers.reduce((acc, user) => {
            const roleName = rolesMap[user.roleId] || 'Không xác định';
            acc[roleName] = (acc[roleName] || 0) + 1;
            return acc;
        }, {});

        const usersByRole = Object.entries(usersByRoleCount).map(([Role, count]) => ({
            Role,
            count
        }));

        // 2. Thống kê sách
        const totalBooks = await Book.count();
        const totalBookQuantity = await Stock.sum('Quantity') || 0;

        // Sách theo thể loại - không sử dụng include
        const allBooks = await Book.findAll({
            attributes: ['BookId', 'CategoryId'],
            raw: true
        });
        const allCategories = await Category.findAll({
            attributes: ['categoryId', 'CategoryName'],
            raw: true
        });

        // Map Category và đếm sách theo thể loại
        const categoriesMap = allCategories.reduce((acc, category) => {
            acc[category.categoryId] = category.CategoryName;
            return acc;
        }, {});

        const booksByCategoryCount = allBooks.reduce((acc, book) => {
            if (!book.CategoryId) return acc;

            const categoryId = book.CategoryId;
            if (!acc[categoryId]) {
                acc[categoryId] = {
                    CategoryId: categoryId,
                    count: 0,
                    Category: { CategoryName: categoriesMap[categoryId] || 'Không xác định' }
                };
            }
            acc[categoryId].count += 1;
            return acc;
        }, {});

        const booksByCategory = Object.values(booksByCategoryCount);

        const recentBooks = await Book.count({
            where: {
                Created_Date: {
                    [Op.gte]: lastMonthDate
                }
            }
        });

        // Thống kê theo ngôn ngữ
        const booksByLanguage = await Book.findAll({
            attributes: [
                'Language',
                [Sequelize.fn('COUNT', Sequelize.col('BookId')), 'count']
            ],
            group: ['Language'],
            raw: true
        });

        // Thống kê theo năm xuất bản
        const booksByYear = await Book.findAll({
            attributes: [
                'PublishingYear',
                [Sequelize.fn('COUNT', Sequelize.col('BookId')), 'count']
            ],
            where: {
                PublishingYear: {
                    [Op.not]: null
                }
            },
            order: [['PublishingYear', 'DESC']],
            limit: 10,
            group: ['PublishingYear'],
            raw: true
        });

        // 3. Thống kê đơn nhập hàng
        const totalImportOrders = await ImportOrders.count();
        const newImportOrders = await ImportOrders.count({ where: { Status: 'New' } });
        const approvedImportOrders = await ImportOrders.count({ where: { Status: 'Approve' } });
        const receivedImportOrders = await ImportOrders.count({ where: { Status: 'Receive' } });
        const approveImportOrders = await ImportOrders.count({ where: { Status: 'ApproveImport' } });

        const recentImportOrders = await ImportOrders.count({
            where: {
                Created_Date: {
                    [Op.gte]: lastMonthDate
                }
            }
        });

        // Tổng giá trị đơn nhập hàng
        const totalImportValue = await ImportOrderDetails.findOne({
            attributes: [[Sequelize.fn('SUM', Sequelize.literal('Quantity * Price')), 'totalValue']],
            raw: true
        });

        // 4. Thống kê đơn xuất hàng
        const totalExportOrders = await ExportOrders.count();
        const newExportOrders = await ExportOrders.count({ where: { Status: 'New' } });
        const approvedExportOrders = await ExportOrders.count({ where: { Status: 'Approved' } });
        const completedExportOrders = await ExportOrders.count({ where: { Status: 'Completed' } });
        const cancelledExportOrders = await ExportOrders.count({ where: { Status: 'Cancelled' } });

        const recentExportOrders = await ExportOrders.count({
            where: {
                Created_Date: {
                    [Op.gte]: lastMonthDate
                }
            }
        });

        // Tổng giá trị đơn xuất hàng
        const totalExportValue = await ExportOrderDetails.findOne({
            attributes: [[Sequelize.fn('SUM', Sequelize.literal('Quantity * UnitPrice')), 'totalValue']],
            raw: true
        });

        // 5. Thống kê tồn kho
        const lowStockItems = await Stock.count({
            where: Sequelize.literal('Quantity < MinStockQuantity AND MinStockQuantity > 0')
        });

        const overStockItems = await Stock.count({
            where: Sequelize.literal('Quantity > MaxStockQuantity AND MaxStockQuantity > 0')
        });

        // Sách có số lượng tồn kho nhiều nhất - không sử dụng include
        const topStockedItems = await Stock.findAll({
            attributes: ['BookId', 'Quantity'],
            order: [['Quantity', 'DESC']],
            limit: 5,
            raw: true
        });

        // Lấy thông tin sách từ BookId
        const topBookIds = topStockedItems.map(item => item.BookId);
        const topBooks = await Book.findAll({
            attributes: ['BookId', 'Title', 'Author'],
            where: {
                BookId: {
                    [Op.in]: topBookIds
                }
            },
            raw: true
        });

        // Map sách vào kết quả tồn kho
        const booksMap = topBooks.reduce((acc, book) => {
            acc[book.BookId] = book;
            return acc;
        }, {});

        const topStockedBooks = topStockedItems.map(item => ({
            ...item,
            Book: booksMap[item.BookId] || { Title: 'Không xác định', Author: 'Không xác định' }
        }));

        // Sách có số lượng tồn kho thấp nhất - không sử dụng include
        const lowStockedItems = await Stock.findAll({
            attributes: ['BookId', 'Quantity'],
            where: {
                Quantity: {
                    [Op.gt]: 0
                }
            },
            order: [['Quantity', 'ASC']],
            limit: 5,
            raw: true
        });

        // Lấy thông tin sách từ BookId
        const lowBookIds = lowStockedItems.map(item => item.BookId);
        const lowBooks = await Book.findAll({
            attributes: ['BookId', 'Title', 'Author'],
            where: {
                BookId: {
                    [Op.in]: lowBookIds
                }
            },
            raw: true
        });

        // Map sách vào kết quả tồn kho thấp
        const lowBooksMap = lowBooks.reduce((acc, book) => {
            acc[book.BookId] = book;
            return acc;
        }, {});

        const lowStockedBooks = lowStockedItems.map(item => ({
            ...item,
            Book: lowBooksMap[item.BookId] || { Title: 'Không xác định', Author: 'Không xác định' }
        }));

        // 6. Thống kê lỗi
        const totalFaults = await Fault.count();
        const recentFaults = await Fault.count({
            where: {
                FaultDate: {
                    [Op.gte]: lastMonthDate
                }
            }
        });

        // Lỗi theo loại đơn hàng
        const faultsByOrderType = await Fault.findAll({
            attributes: [
                'OrderType',
                [Sequelize.fn('COUNT', Sequelize.col('FaultId')), 'count'],
                [Sequelize.fn('SUM', Sequelize.col('Quantity')), 'totalQuantity']
            ],
            group: ['OrderType'],
            raw: true
        });

        // Lỗi gần đây - không sử dụng include
        const recentFaultsData = await Fault.findAll({
            attributes: ['FaultId', 'BookId', 'CreatedBy', 'Quantity', 'FaultDate', 'OrderType'],
            order: [['FaultDate', 'DESC']],
            limit: 5,
            raw: true
        });

        // Lấy thông tin sách và người dùng cần thiết
        const faultBookIds = recentFaultsData.map(fault => fault.BookId);
        const faultUserIds = recentFaultsData.map(fault => fault.CreatedBy);

        const faultBooks = await Book.findAll({
            attributes: ['BookId', 'Title'],
            where: {
                BookId: {
                    [Op.in]: faultBookIds
                }
            },
            raw: true
        });

        const faultUsers = await User.findAll({
            attributes: ['userId', 'FullName'],
            where: {
                userId: {
                    [Op.in]: faultUserIds
                }
            },
            raw: true
        });

        // Map thông tin sách và người dùng vào lỗi
        const faultBooksMap = faultBooks.reduce((acc, book) => {
            acc[book.BookId] = book;
            return acc;
        }, {});

        const faultUsersMap = faultUsers.reduce((acc, user) => {
            acc[user.userId] = user;
            return acc;
        }, {});

        const recentFaultsList = recentFaultsData.map(fault => ({
            ...fault,
            Book: faultBooksMap[fault.BookId] || { Title: 'Không xác định' },
            User: faultUsersMap[fault.CreatedBy] || { FullName: 'Không xác định' }
        }));

        // 7. Thống kê OrderStatusLogs
        const totalStatusChanges = await OrderStatusLogs.count();
        const recentStatusChanges = await OrderStatusLogs.count({
            where: {
                Created_Date: {
                    [Op.gte]: lastMonthDate
                }
            }
        });

        // Phân loại theo loại đơn hàng
        const statusChangesByOrderType = await OrderStatusLogs.findAll({
            attributes: [
                'OrderType',
                [Sequelize.fn('COUNT', Sequelize.col('LogId')), 'count']
            ],
            group: ['OrderType'],
            raw: true
        });

        // Trạng thái phổ biến nhất
        const mostCommonStatus = await OrderStatusLogs.findAll({
            attributes: [
                'Status',
                [Sequelize.fn('COUNT', Sequelize.col('LogId')), 'count']
            ],
            group: ['Status'],
            order: [[Sequelize.literal('count'), 'DESC']],
            limit: 5,
            raw: true
        });

        // 8. Thống kê bin và kho
        const totalBins = await Bin.count();
        const totalShelves = await Shelf.count();
        const totalWarehouses = await Warehouse.count();

        const availableBins = await Bin.count({
            where: Sequelize.literal('Quantity_Current < Quantity_Max_Limit')
        });

        const fullBins = await Bin.count({
            where: Sequelize.literal('Quantity_Current >= Quantity_Max_Limit')
        });

        // Sách đã phân bổ vào bin
        const booksInBins = await BookBin.count({
            distinct: true,
            col: 'BookId'
        });

        // Thống kê sách và bin
        const booksPerBin = await BookBin.findAll({
            attributes: [
                'BinId',
                [Sequelize.fn('COUNT', Sequelize.col('BookId')), 'bookCount'],
                [Sequelize.fn('SUM', Sequelize.col('Quantity')), 'totalQuantity']
            ],
            group: ['BinId'],
            order: [[Sequelize.literal('totalQuantity'), 'DESC']],
            limit: 5,
            raw: true
        });

        // 9. Thống kê metadata bổ sung
        const totalAuthors = await Book.count({
            distinct: true,
            col: 'Author'
        });

        const totalPublishers = await Book.count({
            distinct: true,
            col: 'Publisher'
        });

        const totalCategories = await Category.count();

        // 10. Thống kê đơn hàng theo thời gian
        // Lấy 6 tháng gần nhất
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
        sixMonthsAgo.setDate(1);
        sixMonthsAgo.setHours(0, 0, 0, 0);

        // Format date để group theo tháng-năm
        const importOrdersByMonth = await ImportOrders.findAll({
            attributes: [
                [Sequelize.fn('DATE_FORMAT', Sequelize.col('Created_Date'), '%Y-%m'), 'month'],
                [Sequelize.fn('COUNT', Sequelize.col('ImportOrderId')), 'count']
            ],
            where: {
                Created_Date: {
                    [Op.gte]: sixMonthsAgo
                }
            },
            group: [Sequelize.fn('DATE_FORMAT', Sequelize.col('Created_Date'), '%Y-%m')],
            order: [[Sequelize.literal('month'), 'ASC']],
            raw: true
        });

        const exportOrdersByMonth = await ExportOrders.findAll({
            attributes: [
                [Sequelize.fn('DATE_FORMAT', Sequelize.col('Created_Date'), '%Y-%m'), 'month'],
                [Sequelize.fn('COUNT', Sequelize.col('ExportOrderId')), 'count']
            ],
            where: {
                Created_Date: {
                    [Op.gte]: sixMonthsAgo
                }
            },
            group: [Sequelize.fn('DATE_FORMAT', Sequelize.col('Created_Date'), '%Y-%m')],
            order: [[Sequelize.literal('month'), 'ASC']],
            raw: true
        });

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
                booksByCategory,
                booksByLanguage,
                booksByYear
            },
            importOrdersStats: {
                totalImportOrders,
                newImportOrders,
                approvedImportOrders,
                receivedImportOrders,
                approveImportOrders,
                recentImportOrders,
                totalImportValue: totalImportValue?.totalValue || 0,
                importOrdersByMonth
            },
            exportOrdersStats: {
                totalExportOrders,
                newExportOrders,
                approvedExportOrders,
                completedExportOrders,
                cancelledExportOrders,
                recentExportOrders,
                totalExportValue: totalExportValue?.totalValue || 0,
                exportOrdersByMonth
            },
            stockStats: {
                totalStockQuantity: totalBookQuantity,
                lowStockItems,
                overStockItems,
                topStockedBooks,
                lowStockedBooks
            },
            faultsStats: {
                totalFaults,
                recentFaults,
                faultsByOrderType,
                recentFaultsList
            },
            statusLogsStats: {
                totalStatusChanges,
                recentStatusChanges,
                statusChangesByOrderType,
                mostCommonStatus
            },
            warehouseStats: {
                totalWarehouses,
                totalShelves,
                totalBins,
                availableBins,
                fullBins,
                booksInBins,
                booksPerBin,
                utilizationRate: totalBins > 0 ? Math.round((fullBins / totalBins) * 100) : 0
            },
            metadataStats: {
                totalPublishers,
                totalAuthors,
                totalCategories
            },
            timelineStats: {
                importOrdersByMonth,
                exportOrdersByMonth
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
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};
