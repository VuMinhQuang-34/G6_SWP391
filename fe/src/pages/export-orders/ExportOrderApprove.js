import React, { useState, useEffect } from 'react';
import {
    Table, Button, Space, Card, Input,
    DatePicker, Select, message
} from 'antd';
import { Link } from 'react-router-dom';
import axios from 'axios';
import HorizontalTimeline from '../../components/HorizontalTimeline';

const { Option } = Select;

const ExportOrderApprove = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchId, setSearchId] = useState('');
    const [searchDate, setSearchDate] = useState(null);

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            const response = await axios.get('http://localhost:9999/api/export-orders', {
                params: { status: 'New' }
            });
            setOrders(response.data);
        } catch (error) {
            message.error('Failed to fetch orders');
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (orderId) => {
        try {
            await axios.patch(`http://localhost:9999/api/export-orders/${orderId}`, {
                status: 'Approved'
            });
            message.success('Order approved successfully');
            fetchOrders();
        } catch (error) {
            message.error('Failed to approve order');
        }
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
                        onClick={() => handleApprove(record.id)}
                    >
                        Approve
                    </Button>
                </Space>
            )
        }
    ];

    return (
        <div style={{ padding: 24 }}>
            <Card title="Approve Export Orders">
                <Space style={{ marginBottom: 16 }}>
                    <Input
                        placeholder="Search by ID"
                        value={searchId}
                        onChange={e => setSearchId(e.target.value)}
                    />
                    <DatePicker
                        placeholder="Filter by date"
                        onChange={date => setSearchDate(date)}
                    />
                </Space>

                <Table
                    columns={columns}
                    dataSource={orders}
                    loading={loading}
                    rowKey="id"
                />
            </Card>
        </div>
    );
};

export default ExportOrderApprove;
