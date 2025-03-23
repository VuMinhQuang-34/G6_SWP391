// src/pages/PackingExportOrder.js
import React, { useEffect, useState } from 'react';
import { Table, Button, message, Tag, Space, Select } from 'antd';
import axios from 'axios';
import moment from 'moment';

const { Option } = Select;

function PackingExportOrder() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedStatus, setSelectedStatus] = useState('all');

    const statusColors = {
        'Pending': 'orange',
        'Approved': 'green',
        'Completed': 'purple',
        'Rejected': 'red',
        'Cancelled': 'gray'
    };

    const validTransitions = {
        'New': ['Pending'],
        'Pending': ['Approved', 'Rejected'],
        'Approved': ['Completed'],
        'Rejected': ['Cancelled']
    };

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const params = {
                status: selectedStatus !== 'all' ? selectedStatus : undefined
            };
            const res = await axios.get('http://localhost:9999/api/export-orders', { params });
            if (res.data.success) {
                // Filter out orders with 'New' status
                const filteredOrders = res.data.data.orders.filter(order => order.status !== 'New');
                setOrders(filteredOrders);
            } else {
                message.error('Failed to load orders');
            }
        } catch (error) {
            message.error('Cannot load orders');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, [selectedStatus]);

    const handleStatusChange = async (orderId, newStatus) => {
        try {
            const currentUser = JSON.parse(localStorage.getItem('user'));
            await axios.patch(`http://localhost:9999/api/export-orders/${orderId}/status`, {
                status: newStatus,
                updatedBy: currentUser.userId,
                reason: `Order status changed to ${newStatus}`
            });
            message.success(`Order #${orderId} status updated to ${newStatus}`);
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
                    {record.status === 'Pending' && (
                        <Button
                            type="primary"
                            onClick={() => handleStatusChange(record.id, 'Approved')}
                        >
                            Complete Packing
                        </Button>
                    )}
                </Space>
            )
        }
    ];

    return (
        <div style={{ padding: 20 }}>
            <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2>Export Orders Management</h2>
                <Select
                    style={{ width: 200 }}
                    value={selectedStatus}
                    onChange={setSelectedStatus}
                >
                    <Option value="all">All Status</Option>
                    <Option value="Pending">Pending</Option>
                    <Option value="Approved">Approved</Option>
                    <Option value="Completed">Completed</Option>
                </Select>
            </div>
            <Table
                rowKey="id"
                columns={columns}
                dataSource={orders}
                loading={loading}
                pagination={{
                    pageSize: 10,
                    showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`
                }}
            />
        </div>
    );
}

export default PackingExportOrder;
