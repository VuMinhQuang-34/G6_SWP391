import db from "../models/index.js"; // Import db từ models
import util from "./common.js"; // Import db từ models
import { Op } from 'sequelize'; // Import Op từ sequelize để sử dụng trong tìm kiếm
const { ImportOrders, ImportOrderDetails, Book, OrderStatusLogs, Fault, Stock } = db; // Destructure các model cần thiết

//#region ADD
export const test = async (req, res) => {
    const { SupplierID, ImportDate, Note, orderDetails, CreatedBy } = req.body; // Lấy dữ liệu từ request body

    try {
        
        const abc = await util.getAllStock();
        //const abcd = await util.getCountUserByStatus("Active");
        //const abcde = await util.getCountUserByStatus("Inactive");
        // const abc = {
        //     a: await util.getCountUserByStatus(),
        //     b: await util.getCountUserByStatus("Active"),
        //     c: await util.getCountUserByStatus("Inactive")
        // }
        // const abc = {
        //     a: await util.getCountIOByStatus(),
        //     b: await util.getCountIOByStatus("New"),
        //     c: await util.getCountIOByStatus("Approve"),
        //     d: await util.getCountIOByStatus("Receive"),
        //     e: await util.getCountIOByStatus("ApproveImport")
        // }
        console.log("abc", abc);
        
        // Trả về phản hồi thành công
        res.status(201).json({
            message: 'OK',
            data: abc
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Đã xảy ra lỗi khi tạo đơn nhập hàng!',
            error: error.message,
        });
    }
};
