import React, { useState, useContext } from 'react';
import { Modal, Form, Input, Select, Button, Table, message } from 'antd';
import { AuthContext } from "../../context/AuthContext";
import { toast } from "react-toastify";
const { Option } = Select;

const AddImportOrderModal = ({ visible, onCancel, onAdd, suppliers, books }) => {
    const { isAuthenticated, user, logout } = useContext(AuthContext);
    const [form] = Form.useForm();
    const [selectedBooks, setSelectedBooks] = useState([]);
    const [searchText, setSearchText] = useState('');

    // Function to filter books based on search text
    const filterBooks = (input, option) => {
        const bookTitle = option?.children?.toLowerCase() || '';
        const searchLower = input.toLowerCase();
        return bookTitle.includes(searchLower) ||
            bookTitle.split(' ').some(word => word.startsWith(searchLower));
    };

    const handleAddOrder = async (values) => {
        try {
            const newOrder = { ...values, Status: "New", CreatedBy: user.userId, orderDetails: selectedBooks };
            await onAdd(newOrder); // Call onAdd function from props
            form.resetFields(); // Reset form after adding
            setSelectedBooks([]); // Reset selected books list
            toast.success(`Order created successfully`, { autoClose: 2000 });
        } catch (error) {
            message.error("Error creating import order!");
        }
    };

    const handleBookSelect = (bookIds) => {
        const selected = books.filter(book => bookIds.includes(book.BookId));
        const updatedBooks = selected.map(book => {
            const existingBook = selectedBooks.find(b => b.BookId === book.BookId);
            return {
                ...book,
                Quantity: existingBook ? existingBook.Quantity : 0, // Keep existing quantity if available
                Price: existingBook ? existingBook.Price : 0, // Keep existing price if available
            };
        });
        setSelectedBooks(updatedBooks);
    };

    const handleQuantityChange = (bookId, value) => {
        // Remove any non-digit characters
        const cleanValue = value.replace(/[^\d]/g, '');
        const updatedDetails = selectedBooks.map((book) => {
            if (book.BookId === bookId) {
                return { ...book, Quantity: cleanValue }; // Keep as string to preserve leading zeros
            }
            return book;
        });
        setSelectedBooks(updatedDetails);
    };

    const handlePriceChange = (bookId, value) => {
        // Remove any non-digit characters
        const cleanValue = value.replace(/[^\d]/g, '');
        const updatedDetails = selectedBooks.map((book) => {
            if (book.BookId === bookId) {
                return { ...book, Price: cleanValue }; // Keep as string to preserve leading zeros
            }
            return book;
        });
        setSelectedBooks(updatedDetails);
    };

    // Calculate total quantity and amount
    const totalQuantity = selectedBooks.reduce((sum, book) => sum + (parseInt(book.Quantity) || 0), 0);
    const totalAmount = selectedBooks.reduce((sum, book) => sum + ((parseInt(book.Quantity) || 0) * (parseInt(book.Price) || 0)), 0);

    return (
        <Modal
            title="Add Import Order"
            open={visible}
            onCancel={onCancel}
            footer={null}
            width={800}
        >
            <Form form={form} layout="vertical" onFinish={handleAddOrder}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Form.Item
                        name="SupplierID"
                        label="Supplier"
                        style={{ flex: 1, marginRight: '10px' }}
                        rules={[{ required: true, message: "Please select a supplier!" }]}
                    >
                        <Select placeholder="Select supplier">
                            {suppliers.map((supplier, index) => (
                                <Option key={index} value={supplier}>
                                    {supplier}
                                </Option>
                            ))}
                        </Select>
                    </Form.Item>

                    <Form.Item
                        name="ImportDate"
                        label="Import Date"
                        style={{ flex: 1, marginLeft: '10px' }}
                        rules={[{ required: true, message: "Please enter import date!" }]}
                    >
                        <Input type="date" />
                    </Form.Item>
                </div>

                <Form.Item
                    name="Note"
                    label="Note"
                >
                    <Input.TextArea rows={2} placeholder="Enter notes if any" style={{ resize: 'none' }} />
                </Form.Item>

                <Form.Item label="Select Books">
                    <Select
                        mode="multiple"
                        placeholder="Search and select books"
                        onChange={handleBookSelect}
                        style={{ width: '100%' }}
                        showSearch
                        filterOption={filterBooks}
                        maxTagCount={3}
                        maxTagTextLength={20}
                        optionFilterProp="children"
                        optionLabelProp="label"
                    >
                        {books.map((book) => (
                            <Option
                                key={book.BookId}
                                value={book.BookId}
                                label={`${book.Title}`}
                            >
                                {`${book.Title} - ${book.Author} - ${book.Publisher} (ID: ${book.BookId})`}
                            </Option>
                        ))}
                    </Select>
                </Form.Item>

                <Table
                    dataSource={selectedBooks}
                    columns={[
                        {
                            title: 'Book ID',
                            dataIndex: 'BookId',
                        },
                        {
                            title: 'Book Title',
                            dataIndex: 'Title',
                        },
                        {
                            title: 'Import Quantity',
                            render: (_, record) => (
                                <Input
                                    type="text"
                                    pattern="[0-9]*"
                                    value={record.Quantity || ''}
                                    onChange={(e) => handleQuantityChange(record.BookId, e.target.value)}
                                    required
                                    maxLength={10}
                                />
                            ),
                        },
                        {
                            title: 'Unit Price',
                            render: (_, record) => (
                                <Input
                                    type="text"
                                    pattern="[0-9]*"
                                    value={record.Price || ''}
                                    onChange={(e) => handlePriceChange(record.BookId, e.target.value)}
                                    required
                                    maxLength={10}
                                />
                            ),
                        },
                        {
                            title: 'Total Price',
                            render: (_, record) => {
                                const quantity = parseInt(record.Quantity) || 0;
                                const price = parseInt(record.Price) || 0;
                                return <span>{quantity * price}</span>;
                            },
                        },
                    ]}
                    rowKey="BookId"
                    pagination={false}
                />

                <div style={{ marginTop: 20 }}>
                    <strong>Total Book Quantity: {totalQuantity}</strong>
                    <br />
                    <strong>Total Amount: {totalAmount} VND</strong>
                </div>

                <Button type="primary" htmlType="submit" style={{ width: '100%' }}>
                    Save
                </Button>
            </Form>
        </Modal>
    );
};

export default AddImportOrderModal;