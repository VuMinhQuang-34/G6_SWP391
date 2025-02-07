// src/components/Header.js

import React from 'react';
import { Layout, Menu, Button, Space } from 'antd';
import { Link } from 'react-router-dom';
import { HomeOutlined, ShopOutlined, DatabaseOutlined, PhoneOutlined } from '@ant-design/icons';

const { Header } = Layout;

const AppHeader = () => {
  return (
    <Header style={{ position: 'fixed', zIndex: 1, width: '100%', background: '#ffffff', padding: '0 50px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', fontSize: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>

        {/* Logo */}
        <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#6c63ff' }}>
          <Link to="/" style={{ color: '#6c63ff', display: 'flex', alignItems: 'center' }}>
            MyWebsite
          </Link>
        </div>

        {/* Menu */}
        <Menu theme="light" mode="horizontal" style={{ flex: 1, justifyContent: 'center', margin: 0, fontSize: '20px' }}>
          <Menu.Item key="1" icon={<HomeOutlined />}><Link to="/">Home</Link></Menu.Item>
          <Menu.Item key="2" icon={<ShopOutlined />}><Link to="/company">Company</Link></Menu.Item>
          <Menu.Item key="3" icon={<DatabaseOutlined />}><Link to="/platform">Platform</Link></Menu.Item>
          <Menu.Item key="4" icon={<PhoneOutlined />}><Link to="/pricing">Pricing</Link></Menu.Item>
          <Menu.Item key="5" icon={<PhoneOutlined />}><Link to="/contact">Contact</Link></Menu.Item>
        </Menu>

        {/* Buttons */}
        <Space size="large">
          <Button type="link" style={{ color: '#6c63ff', fontSize: '20px' }}><Link to="/login">Login</Link></Button>
          <Button type="primary" style={{ backgroundColor: '#6c63ff', borderColor: '#6c63ff', fontSize: '20px' }}><Link to="/get-started">Get Started</Link></Button>
        </Space>
      </div>
    </Header>
  );
};

export default AppHeader;
