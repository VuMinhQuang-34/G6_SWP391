import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { Card, Descriptions, Spin, Button, Table, Typography, Row, Col } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import VerticalTimeline from '../../components/VerticalTimeline'; // Import component VerticalTimeline
import OrderHistoryLog from '../../components/OrderHistoryLog'; // Import component VerticalTimeline
import { orderStatuses, suppliersList } from "../../constants/variable";

const { Title } = Typography;

const ViewImportOrder = () => {
    const { id } = useParams(); // Get ID from URL
    const [orderDetails, setOrderDetails] = useState(null);
    const [loading, setLoading] = useState(true);

    console.log("ViewImportOrder => ", id);
    useEffect(() => {
        const fetchOrderDetails = async () => {
            setLoading(true);
            try {
                const response = await axios.get(`http://localhost:9999/api/import-orders/${id}`);
                setOrderDetails(response.data);
            } catch (error) {
                console.error("Error loading import order information:", error);
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchOrderDetails();
        }
    }, [id]);

    if (loading) return <Spin size="large" />; // Display loading spinner
    if (!orderDetails) return <p>No import order information available.</p>;

    // Configure columns for books table
    const columns = [
        {
            title: 'Book ID',
            dataIndex: 'BookId',
            key: 'BookId',
        },
        {
            title: 'Book Title',
            dataIndex: ['BookInfo', 'Title'], // Access BookInfo.Title
            key: 'Title',
        },
        {
            title: 'Author',
            dataIndex: ['BookInfo', 'Author'], // Access BookInfo.Author
            key: 'Author',
        },
        {
            title: 'Publisher',
            dataIndex: ['BookInfo', 'Publisher'], // Access BookInfo.Publisher
            key: 'Publisher',
        },
        {
            title: 'Quantity',
            dataIndex: 'Quantity',
            key: 'Quantity',
        },
        {
            title: 'Unit Price',
            dataIndex: 'Price',
            key: 'Price',
            render: (text) => <span style={{ color: '#ff4d4f', fontWeight: 'bold' }}>{text} VND</span>, // Highlight price
        },
        {
            title: 'Total Price / Book',
            dataIndex: 'Price',
            key: 'Price',
            render: (text, record) => <span style={{ color: 'green', fontWeight: 'bold' }}>{text * record.Quantity} VND</span>, // Highlight price
        },
    ];



    return (
        <div style={{ width: '100%', margin: '20px', padding: "20px" }}>
            <Button
                type="primary"
                style={{ marginBottom: '20px', backgroundColor: '#52c41a', borderColor: '#52c41a' }}
                icon={<ArrowLeftOutlined />}
                onClick={() => window.history.back()}
            >
                Go Back
            </Button>

            <Row gutter={24}>
                {/* Card 1: Import order information */}
                <Col span={12}>
                    <Card style={{ borderRadius: '10px', boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)', backgroundColor: '#e6f7ff', marginBottom: '20px' }}>
                        <Title level={4}>Import Order Information</Title>
                        <Descriptions bordered column={1}>
                            <Descriptions.Item label="Import Order ID">{orderDetails.ImportOrderId}</Descriptions.Item>
                            <Descriptions.Item label="Supplier">{orderDetails.SupplierID}</Descriptions.Item>
                            <Descriptions.Item label="Import Date">{new Date(orderDetails.ImportDate).toLocaleDateString()}</Descriptions.Item>
                            <Descriptions.Item label="Note">{orderDetails.Note}</Descriptions.Item>
                            <Descriptions.Item label="Status">{orderDetails.Status}</Descriptions.Item>
                            {/* <Descriptions.Item label="Total Quantity" style={{ color: '#52c41a', fontWeight: 'bold' }}>{orderDetails.totalQuantity}</Descriptions.Item> */}
                            {/* <Descriptions.Item label="Total Price" style={{ color: '#52c41a', fontWeight: 'bold' }}>{orderDetails.totalPrice} VND</Descriptions.Item> */}
                        </Descriptions>
                    </Card>

                    {/* Card 2: Book list */}
                    <Card title="Books in Import Order" style={{ borderRadius: '10px', boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)', backgroundColor: '#fff3e6' }}>
                        <Table
                            dataSource={orderDetails.details}
                            columns={columns}
                            rowKey="BookId"
                            pagination={{ pageSize: 5 }}
                            bordered
                            summary={pageData => {
                                let totalQuantity = 0;
                                let totalPrice = 0;

                                pageData.forEach(({ Quantity, Price }) => {
                                    totalQuantity += Quantity;
                                    totalPrice += Price * Quantity; // Calculate total price
                                });

                                return (
                                    <Table.Summary fixed>
                                        <Table.Summary.Row>
                                            <Table.Summary.Cell index={0} colSpan={6}>Total</Table.Summary.Cell>
                                            {/* <Table.Summary.Cell index={2} style={{ color: '#52c41a', fontWeight: 'bold' }}>{totalQuantity}</Table.Summary.Cell> */}
                                            <Table.Summary.Cell index={1} style={{ color: 'green', fontWeight: 'bold' }}>{totalPrice} VND</Table.Summary.Cell>
                                        </Table.Summary.Row>
                                    </Table.Summary>
                                );
                            }}
                        />
                    </Card>
                </Col>

                {/* Card 3: Order timeline */}
                <Col span={6}>
                    <VerticalTimeline orderId={id} orderStatuses={orderStatuses} orderType="Import" /> {/* Pass orderStatuses to VerticalTimeline component */}
                </Col>

                {/* Card 4: Order status log history */}
                <Col span={6} style={{ marginTop: '0' }}>
                    <OrderHistoryLog orderId={id} orderType="Import" />
                </Col>
            </Row>
        </div>
    );
};

export default ViewImportOrder; 