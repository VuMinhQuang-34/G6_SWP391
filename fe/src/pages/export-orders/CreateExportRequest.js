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
                status: status || undefined,
                searchId: searchId || undefined,
                fromDate: dateRange?.[0]?.format('YYYY-MM-DD'),
                toDate: dateRange?.[1]?.format('YYYY-MM-DD')
            };

            const response = await axios.get('http://localhost:9999/api/export-orders', { params });
            console.log('Export orders response:', response.data);

            if (response.data.success) {
                setOrders(response.data.data.orders);
                setPagination({
                    ...pagination,
                    total: response.data.data.total,
                    current: response.data.data.currentPage
                });
            } else {
                message.error(response.data.message || 'Failed to fetch orders');
            }
        } catch (error) {
            console.error('Error fetching orders:', error);
            message.error('Failed to fetch orders: ' + (error.response?.data?.message || error.message));
        } finally {
            setLoading(false);
        }
    };

    // Fetch products with inventory information
    const fetchProducts = async () => {
        try {
            setLoading(true);
            const response = await axios.get('http://localhost:9999/api/books');
            if (response.data.success) {
                setProducts(response.data.data.map(book => ({
                    BookId: book.BookId,
                    Title: book.Title,
                    Author: book.Author,
                    Publisher: book.Publisher,
                    Category: book.Category?.CategoryName,
                    Language: book.Language,
                    Status: book.Status,
                    Price: 0, // Tạm thời set giá = 0, cần bổ sung field Price vào API
                    StockQuantity: 0 // Tạm thời set số lượng = 0, cần bổ sung field StockQuantity vào API
                })));
            }
        } catch (error) {
            message.error('Failed to fetch books');
            console.error('Error fetching books:', error);
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
            const response = await axios.delete(`http://localhost:9999/api/export-orders/${orderId}`);
            if (response.data.success) {
                message.success(response.data.message || 'Order deleted successfully');
                fetchOrders();
            } else {
                message.error(response.data.message || 'Failed to delete order');
            }
        } catch (error) {
            if (error.response?.status === 400) {
                message.error('Cannot delete order that is not in New status');
            } else {
                message.error('Failed to delete order: ' + (error.response?.data?.message || error.message));
            }
            console.error('Error deleting order:', error);
        }
    };

    // Handle book selection
    const handleBookSelect = async (bookIds) => {
        try {
            setLoading(true);
            const selected = products.filter(book => bookIds.includes(book.BookId));

            // Fetch stock quantities for selected books
            const stockPromises = selected.map(book =>
                axios.get(`http://localhost:9999/api/stocks/${book.BookId}`)
            );

            const stockResponses = await Promise.all(stockPromises);

            const updatedBooks = selected.map((book, index) => {
                const stockResponse = stockResponses[index].data;
                // Kiểm tra response thành công và lấy số lượng từ data
                const stockQuantity = stockResponse.code === 200 ? stockResponse.data[0].quantity : 0;
                const existingBook = selectedItems.find(b => b.BookId === book.BookId);

                return {
                    ...book,
                    StockQuantity: stockQuantity, // Lấy số lượng tồn kho từ API
                    Quantity: existingBook ? existingBook.Quantity : 1,
                    Note: existingBook ? existingBook.Note : ''
                };
            });

            setSelectedItems(updatedBooks);
        } catch (error) {
            message.error('Failed to fetch stock information');
            console.error('Error fetching stock information:', error);
        } finally {
            setLoading(false);
        }
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

    // Handle price change
    const handlePriceChange = (bookId, value) => {
        setSelectedItems(selectedItems.map(item => {
            if (item.BookId === bookId) {
                return { ...item, Price: value };
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
                !item.Quantity ||
                item.Quantity <= 0 ||
                item.Quantity > item.StockQuantity ||
                item.StockQuantity <= 0
            );

            if (invalidItems.length > 0) {
                message.error('Please check quantities. They must be greater than 0 and not exceed available stock.');
                return;
            }

            // Validate prices
            if (selectedItems.some(item => !item.Price || item.Price <= 0)) {
                message.error('Please enter valid price for all items');
                return;
            }

            const orderData = {
                items: selectedItems.map(item => ({
                    bookId: item.BookId,
                    quantity: item.Quantity,
                    price: item.Price,
                    note: item.Note || ''
                })),
                note: values.Note || '',
                exportDate: values.ExportDate,
                recipientName: values.RecipientName,
                recipientPhone: values.RecipientPhone,
                shippingAddress: values.ShippingAddress,
                createdBy: user.userId
            };

            setLoading(true);
            const response = await axios.post('http://localhost:9999/api/export-orders', orderData);

            if (response.data.success) {
                toast.success(response.data.message || 'Export request created successfully');
                form.resetFields();
                setSelectedItems([]);
                setCreateModalVisible(false);
                fetchOrders();
            } else {
                toast.error(response.data.message || 'Failed to create export request');
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to create export request');
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
            key: 'createdBy'
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
            title: 'Export Date',
            dataIndex: 'exportDate',
            key: 'exportDate',
            render: (date) => date ? moment(date).format('DD/MM/YYYY') : '-'
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_, record) => (
                <Space>
                    {record.status === 'New' ? (
                        <>
                            <Button
                                type="primary"
                                icon={<EyeOutlined />}
                                onClick={() => window.location.href = `/export-orders/${record.id}?mode=edit`}
                            >
                                Edit
                            </Button>
                            <Button
                                danger
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
                        </>
                    ) : (
                        <Button
                            type="primary"
                            icon={<EyeOutlined />}
                            onClick={() => window.location.href = `/export-orders/${record.id}`}
                        >
                            View
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
                                    disabled={book.Status !== 'Active'}
                                >
                                    {book.Title} - {book.Author} - {book.Publisher} ({book.Category})
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
                                key: 'StockQuantity',
                                render: (stock) => (
                                    <Tag color={stock > 0 ? 'green' : 'red'}>
                                        {stock}
                                    </Tag>
                                )
                            },
                            {
                                title: 'Unit Price',
                                key: 'Price',
                                render: (_, record) => (
                                    <InputNumber
                                        min={0}
                                        value={record.Price}
                                        onChange={(value) => handlePriceChange(record.BookId, value)}
                                        style={{ width: '100%' }}
                                        formatter={value => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                        parser={value => value.replace(/\$\s?|(,*)/g, '')}
                                    />
                                )
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
                                        disabled={record.StockQuantity <= 0}
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
                                render: (_, record) => {
                                    const total = (record.Quantity || 0) * (record.Price || 0);
                                    return `$ ${total.toFixed(2)}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
                                }
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
                                <strong>Total Amount:</strong> $ {selectedItems.reduce((sum, item) => sum + ((item.Quantity || 0) * (item.Price || 0)), 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
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