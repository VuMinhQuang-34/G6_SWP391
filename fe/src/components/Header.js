import React, { useContext } from "react";
import { Layout, Menu, Button, Space, Dropdown, Avatar, Input } from "antd";
import { Link, useNavigate } from "react-router-dom";
import { UserOutlined, LockOutlined, LogoutOutlined, BellOutlined, SearchOutlined, ShopOutlined } from "@ant-design/icons";
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
        <Link to={`/users/${user?.userId}`}>Profile</Link>
      </Menu.Item>
      <Menu.Item key="change-password" icon={<LockOutlined />}>
        <Link to="/change-password">Change Password</Link>
      </Menu.Item>
      <Menu.Item key="logout" icon={<LogoutOutlined />} onClick={handleLogout}>
        Logout
      </Menu.Item>
    </Menu>
  );

  return (
    <Header
      style={{
        position: "fixed",
        zIndex: 1,
        width: "100%",
        background: "linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)",
        padding: "0 50px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        height: "64px",
      }}
    >
      {/* Logo and Title */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <ShopOutlined style={{ fontSize: "32px", color: "#1976d2" }} />
        <Link to="/" style={{ 
          color: "#1976d2", 
          fontSize: "24px", 
          fontWeight: "bold",
          textDecoration: "none",
          display: "flex",
          alignItems: "center"
        }}>
          Warehouse Management System
        </Link>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
        {/* Search and Icons */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <Input.Search
            style={{ 
              width: 250,
              borderRadius: "6px",
              backgroundColor: "rgba(255, 255, 255, 0.8)",
              border: "1px solid rgba(25, 118, 210, 0.2)",
            }}
            prefix={<SearchOutlined style={{ color: "#1976d2" }} />}
            onSearch={(value) => console.log(value)}
          />
          <Button 
            icon={<BellOutlined />} 
            style={{ 
              border: "none",
              background: "transparent",
              color: "#1976d2",
              fontSize: "18px"
            }}
          />
          <Button
            style={{
              border: "none",
              background: "transparent",
              padding: "4px",
              display: "flex",
              alignItems: "center"
            }}
          >
            <img 
              src="https://e7.pngegg.com/pngimages/739/884/png-clipart-flag-of-vietnam-north-vietnam-south-vietnam-vietnam-war-flag-miscellaneous-angle-thumbnail.png" 
              alt="Vietnam Flag" 
              style={{ width: '24px', height: '24px' }} 
            />
          </Button>
        </div>

        {/* Login/Avatar Section */}
        {!isAuthenticated ? (
          <Button 
            type="primary"
            style={{ 
              backgroundColor: "#1976d2",
              borderColor: "#1976d2",
              color: "#ffffff",
              height: "40px",
              padding: "0 24px",
              borderRadius: "6px",
              fontWeight: "500",
              transition: "all 0.3s ease",
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = "#1565c0";
              e.target.style.borderColor = "#1565c0";
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = "#1976d2";
              e.target.style.borderColor = "#1976d2";
            }}
          >
            <Link to="/login" style={{ color: "#ffffff" }}>Login</Link>
          </Button>
        ) : (
          <Dropdown overlay={userMenu} placement="bottomRight" arrow>
            <Avatar
              size="large"
              icon={<UserOutlined />}
              style={{ 
                backgroundColor: "#1976d2", 
                color: "#ffffff",
                cursor: "pointer",
                fontSize: "20px"
              }}
            />
          </Dropdown>
        )}
      </div>
    </Header>
  );
};

export default AppHeader;
