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

// Notifications
import { toast } from "react-toastify";

const { confirm } = Modal;
const { Option } = Select;

const UserList = () => {
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

  // Call API to get Users list
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await axios.get("http://localhost:9999/api/users");
      setUsers(response.data);
      setLoading(false);
    } catch (error) {
      message.error("Error loading user list!");
      setLoading(false);
    }
  };

  // Handle search by email
  const handleSearch = (e) => {
    setSearchText(e.target.value);
  };

  // Handle filter by Status (Active/Inactive)
  const handleStatusFilter = (value) => {
    setStatusFilter(value);
  };

  // Handle filter by Role (Admin/Staff)
  const handleRoleFilter = (value) => {
    setRoleFilter(value);
  };

  // Handle "Edit" button click
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
      toast.success(`Update successful`, { autoClose: 2000 });

      message.success("User updated successfully!");
      setIsEditModalOpen(false);
    } catch (error) {
      message.error("Error updating user!");
      toast.error(`Update failed`);
    }
  };

  // Confirm user status update
  const showDeleteConfirm = (user) => {
    console.log("Clicked delete for user:", user);

    Modal.confirm({
      title: `Are you sure you want to update this user's status?`,
      icon: React.createElement(ExclamationCircleOutlined),
      content: `User will be changed to ${user.Status === "Active" ? "Inactive" : "Active"
        } status`,
      okText: "Confirm",
      okType: "danger",
      cancelText: "Cancel",
      onOk() {
        handleToggleStatus(user);
      },
    });
  };
  // Handle updating user status (Active ⇆ Inactive)
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
      toast.success(`Update successful`, { autoClose: 2000 });
      message.success(`User status changed to ${newStatus}`);
    } catch (error) {
      message.error("Error updating user status!");
      toast.error(`Update failed`);
    }
  };

  // Handle opening the Add User Modal
  const showAddUserModal = () => {
    setIsModalOpen(true);
  };

  // Handle closing the Add User Modal
  const handleCancel = () => {
    setIsModalOpen(false);
    form.resetFields();
  };

  // Handle form submission to add a user
  const handleAddUser = async (values) => {
    try {
      const response = await axios.post(
        "http://localhost:9999/api/users",
        values
      );

      // After successfully creating the user, call API to get the latest list
      const updatedUsers = await axios.get("http://localhost:9999/api/users");

      // Update the user list from API
      setUsers(updatedUsers.data);

      // Display success message
      message.success("User added successfully!");

      // Display success toast notification
      toast.success(`Account created successfully`, { autoClose: 2000 });

      // Close the add user popup
      handleCancel();
    } catch (error) {
      message.error("Error adding user!");
      toast.error(`Update failed`);
    }
  };

  // Filter user list by search & filter conditions
  const filteredUsers = users.filter((user) => {
    const matchEmail = user.Email
      ? user.Email.toLowerCase().includes(searchText.toLowerCase())
      : false;
    const matchStatus = statusFilter ? user.Status === statusFilter : true;
    const matchRole = roleFilter ? user.roleId === roleFilter : true;
    return matchEmail && matchStatus && matchRole;
  });

  // Configure columns displayed in the table
  const columns = [
    {
      title: "Employee ID",
      dataIndex: "userId",
      key: "userId",
      width: 80,
      sorter: (a, b) => a.userId - b.userId,
    },
    { title: "Full Name", dataIndex: "FullName", key: "FullName" },
    { title: "Email", dataIndex: "Email", key: "Email" },
    { title: "Phone Number", dataIndex: "PhoneNumber", key: "PhoneNumber" },
    {
      title: "Position",
      dataIndex: "roleId",
      key: "roleId",
      render: (role) => (
        <Tag color={role === 1 ? "red" : role === 2 ? "gold" : "blue"}>
          {role === 1 ? "Admin" : role === 2 ? "Manager" : "Staff"}
        </Tag>
      ),
    },
    {
      title: "Status",
      dataIndex: "Status",
      key: "Status",
      render: (status) => (
        <Tag color={status === "Active" ? "green" : "volcano"}>{status}</Tag>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (text, record) => (
        <Space>
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={() => showEditUserModal(record)}
          >
            Edit
          </Button>
          {/* <Button type="danger" icon={<DeleteOutlined />} onClick={() => showDeleteConfirm(record)}>Update Status</Button> */}
          <Popconfirm
            title="Are you sure you want to delete this user?"
            okText="Confirm"
            cancelText="Cancel"
            onConfirm={() => handleToggleStatus(record)}
            okButtonProps={{ danger: true }}
          >
            <Button type="danger" icon={<DeleteOutlined />}>
              Update Status
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: "20px" }}>
      <h2>User Management</h2>

      <Space style={{ marginBottom: 20 }}>
        <Input
          placeholder="Search by Email..."
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={handleSearch}
          style={{ width: 250 }}
        />
        <Select
          placeholder="Filter by status"
          style={{ width: 180 }}
          onChange={handleStatusFilter}
          allowClear
        >
          <Option value="Active">Active</Option>
          <Option value="Inactive">Inactive</Option>
        </Select>
        {/* <Select placeholder="Filter by role" style={{ width: 150 }} onChange={handleRoleFilter} allowClear>
                    <Option value="1">Admin</Option>
                    <Option value="2">Manager</Option>
                    <Option value="3">Staff</Option>
                </Select> */}

        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={showAddUserModal}
        >
          Add Account
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

      {/* Add Account Modal */}
      <Modal
        title="Add Account"
        open={isModalOpen}
        onCancel={handleCancel}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleAddUser}>
          <Form.Item
            name="FullName"
            label="Full Name"
            rules={[{ required: true, message: "Please enter full name!" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="Email"
            label="Email"
            rules={[
              { type: "email", required: true, message: "Invalid email!" },
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="Password"
            label="Password"
            rules={[{ required: true, message: "Please enter password!" }]}
          >
            <Input.Password />
          </Form.Item>
          <Form.Item
            name="PhoneNumber"
            label="Phone Number"
            rules={[
              { required: true, message: "Please enter phone number!" },
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item name="roleId" label="Role" rules={[{ required: true }]}>
            <Select>
              <Option value="1">Admin</Option>
              <Option value="2">Manager</Option>
              <Option value="3">Staff</Option>
            </Select>
          </Form.Item>
          <Button type="primary" htmlType="submit">
            Add
          </Button>
        </Form>
      </Modal>

      <Modal
        title="Edit User Information"
        open={isEditModalOpen}
        onCancel={() => setIsEditModalOpen(false)}
        footer={null}
      >
        <Form form={editForm} layout="vertical" onFinish={handleUpdateUser}>
          {/* Full Name */}
          <Form.Item
            name="FullName"
            label="Full Name"
            rules={[{ required: true, message: "Please enter full name!" }]}
          >
            <Input />
          </Form.Item>

          {/* Email */}
          <Form.Item
            name="Email"
            label="Email"
            rules={[
              { required: true, message: "Please enter email!" },
              { type: "email", message: "Invalid email!" },
            ]}
          >
            <Input />
          </Form.Item>

          {/* Phone Number (10 digits only) */}
          <Form.Item
            name="PhoneNumber"
            label="Phone Number"
            rules={[
              { required: true, message: "Please enter phone number!" },
              {
                pattern: /^0\d{9}$/,
                message:
                  "Invalid phone number! (must have 10 digits, starting with 0)",
              },
            ]}
          >
            <Input />
          </Form.Item>

          {/* Role */}
          <Form.Item
            name="roleId"
            label="Position"
            rules={[{ required: true, message: "Please select a position!" }]}
          >
            <Select>
              <Option value={1}>Admin</Option>
              <Option value={2}>Manager</Option>
              <Option value={3}>Staff</Option>
            </Select>
          </Form.Item>

          <Button type="primary" htmlType="submit">
            Save
          </Button>
        </Form>
      </Modal>
    </div>
  );
};

export default UserList;
