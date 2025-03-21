import db from '../models/index.js';
import { validateExportOrder } from '../validations/exportOrderValidation.js';
import ApiError from '../utils/ApiError.js';
import httpStatus from 'http-status';

const { ExportOrders, ExportOrderDetails, User, Book, OrderStatusLogs } = db;
const { Op } = db.Sequelize;

/**
 * Controller tạo đơn hàng xuất mới
 * @param {Object} req - Request object chứa thông tin đơn hàng
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware
 */
export const createExportOrder = async (req, res, next) => {
    try {
        const { 
            items, 
            note, 
            exportDate,
            recipientName,
            recipientPhone,
            shippingAddress 
        } = req.body;

        // Kiểm tra dữ liệu đầu vào
        if (!items || !Array.isArray(items) || items.length === 0) {
            throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid input data');
        }

        // Validate recipient information
        if (!recipientName || !recipientPhone || !shippingAddress) {
            throw new ApiError(httpStatus.BAD_REQUEST, 'Recipient information is required');
        }

        // Validate phone number format
        const phoneRegex = /^[0-9]{10}$/;
        if (!phoneRegex.test(recipientPhone)) {
            throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid phone number format');
        }

        // Tạo đơn hàng xuất mới với trạng thái ban đầu là 'New'
        const exportOrder = await ExportOrders.create({
            CreatedBy: req.user.userId,
            Status: 'New',
            Created_Date: new Date(),
            ExportDate: exportDate,
            Note: note,
            RecipientName: recipientName,
            RecipientPhone: recipientPhone,
            ShippingAddress: shippingAddress
        });

        // Tạo chi tiết đơn hàng cho từng sản phẩm
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

        // Tạo log trạng thái ban đầu
        await OrderStatusLogs.create({
            OrderId: exportOrder.ExportOrderId,
            OrderType: 'Export',
            Status: 'New',
            CreatedBy: req.user.userId,
            Created_Date: new Date(),
            Note: 'Export order created'
        });

        // Lấy thông tin đơn hàng đầy đủ kèm theo các quan hệ
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

        // Format dữ liệu trả về
        const formattedOrder = {
            id: savedOrder.ExportOrderId,
            createdBy: savedOrder.Creator?.FullName,
            status: savedOrder.Status,
            orderDate: savedOrder.Created_Date,
            exportDate: savedOrder.ExportDate,
            note: savedOrder.Note,
            recipientName: savedOrder.RecipientName,
            recipientPhone: savedOrder.RecipientPhone,
            shippingAddress: savedOrder.ShippingAddress,
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

/**
 * Controller lấy danh sách đơn hàng xuất với phân trang và lọc
 * @param {Object} req - Request object chứa các tham số query
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware
 */
export const getExportOrders = async (req, res, next) => {
    try {
        // Lấy các tham số phân trang và lọc từ query
        const { page = 1, limit = 10, status, fromDate, toDate, searchId } = req.query;
        const offset = (page - 1) * limit;

        // Xây dựng điều kiện tìm kiếm
        const whereConditions = {};
        if (status) whereConditions.Status = status;
        if (searchId) whereConditions.ExportOrderId = { [Op.like]: `%${searchId}%` };
        if (fromDate || toDate) {
            whereConditions.Created_Date = {};
            if (fromDate) whereConditions.Created_Date[Op.gte] = new Date(fromDate);
            if (toDate) whereConditions.Created_Date[Op.lte] = new Date(toDate);
        }

        // Truy vấn danh sách đơn hàng với các quan hệ
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

        // Format dữ liệu trả về
        const formattedOrders = await Promise.all(rows.map(async (order) => {
            // Lấy lịch sử trạng thái
            const statusLogs = await OrderStatusLogs.findAll({
                where: {
                    OrderId: order.ExportOrderId,
                    OrderType: 'Export'
                },
                include: [{
                    model: User,
                    attributes: ['userId', 'FullName']
                }],
                order: [['Created_Date', 'DESC']]
            });

            return {
                id: order.ExportOrderId,
                createdBy: order.Creator?.FullName,
                approvedBy: order.Approver?.FullName,
                status: order.Status,
                orderDate: order.Created_Date,
                exportDate: order.ExportDate,
                approvedDate: order.ApprovedDate,
                note: order.Note,
                reason: order.Reason,
                recipientName: order.RecipientName,
                recipientPhone: order.RecipientPhone,
                shippingAddress: order.ShippingAddress,
                items: order.ExportOrderDetails.map(detail => ({
                    productId: detail.Book.BookId,
                    productName: detail.Book.Title,
                    quantity: detail.Quantity,
                    unitPrice: detail.UnitPrice,
                    note: detail.Note
                })),
                statusLogs: statusLogs.map(log => ({
                    status: log.Status,
                    date: log.Created_Date,
                    by: log.User?.FullName,
                    note: log.Note
                }))
            };
        }));

        // Trả về kết quả với thông tin phân trang
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

/**
 * Controller lấy thông tin chi tiết một đơn hàng xuất theo ID
 * @param {Object} req - Request object chứa ID đơn hàng
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware
 */
export const getExportOrderById = async (req, res, next) => {
    try {
        // Tìm đơn hàng theo ID kèm theo các quan hệ
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

        // Lấy lịch sử trạng thái của đơn hàng
        const statusLogs = await OrderStatusLogs.findAll({
            where: {
                OrderId: exportOrder.ExportOrderId,
                OrderType: 'Export'
            },
            include: [{
                model: User,
                attributes: ['userId', 'FullName']
            }],
            order: [['Created_Date', 'DESC']]
        });

        // Format và trả về kết quả
        const response = {
            id: exportOrder.ExportOrderId,
            createdBy: exportOrder.Creator?.FullName,
            approvedBy: exportOrder.Approver?.FullName,
            status: exportOrder.Status,
            orderDate: exportOrder.Created_Date,
            exportDate: exportOrder.ExportDate,
            approvedDate: exportOrder.ApprovedDate,
            note: exportOrder.Note,
            reason: exportOrder.Reason,
            recipientName: exportOrder.RecipientName,
            recipientPhone: exportOrder.RecipientPhone,
            shippingAddress: exportOrder.ShippingAddress,
            items: exportOrder.ExportOrderDetails.map(detail => ({
                productId: detail.Book.BookId,
                productName: detail.Book.Title,
                quantity: detail.Quantity,
                unitPrice: detail.UnitPrice,
                note: detail.Note
            })),
            statusLogs: statusLogs.map(log => ({
                status: log.Status,
                date: log.Created_Date,
                by: log.User?.FullName,
                note: log.Note
            }))
        };

        res.json(response);
    } catch (error) {
        next(error);
    }
};

/**
 * Controller cập nhật thông tin đơn hàng xuất
 * @param {Object} req - Request object chứa thông tin cập nhật
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware
 */
export const updateExportOrder = async (req, res, next) => {
    try {
        const { 
            items, 
            note,
            recipientName,
            recipientPhone,
            shippingAddress 
        } = req.body;
        const exportOrderId = req.params.id;

        // Kiểm tra tồn tại đơn hàng
        const exportOrder = await ExportOrders.findByPk(exportOrderId);
        if (!exportOrder) {
            throw new ApiError(httpStatus.NOT_FOUND, 'Export order not found');
        }

        // Chỉ cho phép cập nhật đơn hàng ở trạng thái 'New'
        if (exportOrder.Status !== 'New') {
            throw new ApiError(httpStatus.BAD_REQUEST, 'Cannot update order that is not in New status');
        }

        // Validate recipient information if provided
        if (recipientPhone && !(/^[0-9]{10}$/).test(recipientPhone)) {
            throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid phone number format');
        }

        // Cập nhật thông tin cơ bản
        await exportOrder.update({
            Note: note,
            RecipientName: recipientName || exportOrder.RecipientName,
            RecipientPhone: recipientPhone || exportOrder.RecipientPhone,
            ShippingAddress: shippingAddress || exportOrder.ShippingAddress
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
                BookId: item.productId,
                Quantity: item.quantity,
                UnitPrice: item.price,
                Note: item.note
            }));

            await ExportOrderDetails.bulkCreate(orderDetails);
        }

        // Ghi log cập nhật
        await OrderStatusLogs.create({
            OrderId: exportOrderId,
            OrderType: 'Export',
            Status: exportOrder.Status,
            CreatedBy: req.user.userId,
            Created_Date: new Date(),
            Note: 'Order details updated'
        });

        // Lấy thông tin đơn hàng sau khi cập nhật
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

        // Format và trả về kết quả
        const response = {
            id: updatedOrder.ExportOrderId,
            createdBy: updatedOrder.Creator?.FullName,
            approvedBy: updatedOrder.Approver?.FullName,
            status: updatedOrder.Status,
            orderDate: updatedOrder.Created_Date,
            exportDate: updatedOrder.ExportDate,
            approvedDate: updatedOrder.ApprovedDate,
            note: updatedOrder.Note,
            reason: updatedOrder.Reason,
            recipientName: updatedOrder.RecipientName,
            recipientPhone: updatedOrder.RecipientPhone,
            shippingAddress: updatedOrder.ShippingAddress,
            items: updatedOrder.ExportOrderDetails.map(detail => ({
                productId: detail.Book.BookId,
                productName: detail.Book.Title,
                quantity: detail.Quantity,
                unitPrice: detail.UnitPrice,
                note: detail.Note
            }))
        };

        res.json(response);
    } catch (error) {
        next(error);
    }
};

/**
 * Controller xóa đơn hàng xuất
 * @param {Object} req - Request object chứa ID đơn hàng cần xóa
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware
 */
export const deleteExportOrder = async (req, res, next) => {
    try {
        const exportOrder = await ExportOrders.findByPk(req.params.id);

        if (!exportOrder) {
            throw new ApiError(httpStatus.NOT_FOUND, 'Export order not found');
        }

        // Chỉ cho phép xóa đơn hàng ở trạng thái 'New'
        if (exportOrder.Status !== 'New') {
            throw new ApiError(httpStatus.BAD_REQUEST, 'Cannot delete order that is not in New status');
        }

        // Xóa tất cả dữ liệu liên quan
        await ExportOrderDetails.destroy({
            where: { ExportOrderId: req.params.id }
        });

        await OrderStatusLogs.destroy({
            where: {
                OrderId: req.params.id,
                OrderType: 'Export'
            }
        });

        await exportOrder.destroy();

        res.status(httpStatus.NO_CONTENT).send();
    } catch (error) {
        next(error);
    }
};

/**
 * Controller cập nhật trạng thái đơn hàng xuất
 * @param {Object} req - Request object chứa thông tin trạng thái mới
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware
 */
export const updateExportOrderStatus = async (req, res, next) => {
    try {
        const { status, reason } = req.body;
        const exportOrderId = req.params.id;

        const exportOrder = await ExportOrders.findByPk(exportOrderId);
        if (!exportOrder) {
            throw new ApiError(httpStatus.NOT_FOUND, 'Export order not found');
        }

        // Kiểm tra tính hợp lệ của việc chuyển trạng thái
        const validTransitions = {
            'New': ['Pending', 'Cancelled'],      // Từ New có thể chuyển sang Pending hoặc Cancelled
            'Pending': ['Approved', 'Rejected'],  // Từ Pending có thể chuyển sang Approved hoặc Rejected
            'Approved': ['Completed'],            // Từ Approved chỉ có thể chuyển sang Completed
            'Rejected': [],                       // Từ Rejected không thể chuyển sang trạng thái khác
            'Cancelled': [],                      // Từ Cancelled không thể chuyển sang trạng thái khác
            'Completed': []                       // Từ Completed không thể chuyển sang trạng thái khác
        };

        if (!validTransitions[exportOrder.Status]?.includes(status)) {
            throw new ApiError(
                httpStatus.BAD_REQUEST,
                `Invalid status transition from ${exportOrder.Status} to ${status}`
            );
        }

        // Cập nhật trạng thái
        const updateData = {
            Status: status,
            Reason: reason
        };

        // Nếu trạng thái là Approved, cập nhật thông tin phê duyệt
        if (status === 'Approved') {
            updateData.ApprovedBy = req.user.userId;
            updateData.ApprovedDate = new Date();
        }

        await exportOrder.update(updateData);

        // Ghi log thay đổi trạng thái
        await OrderStatusLogs.create({
            OrderId: exportOrderId,
            OrderType: 'Export',
            Status: status,
            CreatedBy: req.user.userId,
            Created_Date: new Date(),
            Note: reason || `Status updated to ${status}`
        });

        // Lấy thông tin đơn hàng sau khi cập nhật
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

        // Format và trả về kết quả
        const response = {
            id: updatedOrder.ExportOrderId,
            createdBy: updatedOrder.Creator?.FullName,
            approvedBy: updatedOrder.Approver?.FullName,
            status: updatedOrder.Status,
            orderDate: updatedOrder.Created_Date,
            exportDate: updatedOrder.ExportDate,
            approvedDate: updatedOrder.ApprovedDate,
            note: updatedOrder.Note,
            reason: updatedOrder.Reason,
            recipientName: updatedOrder.RecipientName,
            recipientPhone: updatedOrder.RecipientPhone,
            shippingAddress: updatedOrder.ShippingAddress,
            items: updatedOrder.ExportOrderDetails.map(detail => ({
                productId: detail.Book.BookId,
                productName: detail.Book.Title,
                quantity: detail.Quantity,
                unitPrice: detail.UnitPrice,
                note: detail.Note
            }))
        };

        res.json(response);
    } catch (error) {
        console.error('Error in updateExportOrderStatus:', error);
        next(error);
    }
}; 