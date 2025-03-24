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

    // Handle logout
    const handleLogout = () => {
        logout(); // Call logout function from AuthContext
        navigate("/login"); // Redirect to login page
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
                            <Link to="/admin/users">Staff</Link>
                        </Menu.Item>
                        <Menu.Item key="3" icon={<SettingOutlined />}>
                            <Link to="admin/categories">Book Categories</Link>
                        </Menu.Item>
                        <Menu.Item key="4" icon={<SettingOutlined />}>
                            <Link to="admin/books">Books</Link>
                        </Menu.Item>
                        {/* <Menu.Item key="5" icon={<SettingOutlined />}>
                            <Link to="orders-import">Import Order</Link>
                        </Menu.Item> */}
                        <Menu.SubMenu key="5" icon={<SettingOutlined />} title="Import Orders">
                            <Menu.Item key="5.1">
                                <Link to="/orders-import">Create Import Order</Link>
                            </Menu.Item>
                            <Menu.Item key="5.2">
                                <Link to="/orders-import/approve">Approve Import Order</Link>
                            </Menu.Item>
                            <Menu.Item key="5.3">
                                <Link to="/orders-import/check">Receive Goods</Link>
                            </Menu.Item>
                            <Menu.Item key="5.4">
                                <Link to="/orders-import/approve/wms">Store in Warehouse</Link>
                            </Menu.Item>
                        </Menu.SubMenu>
                        <Menu.SubMenu key="6" icon={<SettingOutlined />} title="Export Orders">
                            <Menu.Item key="6.1">
                                <Link to="/export-orders">Create Export Order</Link>
                            </Menu.Item>
                            <Menu.Item key="6.2">
                                <Link to="/export-orders/status/approve">Approve Export Order</Link>
                            </Menu.Item>
                            <Menu.Item key="6.3">
                                <Link to="/export-orders/status/packing">Packaging</Link>
                            </Menu.Item>
                            <Menu.Item key="6.4">
                                <Link to="/export-orders/status/shipping">Shipping & Completion</Link>
                            </Menu.Item>
                        </Menu.SubMenu>
                        <Menu.Item key="7" icon={<SettingOutlined />}>
                            <Link to="stock">Inventory</Link>
                        </Menu.Item>
                        {/* <Menu.Item key="3" icon={<SettingOutlined />}>  
                            <Link to="/books">Book Inventory</Link>
                        </Menu.Item> */}
                        {/* <Menu.Item key="4" icon={<SettingOutlined />}>
                            <Link to="/inventory">Stock</Link>
                        </Menu.Item>
                        <Menu.Item key="5" icon={<SettingOutlined />}>
                            <Link to="/import-orders">Import Orders</Link>
                        </Menu.Item>
                        <Menu.Item key="6" icon={<SettingOutlined />}>
                            <Link to="/export-orders">Export Orders</Link>
                        </Menu.Item>
                        <Menu.Item key="7" icon={<SettingOutlined />}>
                            <Link to="/history">History</Link>
                        </Menu.Item>
                        <Menu.Item key="8" icon={<SettingOutlined />}>
                            <Link to="/approval-management">Approval Management</Link>
                        </Menu.Item> */}
                        <Menu.Item key="9" icon={<SettingOutlined />}>
                            <Link to="location">Warehouse Location</Link>
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
                            <Outlet /> {/* Display child page content */}
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
