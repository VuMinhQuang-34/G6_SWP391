import db from "../models/index.js";
import bcrypt from "bcryptjs";

const { User, Role } = db;

// 📌 Lấy danh sách Users + Tìm kiếm + Phân trang
export const getAllUsers = async (req, res) => {
    try {
        console.log("API: getAllUsers");

        const { page = 1, limit = 10, search = "", status, roleId } = req.query;

        let whereCondition = {};

        if (search) {
            whereCondition.Email = { [db.Sequelize.Op.like]: `%${search}%` };
        }
        if (status) {
            whereCondition.Status = status;
        }
        if (roleId) {
            whereCondition.roleId = roleId;
        }

        const offset = (page - 1) * limit;
        const { count, rows } = await User.findAndCountAll({
            where: whereCondition,
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [["Created_Date", "DESC"]],
        });

        res.json(rows); // 🔥 Chỉ trả về danh sách user thay vì object count + rows
    } catch (error) {
        res.status(500).json({ message: "Lỗi server!", error: error.message });
    }
};


// 📌 Lấy User theo ID
export const getUserById = async (req, res) => {
    try {
        const { id } = req.params;
        //const user = await User.findByPk(id);
        const user = await User.findByPk(id, {
            include: [
                {
                    model: Role,
                    attributes: ["Role_Name"], // Chỉ lấy roleName, tránh dư thừa dữ liệu
                },
            ],
        });
        if (!user) {
            return res.status(404).json({ message: "User không tồn tại!" });
        }

        res.json(user);
    } catch (error) {
        res.status(500).json({ message: "Lỗi server!", error: error.message });
    }
};

// 📌 Tạo User mới
export const createUser = async (req, res) => {
    try {
        const { FullName, Email, Password, roleId, PhoneNumber } = req.body;

        // Kiểm tra dữ liệu đầu vào
        if (!FullName || !Email || !Password || !roleId) {
            return res.status(400).json({ message: "Thiếu thông tin bắt buộc!" });
        }

        // Kiểm tra roleId hợp lệ
        const roleExists = await Role.findOne({ where: { roleId } });

        if (!roleExists) {
            return res.status(400).json({ message: `Role ID ${roleId} không hợp lệ!` });
        }

        // Kiểm tra email đã tồn tại chưa
        const existingUser = await User.findOne({ where: { Email } });

        if (existingUser) {
            return res.status(400).json({ message: "Email đã được sử dụng!" });
        }

        // Hash mật khẩu trước khi lưu
        const hashedPassword = await bcrypt.hash(Password, 10);

        const newUser = await User.create({
            FullName,
            Email,
            Password: hashedPassword,
            roleId,
            PhoneNumber,
            Status: "Active",
            Created_Date: new Date(),
            Edit_Date: new Date(),
        });

        res.status(201).json({ message: "User tạo thành công!", user: newUser });
    } catch (error) {
        res.status(500).json({ message: "Lỗi server!", error: error.message });
    }
};

// 📌 Cập nhật User

export const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { FullName, Email, roleId, PhoneNumber, Status } = req.body;

        const user = await User.findByPk(id);
        if (!user) {
            return res.status(404).json({ message: "User không tồn tại!" });
        }

        // Kiểm tra roleId hợp lệ nếu có thay đổi
        if (roleId) {
            const roleExists = await Role.findOne({ where: { roleId } });
            if (!roleExists) {
                return res.status(400).json({ message: `Role ID ${roleId} không hợp lệ!` });
            }
        }

        // Kiểm tra Email trùng lặp
        if (Email && Email !== user.Email) {
            const existingUser = await User.findOne({ where: { Email } });
            if (existingUser) {
                return res.status(400).json({ message: "Email đã được sử dụng!" });
            }
        }

        await user.update({
            FullName: FullName || user.FullName,
            Email: Email || user.Email,
            roleId: roleId || user.roleId,
            PhoneNumber: PhoneNumber || user.PhoneNumber,
            Status: Status || user.Status,
            Edit_Date: new Date(),
        });

        res.json({ message: "Cập nhật thành công!", user });
    } catch (error) {
        res.status(500).json({ message: "Lỗi server!", error: error.message });
    }
};

// 📌 Xóa User (Chuyển trạng thái sang Inactive)
export const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findByPk(id);

        if (!user) {
            return res.status(404).json({ message: "User không tồn tại!" });
        }

        // Chuyển trạng thái sang Inactive thay vì xóa cứng
        await user.update({ Status: "Inactive" });

        res.json({ message: "User đã chuyển sang trạng thái Inactive!" });
    } catch (error) {
        res.status(500).json({ message: "Lỗi server!", error: error.message });
    }
};
