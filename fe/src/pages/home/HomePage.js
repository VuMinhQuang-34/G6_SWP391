// fe/src/pages/home/HomePage.js
import React from 'react';
import { Layout, Typography, Row, Col, Card, Button, Divider, Statistic } from 'antd';
import { BookOutlined, ReadOutlined, DatabaseOutlined, ClockCircleOutlined, TeamOutlined } from '@ant-design/icons';
import './HomePage.css'; // Import CSS

const { Title, Paragraph, Text } = Typography;
const { Content } = Layout;

const HomePage = () => {
    return (
        <div className="home-page">
            {/* Hero Banner Section */}
            <div className="hero-banner">
                <div className="overlay"></div>
                <div className="banner-content">
                    <Title level={1} className="banner-title">Book Warehouse Management</Title>
                    <Title level={3} className="banner-subtitle">Efficient book management - Preserving knowledge</Title>
                    <Button type="primary" size="large" className="banner-button">
                        Explore Now
                    </Button>
                </div>
            </div>

            {/* Features Section */}
            <div className="section features-section">
                <Title level={2} className="section-title">Our Services</Title>
                <Row gutter={[24, 24]}>
                    <Col xs={24} sm={12} md={8}>
                        <Card className="feature-card" bordered={false}>
                            <BookOutlined className="feature-icon" />
                            <Title level={4}>Book Inventory Management</Title>
                            <Paragraph>
                                Smart inventory management system that optimizes storage processes
                                and retrieves book information quickly and accurately.
                            </Paragraph>
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} md={8}>
                        <Card className="feature-card" bordered={false}>
                            <DatabaseOutlined className="feature-icon" />
                            <Title level={4}>Import/Export Operations</Title>
                            <Paragraph>
                                Track and manage import and export orders efficiently with an intuitive,
                                simple, and easy-to-use interface.
                            </Paragraph>
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} md={8}>
                        <Card className="feature-card" bordered={false}>
                            <ClockCircleOutlined className="feature-icon" />
                            <Title level={4}>Real-Time Statistics</Title>
                            <Paragraph>
                                Detailed statistics and reports on inventory status, helping you make
                                accurate and timely business decisions.
                            </Paragraph>
                        </Card>
                    </Col>
                </Row>
            </div>

            {/* Categories Section */}
            <div className="section categories-section">
                <Title level={2} className="section-title">Book Categories</Title>
                <Row gutter={[24, 24]}>
                    <Col xs={24} sm={12} md={8} lg={6}>
                        <Card
                            className="category-card"
                            cover={<img alt="Literature" src="https://images.unsplash.com/photo-1543002588-bfa74002ed7e?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=60" />}
                        >
                            <Title level={4}>Literature</Title>
                            <Paragraph>Short stories, novels, poetry, and many classic works</Paragraph>
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} md={8} lg={6}>
                        <Card
                            className="category-card"
                            cover={<img alt="Science" src="https://images.unsplash.com/photo-1507413245164-6160d8298b31?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=60" />}
                        >
                            <Title level={4}>Science</Title>
                            <Paragraph>Science and technology books with the latest research trends</Paragraph>
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} md={8} lg={6}>
                        <Card
                            className="category-card"
                            cover={<img alt="Business" src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=60" />}
                        >
                            <Title level={4}>Business</Title>
                            <Paragraph>Business management, finance, and personal development</Paragraph>
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} md={8} lg={6}>
                        <Card
                            className="category-card"
                            cover={<img alt="Children" src="https://images.unsplash.com/photo-1471970394675-613138e45da3?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=60" />}
                        >
                            <Title level={4}>Children's Books</Title>
                            <Paragraph>Comics, coloring books, and fairy tales for children</Paragraph>
                        </Card>
                    </Col>
                </Row>
            </div>

            {/* Statistics Section */}
            <div className="section stats-section">
                <div className="stats-background"></div>
                <div className="stats-content">
                    <Title level={2} className="section-title light">Our Book Warehouse</Title>
                    <Row gutter={[48, 24]} className="stats-row">
                        <Col xs={12} md={6}>
                            <Statistic
                                title={<Text className="stat-title">Total Books</Text>}
                                value={10000}
                                prefix={<BookOutlined />}
                                className="stat-item"
                            />
                        </Col>
                        <Col xs={12} md={6}>
                            <Statistic
                                title={<Text className="stat-title">Categories</Text>}
                                value={20}
                                prefix={<ReadOutlined />}
                                className="stat-item"
                            />
                        </Col>
                        <Col xs={12} md={6}>
                            <Statistic
                                title={<Text className="stat-title">Storage Locations</Text>}
                                value={50}
                                prefix={<DatabaseOutlined />}
                                className="stat-item"
                            />
                        </Col>
                        <Col xs={12} md={6}>
                            <Statistic
                                title={<Text className="stat-title">Readers</Text>}
                                value={5000}
                                prefix={<TeamOutlined />}
                                className="stat-item"
                            />
                        </Col>
                    </Row>
                </div>
            </div>

            {/* About Section */}
            <div className="section about-section">
                <Row gutter={[48, 24]} align="middle">
                    <Col xs={24} md={12}>
                        <div className="about-image">
                            <img
                                src="https://images.unsplash.com/photo-1481627834876-b7833e8f5570?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=60"
                                alt="About our library"
                            />
                        </div>
                    </Col>
                    <Col xs={24} md={12}>
                        <div className="about-content">
                            <Title level={2}>About Us</Title>
                            <Paragraph>
                                The Knowledge Book Warehouse is a modern book management system designed to help
                                libraries, bookstores, and educational organizations manage documents efficiently.
                            </Paragraph>
                            <Paragraph>
                                With over 10 years of experience, we proudly deliver comprehensive solutions
                                from inventory, classification, to distribution and statistical reporting.
                            </Paragraph>
                            <Button type="primary" size="large">Learn More</Button>
                        </div>
                    </Col>
                </Row>
            </div>

            {/* Call to Action */}
            <div className="section cta-section">
                <Title level={2}>Start Managing Your Book Inventory Today</Title>
                <Paragraph className="cta-text">
                    Join thousands of organizations using our system to efficiently manage their book inventories
                </Paragraph>
                <Button type="primary" size="large" className="cta-button">
                    Register For Trial
                </Button>
            </div>
        </div>
    );
};

export default HomePage;