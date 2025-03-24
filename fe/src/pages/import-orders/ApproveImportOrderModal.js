import React, { useState, useEffect, useContext } from 'react';
import { Modal, Form, Input, Select, Button, Table, message } from 'antd';
import { toast } from "react-toastify";
import { AuthContext } from "../../context/AuthContext";
const { Option } = Select;

const ApproveImportOrderModal = ({ visible, onCancel, onEdit, suppliers, books, order }) => {
    console.log(" ApproveImportOrderModal => ", { visible, onCancel, onEdit, suppliers, books, order })
    const { isAuthenticated, user, logout } = useContext(AuthContext);
    const [form] = Form.useForm();
    const [selectedBooks, setSelectedBooks] = useState([]);

    useEffect(() => {
        if (order) {
            form.setFieldsValue({
                SupplierID: order.SupplierID,
                ImportDate: order.ImportDate ? order.ImportDate.split('T')[0] : '',
                Note: order.Note,
            });
            setSelectedBooks(order.details || []);
        }
    }, [order, form, visible]);

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
        const updatedDetails = selectedBooks.map((book) => {
            if (book.BookId === bookId) {
                return { ...book, Quantity: value }; // Update quantity
            }
            return book;
        });
        setSelectedBooks(updatedDetails); // Update selectedBooks
    };

    const handlePriceChange = (bookId, value) => {
        const updatedDetails = selectedBooks.map((book) => {
            if (book.BookId === bookId) {
                return { ...book, Price: value }; // Update price
            }
            return book;
        });
        setSelectedBooks(updatedDetails); // Update selectedBooks
    };

    //#region Approve
    const handleApprove = async () => {
        // Logic for approving the order
        const formData = await form.getFieldsValue();
        await onEdit({ ...order, Status: "Approve", LogNote: formData.LogNote }, order.ImportOrderId);
    };

    const handleReject = async () => {
        // Logic for rejecting the order
        const formData = await form.getFieldsValue();
        await onEdit({ ...order, Status: "New", LogStatus: "Reject", LogNote: formData.LogNote }, order.ImportOrderId);
    };

    const handleClose = () => {
        onCancel(); // Close the modal
    };

    return (
        <Modal
            title="Approve Import Order"
            open={visible}
            onCancel={onCancel}
            footer={null}
            width={800} // Increased modal width
        >
            <Form form={form} layout="vertical">
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Form.Item
                        name="SupplierID"
                        label="Supplier"
                        style={{ flex: 1, marginRight: '10px' }}
                        rules={[{ required: true, message: "Please select a supplier!" }]}
                    >
                        <Select placeholder="Select supplier" disabled>
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
                        <Input type="date" disabled />
                    </Form.Item>
                </div>

                <Form.Item
                    name="Note"
                    label="Note"
                >
                    <Input.TextArea rows={2} placeholder="Enter notes if any" style={{ resize: 'none' }} disabled />
                </Form.Item>

                {/* Import order details table */}
                <h3>Import Order Details</h3>
                <Table
                    dataSource={selectedBooks}
                    columns={[
                        {
                            title: 'Book ID',
                            dataIndex: 'BookId',
                        },
                        {
                            title: 'Book Title',
                            //dataIndex: 'Title',
                            render: (_, record) => (
                                <span>{record.BookInfo ? record.BookInfo.Title : 'No information'}</span>
                            ),
                        },
                        {
                            title: 'Import Quantity',
                            render: (_, record) => (
                                <Input
                                    type="number"
                                    min={0} // Allow any quantity
                                    value={record.Quantity || 0} // Use value
                                    onChange={(e) => handleQuantityChange(record.BookId, e.target.value)}
                                    required
                                    disabled
                                />
                            ),
                        },
                        {
                            title: 'Unit Price',
                            render: (_, record) => (
                                <Input
                                    type="number"
                                    min={0} // Allow any price
                                    value={record.Price || 0} // Use value
                                    onChange={(e) => handlePriceChange(record.BookId, e.target.value)}
                                    required
                                    disabled
                                />
                            ),
                        },
                        {
                            title: 'Total Price',
                            render: (_, record) => (
                                <span>{(record.Quantity || 0) * (record.Price || 0)}</span>
                            ),
                        },
                    ]}
                    rowKey="BookId"
                    pagination={false}
                />

                {/* Display total quantity and total amount */}
                <div style={{ marginTop: 20 }}>
                    <strong>Total Book Quantity: {selectedBooks.reduce((sum, book) => sum + (book.Quantity || 0), 0)}</strong>
                    <br />
                    <strong>Total Amount: {selectedBooks.reduce((sum, book) => sum + (book.Price * (book.Quantity || 0)), 0)}</strong>
                </div>

                <Form.Item label="Select Books">
                    <Select
                        mode="multiple"
                        placeholder="Select books"
                        onChange={handleBookSelect}
                        style={{ width: '100%' }}
                        disabled
                    >
                        {books.map((book) => (
                            <Option key={book.BookId} value={book.BookId}>
                                {book.Title} - {book.Author} - {book.Publisher}
                            </Option>
                        ))}
                    </Select>
                </Form.Item>

                <Form.Item
                    name="LogNote"
                    label="Approval Note"
                >
                    <Input.TextArea rows={2} placeholder="Enter approval note" style={{ resize: 'none' }} />
                </Form.Item>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '5px' }}>
                    <Button type="default" onClick={handleClose}>
                        Close
                    </Button>
                    <Button type="default" onClick={handleReject} danger>
                        Reject
                    </Button>
                    <Button type="primary" onClick={handleApprove} style={{ marginRight: '10px' }}>
                        Approve
                    </Button>
                </div>
            </Form>
        </Modal>
    );
};

export default ApproveImportOrderModal; 