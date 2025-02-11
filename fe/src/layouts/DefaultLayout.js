import React, { useState, useContext } from 'react';
import { Layout, Menu } from 'antd';
import {
    HomeOutlined,
    UserOutlined,
    SettingOutlined,
    LogoutOutlined,
} from "@ant-design/icons";
import { Link, Outlet, useNavigate } from "react-router-dom";
import AppHeader from '../components/Header';
import AppFooter from '../components/Footer';
import { AuthContext } from "../context/AuthContext"; // Import AuthContext

const { Content, Sider } = Layout;

const DefaultLayout = () => {
    const [collapsed, setCollapsed] = useState(false);
    const { logout } = useContext(AuthContext);
    const navigate = useNavigate();

    // Xử lý logout
    const handleLogout = () => {
        logout(); // Gọi hàm logout từ AuthContext
        navigate("/login"); // Chuyển hướng về trang đăng nhập
    };

    return (
        <Layout style={{ minHeight: "100vh" }}>
            {/* Header */}
            <AppHeader />

            {/* Main Layout */}
            <Layout style={{ marginTop: 64 }}>
                {/* Sidebar */}
                <Sider
                    collapsible
                    collapsed={collapsed}
                    onCollapse={(value) => setCollapsed(value)}
                    style={{ background: "#001529", color: "#fff" }}
                >
                    <Menu theme="dark" mode="inline" defaultSelectedKeys={["1"]}>
                        <Menu.Item key="1" icon={<HomeOutlined />}>
                            <Link to="/">Dashboard</Link>
                        </Menu.Item>
                        <Menu.Item key="2" icon={<UserOutlined />}>
                            <Link to="/admin/users">Nhân viên</Link>
                        </Menu.Item>
                        {/* <Menu.Item key="3" icon={<SettingOutlined />}>
                            <Link to="/books">Kho sách</Link>
                        </Menu.Item>
                        <Menu.Item key="4" icon={<SettingOutlined />}>
                            <Link to="/inventory">Hàng tồn kho</Link>
                        </Menu.Item>
                        <Menu.Item key="5" icon={<SettingOutlined />}>
                            <Link to="/import-orders">Đơn nhập kho</Link>
                        </Menu.Item>
                        <Menu.Item key="6" icon={<SettingOutlined />}>
                            <Link to="/export-orders">Đơn xuất kho</Link>
                        </Menu.Item>
                        <Menu.Item key="7" icon={<SettingOutlined />}>
                            <Link to="/history">Lịch sử</Link>
                        </Menu.Item>
                        <Menu.Item key="8" icon={<SettingOutlined />}>
                            <Link to="/approval-management">Quản lý phê duyệt</Link>
                        </Menu.Item> */}
                        <Menu.Item key="9" icon={<LogoutOutlined />} danger onClick={handleLogout}>
                            Logout
                        </Menu.Item>
                    </Menu>
                </Sider>

                {/* Content Area */}
                <Layout>
                    <Content style={{ padding: "50px", background: "#ecf0f1" }}>
                        <div
                            style={{
                                minHeight: 380,
                                background: "#fff",
                                padding: "24px",
                                borderRadius: "8px",
                            }}
                        >
                            <Outlet /> {/* Hiển thị nội dung trang con */}
                        </div>
                    </Content>

                    {/* Footer */}
                    <AppFooter />
                </Layout>
            </Layout>
        </Layout>
    );
};

export default DefaultLayout;
