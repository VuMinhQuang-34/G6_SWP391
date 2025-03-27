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
    const { logout, user } = useContext(AuthContext);
    const navigate = useNavigate();

    // Handle logout
    const handleLogout = () => {
        logout(); // Call logout function from AuthContext
        navigate("/login"); // Redirect to login page
    };

    // Kiểm tra role để hiển thị menu
    const isAdmin = user?.roleId == 0;
    const isManager = user?.roleId == 1;
    const isStaff = user?.roleId == 2;

    // Menu items dựa trên role
    const getMenuItems = () => {
        const menuItems = [
            // Dashboard - tất cả role đều thấy
            {
                key: "1",
                icon: <HomeOutlined />,
                label: <Link to="/dashboard">Dashboard</Link>,
            }
        ];

        // Menu items chỉ dành cho Admin và Manager
        // if (isAdmin || isManager || isStaff) {
        if (isAdmin || isManager) {
            menuItems.push(
                {
                    key: "2",
                    icon: <UserOutlined />,
                    label: <Link to="/admin/users">Staff</Link>,
                },
                {
                    key: "3",
                    icon: <SettingOutlined />,
                    label: <Link to="/admin/categories">Book Categories</Link>,
                },
                {
                    key: "4",
                    icon: <SettingOutlined />,
                    label: <Link to="/admin/books">Books</Link>,
                }
            );
        }

        // Menu Import Orders
        const importOrdersSubMenu = {
            key: "5",
            icon: <SettingOutlined />,
            label: "Import Orders",
            children: [
                {
                    key: "5.1",
                    label: <Link to="/orders-import">Create Import Order</Link>,
                },
                {
                    key: "5.2",
                    label: <Link to="/orders-import/approve">Approve Import Order</Link>,
                },
                {
                    key: "5.3",
                    label: <Link to="/orders-import/check">Receive Order </Link>,
                }
            ]
        };

        // Chỉ thêm "Store in Warehouse" cho Admin và Manager
        if (isAdmin || isManager) {
            importOrdersSubMenu.children.push({
                key: "5.4",
                label: <Link to="/orders-import/approve/wms">Store in Warehouse</Link>,
            });
        }

        menuItems.push(importOrdersSubMenu);

        // Menu Export Orders
        menuItems.push({
            key: "6",
            icon: <SettingOutlined />,
            label: "Export Orders",
            children: [
                {
                    key: "6.1",
                    label: <Link to="/export-orders">Create Export Order</Link>,
                },
                {
                    key: "6.2",
                    label: <Link to="/export-orders/status/approve">Approve Export Order</Link>,
                },
                {
                    key: "6.3",
                    label: <Link to="/export-orders/status/packing">Packaging</Link>,
                },
                {
                    key: "6.4",
                    label: <Link to="/export-orders/status/shipping">Shipping & Completion</Link>,
                }
            ]
        });

        // Các menu items khác
        menuItems.push(
            {
                key: "7",
                icon: <SettingOutlined />,
                label: <Link to="stock">Inventory</Link>,
            },
            {
                key: "9",
                icon: <SettingOutlined />,
                label: <Link to="location">Warehouse Location</Link>,
            }
        );

        // Menu Supplier chỉ cho Admin và Manager
        if (isAdmin || isManager || isStaff) {
            menuItems.push({
                key: "10",
                icon: <SettingOutlined />,
                label: <Link to="supplier">Supplier</Link>,
            });
        }

        // Logout button - tất cả role đều thấy
        menuItems.push({
            key: "100",
            icon: <LogoutOutlined />,
            danger: true,
            label: "Logout",
            onClick: handleLogout
        });

        return menuItems;
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
                    <Menu
                        theme="dark"
                        mode="inline"
                        defaultSelectedKeys={["1"]}
                        items={getMenuItems()}
                    />
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
