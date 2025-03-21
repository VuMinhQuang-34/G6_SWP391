import db from "../models/index.js"; // Import db từ models
import { Op, where } from 'sequelize'; // Import Op từ sequelize để sử dụng trong tìm kiếm
const { ImportOrders, ImportOrderDetails, Book, OrderStatusLogs, Fault, Stock, User, Category, Bin, Shelf, Warehouse, BookBin } = db;

//#region ==IO==
const getOneIO = async (req, res) => {

}

//#region count-book
const getCountBooksIO = async (id) => {
    // Lấy danh sách chi tiết đơn nhập dựa trên ImportOrderId
    const orderDetails = await ImportOrderDetails.findAll({
        where: { ImportOrderId: id },
        attributes: ['BookId', 'Quantity', 'Price'], // Chỉ lấy các thuộc tính cần thiết
    });

    // Tính toán tổng số sách và tổng giá
    const totalQuantity = orderDetails.reduce((sum, detail) => sum + detail.Quantity, 0);
    // const totalPrice = orderDetails.reduce((sum, detail) => sum + parseFloat(detail.Price), 0);
    return totalQuantity;
}

//#region get-books-by-IO
const getAllBookByIO = async (importOrderId) => {
    try {
        const books = await ImportOrderDetails.findAll({
            where: { ImportOrderId: importOrderId }
        });
        return books;
    } catch (error) {
        console.error('Error in getAllBookByIO:', error);
        throw error;
    }
}

// #region count-IO 
const getCountIOByStatus = async (status) => {
    if (status == 'New') {
        return await ImportOrders.count({ where: { Status: 'New' } });
    } else if (status == 'Approve') {
        return await ImportOrders.count({ where: { Status: 'Approve' } });
    } else if (status == 'Receive') {
        return await ImportOrders.count({ where: { Status: 'Receive' } });
    } else if (status == 'ApproveImport') {
        return await ImportOrders.count({ where: { Status: 'ApproveImport' } });
    }
    return await ImportOrders.count();
}




//#region ==STOCK==





//#region get-one
const getOneStockByBookId = async (bookId) => {
    return await Stock.findOne({
        where: { BookId: bookId },
        raw: true
    })
}
//#region get-all
const getAllStock = async () => {
    return await Stock.findAll({
        raw: true,
        order: [['Quantity', 'DESC']]
    })
}

//#region count-total-book
const getTotalQuantityStock = async () => {
    return await Stock.sum('Quantity');
}

//#region update stock
const updateStock = async (stock) => {
    try {
        await Stock.update({
            MaxStockQuantity: stock.MaxStockQuantity,
            MinStockQuantity: stock.MinStockQuantity
        }, {
            where: { BookId: stock.BookId }
        })
    } catch (error) {

    }

}

//#region ==USER==
const getAllUsers = async () => {
    return await User.findAll({ raw: true });
}

const getCountUserByStatus = async (status) => {

    if (status == 'Active') {
        return await User.count({ where: { Status: 'Active' } });
    } else if (status == 'Inactive') {
        return await User.count({ where: { Status: 'Inactive' } });
    }
    return await User.count();
}
const getCountUserByRole = async (role) => {
    if (role == 'Admin') {
        return await User.count({ where: { roleId: 1 } });
    } else if (role == 'Manager') {
        return await User.count({ where: { Status: 2 } });
    } else if (role == 'Staff') {
        return await User.count({ where: { Status: 3 } });
    }
}

//#region ==book==






//#region count-books
const getTotalBook = async (role) => {
    return await Book.count();
}


//#region ==Category==







//#region count-books
const getAllCategories = async (role) => {
    return await Category.findAll();
}

// Lấy thông tin stock của một sách
const getOneStock = async (bookId) => {
    try {
        const stock = await Stock.findOne({
            where: { BookId: bookId }
        });
        return stock || { Quantity: 0 }; // Trả về object với Quantity = 0 nếu không tìm thấy
    } catch (error) {
        console.error('Error in getOneStock:', error);
        throw error;
    }
};






//#region ===Bin===







const getAllBin = async () => {
    try {
        return await Bin.findAll();
    } catch (error) {

    }
}

const getOneBinById = async (id) => {
    try {
        return await await Bin.findOne({ BinId: id });
    } catch (error) {

    }
}

const createBin = async (req, res) => {
    try {
        const { BinId, ShelfId, Name, Quantity_Max_Limit, Quantity_Current, Description } = req.body;

        if (!BinId || !ShelfId || !Name || !Quantity_Max_Limit) {
            return res.status(400).json({ error: 'Vui lòng cung cấp đầy đủ thông tin Bin' });
        }

        const newBin = await Bin.create({
            BinId,
            ShelfId,
            Name,
            Quantity_Max_Limit,
            Quantity_Current: Quantity_Current || 0, // Nếu không có thì mặc định là 0
            Description
        });

        return newBin;
    } catch (error) {
        return null;
    }
}


const updateBin = async (req, res) => {
    try {
        const { BinId, ShelfId, Name, Quantity_Max_Limit, Quantity_Current, Description } = req.body;

        if (!BinId || !ShelfId || !Name || !Quantity_Max_Limit) {
            return res.status(400).json({ error: 'Vui lòng cung cấp đầy đủ thông tin Bin' });
        }

        const newBin = await Bin.create({
            BinId,
            ShelfId,
            Name,
            Quantity_Max_Limit,
            Quantity_Current: Quantity_Current || 0, // Nếu không có thì mặc định là 0
            Description
        });

        return newBin;
    } catch (error) {
        return null;
    }
}

// Xóa bin chỉ khi không chứa sách nào
const deleteBin = async (binId) => {
    try {
        // Kiểm tra bin có tồn tại không
        const bin = await Bin.findOne({ 
            where: { BinId: binId } 
        });
        
        if (!bin) {
            return {
                success: false,
                message: 'Bin không tồn tại',
                status: 404
            };
        }
        
        // Kiểm tra bin có chứa sách nào không
        const bookCount = await BookBin.count({ 
            where: { BinId: binId } 
        });
        
        if (bookCount > 0) {
            return {
                success: false,
                message: 'Không thể xóa bin vì đang chứa sách',
                status: 400
            };
        }
        
        // Nếu bin không chứa sách, thực hiện xóa
        await bin.destroy();
        
        return {
            success: true,
            message: 'Xóa bin thành công',
            status: 200
        };
    } catch (error) {
        console.error('Error in deleteBin:', error);
        return {
            success: false,
            message: 'Lỗi khi xóa bin',
            error: error.message,
            status: 500
        };
    }
};

const getTotalBooksInBin = async (req, res) => {
    try {
        const { BinId } = req.params;

        // Kiểm tra bin có tồn tại không
        const bin = await Bin.findOne({ BinId });
        if (!bin) {
            return res.status(404).json({ error: 'Bin không tồn tại' });
        }

        // Tính tổng số lượng sách trong bin
        const totalQuantity = await BookBin.sum('Quantity', { where: { BinId } });

        res.status(200).json({ BinId, TotalQuantity: totalQuantity || 0 });
    } catch (error) {
        res.status(500).json({ error: 'Lỗi khi lấy tổng số lượng sách trong Bin', details: error.message });
    }
};

//#region ===Shelf===

const getAllShelf = async () => {
    try {
        return await Shelf.findAll({
            raw: true,
            order: [['ShelfId', 'ASC']]
        });
    } catch (error) {
        console.error('Error in getAllShelf:', error);
        throw error;
    }
}

export default {
    getOneIO,
    getCountBooksIO,
    getAllBookByIO,
    getOneStockByBookId,
    getAllUsers,
    getCountUserByStatus,
    getCountUserByRole,
    getCountIOByStatus,
    getAllStock,
    getTotalQuantityStock,
    updateStock,
    getTotalBook,
    getAllCategories,
    getOneStock,
    getAllBin,
    getOneBinById,
    createBin,
    updateBin,
    getTotalBooksInBin,
    getAllShelf,
    deleteBin
}