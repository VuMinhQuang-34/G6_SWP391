import React, { useState, useEffect, useContext } from 'react';
import {
    Card, Form, Input, Button, Table, InputNumber, Tag,
    message, Select, Space, Modal, Row, Col, DatePicker
} from 'antd';
import { PlusOutlined, DeleteOutlined, EyeOutlined, SearchOutlined } from '@ant-design/icons';
import { AuthContext } from "../../context/AuthContext";
import { toast } from "react-toastify";
import axios from 'axios';
import moment from 'moment';

const { TextArea } = Input;
const { Option } = Select;
const { RangePicker } = DatePicker;

const CreateExportRequest = () => {
    const { user } = useContext(AuthContext);
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [products, setProducts] = useState([]);
    const [selectedItems, setSelectedItems] = useState([]);
    const [createModalVisible, setCreateModalVisible] = useState(false);
    const [orders, setOrders] = useState([]);
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

    // Fetch products with inventory information
    const fetchProducts = async () => {
        try {
            setLoading(true);
            const response = await axios.get('/api/books');
            setProducts(response.data.map(book => ({
                BookId: book.BookId,
                Title: book.Title,
                Author: book.Author,
                Price: book.Price,
                StockQuantity: book.StockQuantity || 0
            })));
        } catch (error) {
            message.error('Failed to fetch products');
            console.error('Error fetching products:', error);
        } finally {
            setLoading(false);
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

    // Handle book selection
    const handleBookSelect = (bookIds) => {
        const selected = products.filter(book => bookIds.includes(book.BookId));
        const updatedBooks = selected.map(book => {
            const existingBook = selectedItems.find(b => b.BookId === book.BookId);
            return {
                ...book,
                Quantity: existingBook ? existingBook.Quantity : 1,
                Note: existingBook ? existingBook.Note : ''
            };
        });
        setSelectedItems(updatedBooks);
    };

    // Handle quantity change
    const handleQuantityChange = (bookId, value) => {
        setSelectedItems(selectedItems.map(item => {
            if (item.BookId === bookId) {
                return { ...item, Quantity: value };
            }
            return item;
        }));
    };

    // Handle note change
    const handleNoteChange = (bookId, value) => {
        setSelectedItems(selectedItems.map(item => {
            if (item.BookId === bookId) {
                return { ...item, Note: value };
            }
            return item;
        }));
    };

    // Handle form submission
    const handleSubmit = async (values) => {
        try {
            if (selectedItems.length === 0) {
                message.error('Please select at least one book');
                return;
            }

            // Validate quantities
            const invalidItems = selectedItems.filter(item => 
                !item.Quantity || item.Quantity <= 0 || item.Quantity > item.StockQuantity
            );
            if (invalidItems.length > 0) {
                message.error('Please check quantities. They must be greater than 0 and not exceed stock quantity.');
                return;
            }

            const orderData = {
                items: selectedItems.map(item => ({
                    productId: item.BookId,
                    quantity: item.Quantity,
                    price: item.Price,
                    note: item.Note
                })),
                note: values.Note,
                exportDate: values.ExportDate,
                recipientName: values.RecipientName,
                recipientPhone: values.RecipientPhone,
                shippingAddress: values.ShippingAddress,
                createdBy: user.userId
            };

            setLoading(true);
            await axios.post('/api/export-orders', orderData);
            toast.success('Export request created successfully');
            
            // Reset form and close modal
            form.resetFields();
            setSelectedItems([]);
            setCreateModalVisible(false);
            // Refresh order list
            fetchOrders();
        } catch (error) {
            toast.error('Failed to create export request');
            console.error('Error creating export request:', error);
        } finally {
            setLoading(false);
        }
    };

    // List view columns
    const listColumns = [
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
            title: 'Recipient',
            dataIndex: 'recipientName',
            key: 'recipientName',
        },
        {
            title: 'Shipping Address',
            dataIndex: 'shippingAddress',
            key: 'shippingAddress',
            ellipsis: true,
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
    ];

    return (
        <Card title="Export Orders Management">
            {/* Filter Section */}
            <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
                <Col span={6}>
                    <Input
                        placeholder="Search by Order ID"
                        prefix={<SearchOutlined />}
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

            {/* Order List Table */}
            <Table
                columns={listColumns}
                dataSource={orders}
                rowKey="id"
                pagination={{
                    current: pagination.current,
                    pageSize: pagination.pageSize,
                    total: pagination.total,
                    onChange: (page, pageSize) => setPagination({ ...pagination, current: page, pageSize }),
                    showSizeChanger: true,
                    showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`
                }}
                loading={loading}
            />

            {/* Create Order Modal */}
            <Modal
                title="Create Export Request"
                open={createModalVisible}
                onCancel={() => {
                    setCreateModalVisible(false);
                    form.resetFields();
                    setSelectedItems([]);
                }}
                footer={null}
                width={1000}
            >
                <Form form={form} layout="vertical" onFinish={handleSubmit}>
                    <Row gutter={16}>
                        <Col span={8}>
                            <Form.Item
                                name="ExportDate"
                                label="Export Date"
                                rules={[{ required: true, message: 'Please select export date' }]}
                            >
                                <Input type="date" />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item
                                name="RecipientName"
                                label="Recipient Name"
                                rules={[{ required: true, message: 'Please enter recipient name' }]}
                            >
                                <Input placeholder="Enter recipient name" />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item
                                name="RecipientPhone"
                                label="Recipient Phone"
                                rules={[
                                    { required: true, message: 'Please enter recipient phone' },
                                    { pattern: /^[0-9]{10}$/, message: 'Please enter a valid 10-digit phone number' }
                                ]}
                            >
                                <Input placeholder="Enter recipient phone number" />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                name="ShippingAddress"
                                label="Shipping Address"
                                rules={[{ required: true, message: 'Please enter shipping address' }]}
                            >
                                <TextArea rows={1} placeholder="Enter detailed shipping address" />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                name="Note"
                                label="Order Note"
                            >
                                <TextArea rows={1} placeholder="Add note for the entire order" />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Form.Item label="Select Books">
                        <Select
                            mode="multiple"
                            placeholder="Select books to export"
                            onChange={handleBookSelect}
                            style={{ width: '100%' }}
                            optionFilterProp="children"
                            showSearch
                        >
                            {products.map((book) => (
                                <Option 
                                    key={book.BookId} 
                                    value={book.BookId}
                                    disabled={book.StockQuantity <= 0}
                                >
                                    {book.Title} - Stock: {book.StockQuantity}
                                </Option>
                            ))}
                        </Select>
                    </Form.Item>

                    <Table
                        dataSource={selectedItems}
                        columns={[
                            {
                                title: 'Book Title',
                                dataIndex: 'Title',
                                key: 'Title'
                            },
                            {
                                title: 'Available Stock',
                                dataIndex: 'StockQuantity',
                                key: 'StockQuantity'
                            },
                            {
                                title: 'Unit Price',
                                dataIndex: 'Price',
                                key: 'Price',
                                render: (price) => `$${price.toFixed(2)}`
                            },
                            {
                                title: 'Quantity',
                                key: 'Quantity',
                                render: (_, record) => (
                                    <InputNumber
                                        min={1}
                                        max={record.StockQuantity}
                                        value={record.Quantity}
                                        onChange={(value) => handleQuantityChange(record.BookId, value)}
                                        style={{ width: '100%' }}
                                    />
                                )
                            },
                            {
                                title: 'Note',
                                key: 'Note',
                                render: (_, record) => (
                                    <Input
                                        value={record.Note}
                                        onChange={(e) => handleNoteChange(record.BookId, e.target.value)}
                                        placeholder="Add note"
                                    />
                                )
                            },
                            {
                                title: 'Total',
                                key: 'Total',
                                render: (_, record) => `$${((record.Quantity || 0) * record.Price).toFixed(2)}`
                            }
                        ]}
                        pagination={false}
                        rowKey="BookId"
                    />

                    <div style={{ marginTop: 16, textAlign: 'right' }}>
                        <Space>
                            <span style={{ marginRight: 16 }}>
                                <strong>Total Items:</strong> {selectedItems.reduce((sum, item) => sum + (item.Quantity || 0), 0)}
                            </span>
                            <span style={{ marginRight: 16 }}>
                                <strong>Total Amount:</strong> ${selectedItems.reduce((sum, item) => sum + ((item.Quantity || 0) * item.Price), 0).toFixed(2)}
                            </span>
                            <Button onClick={() => {
                                setCreateModalVisible(false);
                                form.resetFields();
                                setSelectedItems([]);
                            }}>
                                Cancel
                            </Button>
                            <Button type="primary" htmlType="submit" loading={loading}>
                                Create Order
                            </Button>
                        </Space>
                    </div>
                </Form>
            </Modal>
        </Card>
    );
};

export default CreateExportRequest; 