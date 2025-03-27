// src/components/Footer.js

import React from 'react';
import { Layout, Row, Col, Typography, Space } from 'antd';
import { ShopOutlined } from '@ant-design/icons';

const { Footer } = Layout;
const { Text } = Typography;

const AppFooter = () => {
  return (
    <Footer style={{ 
      background: '#ffffff', 
      color: '#1976d2', 
      padding: '60px 20px', 
      borderTop: '1px solid rgba(25, 118, 210, 0.1)',
      marginTop: 'auto'
    }}>
      <div style={{ width: '100%', maxWidth: '1200px', margin: '0 auto' }}>
        <Row justify="space-between" gutter={[32, 32]}>
          <Col xs={24} sm={12} md={6}>
            <Space direction="vertical" size="large">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShopOutlined style={{ fontSize: '24px', color: '#1976d2' }} />
                <Text style={{ color: '#1976d2', fontWeight: 'bold', fontSize: '20px' }}>
                  WMS
                </Text>
              </div>
              <Text style={{ color: '#1976d2', opacity: 0.8 }}>
                © 2025 Warehouse Management System. Group6
              </Text>
            </Space>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Space direction="vertical" size="large">
              <Text style={{ color: '#1976d2', fontWeight: 'bold', fontSize: '18px' }}>
                Quick Links
              </Text>
              <Space direction="vertical" size="small">
                <Text style={{ color: '#1976d2', opacity: 0.8, cursor: 'pointer' }}>
                  About Us
                </Text>
                <Text style={{ color: '#1976d2', opacity: 0.8, cursor: 'pointer' }}>
                  Privacy Policy
                </Text>
                <Text style={{ color: '#1976d2', opacity: 0.8, cursor: 'pointer' }}>
                  Terms & Conditions
                </Text>
              </Space>
            </Space>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Space direction="vertical" size="large">
              <Text style={{ color: '#1976d2', fontWeight: 'bold', fontSize: '18px' }}>
                Contact Us
              </Text>
              <Space direction="vertical" size="small">
                <Text style={{ color: '#1976d2', opacity: 0.8 }}>
                  Email: support@wms.com
                </Text>
                <Text style={{ color: '#1976d2', opacity: 0.8 }}>
                  Phone: +84 123 456 789
                </Text>
                <Text style={{ color: '#1976d2', opacity: 0.8 }}>
                  Address: 123 Warehouse Street, District 1, HCMC
                </Text>
              </Space>
            </Space>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Space direction="vertical" size="large">
              <Text style={{ color: '#1976d2', fontWeight: 'bold', fontSize: '18px' }}>
                Follow Us
              </Text>
              <Space direction="vertical" size="small">
                <Text style={{ color: '#1976d2', opacity: 0.8, cursor: 'pointer' }}>
                  Facebook
                </Text>
                <Text style={{ color: '#1976d2', opacity: 0.8, cursor: 'pointer' }}>
                  LinkedIn
                </Text>
                <Text style={{ color: '#1976d2', opacity: 0.8, cursor: 'pointer' }}>
                  Twitter
                </Text>
              </Space>
            </Space>
          </Col>
        </Row>
      </div>
    </Footer>
  );
};

export default AppFooter;
