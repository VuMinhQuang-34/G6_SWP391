// src/components/Layout.js

import React from 'react';
import { Layout } from 'antd';
import AppHeader from '../components/Header';
import AppFooter from '../components/Footer';

const { Content } = Layout;

const DefaultLayout = ({ children }) => {
    return (
        <Layout style={{ minHeight: '100vh' }}>
            {/* Header */}
            <AppHeader />

            {/* Content */}
            <Layout style={{ marginTop: 64 }}>
                <Content style={{ padding: '50px', background: '#ecf0f1' }}>
                    <div style={{ minHeight: 380, background: '#fff', padding: '24px' }}>
                        {children}
                    </div>
                </Content>

                {/* Footer */}
                <AppFooter />
            </Layout>
        </Layout>
    );
};

export default DefaultLayout;
