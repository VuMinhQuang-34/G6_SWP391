// src/pages/ShippingExportOrder.js
import React, { useEffect, useState } from 'react';
import { Table, Button, message, Tag, Space, Modal, Descriptions, Divider, Typography } from 'antd';
import axios from 'axios';
import moment from 'moment';

const { Title, Text } = Typography;

function ShippingExportOrder() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [confirmLoading, setConfirmLoading] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [orderDetails, setOrderDetails] = useState(null);

    const statusColors = {
        'Approved': 'green',
        'Shipping': 'blue',
        'Completed': 'purple'
    };

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const res = await axios.get('http://localhost:9999/api/export-orders');
            if (res.data.success && Array.isArray(res.data.data.orders)) {
                // Chỉ lấy đơn hàng có trạng thái Approved hoặc Shipping
                const filteredOrders = res.data.data.orders.filter(
                    order => order.status === 'Approved' || order.status === 'Shipping'
                );
                setOrders(filteredOrders);
            } else {
                setOrders([]);
                message.error('Failed to load orders');
            }
        } catch (error) {
            setOrders([]);
            message.error('Cannot load orders');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    const updateStock = async (orderDetails) => {
        try {
            for (const item of orderDetails) {
                await axios.patch('http://localhost:9999/api/stocks', {
                    bookId: item.BookId,
                    quantity: -item.Quantity // Trừ đi số lượng xuất
                });
            }
            return true;
        } catch (error) {
            console.error('Failed to update stock:', error);
            return false;
        }
    };

    const handleConfirmShip = async (order) => {
        try {
            setSelectedOrder(order);
            // Fetch order details
            const response = await axios.get(`http://localhost:9999/api/export-orders/${order.id}`);
            if (response.data.success) {
                setOrderDetails(response.data.data);
            }
            setShowConfirmModal(true);
        } catch (error) {
            message.error('Failed to load order details');
            console.error(error);
        }
    };

    const handleShip = async () => {
        try {
            setConfirmLoading(true);
            const currentUser = JSON.parse(localStorage.getItem('user'));

            // Lấy chi tiết đơn hàng
            const orderDetailRes = await axios.get(`http://localhost:9999/api/export-orders/${selectedOrder.id}`);
            if (!orderDetailRes.data.success) {
                throw new Error('Failed to get order details');
            }

            // Cập nhật tồn kho
            const stockUpdateSuccess = await updateStock(orderDetailRes.data.data.items);
            if (!stockUpdateSuccess) {
                throw new Error('Failed to update stock');
            }

            // Cập nhật trạng thái đơn hàng
            await axios.patch(`http://localhost:9999/api/export-orders/${selectedOrder.id}/status`, {
                status: 'Shipping',
                updatedBy: currentUser.userId,
                reason: 'Order is being shipped'
            });

            message.success(`Order #${selectedOrder.id} is now being shipped`);
            setShowConfirmModal(false);
            setOrderDetails(null);
            fetchOrders();
        } catch (error) {
            message.error('Failed to process shipping: ' + error.message);
            console.error(error);
        } finally {
            setConfirmLoading(false);
        }
    };

    const handleDeliverySuccess = async (orderId) => {
        try {
            const currentUser = JSON.parse(localStorage.getItem('user'));
            await axios.patch(`http://localhost:9999/api/export-orders/${orderId}/status`, {
                status: 'Completed',
                updatedBy: currentUser.userId,
                reason: 'Delivery completed successfully'
            });
            message.success(`Order #${orderId} has been delivered successfully`);
            fetchOrders();
        } catch (error) {
            message.error('Failed to update order status');
            console.error(error);
        }
    };

    const columns = [
        {
            title: 'Order ID',
            dataIndex: 'id',
            key: 'id'
        },
        {
            title: 'Recipient',
            dataIndex: 'recipientName',
            key: 'recipientName'
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status) => (
                <Tag color={statusColors[status]}>
                    {status}
                </Tag>
            )
        },
        {
            title: 'Order Date',
            dataIndex: 'orderDate',
            key: 'orderDate',
            render: (date) => moment(date).format('DD/MM/YYYY HH:mm')
        },
        {
            title: 'Shipping Address',
            dataIndex: 'shippingAddress',
            key: 'shippingAddress',
            ellipsis: true
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_, record) => (
                <Space>
                    <Button
                        type="link"
                        onClick={() => window.location.href = `/export-orders/${record.id}`}
                    >
                        View Details
                    </Button>
                    {record.status === 'Approved' && (
                        <Button
                            type="primary"
                            onClick={() => handleConfirmShip(record)}
                        >
                            Confirm Ship
                        </Button>
                    )}
                    {record.status === 'Shipping' && (
                        <Button
                            type="primary"
                            onClick={() => handleDeliverySuccess(record.id)}
                        >
                            Delivery Success
                        </Button>
                    )}
                </Space>
            )
        }
    ];

    return (
        <div style={{ padding: 20 }}>
            <div style={{ marginBottom: 16 }}>
                <h2>Shipping Management</h2>
            </div>
            <Table
                rowKey="id"
                columns={columns}
                dataSource={orders || []}
                loading={loading}
                pagination={{
                    pageSize: 10,
                    showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`
                }}
            />

            <Modal
                title={<Title level={4}>Confirm Shipping Order #{selectedOrder?.id}</Title>}
                open={showConfirmModal}
                onOk={handleShip}
                confirmLoading={confirmLoading}
                onCancel={() => {
                    setShowConfirmModal(false);
                    setOrderDetails(null);
                }}
                width={700}
                okText="Confirm Shipping"
                cancelText="Cancel"
            >
                <div style={{ maxHeight: '60vh', overflow: 'auto', padding: '0 10px' }}>
                    {selectedOrder && orderDetails && (
                        <>
                            <Descriptions
                                title={<Text strong>Order Information</Text>}
                                bordered
                                column={2}
                                size="small"
                                style={{ marginBottom: 20 }}
                            >
                                <Descriptions.Item label="Order Date">
                                    {moment(orderDetails.orderDate).format('DD/MM/YYYY HH:mm')}
                                </Descriptions.Item>
                                <Descriptions.Item label="Export Date">
                                    {moment(orderDetails.exportDate).format('DD/MM/YYYY')}
                                </Descriptions.Item>
                                <Descriptions.Item label="Status" span={2}>
                                    <Tag color={statusColors[orderDetails.status]}>
                                        {orderDetails.status}
                                    </Tag>
                                </Descriptions.Item>
                            </Descriptions>

                            <Descriptions
                                title={<Text strong>Recipient Information</Text>}
                                bordered
                                column={1}
                                size="small"
                                style={{ marginBottom: 20 }}
                            >
                                <Descriptions.Item label="Name">{orderDetails.recipientName}</Descriptions.Item>
                                <Descriptions.Item label="Phone">{orderDetails.recipientPhone}</Descriptions.Item>
                                <Descriptions.Item label="Shipping Address">{orderDetails.shippingAddress}</Descriptions.Item>
                            </Descriptions>

                            <div style={{ marginBottom: 20 }}>
                                <Text strong>Order Items</Text>
                                <Table
                                    dataSource={orderDetails.items}
                                    size="small"
                                    pagination={false}
                                    style={{ marginTop: 10 }}
                                    columns={[
                                        {
                                            title: 'Product',
                                            dataIndex: 'productName',
                                            key: 'productName'
                                        },
                                        {
                                            title: 'Quantity',
                                            dataIndex: 'quantity',
                                            key: 'quantity',
                                            width: 100,
                                            align: 'right'
                                        },
                                        {
                                            title: 'Unit Price',
                                            dataIndex: 'unitPrice',
                                            key: 'unitPrice',
                                            width: 120,
                                            align: 'right',
                                            render: (price) => `$${Number(price).toFixed(2)}`
                                        },
                                        {
                                            title: 'Total',
                                            key: 'total',
                                            width: 120,
                                            align: 'right',
                                            render: (_, record) => `$${(record.quantity * record.unitPrice).toFixed(2)}`
                                        }
                                    ]}
                                    summary={(data) => {
                                        const total = data.reduce((sum, item) =>
                                            sum + (item.quantity * item.unitPrice), 0
                                        );
                                        return (
                                            <Table.Summary.Row>
                                                <Table.Summary.Cell colSpan={3} align="right">
                                                    <strong>Total Amount:</strong>
                                                </Table.Summary.Cell>
                                                <Table.Summary.Cell align="right">
                                                    <strong>${total.toFixed(2)}</strong>
                                                </Table.Summary.Cell>
                                            </Table.Summary.Row>
                                        );
                                    }}
                                />
                            </div>

                            <Divider />

                            <div style={{ backgroundColor: '#fffbe6', padding: 16, borderRadius: 4, marginBottom: 16 }}>
                                <Text type="warning" strong>Important Notice:</Text>
                                <ul style={{ marginTop: 8, marginBottom: 0 }}>
                                    <li>This action will update the stock quantity for all items in this order.</li>
                                    <li>The order status will be changed to "Shipping".</li>
                                    <li>Please ensure all items are properly packed before confirming.</li>
                                </ul>
                            </div>
                        </>
                    )}
                </div>
            </Modal>
        </div>
    );
}

export default ShippingExportOrder;
