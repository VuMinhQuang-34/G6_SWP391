import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
    Card, Descriptions, Spin, Button, Table, Typography,
    Row, Col, Space, message
} from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import axios from 'axios';
import VerticalTimeline from '../../components/VerticalTimeline';
import OrderHistoryLog from '../../components/OrderHistoryLog';
import moment from 'moment';

const { Title } = Typography;

const ViewExportOrder = () => {
    const { id } = useParams();
    const [orderDetails, setOrderDetails] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchOrderDetails();
    }, [id]);

    const fetchOrderDetails = async () => {
        try {
            const response = await axios.get(`http://localhost:9999/api/export-orders/${id}`);
            setOrderDetails(response.data);
        } catch (error) {
            message.error('Failed to fetch order details');
        } finally {
            setLoading(false);
        }
    };

    const columns = [
        {
            title: 'Product ID',
            dataIndex: 'productId',
            key: 'productId',
        },
        {
            title: 'Product Name',
            dataIndex: 'productName',
            key: 'productName',
        },
        {
            title: 'Quantity',
            dataIndex: 'quantity',
            key: 'quantity',
        },
        {
            title: 'Price',
            dataIndex: 'price',
            key: 'price',
        },
        {
            title: 'Total',
            key: 'total',
            render: (_, record) => record.quantity * record.price
        }
    ];

    if (loading) return <Spin size="large" />;
    if (!orderDetails) return <div>Order not found</div>;

    return (
        <div style={{ padding: 24 }}>
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
                <Button type="link" icon={<ArrowLeftOutlined />} href="/orders-export">
                    Back to list
                </Button>

                <Row gutter={24}>
                    <Col span={16}>
                        <Card title="Order Details">
                            <Descriptions column={2}>
                                <Descriptions.Item label="Order ID">
                                    {orderDetails.id}
                                </Descriptions.Item>
                                <Descriptions.Item label="Status">
                                    {orderDetails.status}
                                </Descriptions.Item>
                                <Descriptions.Item label="Created By">
                                    {orderDetails.createdBy}
                                </Descriptions.Item>
                                <Descriptions.Item label="Order Date">
                                    {moment(orderDetails.orderDate).format('DD/MM/YYYY HH:mm')}
                                </Descriptions.Item>
                                {orderDetails.approvedBy && (
                                    <>
                                        <Descriptions.Item label="Approved By">
                                            {orderDetails.approvedBy}
                                        </Descriptions.Item>
                                        <Descriptions.Item label="Approved Date">
                                            {moment(orderDetails.approvedDate).format('DD/MM/YYYY HH:mm')}
                                        </Descriptions.Item>
                                    </>
                                )}
                                {orderDetails.reason && (
                                    <Descriptions.Item label="Reason" span={2}>
                                        {orderDetails.reason}
                                    </Descriptions.Item>
                                )}
                                <Descriptions.Item label="Note" span={2}>
                                    {orderDetails.note}
                                </Descriptions.Item>
                            </Descriptions>
                        </Card>

                        <Card title="Products" style={{ marginTop: 16 }}>
                            <Table
                                columns={[
                                    {
                                        title: 'Product ID',
                                        dataIndex: ['Book', 'BookId'],
                                    },
                                    {
                                        title: 'Product Name',
                                        dataIndex: ['Book', 'Title'],
                                    },
                                    {
                                        title: 'Quantity',
                                        dataIndex: 'Quantity',
                                    },
                                    {
                                        title: 'Unit Price',
                                        dataIndex: 'UnitPrice',
                                        render: (price) => `${price?.toLocaleString()} VND`
                                    },
                                    {
                                        title: 'Total',
                                        render: (_, record) =>
                                            `${(record.Quantity * record.UnitPrice)?.toLocaleString()} VND`
                                    }
                                ]}
                                dataSource={orderDetails.ExportOrderDetails}
                                rowKey="ExportOrderDetailId"
                                pagination={false}
                            />
                        </Card>
                    </Col>

                    <Col span={8}>
                        <Card title="Order Timeline">
                            <VerticalTimeline
                                currentStatus={orderDetails.status}
                                statuses={[
                                    { key: 'New', label: 'New' },
                                    { key: 'Approved', label: 'Approved' },
                                    { key: 'Packed', label: 'Packed' },
                                    { key: 'Shipped', label: 'Shipped' }
                                ]}
                            />
                        </Card>

                        <Card title="Order History" style={{ marginTop: 16 }}>
                            <OrderHistoryLog
                                orderId={id}
                                orderType="EXPORT"
                            />
                        </Card>
                    </Col>
                </Row>
            </Space>
        </div>
    );
};

export default ViewExportOrder;
