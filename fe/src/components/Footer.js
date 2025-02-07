// src/components/Footer.js

import React from 'react';
import { Layout, Row, Col, Typography, Space } from 'antd';

const { Footer } = Layout;
const { Text } = Typography;

const AppFooter = () => {
  return (
    <Footer style={{ background: '#ffffff', color: '#2c3e50', padding: '60px 20px', borderTop: '1px solid #f0f0f0', fontSize: '20px' }}>
      <div style={{ width: '100%' }}>
        <Row justify="space-between" gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <Space direction="vertical">
              <Text style={{ color: '#6c63ff', fontWeight: 'bold', fontSize: '24px' }}>BookStore</Text>
              <Text style={{ color: '#2c3e50' }}>© 2023 All Rights Reserved</Text>
            </Space>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Space direction="vertical">
              <Text style={{ color: '#6c63ff', fontWeight: 'bold', fontSize: '20px' }}>Quick Links</Text>
              <Text style={{ color: '#2c3e50', fontSize: '18px' }}>Privacy Policy</Text>
              <Text style={{ color: '#2c3e50', fontSize: '18px' }}>Terms & Conditions</Text>
            </Space>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Space direction="vertical">
              <Text style={{ color: '#6c63ff', fontWeight: 'bold', fontSize: '20px' }}>Contact Us</Text>
              <Text style={{ color: '#2c3e50', fontSize: '18px' }}>info@bookstore.com</Text>
              <Text style={{ color: '#2c3e50', fontSize: '18px' }}>+123 456 7890</Text>
            </Space>
          </Col>
        </Row>
      </div>
    </Footer>
  );
};

export default AppFooter;
