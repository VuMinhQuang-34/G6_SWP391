import React, { useState, useContext, useEffect } from 'react';
import {
    Modal, Form, Input, Select, InputNumber,
    Button, Table, Space, message, Card
} from 'antd';
import axios from 'axios';
import { AuthContext } from "../../context/AuthContext";
import { toast } from "react-toastify";

const { Option } = Select;

const AddExportOrderModal = ({ visible, onCancel, onAdd }) => {
    const { user } = useContext(AuthContext);
    const [form] = Form.useForm();
    const [selectedBooks, setSelectedBooks] = useState([]);
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [books, setBooks] = useState([]);
    const [customers, setCustomers] = useState([]);

    useEffect(() => {
        if (visible) {
            fetchInitialData();
        }
    }, [visible]);

    const fetchInitialData = async () => {
        setInitialLoading(true);
        try {
            await Promise.all([fetchCustomers(), fetchProducts()]);
        } finally {
            setInitialLoading(false);
        }
    };

    const fetchCustomers = async () => {
        try {
            const response = await axios.get('http://localhost:9999/api/customers');
            // Đảm bảo response.data là mảng
            const customerData = Array.isArray(response.data) ? response.data : response.data.customers || [];
            setCustomers(customerData);
        } catch (error) {
            console.error('Error fetching customers:', error);
            message.error('Failed to fetch customers');
            setCustomers([]);
        }
    };

    const fetchProducts = async () => {
        try {
            const response = await axios.get('http://localhost:9999/api/books');
            // Đảm bảo response.data là mảng
            const productData = Array.isArray(response.data) ? response.data : response.data.books || [];
            setBooks(productData);
        } catch (error) {
            console.error('Error fetching products:', error);
            message.error('Failed to fetch products');
            setBooks([]);
        }
    };

    const handleAddOrder = async (values) => {
        try {
            setLoading(true);
            const newOrder = {
                ...values,
                Status: "New",
                CreatedBy: user.userId,
                orderDetails: selectedBooks
            };
            await onAdd(newOrder);
            form.resetFields();
            setSelectedBooks([]);
            toast.success(`Tạo đơn xuất thành công`, { autoClose: 2000 });
        } catch (error) {
            console.error('Error creating order:', error);
            message.error("Lỗi khi tạo đơn xuất!");
        } finally {
            setLoading(false);
        }
    };

    const handleBookSelect = (bookIds) => {
        const selected = books.filter(book => bookIds.includes(book.BookId));
        const updatedBooks = selected.map(book => {
            const existingBook = selectedBooks.find(b => b.BookId === book.BookId);
            return {
                ...book,
                Quantity: existingBook ? existingBook.Quantity : 0,
                Price: existingBook ? existingBook.Price : book.Price,
            };
        });
        setSelectedBooks(updatedBooks);
    };

    const handleQuantityChange = (bookId, value) => {
        const updatedDetails = selectedBooks.map((book) => {
            if (book.BookId === bookId) {
                return { ...book, Quantity: Number(value) };
            }
            return book;
        });
        setSelectedBooks(updatedDetails);
    };

    const handlePriceChange = (bookId, value) => {
        const updatedDetails = selectedBooks.map((book) => {
            if (book.BookId === bookId) {
                return { ...book, Price: Number(value) };
            }
            return book;
        });
        setSelectedBooks(updatedDetails);
    };

    const columns = [
        {
            title: 'Product',
            dataIndex: 'Title',
        },
        {
            title: 'Quantity',
            dataIndex: 'Quantity',
            render: (_, record) => (
                <Input
                    type="number"
                    min={1}
                    max={record.Quantity}
                    value={record.Quantity || 0}
                    onChange={(e) => handleQuantityChange(record.BookId, e.target.value)}
                    required
                />
            ),
        },
        {
            title: 'Price',
            dataIndex: 'Price',
            render: (_, record) => (
                <Input
                    type="number"
                    min={0}
                    value={record.Price || 0}
                    onChange={(e) => handlePriceChange(record.BookId, e.target.value)}
                    required
                />
            ),
        },
        {
            title: 'Total Price',
            render: (_, record) => (
                <span>{((record.Quantity || 0) * (record.Price || 0)).toLocaleString()} VND</span>
            ),
        },
        {
            title: 'Action',
            render: (_, __, index) => (
                <Button danger onClick={() => {
                    const newBooks = [...selectedBooks];
                    newBooks.splice(index, 1);
                    setSelectedBooks(newBooks);
                }}>
                    Remove
                </Button>
            )
        }
    ];

    return (
        <Modal
            title="Thêm Đơn Xuất"
            open={visible}
            onCancel={onCancel}
            footer={null}
            width={800}
        >
            <Form form={form} layout="vertical" onFinish={handleAddOrder}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Form.Item
                        name="CustomerId"
                        label="Khách hàng"
                        style={{ flex: 1, marginRight: '10px' }}
                        rules={[{ required: true, message: "Vui lòng chọn khách hàng!" }]}
                    >
                        <Select placeholder="Chọn khách hàng">
                            {customers.map((customer) => (
                                <Option key={customer.CustomerId} value={customer.CustomerId}>
                                    {customer.Name}
                                </Option>
                            ))}
                        </Select>
                    </Form.Item>

                    <Form.Item
                        name="ExportDate"
                        label="Ngày xuất"
                        style={{ flex: 1, marginLeft: '10px' }}
                        rules={[{ required: true, message: "Vui lòng nhập ngày xuất!" }]}
                    >
                        <Input type="date" />
                    </Form.Item>
                </div>

                <Form.Item name="Note" label="Ghi chú">
                    <Input.TextArea rows={2} placeholder="Nhập ghi chú nếu có" style={{ resize: 'none' }} />
                </Form.Item>

                <h3>Chi tiết đơn xuất</h3>
                <Table
                    dataSource={selectedBooks}
                    columns={columns}
                    rowKey="BookId"
                    pagination={false}
                />

                <div style={{ marginTop: 20 }}>
                    <strong>Tổng số lượng sách: {selectedBooks.reduce((sum, book) => sum + (book.Quantity || 0), 0)}</strong>
                    <br />
                    <strong>Tổng số tiền: {selectedBooks.reduce((sum, book) => sum + ((book.Price || 0) * (book.Quantity || 0)), 0).toLocaleString()} VND</strong>
                </div>

                <Form.Item label="Chọn sách">
                    <Select
                        mode="multiple"
                        placeholder="Chọn sách"
                        onChange={handleBookSelect}
                        style={{ width: '100%' }}
                    >
                        {books.map((book) => (
                            <Option key={book.BookId} value={book.BookId}>
                                {book.Title} - {book.Author} - {book.Publisher}
                            </Option>
                        ))}
                    </Select>
                </Form.Item>

                <Button type="primary" htmlType="submit" style={{ width: '100%' }}>
                    Lưu
                </Button>
            </Form>
        </Modal>
    );
};

export default AddExportOrderModal;
