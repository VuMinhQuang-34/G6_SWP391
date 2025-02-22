import React, { useContext } from "react";
import { Layout, Menu, Button, Space, Dropdown, Avatar, Input } from "antd";
import { Link, useNavigate } from "react-router-dom";
import { UserOutlined, LockOutlined, LogoutOutlined, BellOutlined } from "@ant-design/icons";
import { AuthContext } from "../context/AuthContext";
//import vietnamFlag from '../assets/vietnam-flag.png'; // Đường dẫn đến hình ảnh lá cờ Việt Nam

const { Header } = Layout;

const AppHeader = () => {
  const { isAuthenticated, user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  // Xử lý đăng xuất
  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Menu dropdown khi bấm vào avatar
  const userMenu = (
    <Menu>
      <Menu.Item key="profile" icon={<UserOutlined />}>
        <Link to={`/users/${user?.userId}`}>Thông tin cá nhân</Link>
      </Menu.Item>
      <Menu.Item key="change-password" icon={<LockOutlined />}>
        <Link to="/change-password">Đổi mật khẩu</Link>
      </Menu.Item>
      <Menu.Item key="logout" icon={<LogoutOutlined />} onClick={handleLogout}>
        Đăng xuất
      </Menu.Item>
    </Menu>
  );

  return (
    <Header
      style={{
        position: "fixed",
        zIndex: 1,
        width: "100%",
        background: "#ffffff",
        padding: "0 50px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        fontSize: "20px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      {/* Logo */}
      <div style={{ fontSize: "36px", fontWeight: "bold", color: "#6c63ff" }}>
        <Link to="/" style={{ color: "#6c63ff", display: "flex", alignItems: "center" }}>
          Quản lý sản xuất
        </Link>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
        {/* Tìm kiếm và các biểu tượng */}
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <Input.Search
            placeholder="Tìm kiếm..."
            style={{ width: 200 }}
            onSearch={(value) => console.log(value)}
          />
          <Button icon={<BellOutlined />} />
          <Button>
            <img src="https://e7.pngegg.com/pngimages/739/884/png-clipart-flag-of-vietnam-north-vietnam-south-vietnam-vietnam-war-flag-miscellaneous-angle-thumbnail.png" alt="Vietnam Flag" style={{ width: '20px', height: '20px' }} />
          </Button>
        </div>

        {/* Nếu chưa đăng nhập: Hiển thị Login */}
        {!isAuthenticated ? (
          <Space size="large">
            <Button type="link" style={{ color: "#6c63ff", fontSize: "20px" }}>
              <Link to="/login">Đăng nhập</Link>
            </Button>
          </Space>
        ) : (
          // Nếu đã đăng nhập: Hiển thị Avatar + Menu Dropdown
          <Dropdown overlay={userMenu} placement="bottomRight" arrow>
            <Avatar
              size="large"
              icon={<UserOutlined />}
              style={{ backgroundColor: "#6c63ff", cursor: "pointer" }}
            />
          </Dropdown>
        )}
      </div>



    </Header>
  );
};

export default AppHeader;
