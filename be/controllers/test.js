import common from "./common.js"; // Import file common.js

const testGetAllBookByIO = async () => {
    try {
        const orderId = 1; // Thay bằng một orderId có trong database
        const books = await common.getAllBookByIO(orderId);
        console.log("Danh sách sách theo Import Order:", books);
    } catch (error) {
        console.error("Lỗi khi gọi getAllBookByIO:", error);
    }
};

// Gọi hàm test
testGetAllBookByIO();
