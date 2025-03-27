import db from "../models/index.js"; // Import db từ models
import util from "./common.js"; // Import db từ models
import { Op } from 'sequelize'; // Import Op từ sequelize để sử dụng trong tìm kiếm
const { ImportOrders, ImportOrderDetails, Book, OrderStatusLogs, Fault, Stock, Bin, BookBin } = db; // Destructure các model cần thiết

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
            Note: Note,
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
            return res.status(400).json({ message: 'Chỉ cho phép cập nhật đơn nhập có trạng thái New!' });
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

//#region GET-ALL
export const getImportOrders = async (req, res) => {
    const { page = 1, limit = 10, searchId = '', searchSupplier = '', searchDate = '', Status } = req.query; // Lấy các tham số từ query

    try {
        const offset = (page - 1) * limit; // Tính toán offset cho phân trang

        // Tìm kiếm đơn nhập hàng
        const whereConditions = {
            [Op.and]: [
                searchId ? { ImportOrderId: { [Op.eq]: searchId } } : {},
                searchSupplier ? { SupplierID: { [Op.like]: `%${searchSupplier}%` } } : {},
                searchDate ? { ImportDate: { [Op.eq]: new Date(searchDate).toISOString() } } : {},
                ...(Status ? [{ Status: { [Op.in]: Array.isArray(Status) ? Status : [Status] } }] : []),
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

//#region GET-ONE
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
                attributes: ['BookId', 'Title', 'Author', 'Publisher', 'CategoryId', 'PublishingYear', 'NumberOfPages', 'Language', 'Status', 'Created_Date', 'Edit_Date'], // Lấy các thuộc tính cần thiết từ model Books
            });
            return {
                BookId: detail.BookId,
                Quantity: detail.Quantity,
                Price: detail.Price,
                BookInfo: book // Thêm thông tin sách vào phản hồi
            };
        }));


        const faultBooksFromDB = await Fault.findAll({
            where: { OrderId: id, OrderType: "Import" },
        });

        // Map qua từng fault book để lấy thông tin sách
        const faultBooks = await Promise.all(faultBooksFromDB.map(async (fault) => {
            const book = await Book.findOne({
                where: { BookId: fault.BookId }
            });

            return {
                FaultId: fault.FaultId,
                OrderId: fault.OrderId,
                OrderType: fault.OrderType,
                BookId: fault.BookId,
                Quantity: fault.Quantity,
                Note: fault.Note,
                CreatedBy: fault.CreatedBy,
                Created_Date: fault.Created_Date,

                Title: book?.Title,
                Author: book?.Author,
                Publisher: book?.Publisher
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
            faultBooks: faultBooks || []
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

//#region APPROVE
export const approveImportOrder = async (req, res) => {
    const { id } = req.params; // Lấy ID đơn nhập từ params
    const { Status, LogStatus, CreatedBy, LogNote } = req.body; // Lấy Status và UpdatedBy từ body

    try {
        // Kiểm tra xem đơn nhập có tồn tại không
        const order = await ImportOrders.findOne({
            where: { ImportOrderId: id },
        });

        if (!order) {
            return res.status(404).json({ message: 'Đơn nhập không tồn tại!' });
        }

        // Cập nhật trạng thái đơn nhập
        await ImportOrders.update(
            { Status },
            { where: { ImportOrderId: id } }
        );

        // Ghi lại trạng thái đơn hàng vào bảng OrderStatusLogs
        await OrderStatusLogs.create({
            OrderId: id,
            OrderType: 'Import', // Đặt OrderType là 'Import'
            Status: LogStatus,
            CreatedBy,
            Note: LogNote,
            Created_Date: new Date(),
        });

        // Trả về phản hồi thành công
        res.status(200).json({
            message: 'Đơn nhập hàng đã được phê duyệt thành công!',
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Đã xảy ra lỗi khi phê duyệt đơn nhập hàng!',
            error: error.message,
        });
    }
};

//#region CHECK
export const checkImportOrder = async (req, res) => {
    const { id } = req.params; // Lấy ID đơn nhập từ params
    const { Status, LogStatus, CreatedBy, LogNote, FaultBooks } = req.body; // Lấy Status và UpdatedBy từ body

    try {
        // Kiểm tra xem đơn nhập có tồn tại không
        const order = await ImportOrders.findOne({
            where: { ImportOrderId: id },
        });

        if (!order) {
            return res.status(404).json({ message: 'Đơn nhập không tồn tại!' });
        }

        //Cập nhật trạng thái đơn nhập
        await ImportOrders.update(
            { Status },
            { where: { ImportOrderId: id } }
        );

        // Ghi lại trạng thái đơn hàng vào bảng OrderStatusLogs
        await OrderStatusLogs.create({
            OrderId: id,
            OrderType: 'Import', // Đặt OrderType là 'Import'
            Status: Status,
            CreatedBy: CreatedBy,
            Note: LogNote,
            Created_Date: new Date(),
        });

        //Thêm bảng sách lỗi
        if (FaultBooks && FaultBooks.length > 0) {
            await Promise.all(FaultBooks.map(async (b) => {
                await Fault.create({
                    OrderId: id,
                    OrderType: 'Import',
                    BookId: b.BookId,
                    FaultDate: new Date(),
                    Quantity: b.Quantity,
                    Note: b.Note,
                    CreatedBy: CreatedBy,
                    Created_date: new Date(),
                });
            }));
        }

        // Trả về phản hồi thành công
        res.status(200).json({
            message: 'Gửi yêu phê duyệt nhập hàng thành công!',
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Gửi yêu phê duyệt nhập hàng thành công!',
            error: error.message,
        });
    }
};

//#region APPROVE-WMS
export const approveWMS = async (req, res) => {
    const { id } = req.params;
    const { Status, LogStatus, CreatedBy, LogNote, FaultBooks, BinAllocations } = req.body;

    console.log("Request params:", req.params);
    console.log("Request body:", req.body);

    try {
        // Kiểm tra xem đơn nhập có tồn tại không
        const order = await ImportOrders.findOne({
            where: { ImportOrderId: id },
        });

        if (!order) {
            return res.status(404).json({ message: 'Đơn nhập không tồn tại!' });
        }

        // Bắt đầu transaction để đảm bảo tính nhất quán dữ liệu
        const t = await db.sequelize.transaction();

        try {
            //Cập nhật kho
            if (Status === "Done" || Status === "ApproveImport") {
                const books = await ImportOrderDetails.findAll({
                    where: { ImportOrderId: id }
                });
                console.log("Books retrieved from import order:", books);

                for (const book of books) {
                    if (book) {
                        const stock = await Stock.findOne({
                            where: { BookId: book.BookId }
                        });
                        console.log(`Current stock for book ${book.BookId}:`, stock);

                        if (!stock) {
                            // Tạo mới stock nếu chưa tồn tại
                            await Stock.create({
                                BookId: book.BookId,
                                Quantity: book.Quantity,
                                MaxStockQuantity: 0,
                                MinStockQuantity: 0,
                                Note: '',
                                Status: ''
                            }, { transaction: t });
                            console.log(`Created new stock for book ${book.BookId} with quantity ${book.Quantity}`);
                        } else {
                            // Đảm bảo giá trị là số khi cộng
                            const currentQuantity = parseInt(stock.Quantity) || 0;
                            const addQuantity = parseInt(book.Quantity) || 0;
                            const newStockQuantity = currentQuantity + addQuantity;

                            await Stock.update(
                                { Quantity: newStockQuantity },
                                { where: { BookId: book.BookId }, transaction: t }
                            );
                            console.log(`Updated stock for book ${book.BookId}: ${currentQuantity} + ${addQuantity} = ${newStockQuantity}`);
                        }
                    }
                }
            }

            // Cập nhật trạng thái đơn nhập
            await ImportOrders.update(
                { Status },
                { where: { ImportOrderId: id }, transaction: t }
            );
            console.log(`Updated import order status to ${Status}`);

            // Ghi lại trạng thái đơn hàng vào bảng OrderStatusLogs
            const newLog = await OrderStatusLogs.create({
                OrderId: id,
                OrderType: 'Import',
                Status: LogStatus,
                CreatedBy,
                Note: LogNote,
                Created_Date: new Date(),
            }, { transaction: t });
            console.log("Created order status log:", newLog);

            // Xử lý phân bổ sách vào bin
            if ((Status === "Done" || Status === "ApproveImport") && BinAllocations && BinAllocations.length > 0) {
                console.log("Processing bin allocations:", BinAllocations);

                for (const allocation of BinAllocations) {
                    const { BookId, BinId, Quantity } = allocation;
                    // Đảm bảo Quantity là số
                    const quantityToAdd = parseInt(Quantity) || 0;

                    console.log(`Processing allocation: Book ${BookId}, Bin ${BinId}, Quantity ${quantityToAdd}`);

                    // Kiểm tra bin có tồn tại không
                    const bin = await Bin.findByPk(BinId, { transaction: t });
                    if (!bin) {
                        console.error(`Bin with ID ${BinId} not found`);
                        await t.rollback();
                        return res.status(404).json({ message: `Không tìm thấy bin với ID ${BinId}` });
                    }
                    console.log(`Found bin ${BinId}:`, bin.Name);

                    // Đảm bảo các giá trị là số khi so sánh
                    const currentBinQuantity = parseInt(bin.Quantity_Current) || 0;
                    const maxBinLimit = parseInt(bin.Quantity_Max_Limit) || 0;
                    const remainingCapacity = maxBinLimit - currentBinQuantity;

                    console.log(`Bin ${bin.Name} - Current: ${currentBinQuantity}, Max: ${maxBinLimit}, Remaining: ${remainingCapacity}`);

                    if (currentBinQuantity + quantityToAdd > maxBinLimit) {
                        console.error(`Bin ${bin.Name} capacity exceeded - Need: ${quantityToAdd}, Available: ${remainingCapacity}`);
                        await t.rollback();
                        return res.status(400).json({
                            message: `Bin ${bin.Name} không đủ dung lượng. Còn trống: ${remainingCapacity}, Cần thêm: ${quantityToAdd}`
                        });
                    }

                    // Tìm bản ghi BookBin hiện có
                    const existingBookBin = await BookBin.findOne({
                        where: { BookId, BinId },
                        transaction: t
                    });

                    console.log(`Checking if book ${BookId} exists in bin ${BinId}:`, existingBookBin ? 'YES' : 'NO');

                    if (existingBookBin) {
                        // Cập nhật số lượng nếu đã tồn tại - đảm bảo là số
                        const currentBookBinQuantity = parseInt(existingBookBin.Quantity) || 0;
                        const newQuantity = currentBookBinQuantity + quantityToAdd;

                        await BookBin.update(
                            {
                                Quantity: newQuantity,
                                Edit_Date: new Date()
                            },
                            {
                                where: { BookBinId: existingBookBin.BookBinId },
                                transaction: t
                            }
                        );
                        console.log(`Updated existing BookBin ${existingBookBin.BookBinId}: ${currentBookBinQuantity} + ${quantityToAdd} = ${newQuantity}`);
                    } else {
                        // Tạo mới nếu chưa tồn tại
                        const newBookBin = await BookBin.create(
                            {
                                BookId,
                                BinId,
                                Quantity: quantityToAdd,
                                Created_Date: new Date()
                            },
                            { transaction: t }
                        );
                        console.log(`Created new BookBin ${newBookBin.BookBinId} with quantity ${quantityToAdd}`);
                    }

                    // Cập nhật số lượng hiện tại trong bin
                    const newBinQuantity = currentBinQuantity + quantityToAdd;
                    await Bin.update(
                        {
                            Quantity_Current: newBinQuantity,
                            Edit_Date: new Date()
                        },
                        {
                            where: { BinId },
                            transaction: t
                        }
                    );
                    console.log(`Updated Bin ${BinId} quantity: ${currentBinQuantity} + ${quantityToAdd} = ${newBinQuantity}`);
                }
            }

            // Xử lý sách lỗi nếu có
            if (FaultBooks && FaultBooks.length > 0) {
                console.log("Processing fault books:", FaultBooks);

                for (const b of FaultBooks) {
                    // Đảm bảo Quantity là số
                    const faultQuantity = parseInt(b.Quantity) || 0;

                    const newFault = await Fault.create({
                        OrderId: id,
                        OrderType: 'Import',
                        BookId: b.BookId,
                        FaultDate: new Date(),
                        Quantity: faultQuantity,
                        Note: b.Note || '',
                        CreatedBy: CreatedBy,
                        Created_date: new Date(),
                    }, { transaction: t });

                    console.log(`Created fault record for book ${b.BookId}: ${newFault.FaultId} with quantity ${faultQuantity}`);
                }
            }

            // Commit transaction
            await t.commit();
            console.log("Transaction committed successfully");

            // Trả về phản hồi thành công
            res.status(200).json({
                message: 'Đơn nhập hàng đã được phê duyệt thành công!',
            });
        } catch (error) {
            // Rollback transaction nếu có lỗi
            await t.rollback();
            console.error("Transaction rolled back due to error:", error);
            throw error;
        }
    } catch (error) {
        console.error("Error in approveWMS:", error);
        res.status(500).json({
            message: 'Đã xảy ra lỗi khi phê duyệt đơn nhập hàng!',
            error: error.message,
        });
    }
};

//#region GET-BookS
export const getBooksByImportOrderId = async (req, res) => {
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
        const response = await Promise.all(orderDetails.map(async (detail) => {
            const book = await Book.findOne({
                where: { BookId: detail.BookId },
                attributes: ['BookId', 'Title', 'Author', 'Publisher', 'CategoryId', 'PublishingYear', 'NumberOfPages', 'Language', 'Status', 'Created_Date', 'Edit_Date'], // Lấy các thuộc tính cần thiết từ model Books
            });
            return book;
        }));

        res.status(200).json(response);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Đã xảy ra lỗi khi lấy thông tin chi tiết đơn nhập!',
            error: error.message,
        });
    }
};