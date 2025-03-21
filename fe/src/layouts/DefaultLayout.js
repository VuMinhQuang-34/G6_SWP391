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
                            <Link to="/dashboard">Dashboard</Link>
                        </Menu.Item>
                        <Menu.Item key="2" icon={<UserOutlined />}>
                            <Link to="/admin/users">Nhân viên</Link>
                        </Menu.Item>
                        <Menu.Item key="3" icon={<SettingOutlined />}>
                            <Link to="admin/categories">Loại sách</Link>
                        </Menu.Item>
                        <Menu.Item key="4" icon={<SettingOutlined />}>
                            <Link to="admin/books">Sách</Link>
                        </Menu.Item>
                        {/* <Menu.Item key="5" icon={<SettingOutlined />}>
                            <Link to="orders-import">Import Order</Link>
                        </Menu.Item> */}
                        <Menu.SubMenu key="5" icon={<SettingOutlined />} title="Import Orders">
                            <Menu.Item key="5.1">
                                <Link to="/orders-import">Tạo đơn nhập</Link>
                            </Menu.Item>
                            <Menu.Item key="5.2">
                                <Link to="/orders-import/approve">Phê duyệt</Link>
                            </Menu.Item>
                            <Menu.Item key="5.3">
                                <Link to="/orders-import/check">Kiểm hàng</Link>
                            </Menu.Item>
                            <Menu.Item key="5.4">
                                <Link to="/orders-import/approve/wms">Phê duyệt nhập kho</Link>
                            </Menu.Item>
                        </Menu.SubMenu>
                        <Menu.SubMenu key="6" icon={<SettingOutlined />} title="Export Orders">
                            <Menu.Item key="6.1">
                                <Link to="/export-orders">Quản lý đơn xuất</Link>
                            </Menu.Item>
                            <Menu.Item key="6.2">
                                <Link to="/export-orders/status/approve">Phê duyệt</Link>
                            </Menu.Item>
                            <Menu.Item key="6.3">
                                <Link to="/export-orders/status/packing">Đóng gói</Link>
                            </Menu.Item>
                            <Menu.Item key="6.4">
                                <Link to="/export-orders/status/shipping">Vận chuyển & Hoàn thành</Link>
                            </Menu.Item>
                        </Menu.SubMenu>
                        <Menu.Item key="7" icon={<SettingOutlined />}>
                            <Link to="stock">Kho hàng</Link>
                        </Menu.Item>
                        {/* <Menu.Item key="3" icon={<SettingOutlined />}>  
                            <Link to="/books">Kho sách</Link>
                        </Menu.Item> */}
                        {/* <Menu.Item key="4" icon={<SettingOutlined />}>
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
                        <Menu.Item key="9" icon={<SettingOutlined />}>
                            <Link to="location">Location</Link>
                        </Menu.Item>
                        <Menu.Item key="10" icon={<LogoutOutlined />} danger onClick={handleLogout}>
                            Logout
                        </Menu.Item>
                    </Menu>
                </Sider>

                {/* Content Area */}
                <Layout>
                    <Content style={{ padding: "15px", background: "#ecf0f1" }}>
                        <div
                            id="content"
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
