import db from '../models/index.js';
import { validateExportOrder } from '../validations/exportOrderValidation.js';
import ApiError from '../utils/ApiError.js';
import httpStatus from 'http-status';

const { ExportOrders, ExportOrderDetails, User, Book } = db;
const { Op } = db.Sequelize;

// Controller tạo đơn hàng xuất
export const createExportOrder = async (req, res, next) => {
    try {
        const { items, note } = req.body;

        // Validate input
        if (!items || !Array.isArray(items) || items.length === 0) {
            throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid input data');
        }

        // Create export order
        const exportOrder = await ExportOrders.create({
            CreatedBy: req.user.userId,
            Status: 'New',
            Created_Date: new Date(),
            Note: note
        });

        // Create order details
        if (items && items.length > 0) {
            const orderDetails = items.map(item => ({
                ExportOrderId: exportOrder.ExportOrderId,
                BookId: item.productId,
                Quantity: item.quantity,
                UnitPrice: item.price,
                Note: item.note
            }));

            await ExportOrderDetails.bulkCreate(orderDetails);
        }

        // Fetch complete order with associations
        const savedOrder = await ExportOrders.findOne({
            where: { ExportOrderId: exportOrder.ExportOrderId },
            include: [
                {
                    model: ExportOrderDetails,
                    include: [{
                        model: Book,
                        attributes: ['BookId', 'Title', 'Price']
                    }]
                },
                {
                    model: User,
                    as: 'Creator',
                    attributes: ['userId', 'FullName']
                }
            ]
        });

        // Format response
        const formattedOrder = {
            id: savedOrder.ExportOrderId,
            createdBy: savedOrder.Creator?.FullName,
            status: savedOrder.Status,
            orderDate: savedOrder.Created_Date,
            note: savedOrder.Note,
            items: savedOrder.ExportOrderDetails.map(detail => ({
                productId: detail.Book.BookId,
                productName: detail.Book.Title,
                quantity: detail.Quantity,
                unitPrice: detail.UnitPrice,
                note: detail.Note
            }))
        };

        res.status(httpStatus.CREATED).json(formattedOrder);
    } catch (error) {
        console.error('Error in createExportOrder:', error);
        next(error);
    }
};

// Controller lấy danh sách đơn hàng xuất
export const getExportOrders = async (req, res, next) => {
    try {
        const { page = 1, limit = 10, status, fromDate, toDate, searchId } = req.query;
        const offset = (page - 1) * limit;

        // Xây dựng điều kiện query
        const whereConditions = {};
        if (status) whereConditions.Status = status;
        if (searchId) whereConditions.ExportOrderId = { [Op.like]: `%${searchId}%` };
        if (fromDate || toDate) {
            whereConditions.Created_Date = {};
            if (fromDate) whereConditions.Created_Date[Op.gte] = new Date(fromDate);
            if (toDate) whereConditions.Created_Date[Op.lte] = new Date(toDate);
        }

        const { count, rows } = await ExportOrders.findAndCountAll({
            where: whereConditions,
            include: [
                {
                    model: User,
                    as: 'Creator',
                    attributes: ['userId', 'FullName']
                },
                {
                    model: User,
                    as: 'Approver',
                    attributes: ['userId', 'FullName']
                },
                {
                    model: ExportOrderDetails,
                    include: [{
                        model: Book,
                        attributes: ['BookId', 'Title', 'Price']
                    }]
                }
            ],
            distinct: true,
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['Created_Date', 'DESC']]
        });

        // Format response data
        const formattedOrders = rows.map(order => ({
            id: order.ExportOrderId,
            createdBy: order.Creator?.FullName,
            approvedBy: order.Approver?.FullName,
            status: order.Status,
            orderDate: order.Created_Date,
            approvedDate: order.ApprovedDate,
            note: order.Note,
            reason: order.Reason,
            items: order.ExportOrderDetails?.map(detail => ({
                productId: detail.Book?.BookId,
                productName: detail.Book?.Title,
                quantity: detail.Quantity,
                unitPrice: detail.UnitPrice,
                note: detail.Note
            })) || []
        }));

        res.json({
            total: count,
            totalPages: Math.ceil(count / limit),
            currentPage: parseInt(page),
            orders: formattedOrders
        });
    } catch (error) {
        console.error('Error in getExportOrders:', error);
        next(error);
    }
};

// Controller lấy thông tin chi tiết một đơn hàng xuất theo ID
export const getExportOrderById = async (req, res, next) => {
    try {
        const exportOrder = await ExportOrders.findOne({
            where: { ExportOrderId: req.params.id },
            include: [
                {
                    model: ExportOrderDetails,
                    include: [{ model: Book }]
                },
                {
                    model: User,
                    as: 'Creator',
                    attributes: ['userId', 'FullName', 'Email']
                },
                {
                    model: User,
                    as: 'Approver',
                    attributes: ['userId', 'FullName', 'Email']
                }
            ]
        });

        if (!exportOrder) {
            throw new ApiError(httpStatus.NOT_FOUND, 'Export order not found');
        }

        res.json(exportOrder);
    } catch (error) {
        next(error);
    }
};

// Controller cập nhật thông tin đơn hàng xuất
export const updateExportOrder = async (req, res, next) => {
    try {
        const { items, note } = req.body;
        const exportOrderId = req.params.id;

        // Cập nhật thông tin đơn hàng
        const exportOrder = await ExportOrders.findByPk(exportOrderId);
        if (!exportOrder) {
            throw new ApiError(httpStatus.NOT_FOUND, 'Export order not found');
        }

        await exportOrder.update({
            Note: note
        });

        // Cập nhật chi tiết đơn hàng nếu có
        if (items && items.length > 0) {
            // Xóa chi tiết cũ
            await ExportOrderDetails.destroy({
                where: { ExportOrderId: exportOrderId }
            });

            // Tạo chi tiết mới
            const orderDetails = items.map(item => ({
                ExportOrderId: exportOrderId,
                BookId: item.bookId,
                Quantity: item.quantity,
                UnitPrice: item.price,
                Note: item.note
            }));

            await ExportOrderDetails.bulkCreate(orderDetails);
        }

        // Lấy đơn hàng đã cập nhật kèm chi tiết
        const updatedOrder = await ExportOrders.findOne({
            where: { ExportOrderId: exportOrderId },
            include: [
                {
                    model: ExportOrderDetails,
                    include: [{ model: Book }]
                },
                {
                    model: User,
                    as: 'Creator',
                    attributes: ['userId', 'FullName', 'Email']
                },
                {
                    model: User,
                    as: 'Approver',
                    attributes: ['userId', 'FullName', 'Email']
                }
            ]
        });

        res.json(updatedOrder);
    } catch (error) {
        next(error);
    }
};

// Controller xóa đơn hàng xuất
export const deleteExportOrder = async (req, res, next) => {
    try {
        const exportOrder = await ExportOrders.findByPk(req.params.id);

        if (!exportOrder) {
            throw new ApiError(httpStatus.NOT_FOUND, 'Export order not found');
        }

        // Xóa chi tiết đơn hàng
        await ExportOrderDetails.destroy({
            where: { ExportOrderId: req.params.id }
        });

        // Xóa đơn hàng
        await exportOrder.destroy();

        res.status(httpStatus.NO_CONTENT).send();
    } catch (error) {
        next(error);
    }
};

// Controller cập nhật trạng thái đơn hàng xuất
export const updateExportOrderStatus = async (req, res, next) => {
    try {
        const { status, reason } = req.body;
        const exportOrderId = req.params.id;

        const exportOrder = await ExportOrders.findByPk(exportOrderId);
        if (!exportOrder) {
            throw new ApiError(httpStatus.NOT_FOUND, 'Export order not found');
        }

        const updateData = {
            Status: status,
            Reason: reason
        };

        if (status === 'Approved') {
            updateData.ApprovedBy = req.user.userId;
            updateData.ApprovedDate = new Date();
        }

        await exportOrder.update(updateData);

        // Fetch updated order
        const updatedOrder = await ExportOrders.findOne({
            where: { ExportOrderId: exportOrderId },
            include: [
                {
                    model: User,
                    as: 'Creator',
                    attributes: ['userId', 'FullName']
                },
                {
                    model: User,
                    as: 'Approver',
                    attributes: ['userId', 'FullName']
                },
                {
                    model: ExportOrderDetails,
                    include: [{ model: Book }]
                }
            ]
        });

        res.json({
            id: updatedOrder.ExportOrderId,
            createdBy: updatedOrder.Creator?.FullName,
            approvedBy: updatedOrder.Approver?.FullName,
            status: updatedOrder.Status,
            orderDate: updatedOrder.Created_Date,
            approvedDate: updatedOrder.ApprovedDate,
            note: updatedOrder.Note,
            reason: updatedOrder.Reason,
            items: updatedOrder.ExportOrderDetails.map(detail => ({
                productId: detail.Book.BookId,
                productName: detail.Book.Title,
                quantity: detail.Quantity,
                unitPrice: detail.UnitPrice,
                note: detail.Note
            }))
        });
    } catch (error) {
        console.error('Error in updateExportOrderStatus:', error);
        next(error);
    }
}; 