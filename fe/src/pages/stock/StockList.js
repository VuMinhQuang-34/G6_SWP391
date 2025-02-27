import React, { useEffect, useState } from "react";
import {
  Table,
  Button,
  Input,
  Space,
  Tag,
  Modal,
  Select,
  message,
  Form,
  Popconfirm,
} from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  SearchOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import axios from "axios";

//Thông báo
import { toast } from "react-toastify";

const { confirm } = Modal;
const { Option } = Select;

const StockList = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();
  const navigate = useNavigate();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [editForm] = Form.useForm();

  // Gọi API lấy danh sách Users
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await axios.get("http://localhost:9999/api/users");
      setUsers(response.data);
      setLoading(false);
    } catch (error) {
      message.error("Lỗi khi tải danh sách người dùng!");
      setLoading(false);
    }
  };

  // Xử lý tìm kiếm theo email
  const handleSearch = (e) => {
    setSearchText(e.target.value);
  };

  // Xử lý lọc theo Trạng thái (Active/Inactive)
  const handleStatusFilter = (value) => {
    setStatusFilter(value);
  };

  // Xử lý lọc theo Quyền (Admin/Staff)
  const handleRoleFilter = (value) => {
    setRoleFilter(value);
  };

  // Xử lý khi nhấn "Chỉnh sửa"
  const handleEdit = (id) => {
    navigate(`/admin/users/${id}`);
  };

  const showEditUserModal = (user) => {
    setSelectedUser(user);
    setIsEditModalOpen(true);
    editForm.setFieldsValue({
      FullName: user.FullName,
      Email: user.Email,
      PhoneNumber: user.PhoneNumber,
      roleId: user.roleId,
    });
  };

  const handleUpdateUser = async (values) => {
    try {
      await axios.put(
        `http://localhost:9999/api/users/${selectedUser.userId}`,
        values
      );

      setUsers(
        users.map((u) =>
          u.userId === selectedUser.userId ? { ...u, ...values } : u
        )
      );
      toast.success(`Cập nhật thành công`, { autoClose: 2000 });

      message.success("Cập nhật user thành công!");
      setIsEditModalOpen(false);
    } catch (error) {
      message.error("Lỗi khi cập nhật user!");
      toast.error(`Cập nhật thất bại`);
    }
  };

  // Xác nhận cập nhật trạng thái user
  const showDeleteConfirm = (user) => {
    console.log("Clicked delete for user:", user);

    Modal.confirm({
      title: `Bạn có chắc chắn muốn cập nhật trạng thái user này?`,
      icon: React.createElement(ExclamationCircleOutlined),
      content: `User sẽ được chuyển sang trạng thái ${
        user.Status === "Active" ? "Inactive" : "Active"
      }`,
      okText: "Xác nhận",
      okType: "danger",
      cancelText: "Hủy",
      onOk() {
        handleToggleStatus(user);
      },
    });
  };
  // Xử lý cập nhật trạng thái User (Active ⇆ Inactive)
  const handleToggleStatus = async (user) => {
    try {
      const newStatus = user.Status == "Active" ? "Inactive" : "Active";
      await axios.put(`http://localhost:9999/api/users/${user.userId}`, {
        Status: newStatus,
      });
      setUsers(
        users.map((u) =>
          u.userId === user.userId ? { ...u, Status: newStatus } : u
        )
      );
      toast.success(`Cập nhật thành công`, { autoClose: 2000 });
      message.success(`User đã chuyển sang trạng thái ${newStatus}`);
    } catch (error) {
      message.error("Lỗi khi cập nhật trạng thái user!");
      toast.error(`Cập nhật thất bại`);
    }
  };

  // Xử lý mở Modal thêm tài khoản
  const showAddUserModal = () => {
    setIsModalOpen(true);
  };

  // Xử lý đóng Modal thêm tài khoản
  const handleCancel = () => {
    setIsModalOpen(false);
    form.resetFields();
  };

  // Xử lý submit form để thêm tài khoản
  const handleAddUser = async (values) => {
    try {
      const response = await axios.post(
        "http://localhost:9999/api/users",
        values
      );

      // Sau khi tạo user thành công, gọi API lấy danh sách user mới nhất
      const updatedUsers = await axios.get("http://localhost:9999/api/users");

      // Cập nhật lại danh sách user từ API
      setUsers(updatedUsers.data);

      // Hiển thị thông báo thành công
      message.success("Thêm user thành công!");

      // Hiển thị toast thông báo thành công

      toast.success(`Thêm mới tài khoản thành công`, { autoClose: 2000 });
      // Đóng popup thêm user
      handleCancel();
    } catch (error) {
      message.error("Lỗi khi thêm user!");
      toast.error(`Cập nhật thất bại`);
    }
  };

  // Lọc danh sách user theo điều kiện tìm kiếm & filter
  const filteredUsers = users.filter((user) => {
    const matchEmail = user.Email
      ? user.Email.toLowerCase().includes(searchText.toLowerCase())
      : false;
    const matchStatus = statusFilter ? user.Status === statusFilter : true;
    const matchRole = roleFilter ? user.roleId === roleFilter : true;
    return matchEmail && matchStatus && matchRole;
  });

  // Cấu hình cột hiển thị trong bảng
  const columns = [
    {
      title: "Mã nhân viên",
      dataIndex: "userId",
      key: "userId",
      width: 80,
      sorter: (a, b) => a.userId - b.userId,
    },
    { title: "Họ và Tên", dataIndex: "FullName", key: "FullName" },
    { title: "Email", dataIndex: "Email", key: "Email" },
    { title: "Số điện thoại", dataIndex: "PhoneNumber", key: "PhoneNumber" },
    {
      title: "Vị trí",
      dataIndex: "roleId",
      key: "roleId",
      render: (role) => (
        <Tag color={role === 1 ? "red" : role === 2 ? "gold" : "blue"}>
          {role === 1 ? "Admin" : role === 2 ? "Manager" : "Staff"}
        </Tag>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "Status",
      key: "Status",
      render: (status) => (
        <Tag color={status === "Active" ? "green" : "volcano"}>{status}</Tag>
      ),
    },
    {
      title: "Hành động",
      key: "actions",
      render: (text, record) => (
        <Space>
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={() => showEditUserModal(record)}
          >
            Chỉnh sửa
          </Button>
          {/* <Button type="danger" icon={<DeleteOutlined />} onClick={() => showDeleteConfirm(record)}>Cập nhật trạng thái</Button> */}
          <Popconfirm
            title="Bạn có chắc chắn muốn xóa user này?"
            okText="Xác nhận"
            cancelText="Hủy"
            onConfirm={() => handleToggleStatus(record)}
            okButtonProps={{ danger: true }}
          >
            <Button type="danger" icon={<DeleteOutlined />}>
              Cập nhật trạng thái
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: "20px" }}>
      <h2>Tồn Kho</h2>

      <Space style={{ marginBottom: 20 }}>
        <Input
          placeholder="Tìm kiếm theo Email..."
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={handleSearch}
          style={{ width: 250 }}
        />
        <Select
          placeholder="Lọc theo trạng thái"
          style={{ width: 180 }}
          onChange={handleStatusFilter}
          allowClear
        >
          <Option value="Active">Hoạt động</Option>
          <Option value="Inactive">Không hoạt động</Option>
        </Select>
        <Select placeholder="Lọc theo quyền" style={{ width: 150 }} onChange={handleRoleFilter} allowClear>
                    <Option value="1">Admin</Option>
                    <Option value="2">Manager</Option>
                    <Option value="3">Staff</Option>
                </Select>

        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={showAddUserModal}
        >
          Thêm tài khoản
        </Button>
      </Space>

      <Table
        columns={columns}
        dataSource={filteredUsers}
        rowKey="userId"
        loading={loading}
        bordered
        pagination={{ pageSize: 10 }}
      />

      {/* Modal Thêm tài khoản */}
      <Modal
        title="Thêm tài khoản"
        open={isModalOpen}
        onCancel={handleCancel}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleAddUser}>
          <Form.Item
            name="FullName"
            label="Họ và Tên"
            rules={[{ required: true, message: "Vui lòng nhập họ và tên!" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="Email"
            label="Email"
            rules={[
              { type: "email", required: true, message: "Email không hợp lệ!" },
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="Password"
            label="Mật khẩu"
            rules={[{ required: true, message: "Vui lòng nhập mật khẩu!" }]}
          >
            <Input.Password />
          </Form.Item>
          <Form.Item
            name="PhoneNumber"
            label="Số điện thoại"
            rules={[
              { required: true, message: "Vui lòng nhập số điện thoại!" },
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item name="roleId" label="Quyền" rules={[{ required: true }]}>
            <Select>
              <Option value="1">Admin</Option>
              <Option value="2">Manager</Option>
              <Option value="3">Staff</Option>
            </Select>
          </Form.Item>
          <Button type="primary" htmlType="submit">
            Thêm
          </Button>
        </Form>
      </Modal>

      <Modal
        title="Chỉnh sửa thông tin User"
        open={isEditModalOpen}
        onCancel={() => setIsEditModalOpen(false)}
        footer={null}
      >
        <Form form={editForm} layout="vertical" onFinish={handleUpdateUser}>
          {/* Họ và Tên */}
          <Form.Item
            name="FullName"
            label="Họ và Tên"
            rules={[{ required: true, message: "Vui lòng nhập họ và tên!" }]}
          >
            <Input />
          </Form.Item>

          {/* Email */}
          <Form.Item
            name="Email"
            label="Email"
            rules={[
              { required: true, message: "Vui lòng nhập email!" },
              { type: "email", message: "Email không hợp lệ!" },
            ]}
          >
            <Input />
          </Form.Item>

          {/* Số điện thoại (Chỉ nhận 10 chữ số) */}
          <Form.Item
            name="PhoneNumber"
            label="Số điện thoại"
            rules={[
              { required: true, message: "Vui lòng nhập số điện thoại!" },
              {
                pattern: /^0\d{9}$/,
                message:
                  "Số điện thoại không hợp lệ! (phải có 10 chữ số, bắt đầu bằng 0)",
              },
            ]}
          >
            <Input />
          </Form.Item>

          {/* Quyền */}
          <Form.Item
            name="roleId"
            label="Vị trí"
            rules={[{ required: true, message: "Vui lòng chọn vị trí công việc!" }]}
          >
            <Select>
              <Option value={1}>Admin</Option>
              <Option value={2}>Manager</Option>
              <Option value={3}>Staff</Option>
            </Select>
          </Form.Item>

          <Button type="primary" htmlType="submit">
            Lưu
          </Button>
        </Form>
      </Modal>
    </div>
  );
};

export default StockList;
