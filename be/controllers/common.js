import db from "../models/index.js"; // Import db từ models
import { Op, where } from 'sequelize'; // Import Op từ sequelize để sử dụng trong tìm kiếm
const { ImportOrders, ImportOrderDetails, Book, OrderStatusLogs, Fault, Stock, User, Category } = db;

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
    getOneStock
}