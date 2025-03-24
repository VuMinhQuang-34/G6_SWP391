// src/pages/ExportOrderListAdvanced.js
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
    Table, Space, Button, Tag, Input, DatePicker, Select,
    Card, Row, Col, Pagination, Modal, message, Form, InputNumber, Typography
} from 'antd';
import { EyeOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import axios from 'axios';
import moment from 'moment';
import { useNavigate } from 'react-router-dom';

const { RangePicker } = DatePicker;
const { Option } = Select;
const { TextArea } = Input;
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

const ExportOrderListAdvanced = () => {
    const [form] = Form.useForm();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [createModalVisible, setCreateModalVisible] = useState(false);
    const [createLoading, setCreateLoading] = useState(false);
    const [orderItems, setOrderItems] = useState([]);
    const [products, setProducts] = useState([]); // Cần fetch từ API
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 10,
        total: 0
    });
    const [filters, setFilters] = useState({
        status: '',
        searchId: '',
        dateRange: []
    });

    // Status colors for different states
    const statusColors = {
        'New': 'blue',
        'Pending': 'orange',
        'Approved': 'green',
        'Rejected': 'red',
        'Cancelled': 'gray',
        'Completed': 'purple'
    };

    // Fetch orders from API
    const fetchOrders = async () => {
        try {
            setLoading(true);
            const { current, pageSize } = pagination;
            const { status, searchId, dateRange } = filters;

            const params = {
                page: current,
                limit: pageSize,
                status,
                searchId,
                fromDate: dateRange[0]?.format('YYYY-MM-DD'),
                toDate: dateRange[1]?.format('YYYY-MM-DD')
            };

            const response = await axios.get('/api/export-orders', { params });
            setOrders(response.data.orders);
            setPagination({
                ...pagination,
                total: response.data.total
            });
        } catch (error) {
            message.error('Failed to fetch orders');
            console.error('Error fetching orders:', error);
        } finally {
            setLoading(false);
        }
    };

    // Fetch products for the create form
    const fetchProducts = async () => {
        try {
            const response = await axios.get('/api/books'); // Adjust endpoint as needed
            setProducts(response.data.map(book => ({
                id: book.BookId,
                name: book.Title,
                price: book.Price
            })));
        } catch (error) {
            message.error('Failed to fetch products');
            console.error('Error fetching products:', error);
        }
    };

    useEffect(() => {
        fetchOrders();
        fetchProducts();
    }, [pagination.current, pagination.pageSize, filters]);

    // Handle delete order
    const handleDelete = async (orderId) => {
        try {
            await axios.delete(`/api/export-orders/${orderId}`);
            message.success('Order deleted successfully');
            fetchOrders();
        } catch (error) {
            if (error.response?.status === 400) {
                message.error('Cannot delete order that is not in New status');
            } else {
                message.error('Failed to delete order');
            }
            console.error('Error deleting order:', error);
        }
    };

    // Create order form handlers
    const handleAddItem = () => {
        setOrderItems([
            ...orderItems,
            {
                key: Date.now(),
                productId: undefined,
                quantity: 1,
                price: 0,
                note: ''
            }
        ]);
    };

    const handleRemoveItem = (key) => {
        setOrderItems(orderItems.filter(item => item.key !== key));
    };

    const handleItemChange = (key, field, value) => {
        setOrderItems(orderItems.map(item => {
            if (item.key === key) {
                if (field === 'productId') {
                    const product = products.find(p => p.id === value);
                    return {
                        ...item,
                        productId: value,
                        price: product?.price || 0
                    };
                }
                return { ...item, [field]: value };
            }
            return item;
        }));
    };

    const handleCreateSubmit = async (values) => {
        try {
            setCreateLoading(true);
            if (orderItems.length === 0) {
                message.error('Please add at least one item to the order');
                return;
            }

            const orderData = {
                items: orderItems.map(item => ({
                    productId: item.productId,
                    quantity: item.quantity,
                    price: item.price,
                    note: item.note
                })),
                note: values.note
            };

            await axios.post('/api/export-orders', orderData);
            message.success('Export order created successfully');
            setCreateModalVisible(false);
            form.resetFields();
            setOrderItems([]);
            fetchOrders();
        } catch (error) {
            message.error('Failed to create export order');
            console.error('Error creating export order:', error);
        } finally {
            setCreateLoading(false);
        }
    };

    // Create form columns
    const createFormColumns = [
        {
            title: 'Product',
            dataIndex: 'productId',
            key: 'productId',
            render: (value, record) => (
                <Select
                    style={{ width: 200 }}
                    value={value}
                    onChange={(val) => handleItemChange(record.key, 'productId', val)}
                    placeholder="Select product"
                >
                    {products.map(product => (
                        <Option key={product.id} value={product.id}>
                            {product.name}
                        </Option>
                    ))}
                </Select>
            )
        },
        {
            title: 'Quantity',
            dataIndex: 'quantity',
            key: 'quantity',
            render: (value, record) => (
                <InputNumber
                    min={1}
                    value={value}
                    onChange={(val) => handleItemChange(record.key, 'quantity', val)}
                />
            )
        },
        {
            title: 'Unit Price',
            dataIndex: 'price',
            key: 'price',
            render: (value) => `$${value.toFixed(2)}`
        },
        {
            title: 'Note',
            dataIndex: 'note',
            key: 'note',
            render: (value, record) => (
                <Input
                    value={value}
                    onChange={(e) => handleItemChange(record.key, 'note', e.target.value)}
                    placeholder="Add note"
                />
            )
        },
        {
            title: 'Action',
            key: 'action',
            render: (_, record) => (
                <Button
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => handleRemoveItem(record.key)}
                />
            )
        }
    ];

    // List view columns
    const columns = useMemo(() => [
        {
            title: 'Order ID',
            dataIndex: 'id',
            key: 'id',
        },
        {
            title: 'Created By',
            dataIndex: 'createdBy',
            key: 'createdBy',
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
            title: 'Approved By',
            dataIndex: 'approvedBy',
            key: 'approvedBy',
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_, record) => (
                <Space>
                    <Button
                        type="primary"
                        icon={<EyeOutlined />}
                        onClick={() => window.location.href = `/export-orders/${record.id}`}
                    >
                        View
                    </Button>
                    {record.status === 'New' && (
                        <Button
                            type="danger"
                            icon={<DeleteOutlined />}
                            onClick={() => Modal.confirm({
                                title: 'Delete Order',
                                content: 'Are you sure you want to delete this order?',
                                okText: 'Yes',
                                cancelText: 'No',
                                onOk: () => handleDelete(record.id)
                            })}
                        >
                            Delete
                        </Button>
                    )}
                </Space>
            )
        }
    ], []);

    return (
        <Card title="Export Orders">
            <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
                <Col span={6}>
                    <Input
                        placeholder="Search by Order ID"
                        value={filters.searchId}
                        onChange={e => setFilters({ ...filters, searchId: e.target.value })}
                    />
                </Col>
                <Col span={6}>
                    <Select
                        style={{ width: '100%' }}
                        placeholder="Filter by Status"
                        value={filters.status}
                        onChange={value => setFilters({ ...filters, status: value })}
                        allowClear
                    >
                        <Option value="New">New</Option>
                        <Option value="Pending">Pending</Option>
                        <Option value="Approved">Approved</Option>
                        <Option value="Rejected">Rejected</Option>
                        <Option value="Cancelled">Cancelled</Option>
                        <Option value="Completed">Completed</Option>
                    </Select>
                </Col>
                <Col span={8}>
                    <RangePicker
                        style={{ width: '100%' }}
                        value={filters.dateRange}
                        onChange={(dates) => setFilters({ ...filters, dateRange: dates })}
                    />
                </Col>
                <Col span={4}>
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => setCreateModalVisible(true)}
                    >
                        Create New Order
                    </Button>
                </Col>
            </Row>

            <Table
                columns={columns}
                dataSource={orders}
                rowKey="id"
                pagination={false}
                loading={loading}
            />

            <Row justify="end" style={{ marginTop: 16 }}>
                <Pagination
                    current={pagination.current}
                    pageSize={pagination.pageSize}
                    total={pagination.total}
                    onChange={(page, pageSize) => setPagination({ ...pagination, current: page, pageSize })}
                    showSizeChanger
                    showTotal={(total, range) => `${range[0]}-${range[1]} of ${total} items`}
                />
            </Row>

            {/* Create Order Modal */}
            <Modal
                title="Create Export Order"
                visible={createModalVisible}
                onCancel={() => {
                    setCreateModalVisible(false);
                    form.resetFields();
                    setOrderItems([]);
                }}
                footer={null}
                width={1000}
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleCreateSubmit}
                >
                    <Table
                        columns={createFormColumns}
                        dataSource={orderItems}
                        pagination={false}
                        rowKey="key"
                    />

                    <Button
                        type="dashed"
                        onClick={handleAddItem}
                        style={{ marginTop: 16, marginBottom: 16 }}
                        block
                        icon={<PlusOutlined />}
                    >
                        Add Item
                    </Button>

                    <Form.Item
                        name="note"
                        label="Order Note"
                    >
                        <TextArea rows={4} placeholder="Add note for the entire order" />
                    </Form.Item>

                    <Form.Item>
                        <Space>
                            <Button type="primary" htmlType="submit" loading={createLoading}>
                                Create Order
                            </Button>
                            <Button onClick={() => {
                                setCreateModalVisible(false);
                                form.resetFields();
                                setOrderItems([]);
                            }}>
                                Cancel
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Modal>
        </Card>
    );
};

export default ExportOrderListAdvanced;
