import React, { useState, useContext } from "react";
import { Form, Input, Button, message } from "antd";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { toast } from "react-toastify";

const ChangePassword = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const { user } = useContext(AuthContext);

  const handleChangePassword = async (values) => {
    setLoading(true);
    try {
      const response = await axios.post("http://localhost:9999/api/auth/change-password", {
        userId: user.userId, // Gửi ID user
        oldPassword: values.oldPassword,
        newPassword: values.newPassword,
      });

      if (response.data.success) {
        navigate("/login");
        message.success("Đổi mật khẩu thành công!");
        toast.success(`Đổi mật khẩu thành công!`, { autoClose: 2000 });
      } else {
        toast.success(`Kiểm tra lại thông tin`, { autoClose: 2000 });
        message.error(response.data.message || "Có lỗi xảy ra, vui lòng thử lại!");
      }
    } catch (error) {
      toast.error(`Cập nhật thất bại`);
      message.error("Lỗi hệ thống, vui lòng thử lại sau!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      style={{ 
        maxWidth: 400, 
        margin: "50px auto", 
        padding: "30px",
        backgroundColor: "#fff", 
        borderRadius: "15px",
        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
      }}
    >
      <h2 
        style={{ 
          textAlign: "center", 
          color: "#1890ff",
          marginBottom: "30px",
          fontSize: "24px",
          fontWeight: "600"
        }}
      >
        Đổi mật khẩu
      </h2>
      <Form 
        onFinish={handleChangePassword}
        layout="vertical"
        size="large"
      >
        <Form.Item
          name="oldPassword"
          rules={[{ required: true, message: "Vui lòng nhập mật khẩu cũ!" }]}
        >
          <Input.Password 
            placeholder="Mật khẩu cũ"
            style={{ borderRadius: "8px" }}
          />
        </Form.Item>
        <Form.Item
          name="newPassword"
          rules={[
            { required: true, message: "Vui lòng nhập mật khẩu mới!" },
            { min: 6, message: "Mật khẩu phải có ít nhất 6 ký tự!" }
          ]}
        >
          <Input.Password 
            placeholder="Mật khẩu mới"
            style={{ borderRadius: "8px" }}
          />
        </Form.Item>
        <Form.Item
          name="confirmPassword"
          dependencies={['newPassword']}
          rules={[
            { required: true, message: "Vui lòng nhập lại mật khẩu mới!" },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('newPassword') === value) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error('Mật khẩu nhập lại không khớp!'));
              },
            }),
          ]}
        >
          <Input.Password 
            placeholder="Nhập lại mật khẩu mới"
            style={{ borderRadius: "8px" }}
          />
        </Form.Item>
        <Form.Item style={{ marginBottom: 0 }}>
          <Button 
            type="primary" 
            block 
            htmlType="submit" 
            loading={loading}
            style={{
              height: "40px",
              borderRadius: "8px",
              fontSize: "16px",
              fontWeight: "500"
            }}
          >
            Xác nhận đổi mật khẩu
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};

export default ChangePassword;
