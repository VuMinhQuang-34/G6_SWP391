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
            shippingAddress,
            createdBy
        } = req.body;

        // Validate input data
        if (!items || !Array.isArray(items) || items.length === 0) {
            throw new ApiError(httpStatus.BAD_REQUEST, 'Items array is required and must not be empty');
        }

        // Validate required fields
        if (!recipientName || !recipientPhone || !shippingAddress || !exportDate) {
            throw new ApiError(httpStatus.BAD_REQUEST, 'Recipient information, shipping address and export date are required');
        }

        // Validate phone number format (10 digits)
        if (!/^[0-9]{10}$/.test(recipientPhone)) {
            throw new ApiError(httpStatus.BAD_REQUEST, 'Phone number must be exactly 10 digits');
        }

        // Validate items
        for (const item of items) {
            if (!item.productId || !item.quantity || !item.price) {
                throw new ApiError(httpStatus.BAD_REQUEST, 'Each item must have productId, quantity, and price');
            }
            if (item.quantity <= 0 || item.price <= 0) {
                throw new ApiError(httpStatus.BAD_REQUEST, 'Quantity and price must be greater than 0');
            }
        }

        // Create export order with initial status 'New'
        const exportOrder = await ExportOrders.create({
            CreatedBy: createdBy,
            Status: 'New',
            Created_Date: new Date(),
            ExportDate: new Date(exportDate),
            Note: note,
            RecipientName: recipientName,
            RecipientPhone: recipientPhone,
            ShippingAddress: shippingAddress
        });

        // Create order details
        const orderDetails = items.map(item => ({
            ExportOrderId: exportOrder.ExportOrderId,
            BookId: item.productId,
            Quantity: item.quantity,
            UnitPrice: item.price,
            Note: item.note
        }));

        await ExportOrderDetails.bulkCreate(orderDetails);

        // Create initial status log
        await OrderStatusLogs.create({
            OrderId: exportOrder.ExportOrderId,
            OrderType: 'Export',
            Status: 'New',
            CreatedBy: createdBy,
            Created_Date: new Date(),
            Note: 'Export order created'
        });

        res.status(httpStatus.CREATED).json({
            success: true,
            message: 'Export order created successfully',
            data: {
                id: exportOrder.ExportOrderId,
                status: 'New',
                createdDate: exportOrder.Created_Date
            }
        });
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

        // Build where conditions
        const whereConditions = {};
        if (status) whereConditions.Status = status;
        if (searchId) whereConditions.ExportOrderId = { [Op.like]: `%${searchId}%` };
        if (fromDate || toDate) {
            whereConditions.Created_Date = {};
            if (fromDate) whereConditions.Created_Date[Op.gte] = new Date(fromDate);
            if (toDate) whereConditions.Created_Date[Op.lte] = new Date(toDate);
        }

        // Query orders with associations
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
                }
            ],
            distinct: true,
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['Created_Date', 'DESC']]
        });

        // Format response
        const formattedOrders = rows.map(order => ({
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
            shippingAddress: order.ShippingAddress
        }));

        // Trả về kết quả với thông tin phân trang
        res.json({
            success: true,
            message: 'Export orders retrieved successfully',
            data: {
                total: count,
                totalPages: Math.ceil(count / limit),
                currentPage: parseInt(page),
                orders: formattedOrders
            }
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
                    include: [{
                        model: Book,
                        attributes: ['BookId', 'Title']
                    }]
                },
                {
                    model: User,
                    as: 'Creator',
                    attributes: ['userId', 'FullName']
                },
                {
                    model: User,
                    as: 'Approver',
                    attributes: ['userId', 'FullName']
                }
            ]
        });

        if (!exportOrder) {
            throw new ApiError(httpStatus.NOT_FOUND, 'Export order not found');
        }

        const response = {
            success: true,
            message: 'Export order retrieved successfully',
            data: {
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
                }))
            }
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
        const { items } = req.body;
        const exportOrderId = req.params.id;

        const exportOrder = await ExportOrders.findByPk(exportOrderId);
        if (!exportOrder) {
            throw new ApiError(httpStatus.NOT_FOUND, 'Export order not found');
        }

        if (exportOrder.Status !== 'New') {
            throw new ApiError(httpStatus.BAD_REQUEST, 'Cannot update order that is not in New status');
        }

        // Update order details
        if (items && items.length > 0) {
            // Validate items
            for (const item of items) {
                if (!item.quantity || item.quantity <= 0) {
                    throw new ApiError(httpStatus.BAD_REQUEST, 'Quantity must be greater than 0');
                }
                if (!item.unitPrice || item.unitPrice <= 0) {
                    throw new ApiError(httpStatus.BAD_REQUEST, 'Unit price must be greater than 0');
                }
            }

            // Delete existing details
            await ExportOrderDetails.destroy({
                where: { ExportOrderId: exportOrderId }
            });

            // Create new details
            const orderDetails = items.map(item => ({
                ExportOrderId: exportOrderId,
                BookId: item.productId,
                Quantity: item.quantity,
                UnitPrice: item.unitPrice,
                Note: item.note || null
            }));

            await ExportOrderDetails.bulkCreate(orderDetails);

            // Create status log for the update
            await OrderStatusLogs.create({
                OrderId: exportOrderId,
                OrderType: 'Export',
                Status: exportOrder.Status,
                CreatedBy: exportOrder.CreatedBy,
                Created_Date: new Date(),
                Note: 'Order details updated'
            });
        }

        // Fetch updated order with details
        const updatedOrder = await ExportOrders.findOne({
            where: { ExportOrderId: exportOrderId },
            include: [
                {
                    model: ExportOrderDetails,
                    include: [{
                        model: Book,
                        attributes: ['BookId', 'Title']
                    }]
                },
                {
                    model: User,
                    as: 'Creator',
                    attributes: ['userId', 'FullName']
                },
                {
                    model: User,
                    as: 'Approver',
                    attributes: ['userId', 'FullName']
                }
            ]
        });

        const response = {
            success: true,
            message: 'Export order updated successfully',
            data: {
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
            }
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

        if (exportOrder.Status !== 'New') {
            throw new ApiError(httpStatus.BAD_REQUEST, 'Cannot delete order that is not in New status');
        }

        // Delete related records
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
        const { status, reason, updatedBy } = req.body;
        const exportOrderId = req.params.id;

        const exportOrder = await ExportOrders.findByPk(exportOrderId);
        if (!exportOrder) {
            throw new ApiError(httpStatus.NOT_FOUND, 'Export order not found');
        }

        // Validate status transition
        const validTransitions = {
            'New': ['Pending'],
            'Pending': ['Approved', 'Rejected'],
            'Approved': ['Completed'],
            'Rejected': ['Cancelled']
        };

        const currentStatus = exportOrder.Status;
        if (!validTransitions[currentStatus]?.includes(status)) {
            throw new ApiError(
                httpStatus.BAD_REQUEST,
                `Invalid status transition from ${currentStatus} to ${status}`
            );
        }

        // Update status and related fields
        const updateData = {
            Status: status,
            Reason: reason || null
        };

        // Nếu trạng thái là Approved, cập nhật thông tin phê duyệt
        if (status === 'Approved') {
            updateData.ApprovedBy = updatedBy;
            updateData.ApprovedDate = new Date();
        }

        await exportOrder.update(updateData);

        // Create status log
        await OrderStatusLogs.create({
            OrderId: exportOrderId,
            OrderType: 'Export',
            Status: status,
            CreatedBy: updatedBy,
            Created_Date: new Date(),
            Note: reason || `Order ${status.toLowerCase()}`
        });

        res.json({
            success: true,
            message: `Export order status updated to ${status} successfully`,
            data: {
                id: exportOrder.ExportOrderId,
                status: status,
                updatedAt: new Date()
            }
        });
    } catch (error) {
        console.error('Error in updateExportOrderStatus:', error);
        next(error);
    }
};

/**
 * Controller lấy lịch sử trạng thái của đơn hàng xuất
 * @param {Object} req - Request object chứa ID đơn hàng
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware
 */
export const getExportOrderStatusLogs = async (req, res, next) => {
    try {
        const orderId = req.params.id;

        // Verify order exists
        const order = await ExportOrders.findByPk(orderId);
        if (!order) {
            throw new ApiError(httpStatus.NOT_FOUND, 'Export order not found');
        }

        // Get status logs
        const logs = await OrderStatusLogs.findAll({
            where: {
                OrderId: orderId,
                OrderType: 'Export'
            },
            include: [{
                model: User,
                attributes: ['userId', 'FullName', 'Email']
            }],
            order: [['Created_Date', 'DESC']]
        });

        // Format response
        const formattedLogs = logs.map(log => ({
            logId: log.LogId,
            status: log.Status,
            createdDate: log.Created_Date,
            createdBy: log.User?.FullName || 'Unknown',
            note: log.Note
        }));

        res.json({
            success: true,
            message: 'Status logs retrieved successfully',
            data: formattedLogs
        });
    } catch (error) {
        console.error('Error in getExportOrderStatusLogs:', error);
        next(error);
    }
};

const handleUpdate = async () => {
    try {
        await axios.put(`http://localhost:9999/api/export-orders/${id}`, {
            items: editableDetails
        });
        message.success('Order details updated successfully');
        setHasChanges(false);
        fetchOrderDetail();
    } catch (error) {
        message.error('Failed to update order details');
    }
};