import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Card, Descriptions, Button, Spin, message, Avatar, Tag, Divider, Input } from "antd";
import { UserOutlined, PhoneOutlined, MailOutlined, EditOutlined, SaveOutlined, CloseOutlined } from "@ant-design/icons";
import axios from "axios";
import { toast } from "react-toastify";

const UserDetail = () => {
  const { id } = useParams(); // Lấy ID từ URL
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ email: "", phoneNumber: "" });
  const [errors, setErrors] = useState({ email: "", phoneNumber: "" });

  // Gọi API lấy thông tin user
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await axios.get(`http://localhost:9999/api/users/${id}`);
        const userData = response.data;
        setUser(userData);
        setFormData({ email: userData.Email, phoneNumber: userData.PhoneNumber });
        setLoading(false);
      } catch (error) {
        message.error("Lỗi khi tải dữ liệu người dùng!");
        setLoading(false);
      }
    };
    fetchUser();
  }, [id]);

  // Validate Email & Số điện thoại Việt Nam
  const validate = () => {
    let isValid = true;
    let newErrors = { email: "", phoneNumber: "" };

    // Validate Email
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!formData.email.match(emailRegex)) {
      newErrors.email = "Email không hợp lệ!";
      isValid = false;
    }

    // Validate Số điện thoại Việt Nam (10 chữ số, bắt đầu bằng 0)
    const phoneRegex = /^0[3|5|7|8|9][0-9]{8}$/;
    if (!formData.phoneNumber.match(phoneRegex)) {
      newErrors.phoneNumber = "Số điện thoại không hợp lệ! (10 chữ số, bắt đầu bằng 0)";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  // Xử lý khi thay đổi giá trị input
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Gọi API cập nhật user
  const updateUser = async () => {
    try {
      await axios.put(`http://localhost:9999/api/users/${id}`, {
        Email: formData.email,
        PhoneNumber: formData.phoneNumber,
      });

      setUser({ ...user, Email: formData.email, PhoneNumber: formData.phoneNumber });
      setIsEditing(false);
      message.success("Cập nhật thông tin thành công!");
      toast.success(`Cập nhật thông tin thành công!`);
      
    } catch (error) {
      message.error("Lỗi khi cập nhật thông tin người dùng!");
      toast.error(`Cập nhật thất bại`);
      
    }
  };

  // Xử lý lưu dữ liệu sau khi validate
  const handleSave = () => {
    if (validate()) {
      updateUser();
    }
  };

  // Xử lý hủy chỉnh sửa
  const handleCancel = () => {
    setFormData({ email: user.Email, phoneNumber: user.PhoneNumber });
    setErrors({ email: "", phoneNumber: "" });
    setIsEditing(false);
  };

  if (loading) {
    return <Spin size="large" style={{ display: "block", margin: "20px auto" }} />;
  }

  return (
    <Card
      bordered
      style={{
        maxWidth: 650,
        margin: "auto",
        borderRadius: 12,
        boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
        padding: "20px"
      }}
    >
      {/* Avatar + Thông tin chính */}
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <Avatar size={80} src={`https://api.dicebear.com/7.x/identicon/svg?seed=${id}`} icon={<UserOutlined />} />
        <h2 style={{ marginTop: 10 }}>{user.FullName}</h2>
        <Tag color={user.Status === "Active" ? "green" : "red"}>{user.Status}</Tag>
      </div>

      <Divider />

      {/* Form cập nhật thông tin */}
      <Descriptions bordered column={1} size="middle">
        <Descriptions.Item label="Mã nhân viên">{user.userId}</Descriptions.Item>
        <Descriptions.Item label="Vị trí">{user.Role.Role_Name}</Descriptions.Item>
        {/* <Descriptions.Item label="Ngày tạo">{user.Created_Date}</Descriptions.Item> */}
        {/* <Descriptions.Item label="Lần chỉnh sửa gần nhất">{user.Edit_Date}</Descriptions.Item> */}

        {/* Email */}
        <Descriptions.Item label="Email">
          <MailOutlined style={{ marginRight: 8 }} />
          {isEditing ? (
            <div>
              <Input
                name="email"
                value={formData.email}
                onChange={handleChange}
                status={errors.email ? "error" : ""}
              />
              {errors.email && <span style={{ color: "red", fontSize: "12px" }}>{errors.email}</span>}
            </div>
          ) : (
            user.Email
          )}
        </Descriptions.Item>

        {/* Số điện thoại */}
        <Descriptions.Item label="Số điện thoại">
          <PhoneOutlined style={{ marginRight: 8 }} />
          {isEditing ? (
            <div>
              <Input
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                status={errors.phoneNumber ? "error" : ""}
              />
              {errors.phoneNumber && <span style={{ color: "red", fontSize: "12px" }}>{errors.phoneNumber}</span>}
            </div>
          ) : (
            user.PhoneNumber
          )}
        </Descriptions.Item>
      </Descriptions>

      {/* Nút chỉnh sửa & Lưu */}
      <div style={{ textAlign: "center", marginTop: 20 }}>
        {isEditing ? (
          <>
            <Button type="primary" icon={<SaveOutlined />} onClick={handleSave} style={{ marginRight: 10 }}>
              Lưu
            </Button>
            <Button icon={<CloseOutlined />} onClick={handleCancel}>
              Hủy
            </Button>
          </>
        ) : (
          <Button type="default" icon={<EditOutlined />} onClick={() => setIsEditing(true)}>
            Chỉnh sửa
          </Button>
        )}
      </div>
    </Card>
  );
};

export default UserDetail;
