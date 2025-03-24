// src/pages/PackingExportOrder.js
import React, { useEffect, useState } from 'react';
import { Table, Button, message, Tag, Space, Select, Steps, Modal, Typography } from 'antd';
import axios from 'axios';
import moment from 'moment';

const { Option } = Select;
const { Step } = Steps;
const { Title, Text } = Typography;

// Custom status progress component
const StatusProgress = ({ status }) => {
    if (status === 'Rejected' || status === 'Cancelled') {
        return (
            <Tag color={status === 'Rejected' ? '#f5222d' : '#8c8c8c'} style={{ padding: '4px 8px' }}>
                {status}
            </Tag>
        );
    }

    const statusFlow = ['New', 'Pending', 'Approved', 'Shipping', 'Completed'];
    const currentIndex = statusFlow.indexOf(status);

    const stepColors = {
        'New': '#1890ff',
        'Pending': '#fa8c16',
        'Approved': '#52c41a',
        'Shipping': '#722ed1',
        'Completed': '#13c2c2'
    };

    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            {statusFlow.map((step, index) => {
                // Determine the status of this step
                let stepStatus = 'wait';
                if (index < currentIndex) stepStatus = 'finish';
                if (index === currentIndex) stepStatus = 'process';

                // Determine the color based on status
                let color = '#d9d9d9'; // wait color
                if (stepStatus === 'finish') color = '#52c41a';
                if (stepStatus === 'process') color = stepColors[step];

                return (
                    <div key={step} style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        width: '20%'
                    }}>
                        <div style={{
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            backgroundColor: color,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#fff',
                            fontSize: '12px',
                            marginBottom: '4px'
                        }}>
                            {index + 1}
                        </div>
                        <div style={{
                            fontSize: '11px',
                            color: stepStatus === 'process' ? color : 'rgba(0,0,0,0.65)',
                            fontWeight: stepStatus === 'process' ? 'bold' : 'normal',
                            textAlign: 'center'
                        }}>
                            {step}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

function PackingExportOrder() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedStatus, setSelectedStatus] = useState('all');
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);

    const statusColors = {
        'Pending': 'orange',
        'Approved': 'green',
        'Completed': 'purple',
        'Rejected': 'red',
        'Cancelled': 'gray',
        'Shipping': 'blue',
        'New': '#1890ff'
    };

    const statusFlow = ['New', 'Pending', 'Approved', 'Shipping', 'Completed'];

    const getStatusStepIndex = (status) => {
        return statusFlow.indexOf(status);
    };

    const getStepStatus = (orderStatus, stepStatus) => {
        const orderIndex = getStatusStepIndex(orderStatus);
        const stepIndex = getStatusStepIndex(stepStatus);

        if (orderIndex === stepIndex) return 'process';
        if (orderIndex > stepIndex) return 'finish';
        return 'wait';
    };

    const stepColors = {
        'New': '#1890ff',
        'Pending': '#fa8c16',
        'Approved': '#52c41a',
        'Shipping': '#722ed1',
        'Completed': '#13c2c2'
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
            width: 300,
            render: (status) => <StatusProgress status={status} />
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
                dataSource={orders || []}
                loading={loading}
                pagination={{
                    pageSize: 10,
                    showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`
                }}
            />

            {/* If there are modals showing status, update them here */}
            <Modal
                title={<div><Title level={4}>Order Details #{selectedOrder?.id}</Title></div>}
                open={showDetailModal}
                onCancel={() => {
                    setShowDetailModal(false);
                    setSelectedOrder(null);
                }}
                footer={null}
                width={700}
            >
                {selectedOrder && (
                    <div style={{ maxHeight: '60vh', overflow: 'auto', padding: '0 10px' }}>
                        <div style={{ marginBottom: 20 }}>
                            <Text strong>Order Status:</Text>
                            <div style={{ marginTop: 10 }}>
                                <StatusProgress status={selectedOrder.status} />
                            </div>
                        </div>

                        {/* ... rest of modal content ... */}
                    </div>
                )}
            </Modal>
        </div>
    );
}

export default PackingExportOrder;
