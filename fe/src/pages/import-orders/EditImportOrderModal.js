import React, { useState, useEffect, useContext } from 'react';
import { Modal, Form, Input, Select, Button, Table, message } from 'antd';
import { toast } from "react-toastify";
import { AuthContext } from "../../context/AuthContext";
const { Option } = Select;

const EditImportOrderModal = ({ visible, onCancel, onEdit, suppliers, books, order }) => {
    const { isAuthenticated, user, logout } = useContext(AuthContext);
    const [form] = Form.useForm();
    const [selectedBooks, setSelectedBooks] = useState([]);
    const [selectedBookIds, setSelectedBookIds] = useState([]);

    useEffect(() => {
        if (order) {
            form.setFieldsValue({
                SupplierID: order.SupplierID,
                ImportDate: order.ImportDate ? order.ImportDate.split('T')[0] : '',
                Note: order.Note,
            });

            // Set selected books
            const orderDetails = order.details || [];
            setSelectedBooks(orderDetails);

            // Set selected book IDs for the Select component
            const bookIds = orderDetails.map(book => book.BookId);
            setSelectedBookIds(bookIds);

            // Set the book IDs in the form
            form.setFieldsValue({
                BookIds: bookIds
            });
        }
    }, [order, form, visible]);

    const handleEditOrder = async (values) => {
        try {
            if (selectedBooks.length === 0) {
                toast.error("Please select at least one book!");
                return;
            }

            // Validate quantities and prices
            const invalidBooks = selectedBooks.filter(book =>
                !book.Quantity || book.Quantity <= 0 || !book.Price || book.Price <= 0
            );

            if (invalidBooks.length > 0) {
                toast.error("Please enter valid quantity and price for all books!");
                return;
            }

            const updatedOrder = {
                SupplierID: values.SupplierID,
                ImportDate: values.ImportDate,
                Note: values.Note,
                Status: "New",
                CreatedBy: user.userId,
                orderDetails: selectedBooks.map(book => ({
                    BookId: book.BookId,
                    Quantity: parseInt(book.Quantity),
                    Price: parseFloat(book.Price),
                })),
            };

            await onEdit(updatedOrder, order.ImportOrderId);
            toast.success("Import order updated successfully!");
            onCancel();
        } catch (error) {
            console.error("Error editing import order:", error);
            toast.error("Failed to update import order!");
        }
    };

    const handleBookSelect = (bookIds) => {
        setSelectedBookIds(bookIds);

        // Keep existing books that are still selected
        const existingBooks = selectedBooks.filter(book => bookIds.includes(book.BookId));

        // Add newly selected books
        const newBookIds = bookIds.filter(id => !selectedBooks.find(book => book.BookId === id));
        const newBooks = books
            .filter(book => newBookIds.includes(book.BookId))
            .map(book => ({
                BookId: book.BookId,
                BookInfo: book,
                Quantity: 0,
                Price: 0
            }));

        // Combine existing and new books
        setSelectedBooks([...existingBooks, ...newBooks]);
    };

    const handleQuantityChange = (bookId, value) => {
        const quantity = parseInt(value) || 0;
        setSelectedBooks(prev =>
            prev.map(book =>
                book.BookId === bookId
                    ? { ...book, Quantity: quantity }
                    : book
            )
        );
    };

    const handlePriceChange = (bookId, value) => {
        const price = parseFloat(value) || 0;
        setSelectedBooks(prev =>
            prev.map(book =>
                book.BookId === bookId
                    ? { ...book, Price: price }
                    : book
            )
        );
    };

    // Calculate totals
    const totalQuantity = selectedBooks.reduce((sum, book) => sum + (parseInt(book.Quantity) || 0), 0);
    const totalAmount = selectedBooks.reduce((sum, book) => sum + ((parseFloat(book.Price) || 0) * (parseInt(book.Quantity) || 0)), 0);

    return (
        <Modal
            title="Edit Import Order"
            open={visible}
            onCancel={onCancel}
            footer={[
                <Button key="cancel" onClick={onCancel}>
                    Cancel
                </Button>,
                <Button key="submit" type="primary" onClick={() => form.submit()}>
                    Save Changes
                </Button>
            ]}
            width={800}
        >
            <Form form={form} layout="vertical" onFinish={handleEditOrder}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '20px' }}>
                    <Form.Item
                        name="SupplierID"
                        label="Supplier"
                        style={{ flex: 1 }}
                        rules={[{ required: true, message: "Please select a supplier!" }]}
                    >
                        <Select placeholder="Select supplier">
                            {suppliers.map((supplier) => (
                                <Option key={supplier} value={supplier}>
                                    {supplier}
                                </Option>
                            ))}
                        </Select>
                    </Form.Item>

                    <Form.Item
                        name="ImportDate"
                        label="Import Date"
                        style={{ flex: 1 }}
                        rules={[{ required: true, message: "Please enter import date!" }]}
                    >
                        <Input type="date" />
                    </Form.Item>
                </div>

                <Form.Item
                    name="BookIds"
                    label="Select Books"
                    rules={[{ required: true, message: "Please select at least one book!" }]}
                >
                    <Select
                        mode="multiple"
                        placeholder="Select books to import"
                        value={selectedBookIds}
                        onChange={handleBookSelect}
                        style={{ width: '100%' }}
                        optionFilterProp="children"
                        showSearch
                    >
                        {books.map((book) => (
                            <Option key={book.BookId} value={book.BookId}>
                                {book.Title} - {book.Author}
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
                            width: '100px'
                        },
                        {
                            title: 'Book Title',
                            render: (_, record) => (
                                <span>{record.BookInfo ? record.BookInfo.Title : 'No information'}</span>
                            ),
                            width: '300px'
                        },
                        {
                            title: 'Quantity',
                            width: '150px',
                            render: (_, record) => (
                                <Input
                                    type="number"
                                    min={1}
                                    value={record.Quantity}
                                    onChange={(e) => handleQuantityChange(record.BookId, e.target.value)}
                                    style={{ width: '100%' }}
                                />
                            ),
                        },
                        {
                            title: 'Unit Price',
                            width: '150px',
                            render: (_, record) => (
                                <Input
                                    type="number"
                                    min={0}
                                    step="0.01"
                                    value={record.Price}
                                    onChange={(e) => handlePriceChange(record.BookId, e.target.value)}
                                    style={{ width: '100%' }}
                                />
                            ),
                        },
                        {
                            title: 'Total',
                            width: '150px',
                            render: (_, record) => (
                                <span>
                                    {((parseFloat(record.Price) || 0) * (parseInt(record.Quantity) || 0)).toFixed(2)}
                                </span>
                            ),
                        },
                    ]}
                    rowKey="BookId"
                    pagination={false}
                    size="middle"
                />

                <div style={{
                    marginTop: 16,
                    padding: '16px',
                    background: '#f5f5f5',
                    borderRadius: '4px',
                    display: 'flex',
                    justifyContent: 'space-between'
                }}>
                    <span>
                        <strong>Total Quantity:</strong> {totalQuantity}
                    </span>
                    <span>
                        <strong>Total Amount:</strong> {totalAmount.toFixed(2)}
                    </span>
                </div>

                <Form.Item
                    name="Note"
                    label="Note"
                    style={{ marginTop: 16 }}
                >
                    <Input.TextArea
                        rows={3}
                        placeholder="Enter notes if any"
                        style={{ resize: 'none' }}
                    />
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default EditImportOrderModal; 