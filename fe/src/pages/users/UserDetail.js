import React, { useEffect, useState } from "react";
import { useParams, } from "react-router-dom";
import { Card, Descriptions, Button, Spin, message, Avatar, Tag, Divider, Input } from "antd";
import { UserOutlined, PhoneOutlined, MailOutlined, EditOutlined, SaveOutlined, CloseOutlined } from "@ant-design/icons";
import axios from "axios";
import { toast } from "react-toastify";

const UserDetail = () => {
  const { id } = useParams(); // Get ID from URL
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ email: "", phoneNumber: "" });
  const [errors, setErrors] = useState({ email: "", phoneNumber: "" });

  // Call API to get user information
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await axios.get(`http://localhost:9999/api/users/${id}`);
        const userData = response.data;
        setUser(userData);
        setFormData({ email: userData.Email, phoneNumber: userData.PhoneNumber });
        setLoading(false);
      } catch (error) {
        message.error("Error loading user data!");
        setLoading(false);
      }
    };
    fetchUser();
  }, [id]);

  // Validate Email & Vietnamese Phone Number
  const validate = () => {
    let isValid = true;
    let newErrors = { email: "", phoneNumber: "" };

    // Validate Email
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!formData.email.match(emailRegex)) {
      newErrors.email = "Invalid email format!";
      isValid = false;
    }

    // Validate Vietnamese Phone Number (10 digits, starting with 0)
    const phoneRegex = /^0[3|5|7|8|9][0-9]{8}$/;
    if (!formData.phoneNumber.match(phoneRegex)) {
      newErrors.phoneNumber = "Invalid phone number! (10 digits, starting with 03, 05, 07, 08, 09)";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  // Handle input value changes
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Call API to update user
  const updateUser = async () => {
    try {
      await axios.put(`http://localhost:9999/api/users/${id}`, {
        Email: formData.email,
        PhoneNumber: formData.phoneNumber,
      });

      setUser({ ...user, Email: formData.email, PhoneNumber: formData.phoneNumber });
      setIsEditing(false);
      message.success("Information updated successfully!");
      toast.success(`Information updated successfully!`);

    } catch (error) {
      message.error("Error updating user information!");
      toast.error(`Update failed`);

    }
  };

  // Handle saving data after validation
  const handleSave = () => {
    if (validate()) {
      updateUser();
    }
  };

  // Handle cancel edit
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
      {/* Avatar + Main Info */}
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <Avatar size={80} src={`https://api.dicebear.com/7.x/identicon/svg?seed=${id}`} icon={<UserOutlined />} />
        <h2 style={{ marginTop: 10 }}>{user.FullName}</h2>
        <Tag color={user.Status === "Active" ? "green" : "red"}>{user.Status}</Tag>
      </div>

      <Divider />

      {/* Update information form */}
      <Descriptions bordered column={1} size="middle">
        <Descriptions.Item label="Employee ID">{user.userId}</Descriptions.Item>
        <Descriptions.Item label="Position">{user.Role.Role_Name}</Descriptions.Item>
        {/* <Descriptions.Item label="Created Date">{user.Created_Date}</Descriptions.Item> */}
        {/* <Descriptions.Item label="Last Edit">{user.Edit_Date}</Descriptions.Item> */}

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

        {/* Phone Number */}
        <Descriptions.Item label="Phone Number">
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

      {/* Edit & Save buttons */}
      <div style={{ textAlign: "center", marginTop: 20 }}>
        {isEditing ? (
          <>
            <Button type="primary" icon={<SaveOutlined />} onClick={handleSave} style={{ marginRight: 10 }}>
              Save
            </Button>
            <Button icon={<CloseOutlined />} onClick={handleCancel}>
              Cancel
            </Button>
          </>
        ) : (
          <Button type="default" icon={<EditOutlined />} onClick={() => setIsEditing(true)}>
            Edit
          </Button>
        )}
      </div>
    </Card>
  );
};

export default UserDetail;
