import React, { useState, useEffect, useContext } from 'react';
import { Modal, Form, Input, Select, Button, Table, message, Col } from 'antd';
import { toast } from "react-toastify";
import { AuthContext } from "../../context/AuthContext";
const { Option } = Select;

const CheckImportOrderModal = ({ visible, onCancel, onEdit, suppliers, books, order }) => {
    console.log(" ApproveImportOrderModal => ", { visible, onCancel, onEdit, suppliers, books, order })
    const { isAuthenticated, user, logout } = useContext(AuthContext);
    const [form] = Form.useForm();
    const [selectedBooks, setSelectedBooks] = useState([]);
    const [selectedFaultBooks, setSelectedFaultBooks] = useState([]);
    const [logNote, setLogNote] = useState('');

    console.log("CheckImportOrderModal books =>", books);
    console.log("CheckImportOrderModal order =>", order);

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
            const existingBook = selectedFaultBooks.find(b => b.BookId === book.BookId);
            return {
                ...book,
                BookInfo: {
                    Title: book.Title || '',  // Ensure BookInfo.Title exists
                    Author: book.Author || '',
                    Publisher: book.Publisher || ''
                },
                Quantity: existingBook ? existingBook.Quantity : 0,
                Price: existingBook ? existingBook.Price : 0,
                Note: existingBook ? existingBook.Note : ""
            };
        });
        setSelectedFaultBooks(updatedBooks);
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

    const handleQuantityFaultBooks = (bookId, value) => {
        const updatedDetails = selectedFaultBooks.map((book) => {
            if (book.BookId === bookId) {
                return { ...book, Quantity: value }; // Update quantity
            }
            return book;
        });
        setSelectedFaultBooks(updatedDetails); // Update selectedBooks
    };

    const handleChangeNoteFault = (bookId, value) => {
        const updatedDetails = selectedFaultBooks.map((book) => {
            if (book.BookId === bookId) {
                return { ...book, Note: value }; // Update note
            }
            return book;
        });
        setSelectedFaultBooks(updatedDetails); // Update selectedBooks
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

    //#region Check
    const handleCheck = async () => {
        // Logic for approving the order
        const values = await form.validateFields();

        await onEdit({ ...order, Status: "Receive", FaultBooks: selectedFaultBooks, LogNote: values.LogNote }, order.ImportOrderId);
        setSelectedFaultBooks([]);

        // Clear specific field
        form.setFieldsValue({
            LogNote: ''
        });
    };


    const handleClose = () => {
        // Logic for rejecting the order
        onCancel(); // Close the modal
    };

    //#region UI
    return (
        <Modal
            title="Approve Import Order"
            open={visible}
            onCancel={onCancel}
            footer={null}
            width={800} // Increase modal width
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

                {/* Display total quantity and amount */}
                <div style={{ marginTop: 20 }}>
                    <strong>Total Book Quantity: {selectedBooks.reduce((sum, book) => sum + (book.Quantity || 0), 0)}</strong>
                    <br />
                </div>
                <Form.Item
                    name="LogNote"
                    label="Note"
                >
                    <Input.TextArea rows={2} placeholder="Enter notes if any" style={{ resize: 'none' }}
                    // onChange={(e) => {
                    //     console.log(logNote);

                    //     setLogNote(e.target.value)
                    // }} 
                    />
                </Form.Item>

                <div style={{ border: '1px solid red', borderRadius: '10px', padding: '10px', margin: '5px 5px' }}>
                    <h3>Handle Defective Books (if any)</h3>
                    <Table
                        dataSource={selectedFaultBooks}
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
                                title: 'Defective Book Quantity',
                                render: (_, record) => (
                                    <Input
                                        type="number"
                                        min={0} // Allow any quantity
                                        value={record.Quantity || 0} // Use value
                                        onChange={(e) => handleQuantityFaultBooks(record.BookId, e.target.value)}
                                    />
                                ),
                            },
                            {
                                title: 'Note',
                                render: (_, record) => (
                                    <Input
                                        type="text"
                                        value={record.Note || ""} // Use value
                                        onChange={(e) => handleChangeNoteFault(record.BookId, e.target.value)}
                                    />
                                ),
                            },
                        ]}
                        rowKey="BookId"
                        pagination={false}
                    />

                    <Form.Item label="Select Books">
                        <Select
                            mode="multiple"
                            placeholder="Select books"
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



                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '5px' }}>
                    <Button type="default" onClick={handleClose}>
                        Close
                    </Button>

                    <Button type="primary" onClick={handleCheck} style={{ marginRight: '10px' }}>
                        Send Approval Request
                    </Button>
                </div>
            </Form>
        </Modal>
    );
};

export default CheckImportOrderModal; 