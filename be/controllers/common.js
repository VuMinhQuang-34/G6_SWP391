import db from "../models/index.js"; // Import db từ models
import { Op, where } from 'sequelize'; // Import Op từ sequelize để sử dụng trong tìm kiếm
const { ImportOrders, ImportOrderDetails, Book, OrderStatusLogs, Fault, Stock, User } = db;

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
const getAllBookByIO = async (orderId) => {
    // Lấy danh sách chi tiết đơn nhập dựa trên orderId
    const orderDetails = await ImportOrderDetails.findAll({
        where: { ImportOrderId: orderId },
        attributes: ['BookId', 'Quantity', 'Price'], // Chỉ lấy các thuộc tính cần thiết
        raw: true
    });

    // Lấy thông tin sách cho từng BookId
    const books = await Promise.all(orderDetails.map(async (detail) => {
        const book = await Book.findOne({
            where: { BookId: detail.BookId },
            attributes: ['BookId', 'Title', 'Author', 'Publisher', 'CategoryId', 'PublishingYear', 'NumberOfPages', 'Language', 'Status', 'Created_Date', 'Edit_Date'], // Lấy các thuộc tính cần thiết từ model Books
            raw: true
        });
        return {...book, ...detail};
    }));

    return books || [];
}

// #region count-IO 
const getCountIOByStatus = async (status) => {
    if (status == 'New') {
        return await ImportOrders.count({where: {Status: 'New'}});
    }else if (status == 'Approve') {
        return await ImportOrders.count({where: {Status: 'Approve'}});
    }else if (status == 'Receive') {
        return await ImportOrders.count({where: {Status: 'Receive'}});
    }else if (status == 'ApproveImport') {
        return await ImportOrders.count({where: {Status: 'ApproveImport'}});
    }
    return await ImportOrders.count();
} 




//#region ==STOCK==





//#region get-one
const getOneStockByBookId = async (bookId) => {
    return await Stock.findOne({
        where: {BookId: bookId},
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
const geTotalQuantityStock = async () => {
    return await Stock.sum('Quantity'); 
}

//#region ==USER==
const getAllUsers = async () => {
    return await User.findAll({raw: true});
}

const getCountUserByStatus = async (status) => {

    if (status == 'Active') {
        return await User.count({where: {Status: 'Active'}});
    }else if (status == 'Inactive') {
        return await User.count({where: {Status: 'Inactive'}});
    }
    return await User.count();
}
const getCountUserByRole = async (role) => {
    if (role == 'Admin') {
        return await User.count({where: {roleId: 1}});
    }else if (role == 'Manager') {
        return await User.count({where: {Status: 2}});
    }else if (role == 'Staff') {
        return await User.count({where: {Status: 3}});
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
    geTotalQuantityStock
}