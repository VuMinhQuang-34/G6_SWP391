// src/components/Layout.js

import React, { useState }from 'react';
import { Layout, Menu } from 'antd';
import {
    HomeOutlined,
    UserOutlined,
    SettingOutlined,
    LogoutOutlined,
} from "@ant-design/icons";
import AppHeader from '../components/Header';
import AppFooter from '../components/Footer';
import { Link } from "react-router-dom";
const { Content, Sider } = Layout;

const DefaultLayout = ({ children }) => {
    const [collapsed, setCollapsed] = useState(false);

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
                        <Menu.Item key="3" icon={<SettingOutlined />}>
                            <Link to="/settings">Kho sách</Link>
                        </Menu.Item>
                        <Menu.Item key="4" icon={<SettingOutlined />}>
                            <Link to="/settings">Hàng tồn kho</Link>
                        </Menu.Item>
                        <Menu.Item key="5" icon={<SettingOutlined />}>
                            <Link to="/settings">Đơn nhập kho</Link>
                        </Menu.Item>
                        <Menu.Item key="6" icon={<SettingOutlined />}>
                            <Link to="/settings">Đơn xuất kho</Link>
                        </Menu.Item>
                        <Menu.Item key="7" icon={<SettingOutlined />}>
                            <Link to="/settings">Lịch sử</Link>
                        </Menu.Item>
                        <Menu.Item key="8" icon={<SettingOutlined />}>
                            <Link to="/settings">Quản lý phê duyệt</Link>
                        </Menu.Item>
                        <Menu.Item key="9" icon={<LogoutOutlined />} danger>
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
                            {children}
                        </div>
                    </Content>

                    {/* Footer */}
                    {/* <AppFooter /> */}
                </Layout>
            </Layout>
        </Layout>
    );
};

export default DefaultLayout;
