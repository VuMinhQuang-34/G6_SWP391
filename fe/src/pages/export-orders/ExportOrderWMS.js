import React, { useState, useEffect } from 'react';
import {
    Table, Button, Space, Card, Input,
    DatePicker, Modal, Form,
    message, Descriptions
} from 'antd';
import { Link } from 'react-router-dom';
import axios from 'axios';
import HorizontalTimeline from '../../components/HorizontalTimeline';

const ExportOrderWMS = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [approveModalVisible, setApproveModalVisible] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [form] = Form.useForm();

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            const response = await axios.get('http://localhost:9999/api/export-orders', {
                params: { status: 'Packed' }
            });
            setOrders(response.data);
        } catch (error) {
            message.error('Failed to fetch orders');
        } finally {
            setLoading(false);
        }
    };

    const handleApproveWMS = async (values) => {
        try {
            await axios.patch(`http://localhost:9999/api/export-orders/${selectedOrder.id}`, {
                status: 'Shipped',
                wmsApprovalDetails: values
            });
            message.success('Order approved for shipping');
            setApproveModalVisible(false);
            fetchOrders();
        } catch (error) {
            message.error('Failed to approve order');
        }
    };

    const showApproveModal = (order) => {
        setSelectedOrder(order);
        setApproveModalVisible(true);
        form.resetFields();
    };

    const columns = [
        {
            title: 'Order ID',
            dataIndex: 'id',
            key: 'id',
        },
        {
            title: 'Customer',
            dataIndex: 'customerId',
            key: 'customerId',
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status) => (
                <HorizontalTimeline
                    statusKey={status}
                    orderStatuses={[
                        { key: 'New', label: 'New' },
                        { key: 'Approved', label: 'Approved' },
                        { key: 'Packed', label: 'Packed' },
                        { key: 'Shipped', label: 'Shipped' }
                    ]}
                />
            )
        },
        {
            title: 'Pack Date',
            dataIndex: 'packDate',
            key: 'packDate',
            render: (date) => date ? new Date(date).toLocaleDateString() : '-'
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_, record) => (
                <Space>
                    <Link to={`/orders-export/${record.id}`}>View</Link>
                    <Button
                        type="primary"
                        onClick={() => showApproveModal(record)}
                    >
                        Approve Shipping
                    </Button>
                </Space>
            )
        }
    ];

    return (
        <div style={{ padding: 24 }}>
            <Card title="WMS Approval for Export Orders">
                <Space style={{ marginBottom: 16 }}>
                    <Input placeholder="Search by Order ID" />
                    <DatePicker placeholder="Filter by date" />
                </Space>

                <Table
                    columns={columns}
                    dataSource={orders}
                    loading={loading}
                    rowKey="id"
                />
            </Card>

            <Modal
                title="Approve Order for Shipping"
                visible={approveModalVisible}
                onCancel={() => setApproveModalVisible(false)}
                onOk={() => form.submit()}
                width={800}
            >
                {selectedOrder && (
                    <Form
                        form={form}
                        onFinish={handleApproveWMS}
                        layout="vertical"
                    >
                        <Descriptions title="Order Information" bordered>
                            <Descriptions.Item label="Order ID">
                                {selectedOrder.id}
                            </Descriptions.Item>
                            <Descriptions.Item label="Customer">
                                {selectedOrder.customerId}
                            </Descriptions.Item>
                            <Descriptions.Item label="Pack Date">
                                {selectedOrder.packDate ?
                                    new Date(selectedOrder.packDate).toLocaleDateString() : '-'}
                            </Descriptions.Item>
                        </Descriptions>

                        <Form.Item
                            name="notes"
                            label="Approval Notes"
                            rules={[{ required: true }]}
                        >
                            <Input.TextArea rows={4} />
                        </Form.Item>

                        <Form.Item
                            name="shippingReference"
                            label="Shipping Reference"
                            rules={[{ required: true }]}
                        >
                            <Input />
                        </Form.Item>
                    </Form>
                )}
            </Modal>
        </div>
    );
};

export default ExportOrderWMS;
