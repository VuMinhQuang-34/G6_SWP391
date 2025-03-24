import db from '../models/index.js';
import { validateExportOrder } from '../validations/exportOrderValidation.js';
import ApiError from '../utils/ApiError.js';
import httpStatus from 'http-status';

const { ExportOrders, ExportOrderDetails, User, Book, OrderStatusLogs, Bin, BookBin, Stock } = db;
const { Op } = db.Sequelize;

/**
 * Helper function to convert bin ID from string format (like "B1", "C2") to integer
 * @param {string|number} binId - The bin ID that may be in string format
 * @returns {number} - The numeric bin ID
 */
const convertBinId = (binId) => {
    if (typeof binId === 'string') {
        const numericPart = binId.match(/\d+/);
        if (numericPart) {
            return parseInt(numericPart[0]);
        }
        throw new ApiError(httpStatus.BAD_REQUEST, `Invalid bin ID format: ${binId}`);
    }
    return binId;
};

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

        // Group items by bookId for validation and processing
        const productItems = {};

        for (const item of items) {
            if (!item.productId || !item.quantity || !item.price) {
                throw new ApiError(httpStatus.BAD_REQUEST, 'Each item must have productId, quantity, and price');
            }
            if (item.quantity <= 0 || item.price <= 0) {
                throw new ApiError(httpStatus.BAD_REQUEST, 'Quantity and price must be greater than 0');
            }
            // Validate binId required
            if (!item.binId) {
                throw new ApiError(httpStatus.BAD_REQUEST, 'Each item must specify a bin source (binId)');
            }

            // Convert string binId to integer if needed
            const numericBinId = convertBinId(item.binId);

            console.log(`Looking up bin with ID: ${item.binId}`);

            // Check if bin exists - use the ORIGINAL binId string for lookup, not the numeric version
            const bin = await Bin.findByPk(item.binId);
            console.log(`Bin lookup result:`, bin ? `Found bin ${bin.BinId} with name ${bin.Name}` : 'Bin not found');

            if (!bin) {
                throw new ApiError(httpStatus.NOT_FOUND, `Bin with ID ${item.binId} not found`);
            }

            console.log(`Looking up BookBin for Book ${item.productId} and Bin ${item.binId}`);

            // Check quantity in bin - use the ORIGINAL binId string 
            const bookBin = await BookBin.findOne({
                where: {
                    BookId: item.productId,
                    BinId: item.binId // Use original bin ID, not converted one
                }
            });

            console.log(`BookBin lookup result:`, bookBin ? `Found BookBin with quantity ${bookBin.Quantity}` : 'BookBin not found');

            if (!bookBin) {
                throw new ApiError(httpStatus.NOT_FOUND, `Book ${item.productId} not found in bin ${item.binId}`);
            }

            // Convert BookBin.Quantity to integer before comparison
            const bookBinQuantity = parseInt(bookBin.Quantity);
            if (bookBinQuantity < item.quantity) {
                throw new ApiError(httpStatus.BAD_REQUEST,
                    `Not enough quantity in bin ${item.binId} for book ${item.productId}. Available: ${bookBinQuantity}, Requested: ${item.quantity}`);
            }

            // Group items by productId for validation
            if (!productItems[item.productId]) {
                productItems[item.productId] = {
                    totalQuantity: 0,
                    price: item.price,
                    bins: []
                };
            }

            productItems[item.productId].totalQuantity += parseInt(item.quantity);
            productItems[item.productId].bins.push({
                binId: item.binId, // Use original string ID, not converted numeric ID
                binOriginal: item.binId, // Keep the original for reference
                quantity: parseInt(item.quantity)
            });
        }

        // Check total stock for each product
        for (const productId in productItems) {
            const stock = await Stock.findOne({
                where: { BookId: productId }
            });

            if (!stock) {
                throw new ApiError(httpStatus.NOT_FOUND, `Stock record not found for book ${productId}`);
            }

            if (stock.Quantity < productItems[productId].totalQuantity) {
                throw new ApiError(httpStatus.BAD_REQUEST,
                    `Total requested quantity (${productItems[productId].totalQuantity}) exceeds available stock (${stock.Quantity}) for book ${productId}`);
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

        // Create order details and update inventory in a transaction
        const orderDetails = [];

        await db.sequelize.transaction(async (transaction) => {
            // Process each item and create records
            for (const productId in productItems) {
                const item = productItems[productId];

                // Create order detail record
                const orderDetail = {
                    ExportOrderId: exportOrder.ExportOrderId,
                    BookId: parseInt(productId),
                    Quantity: item.totalQuantity,
                    UnitPrice: item.price,
                    Note: null // Add note if needed
                };

                orderDetails.push(orderDetail);

                // Process each bin allocation for this product
                for (const binAllocation of item.bins) {
                    console.log(`Processing bin: ${binAllocation.binId}, type: ${typeof binAllocation.binId}`);

                    try {
                        // Create bin allocation record - sử dụng binId gốc cho database
                        await db.ExportOrderBins.create({
                            ExportOrderId: exportOrder.ExportOrderId,
                            BookId: parseInt(productId),
                            BinId: binAllocation.binId, // Sử dụng binId gốc (chuỗi) thay vì numericBinId
                            Quantity: binAllocation.quantity
                        }, { transaction });

                        console.log(`Created ExportOrderBins record with binId: ${binAllocation.binId}`);
                    } catch (error) {
                        console.error(`Error creating ExportOrderBins record:`, error);
                        throw error;
                    }

                    // QUAN TRỌNG: Tìm BookBin bằng binId gốc (chuỗi), KHÔNG dùng numericBinId
                    // Vì BookBin trong database có thể đang lưu binId dạng chuỗi
                    const bookBin = await BookBin.findOne({
                        where: {
                            BookId: parseInt(productId),
                            BinId: binAllocation.binId
                        },
                        transaction
                    });

                    if (!bookBin) {
                        throw new ApiError(
                            httpStatus.BAD_REQUEST,
                            `Book ${parseInt(productId)} not found in bin ${binAllocation.binId}`
                        );
                    }

                    if (bookBin.Quantity < binAllocation.quantity) {
                        throw new ApiError(
                            httpStatus.BAD_REQUEST,
                            `Not enough quantity in bin ${binAllocation.binId} for book ${parseInt(productId)}. Available: ${bookBin.Quantity}, Requested: ${binAllocation.quantity}`
                        );
                    }

                    const newBinQuantity = bookBin.Quantity - binAllocation.quantity;
                    await BookBin.update(
                        { Quantity: newBinQuantity },
                        {
                            where: { BookBinId: bookBin.BookBinId },
                            transaction
                        }
                    );

                    // Bin cũng có thể đang lưu BinId dạng chuỗi, dùng binId gốc
                    const binRecord = await Bin.findByPk(binAllocation.binId, { transaction });
                    if (binRecord) {
                        const currentBinQuantity = binRecord.Quantity_Current !== null ? parseInt(binRecord.Quantity_Current) : 0;
                        const newBinCurrentQuantity = currentBinQuantity - binAllocation.quantity;

                        await Bin.update(
                            { Quantity_Current: newBinCurrentQuantity },
                            {
                                where: { BinId: binAllocation.binId },
                                transaction
                            }
                        );
                    } else {
                        throw new ApiError(httpStatus.NOT_FOUND, `Bin ${binAllocation.binId} not found`);
                    }

                    // Update Stock quantity
                    const stock = await Stock.findOne({
                        where: { BookId: parseInt(productId) },
                        transaction
                    });

                    if (stock) {
                        const currentStockQuantity = parseInt(stock.Quantity);
                        await Stock.update(
                            { Quantity: currentStockQuantity - binAllocation.quantity },
                            {
                                where: { BookId: parseInt(productId) },
                                transaction
                            }
                        );
                    }
                }
            }

            // Bulk create order details
            await ExportOrderDetails.bulkCreate(orderDetails, { transaction });

            // Create initial status log
            await OrderStatusLogs.create({
                OrderId: exportOrder.ExportOrderId,
                OrderType: 'Export',
                Status: 'New',
                CreatedBy: createdBy,
                Created_Date: new Date(),
                Note: 'Export order created'
            }, { transaction });
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

        // Get bin information for this order
        const orderBins = await db.ExportOrderBins.findAll({
            where: { ExportOrderId: req.params.id },
            include: [{
                model: Bin,
                attributes: ['Name']
            }]
        });

        // Group bins by BookId
        const binsByBook = {};
        orderBins.forEach(bin => {
            if (!binsByBook[bin.BookId]) {
                binsByBook[bin.BookId] = [];
            }

            // Get original bin name or format it
            let displayBinName;
            if (bin.Bin && bin.Bin.Name) {
                displayBinName = bin.Bin.Name;
            } else {
                // If bin name not available, format as B1, C2, etc. based on ID
                const numericId = bin.BinId;
                // Determine the letter prefix (A=1, B=2, etc.)
                const letterCode = String.fromCharCode(64 + Math.ceil(numericId / 10));
                displayBinName = `${letterCode}${numericId % 10 || 10}`;
            }

            binsByBook[bin.BookId].push({
                binId: bin.BinId,
                binName: displayBinName,
                quantity: bin.Quantity
            });
        });

        // Map order details with bin information
        const itemsWithBins = exportOrder.ExportOrderDetails.map(detail => {
            const bookBins = binsByBook[detail.BookId] || [];
            return {
                productId: detail.BookId,
                productName: detail.Book ? detail.Book.Title : `Product ${detail.BookId}`,
                quantity: detail.Quantity,
                unitPrice: detail.UnitPrice,
                note: detail.Note,
                bins: bookBins
            };
        });

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
                items: itemsWithBins
            }
        };

        res.json(response);
    } catch (error) {
        console.error('Error in getExportOrderById:', error);
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
                if (!item.productId) {
                    throw new ApiError(httpStatus.BAD_REQUEST, 'Product ID is required');
                }
                if (!item.quantity || item.quantity <= 0) {
                    throw new ApiError(httpStatus.BAD_REQUEST, 'Quantity must be greater than 0');
                }
                if (!item.unitPrice || item.unitPrice <= 0) {
                    throw new ApiError(httpStatus.BAD_REQUEST, 'Unit price must be greater than 0');
                }

                // Validate bin data if provided
                if (item.bins && Array.isArray(item.bins)) {
                    // Check if total bin quantity matches item quantity
                    const totalBinQuantity = item.bins.reduce((sum, bin) => sum + (parseInt(bin.quantity) || 0), 0);
                    if (totalBinQuantity !== item.quantity) {
                        throw new ApiError(
                            httpStatus.BAD_REQUEST,
                            `Total bin quantity (${totalBinQuantity}) must match item quantity (${item.quantity}) for product ${item.productId}`
                        );
                    }

                    // Validate each bin entry
                    for (const bin of item.bins) {
                        if (!bin.binId) {
                            throw new ApiError(httpStatus.BAD_REQUEST, 'Bin ID is required for each bin entry');
                        }
                        if (!bin.quantity || bin.quantity <= 0) {
                            throw new ApiError(httpStatus.BAD_REQUEST, 'Bin quantity must be greater than 0');
                        }
                    }
                } else {
                    throw new ApiError(httpStatus.BAD_REQUEST, 'Bins array is required for each item');
                }
            }

            // Begin transaction
            await db.sequelize.transaction(async (transaction) => {
                // STEP 1: Restore inventory from current order details and bins
                // Get current bins data
                const currentBins = await db.ExportOrderBins.findAll({
                    where: { ExportOrderId: exportOrderId },
                    transaction
                });

                // Restore inventory for each bin allocation
                for (const bin of currentBins) {
                    // Check if BookBin exists
                    let bookBin = await BookBin.findOne({
                        where: {
                            BookId: bin.BookId,
                            BinId: bin.BinId
                        },
                        transaction
                    });

                    if (bookBin) {
                        // Update existing record
                        const currentQuantity = parseInt(bookBin.Quantity);
                        await BookBin.update(
                            { Quantity: currentQuantity + bin.Quantity },
                            {
                                where: { BookBinId: bookBin.BookBinId },
                                transaction
                            }
                        );
                    } else {
                        // Create new record
                        await BookBin.create({
                            BookId: bin.BookId,
                            BinId: bin.BinId,
                            Quantity: bin.Quantity
                        }, { transaction });
                    }

                    // Update Bin.Quantity_Current
                    const binRecord = await Bin.findByPk(bin.BinId, { transaction });
                    if (binRecord) {
                        const currentBinQuantity = binRecord.Quantity_Current !== null ? parseInt(binRecord.Quantity_Current) : 0;
                        const newBinQuantity = currentBinQuantity + bin.Quantity;

                        await Bin.update(
                            { Quantity_Current: newBinQuantity },
                            {
                                where: { BinId: bin.BinId },
                                transaction
                            }
                        );
                    }

                    // Update Stock quantity
                    const stock = await Stock.findOne({
                        where: { BookId: bin.BookId },
                        transaction
                    });

                    if (stock) {
                        const currentStockQuantity = parseInt(stock.Quantity);
                        await Stock.update(
                            { Quantity: currentStockQuantity - bin.Quantity },
                            {
                                where: { BookId: bin.BookId },
                                transaction
                            }
                        );
                    }
                }

                // STEP 2: Delete existing order details and bins
                await ExportOrderDetails.destroy({
                    where: { ExportOrderId: exportOrderId },
                    transaction
                });

                await db.ExportOrderBins.destroy({
                    where: { ExportOrderId: exportOrderId },
                    transaction
                });

                // STEP 3: Create new order details and bin allocations
                // Create new order details
                const orderDetails = items.map(item => ({
                    ExportOrderId: exportOrderId,
                    BookId: item.productId,
                    Quantity: item.quantity,
                    UnitPrice: item.unitPrice,
                    Note: item.note || null
                }));

                await ExportOrderDetails.bulkCreate(orderDetails, { transaction });

                // Process new bin allocations and update inventory
                for (const item of items) {
                    // Process each bin allocation
                    for (const bin of item.bins) {
                        console.log(`Processing bin: ${bin.binId}, type: ${typeof bin.binId}`);

                        try {
                            // Create bin allocation record - sử dụng binId gốc cho database
                            await db.ExportOrderBins.create({
                                ExportOrderId: exportOrderId,
                                BookId: parseInt(item.productId),
                                BinId: bin.binId, // Sử dụng binId gốc (chuỗi) thay vì numericBinId
                                Quantity: bin.quantity
                            }, { transaction });

                            console.log(`Created ExportOrderBins record with binId: ${bin.binId}`);
                        } catch (error) {
                            console.error(`Error creating ExportOrderBins record:`, error);
                            throw error;
                        }

                        // QUAN TRỌNG: Tìm BookBin bằng binId gốc (chuỗi), KHÔNG dùng numericBinId
                        // Vì BookBin trong database có thể đang lưu binId dạng chuỗi
                        const bookBin = await BookBin.findOne({
                            where: {
                                BookId: parseInt(item.productId),
                                BinId: bin.binId
                            },
                            transaction
                        });

                        if (!bookBin) {
                            throw new ApiError(
                                httpStatus.BAD_REQUEST,
                                `Book ${parseInt(item.productId)} not found in bin ${bin.binId}`
                            );
                        }

                        if (bookBin.Quantity < bin.quantity) {
                            throw new ApiError(
                                httpStatus.BAD_REQUEST,
                                `Not enough quantity in bin ${bin.binId} for book ${parseInt(item.productId)}. Available: ${bookBin.Quantity}, Requested: ${bin.quantity}`
                            );
                        }

                        const newBinQuantity = bookBin.Quantity - bin.quantity;
                        await BookBin.update(
                            { Quantity: newBinQuantity },
                            {
                                where: { BookBinId: bookBin.BookBinId },
                                transaction
                            }
                        );

                        // Bin cũng có thể đang lưu BinId dạng chuỗi, dùng binId gốc
                        const binRecord = await Bin.findByPk(bin.binId, { transaction });
                        if (binRecord) {
                            const currentBinQuantity = binRecord.Quantity_Current !== null ? parseInt(binRecord.Quantity_Current) : 0;
                            const newBinCurrentQuantity = currentBinQuantity - bin.quantity;

                            await Bin.update(
                                { Quantity_Current: newBinCurrentQuantity },
                                {
                                    where: { BinId: bin.binId },
                                    transaction
                                }
                            );
                        } else {
                            throw new ApiError(httpStatus.NOT_FOUND, `Bin ${bin.binId} not found`);
                        }

                        // Update Stock quantity
                        const stock = await Stock.findOne({
                            where: { BookId: parseInt(item.productId) },
                            transaction
                        });

                        if (stock) {
                            const currentStockQuantity = parseInt(stock.Quantity);
                            await Stock.update(
                                { Quantity: currentStockQuantity - bin.quantity },
                                {
                                    where: { BookId: parseInt(item.productId) },
                                    transaction
                                }
                            );
                        }
                    }
                }
            });

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

            // Get updated bin information
            const updatedBins = await db.ExportOrderBins.findAll({
                where: { ExportOrderId: exportOrderId },
                include: [{
                    model: Bin,
                    attributes: ['Name']
                }]
            });

            // Group bins by BookId
            const binsByBook = {};
            updatedBins.forEach(bin => {
                if (!binsByBook[bin.BookId]) {
                    binsByBook[bin.BookId] = [];
                }

                // Get original bin name or format it
                let displayBinName;
                if (bin.Bin && bin.Bin.Name) {
                    displayBinName = bin.Bin.Name;
                } else {
                    // If bin name not available, format as B1, C2, etc. based on ID
                    const numericId = bin.BinId;
                    // Determine the letter prefix (A=1, B=2, etc.)
                    const letterCode = String.fromCharCode(64 + Math.ceil(numericId / 10));
                    displayBinName = `${letterCode}${numericId % 10 || 10}`;
                }

                binsByBook[bin.BookId].push({
                    binId: bin.BinId,
                    binName: displayBinName,
                    quantity: bin.Quantity
                });
            });

            // Build response
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
                        productId: detail.BookId,
                        productName: detail.Book ? detail.Book.Title : `Product ${detail.BookId}`,
                        quantity: detail.Quantity,
                        unitPrice: detail.UnitPrice,
                        note: detail.Note,
                        bins: binsByBook[detail.BookId] || []
                    }))
                }
            };

            res.json(response);
        } else {
            throw new ApiError(httpStatus.BAD_REQUEST, 'No items provided for update');
        }
    } catch (error) {
        console.error('Error in updateExportOrder:', error);
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
        const exportOrderId = req.params.id;
        const exportOrder = await ExportOrders.findByPk(exportOrderId);

        if (!exportOrder) {
            throw new ApiError(httpStatus.NOT_FOUND, 'Export order not found');
        }

        if (exportOrder.Status !== 'New') {
            throw new ApiError(httpStatus.BAD_REQUEST, 'Cannot delete order that is not in New status');
        }

        console.log(`[DELETE] Starting delete process for export order ${exportOrderId}`);

        await db.sequelize.transaction(async (transaction) => {
            // First restore inventory from the order bins
            const orderBins = await db.ExportOrderBins.findAll({
                where: { ExportOrderId: exportOrderId },
                transaction
            });

            console.log(`[DELETE] Restoring inventory for ${orderBins.length} bin allocations from order ${exportOrderId}`);
            console.log(`[DELETE] Order bins data:`, JSON.stringify(orderBins));

            // Restore inventory for each bin allocation
            for (const bin of orderBins) {
                const binQuantity = parseInt(bin.Quantity);
                const bookId = parseInt(bin.BookId);
                const binId = bin.BinId; // Sử dụng binId gốc (chuỗi)

                console.log(`[DELETE] Restoring ${binQuantity} items of book ${bookId} to bin ${binId}`);
                console.log(`[DELETE] Bin object data:`, JSON.stringify(bin));

                // Check if BookBin record exists
                let bookBin = await BookBin.findOne({
                    where: {
                        BookId: bookId,
                        BinId: binId // Dùng binId gốc (chuỗi)
                    },
                    transaction
                });

                console.log(`[DELETE] Found existing BookBin?`, bookBin ? 'Yes' : 'No');
                if (bookBin) {
                    console.log(`[DELETE] BookBin data:`, JSON.stringify(bookBin));
                }

                if (bookBin) {
                    // Update existing record
                    const currentQuantity = parseInt(bookBin.Quantity);
                    const newQuantity = currentQuantity + binQuantity;

                    console.log(`[DELETE] Updating BookBin: Current quantity ${currentQuantity} (${typeof currentQuantity}) + ${binQuantity} (${typeof binQuantity}) = ${newQuantity} (${typeof newQuantity})`);

                    const updateResult = await BookBin.update(
                        { Quantity: newQuantity.toString() }, // Chuyển đổi thành string vì model định nghĩa Quantity là STRING
                        {
                            where: { BookBinId: bookBin.BookBinId },
                            transaction
                        }
                    );
                    console.log(`[DELETE] BookBin update result:`, updateResult);
                } else {
                    // Create new record
                    console.log(`[DELETE] Creating new BookBin record for book ${bookId} in bin ${binId} with quantity ${binQuantity}`);

                    const newBookBin = await BookBin.create({
                        BookId: bookId.toString(), // Chuyển đổi thành string vì model định nghĩa BookId là STRING
                        BinId: binId, // Dùng binId gốc (chuỗi)
                        Quantity: binQuantity.toString() // Chuyển đổi thành string vì model định nghĩa Quantity là STRING
                    }, { transaction });

                    console.log(`[DELETE] New BookBin created:`, JSON.stringify(newBookBin));
                }

                // Update Bin.Quantity_Current
                const binRecord = await Bin.findByPk(binId, { transaction });
                console.log(`[DELETE] Found bin record?`, binRecord ? 'Yes' : 'No');
                if (binRecord) {
                    console.log(`[DELETE] Bin data:`, JSON.stringify(binRecord));

                    const currentBinQuantity = binRecord.Quantity_Current !== null ? parseInt(binRecord.Quantity_Current) : 0;
                    const newBinQuantity = currentBinQuantity + binQuantity;

                    console.log(`[DELETE] Updating Bin Quantity_Current: ${currentBinQuantity} (${typeof currentBinQuantity}) + ${binQuantity} (${typeof binQuantity}) = ${newBinQuantity} (${typeof newBinQuantity})`);

                    const binUpdateResult = await Bin.update(
                        { Quantity_Current: newBinQuantity },
                        {
                            where: { BinId: binId },
                            transaction
                        }
                    );
                    console.log(`[DELETE] Bin update result:`, binUpdateResult);
                } else {
                    console.log(`[DELETE] Warning: Bin ${binId} not found when restoring inventory`);
                }

                // Update Stock quantity
                const stock = await Stock.findOne({
                    where: { BookId: bookId },
                    transaction
                });

                console.log(`[DELETE] Found stock record?`, stock ? 'Yes' : 'No');
                if (stock) {
                    console.log(`[DELETE] Stock data:`, JSON.stringify(stock));

                    const currentStockQuantity = parseInt(stock.Quantity);
                    const newStockQuantity = currentStockQuantity + binQuantity;

                    console.log(`[DELETE] Updating Stock Quantity: ${currentStockQuantity} (${typeof currentStockQuantity}) + ${binQuantity} (${typeof binQuantity}) = ${newStockQuantity} (${typeof newStockQuantity})`);

                    const stockUpdateResult = await Stock.update(
                        { Quantity: newStockQuantity },
                        {
                            where: { BookId: bookId },
                            transaction
                        }
                    );
                    console.log(`[DELETE] Stock update result:`, stockUpdateResult);
                } else {
                    console.log(`[DELETE] Warning: Stock record for book ${bookId} not found when restoring inventory`);
                }
            }

            // Delete related records
            console.log(`[DELETE] Deleting related ExportOrderDetails records`);
            const deleteDetailsResult = await ExportOrderDetails.destroy({
                where: { ExportOrderId: exportOrderId },
                transaction
            });
            console.log(`[DELETE] ExportOrderDetails deletion result:`, deleteDetailsResult);

            console.log(`[DELETE] Deleting related ExportOrderBins records`);
            const deleteBinsResult = await db.ExportOrderBins.destroy({
                where: { ExportOrderId: exportOrderId },
                transaction
            });
            console.log(`[DELETE] ExportOrderBins deletion result:`, deleteBinsResult);

            console.log(`[DELETE] Deleting related OrderStatusLogs records`);
            const deleteLogsResult = await OrderStatusLogs.destroy({
                where: {
                    OrderId: exportOrderId,
                    OrderType: 'Export'
                },
                transaction
            });
            console.log(`[DELETE] OrderStatusLogs deletion result:`, deleteLogsResult);

            // Delete the export order
            console.log(`[DELETE] Deleting the main export order record`);
            const deleteOrderResult = await exportOrder.destroy({ transaction });
            console.log(`[DELETE] Export order deletion result:`, deleteOrderResult);
        });

        console.log(`[DELETE] Successfully completed delete process for export order ${exportOrderId}`);

        res.status(httpStatus.OK).json({
            success: true,
            message: 'Export order deleted successfully'
        });
    } catch (error) {
        console.error('[DELETE] Error in deleteExportOrder:', error);
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
            'New': ['Pending', 'Rejected'],
            'Pending': ['Approved', 'Rejected'],
            'Approved': ['Shipping', 'Rejected'],
            'Shipping': ['Completed'],
            'Rejected': ['Cancelled']
        };

        const currentStatus = exportOrder.Status;
        if (!validTransitions[currentStatus]?.includes(status)) {
            throw new ApiError(
                httpStatus.BAD_REQUEST,
                `Invalid status transition from ${currentStatus} to ${status}`
            );
        }

        // Handle rejection - return items to bins and stock
        if (status === 'Rejected') {
            // Get the order details to find quantities
            const orderDetails = await ExportOrderDetails.findAll({
                where: { ExportOrderId: exportOrderId }
            });

            // Get the bin information for this order
            const orderBins = await db.ExportOrderBins.findAll({
                where: { ExportOrderId: exportOrderId }
            });

            if (!orderBins || orderBins.length === 0) {
                throw new ApiError(httpStatus.NOT_FOUND,
                    'Bin information not found for this order. Cannot restore inventory.');
            }

            // Process each bin allocation in a transaction
            await db.sequelize.transaction(async (transaction) => {
                for (const binAllocation of orderBins) {
                    const { BookId, BinId, Quantity } = binAllocation;

                    // 1. Check if BookBin record exists
                    let bookBin = await BookBin.findOne({
                        where: {
                            BookId: BookId,
                            BinId: BinId
                        },
                        transaction
                    });

                    if (bookBin) {
                        // Update existing record
                        const currentQuantity = parseInt(bookBin.Quantity);
                        await BookBin.update(
                            { Quantity: currentQuantity + Quantity },
                            {
                                where: { BookBinId: bookBin.BookBinId },
                                transaction
                            }
                        );
                    } else {
                        // Create new record
                        await BookBin.create({
                            BookId: BookId,
                            BinId: BinId,
                            Quantity: Quantity
                        }, { transaction });
                    }

                    // 2. Update Bin.Quantity_Current
                    const bin = await Bin.findByPk(BinId, { transaction });
                    if (bin) {
                        const currentBinQuantity = bin.Quantity_Current !== null ? parseInt(bin.Quantity_Current) : 0;
                        const newBinQuantity = currentBinQuantity + Quantity;

                        await Bin.update(
                            { Quantity_Current: newBinQuantity },
                            {
                                where: { BinId: BinId },
                                transaction
                            }
                        );
                    }

                    // 3. Update Stock quantity
                    const stock = await Stock.findOne({
                        where: { BookId: BookId },
                        transaction
                    });

                    if (stock) {
                        const currentStockQuantity = parseInt(stock.Quantity);
                        await Stock.update(
                            { Quantity: currentStockQuantity + Quantity },
                            {
                                where: { BookId: BookId },
                                transaction
                            }
                        );
                    }
                }
            });
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