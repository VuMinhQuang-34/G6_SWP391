import db from "../models/index.js"; // Import db từ models
import { Op } from 'sequelize'; // Import Op từ sequelize để sử dụng trong tìm kiếm
const { ImportOrders, ImportOrderDetails, Book, OrderStatusLogs } = db; // Destructure các model cần thiết

//#region ADD
export const createImportOrder = async (req, res) => {
    const { SupplierID, ImportDate, Note, orderDetails, CreatedBy } = req.body; // Lấy dữ liệu từ request body

    try {
        // Kiểm tra dữ liệu đầu vào
        if (!SupplierID || !ImportDate || !orderDetails || !Array.isArray(orderDetails) || orderDetails.length === 0) {
            return res.status(400).json({ message: 'Thiếu thông tin cần thiết để tạo đơn nhập!' });
        }

        // Tạo đơn nhập mới
        const newOrder = await ImportOrders.create({
            SupplierID,
            ImportDate,
            Note,
            Status: "New", // Trạng thái mặc định là "New"
            CreatedBy,
            Created_Date: new Date(),
        });

        // Thêm các chi tiết đơn nhập
        await Promise.all(orderDetails.map(async (detail) => {
            await ImportOrderDetails.create({
                ImportOrderId: newOrder.ImportOrderId, // Sử dụng ID của đơn nhập mới
                BookId: detail.BookId,
                Quantity: parseInt(detail.Quantity, 10), // Chuyển đổi Quantity thành số
                Price: parseFloat(detail.Price), // Chuyển đổi Price thành số
            });
        }));

        // Ghi lại trạng thái đơn hàng vào bảng OrderStatusLogs
        await OrderStatusLogs.create({
            OrderId: newOrder.ImportOrderId,
            OrderType: 'Import', // Đặt OrderType là 'Import'
            Status: 'New', // Trạng thái hiện tại
            CreatedBy,
            Created_Date: new Date(),
        });

        // Trả về phản hồi thành công
        res.status(201).json({
            message: 'Đơn nhập hàng đã được tạo thành công!',
            orderId: newOrder.ImportOrderId, // Trả về ID của đơn nhập mới
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Đã xảy ra lỗi khi tạo đơn nhập hàng!',
            error: error.message,
        });
    }
};

//#region EDIT
export const updateImportOrder = async (req, res) => {
    const { id } = req.params; // Lấy ID đơn nhập từ params
    const { SupplierID, ImportDate, Note, orderDetails, UpdatedBy } = req.body; // Lấy dữ liệu từ request body

    try {
        // Kiểm tra dữ liệu đầu vào
        if (!SupplierID || !ImportDate || !orderDetails || !Array.isArray(orderDetails) || orderDetails.length === 0) {
            return res.status(400).json({ message: 'Thiếu thông tin cần thiết để cập nhật đơn nhập!' });
        }

        // Lấy thông tin đơn nhập hiện tại với raw: true
        const order = await ImportOrders.findOne({
            where: { ImportOrderId: id },
            raw: true, // Trả về đối tượng thuần túy
        });

        // Kiểm tra xem đơn nhập có tồn tại không
        if (!order) {
            return res.status(404).json({ message: 'Đơn nhập không tồn tại!' });
        }
        console.log("order-edit1 =>", order);
        console.log("order-edit2 =>", order.Status);
        
        // Kiểm tra trạng thái của đơn nhập
        if (order.Status !== 'New') { // Truy cập trực tiếp vào thuộc tính
            return res.status(403).json({ message: 'Chỉ cho phép cập nhật đơn nhập có trạng thái New!' });
        }

        // Cập nhật thông tin đơn nhập
        await ImportOrders.update({
            SupplierID,
            ImportDate,
            Note,
            UpdatedBy,
            Updated_Date: new Date(),
        }, {
            where: { ImportOrderId: id },
        });

        // Xóa các chi tiết đơn nhập cũ
        await ImportOrderDetails.destroy({
            where: { ImportOrderId: id },
        });

        // Cập nhật các chi tiết đơn nhập mới
        await Promise.all(orderDetails.map(async (detail) => {
            await ImportOrderDetails.create({
                ImportOrderId: id, // Sử dụng id của đơn nhập
                BookId: detail.BookId,
                Quantity: parseInt(detail.Quantity, 10), // Chuyển đổi Quantity thành số
                Price: parseFloat(detail.Price), // Chuyển đổi Price thành số
            });
        }));

        // Lấy lại thông tin đơn nhập đã cập nhật để trả về
        const updatedOrder = await ImportOrders.findOne({
            where: { ImportOrderId: id },
            raw: true, // Trả về đối tượng thuần túy
        });

        // Tạo phản hồi
        const response = {
            ImportOrderId: updatedOrder.ImportOrderId,
            CreatedBy: updatedOrder.CreatedBy,
            SupplierID: updatedOrder.SupplierID,
            Created_Date: updatedOrder.Created_Date,
            ImportDate: updatedOrder.ImportDate,
            Status: updatedOrder.Status,
            Note: updatedOrder.Note,
            orderDetails: await ImportOrderDetails.findAll({
                where: { ImportOrderId: id },
                attributes: ['BookId', 'Quantity', 'Price'], // Chỉ lấy các thuộc tính cần thiết
            }),
        };

        // Trả về phản hồi thành công
        res.status(200).json({
            message: 'Đơn nhập hàng đã được cập nhật thành công!',
            order: response, // Trả về thông tin đơn hàng đã cập nhật
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Đã xảy ra lỗi khi cập nhật đơn nhập hàng!',
            error: error.message,
        });
    }
};

//#region GET ALL
export const getImportOrders = async (req, res) => {
    const { page = 1, limit = 10, searchId = '', searchSupplier = '', searchDate = '' } = req.query; // Lấy các tham số từ query

    try {
        const offset = (page - 1) * limit; // Tính toán offset cho phân trang

        // Tìm kiếm đơn nhập hàng
        const whereConditions = {
            [Op.and]: [
                searchId ? { ImportOrderId: { [Op.eq]: searchId } } : {},
                searchSupplier ? { SupplierID: { [Op.like]: `%${searchSupplier}%` } } : {},
                searchDate ? { ImportDate: { [Op.eq]: new Date(searchDate).toISOString() } } : {},
            ],
        };

        const { count, rows } = await ImportOrders.findAndCountAll({
            where: whereConditions,
            limit: parseInt(limit), // Giới hạn số lượng kết quả
            offset: parseInt(offset), // Bỏ qua số lượng kết quả đã hiển thị
            order: [['Created_Date', 'DESC']], // Sắp xếp theo ngày tạo
        });

        // Trả về phản hồi thành công
        res.status(200).json({
            total: count,
            totalPages: Math.ceil(count / limit),
            currentPage: parseInt(page),
            orders: rows,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Đã xảy ra lỗi khi lấy danh sách đơn nhập hàng!',
            error: error.message,
        });
    }
};

//#region GET ONE
export const getImportOrderDetails = async (req, res) => {
    const { id } = req.params; // Lấy ID đơn nhập từ params

    try {
        // Lấy thông tin đơn nhập
        const order = await ImportOrders.findOne({
            where: { ImportOrderId: id },
        });

        if (!order) {
            return res.status(404).json({ message: 'Đơn nhập không tồn tại!' });
        }

        // Lấy danh sách chi tiết đơn nhập dựa trên ImportOrderId
        const orderDetails = await ImportOrderDetails.findAll({
            where: { ImportOrderId: id },
            attributes: ['BookId', 'Quantity', 'Price'], // Chỉ lấy các thuộc tính cần thiết
        });

        // Tính toán tổng số sách và tổng giá
        const totalQuantity = orderDetails.reduce((sum, detail) => sum + detail.Quantity, 0);
        const totalPrice = orderDetails.reduce((sum, detail) => sum + parseFloat(detail.Price), 0);

        // Lấy thông tin sách cho từng BookId
        const detailsWithBooks = await Promise.all(orderDetails.map(async (detail) => {
            const book = await Book.findOne({
                where: { BookId: detail.BookId },
                attributes: ['Title', 'Author', 'Publisher'], // Lấy các thuộc tính cần thiết từ model Books
            });
            return {
                BookId: detail.BookId,
                Quantity: detail.Quantity,
                Price: detail.Price,
                BookInfo: book // Thêm thông tin sách vào phản hồi
            };
        }));

        // Tạo phản hồi
        const response = {
            ImportOrderId: order.ImportOrderId,
            CreatedBy: order.CreatedBy,
            SupplierID: order.SupplierID,
            Created_Date: order.Created_Date,
            ImportDate: order.ImportDate,
            Status: order.Status,
            Note: order.Note,
            // details: orderDetails, // Danh sách sách
            details: detailsWithBooks,
            totalQuantity, // Tổng số sách
            totalPrice, // Tổng giá
        };

        res.status(200).json(response);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Đã xảy ra lỗi khi lấy thông tin chi tiết đơn nhập!',
            error: error.message,
        });
    }
};

//#region DELETE
export const deleteImportOrder = async (req, res) => {
    const { id } = req.params; // Lấy ID đơn nhập từ params

    try {
        // Kiểm tra xem đơn nhập có tồn tại không
        const order = await ImportOrders.findOne({
            where: { ImportOrderId: id },
        });

        if (!order) {
            return res.status(404).json({ message: 'Đơn nhập không tồn tại!' });
        }

        // Kiểm tra trạng thái của đơn nhập
        if (order.Status !== 'New') {
            return res.status(403).json({ message: 'Chỉ cho phép xóa đơn nhập có trạng thái New!' });
        }

        // Xóa các chi tiết đơn nhập liên quan
        await ImportOrderDetails.destroy({
            where: { ImportOrderId: id },
        });

        // Xóa các bản ghi trong OrderStatusLogs liên quan
        await OrderStatusLogs.destroy({
            where: { OrderId: id, OrderType: 'Import' }, // Chỉ xóa các bản ghi có OrderType là 'Import'
        });

        // Xóa đơn nhập
        await ImportOrders.destroy({
            where: { ImportOrderId: id },
        });

        // Trả về phản hồi thành công
        res.status(200).json({
            message: 'Đơn nhập đã được xóa thành công!',
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Đã xảy ra lỗi khi xóa đơn nhập!',
            error: error.message,
        });
    }
};

// Các hàm CRUD khác (update, delete, etc.) sẽ được thêm vào đây