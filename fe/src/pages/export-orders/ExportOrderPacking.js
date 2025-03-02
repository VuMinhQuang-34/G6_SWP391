import React, { useState, useEffect } from 'react';
import {
    Table, Button, Space, Card, Input,
    DatePicker, Modal, Form, InputNumber,
    message
} from 'antd';
import { Link } from 'react-router-dom';
import axios from 'axios';
import HorizontalTimeline from '../../components/HorizontalTimeline';

const ExportOrderPacking = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [packingModalVisible, setPackingModalVisible] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [form] = Form.useForm();

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            const response = await axios.get('http://localhost:9999/api/export-orders', {
                params: { status: 'Approved' }
            });
            setOrders(response.data);
        } catch (error) {
            message.error('Failed to fetch orders');
        } finally {
            setLoading(false);
        }
    };

    const handlePacking = async (values) => {
        try {
            await axios.patch(`http://localhost:9999/api/export-orders/${selectedOrder.id}`, {
                status: 'Packed',
                packingDetails: values
            });
            message.success('Order packed successfully');
            setPackingModalVisible(false);
            fetchOrders();
        } catch (error) {
            message.error('Failed to update packing status');
        }
    };

    const showPackingModal = (order) => {
        setSelectedOrder(order);
        setPackingModalVisible(true);
        form.setFieldsValue({
            items: order.items.map(item => ({
                productId: item.productId,
                productName: item.productName,
                quantity: item.quantity,
                packedQuantity: item.quantity
            }))
        });
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
            title: 'Order Date',
            dataIndex: 'orderDate',
            key: 'orderDate',
            render: (date) => new Date(date).toLocaleDateString()
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_, record) => (
                <Space>
                    <Link to={`/orders-export/${record.id}`}>View</Link>
                    <Button
                        type="primary"
                        onClick={() => showPackingModal(record)}
                    >
                        Pack Order
                    </Button>
                </Space>
            )
        }
    ];

    return (
        <div style={{ padding: 24 }}>
            <Card title="Pack Export Orders">
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
                title="Pack Order"
                visible={packingModalVisible}
                onCancel={() => setPackingModalVisible(false)}
                onOk={() => form.submit()}
                width={800}
            >
                <Form
                    form={form}
                    onFinish={handlePacking}
                >
                    <Form.List name="items">
                        {(fields) => (
                            <>
                                {fields.map(field => (
                                    <Card key={field.key} style={{ marginBottom: 16 }}>
                                        <Form.Item
                                            {...field}
                                            label="Product"
                                            name={[field.name, 'productName']}
                                        >
                                            <Input disabled />
                                        </Form.Item>
                                        <Form.Item
                                            {...field}
                                            label="Required Quantity"
                                            name={[field.name, 'quantity']}
                                        >
                                            <InputNumber disabled />
                                        </Form.Item>
                                        <Form.Item
                                            {...field}
                                            label="Packed Quantity"
                                            name={[field.name, 'packedQuantity']}
                                            rules={[
                                                { required: true },
                                                ({ getFieldValue }) => ({
                                                    validator(_, value) {
                                                        const items = getFieldValue('items');
                                                        const requiredQty = items[field.name].quantity;
                                                        if (value && value <= requiredQty) {
                                                            return Promise.resolve();
                                                        }
                                                        return Promise.reject('Packed quantity cannot exceed required quantity');
                                                    }
                                                })
                                            ]}
                                        >
                                            <InputNumber min={0} />
                                        </Form.Item>
                                    </Card>
                                ))}
                            </>
                        )}
                    </Form.List>
                </Form>
            </Modal>
        </div>
    );
};

export default ExportOrderPacking;
