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
                Quantity: existingBook ? existingBook.Quantity : 0, // Giữ nguyên số lượng nếu đã có
                Price: existingBook ? existingBook.Price : 0, // Giữ nguyên giá nếu đã có
            };
        });
        setSelectedBooks(updatedBooks);
    };

    const handleQuantityChange = (bookId, value) => {
        const updatedDetails = selectedBooks.map((book) => {
            if (book.BookId === bookId) {
                return { ...book, Quantity: value }; // Cập nhật số lượng
            }
            return book;
        });
        setSelectedBooks(updatedDetails); // Cập nhật lại selectedBooks
    };

    const handlePriceChange = (bookId, value) => {
        const updatedDetails = selectedBooks.map((book) => {
            if (book.BookId === bookId) {
                return { ...book, Price: value }; // Cập nhật đơn giá
            }
            return book;
        });
        setSelectedBooks(updatedDetails); // Cập nhật lại selectedBooks
    };

    //#region Approve
    const handleApprove = async () => {
        // Logic for approving the order
        const formData = await form.getFieldsValue();
        await onEdit({...order, Status: "Approve", LogNote: formData.LogNote}, order.ImportOrderId);
    };

    const handleReject = async () => {
        // Logic for rejecting the order
        const formData = await form.getFieldsValue();
        await onEdit({...order, Status: "New", LogStatus: "Reject", LogNote: formData.LogNote}, order.ImportOrderId);
    };

    const handleClose = () => {
        onCancel(); // Close the modal
    };

    return (
        <Modal
            title="Phê Duyệt Đơn Nhập"
            open={visible}
            onCancel={onCancel}
            footer={null}
            width={800} // Mở rộng chiều rộng của modal
        >
            <Form form={form} layout="vertical">
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Form.Item
                        name="SupplierID"
                        label="Nhà cung cấp"
                        style={{ flex: 1, marginRight: '10px' }}
                        rules={[{ required: true, message: "Vui lòng chọn nhà cung cấp!" }]}
                    >
                        <Select placeholder="Chọn nhà cung cấp" disabled>
                            {suppliers.map((supplier, index) => (
                                <Option key={index} value={supplier}>
                                    {supplier}
                                </Option>
                            ))}
                        </Select>
                    </Form.Item>

                    <Form.Item
                        name="ImportDate"
                        label="Ngày nhập"
                        style={{ flex: 1, marginLeft: '10px' }}
                        rules={[{ required: true, message: "Vui lòng nhập ngày nhập!" }]}
                    >
                        <Input type="date" disabled />
                    </Form.Item>
                </div>

                <Form.Item
                    name="Note"
                    label="Ghi chú"
                >
                    <Input.TextArea rows={2} placeholder="Nhập ghi chú nếu có" style={{ resize: 'none' }} disabled />
                </Form.Item>

                {/* Bảng chi tiết đơn nhập */}
                <h3>Chi tiết đơn nhập</h3>
                <Table
                    dataSource={selectedBooks}
                    columns={[
                        {
                            title: 'ID Sách',
                            dataIndex: 'BookId',
                        },
                        {
                            title: 'Tên Sách',
                            //dataIndex: 'Title',
                            render: (_, record) => (
                                <span>{record.BookInfo ? record.BookInfo.Title : 'Không có thông tin'}</span>
                            ),
                        },
                        {
                            title: 'Số Lượng Nhập',
                            render: (_, record) => (
                                <Input
                                    type="number"
                                    min={0} // Cho phép nhập số lượng bất kỳ
                                    value={record.Quantity || 0} // Sử dụng value
                                    onChange={(e) => handleQuantityChange(record.BookId, e.target.value)}
                                    required
                                    disabled
                                />
                            ),
                        },
                        {
                            title: 'Đơn Giá',
                            render: (_, record) => (
                                <Input
                                    type="number"
                                    min={0} // Cho phép nhập đơn giá bất kỳ
                                    value={record.Price || 0} // Sử dụng value
                                    onChange={(e) => handlePriceChange(record.BookId, e.target.value)}
                                    required
                                    disabled
                                />
                            ),
                        },
                        {
                            title: 'Tổng Giá',
                            render: (_, record) => (
                                <span>{(record.Quantity || 0) * (record.Price || 0)}</span>
                            ),
                        },
                    ]}
                    rowKey="BookId"
                    pagination={false}
                />

                {/* Hiển thị tổng số lượng và tổng số tiền */}
                <div style={{ marginTop: 20 }}>
                    <strong>Tổng số lượng sách: {selectedBooks.reduce((sum, book) => sum + (book.Quantity || 0), 0)}</strong>
                    <br />
                    <strong>Tổng số tiền: {selectedBooks.reduce((sum, book) => sum + (book.Price * (book.Quantity || 0)), 0)}</strong>
                </div>

                <Form.Item label="Chọn sách">
                    <Select
                        mode="multiple"
                        placeholder="Chọn sách"
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
                    label="Ghi chú phê duyệt"
                >
                    <Input.TextArea rows={2} placeholder="Nhập ghi phê duyệt" style={{ resize: 'none' }} />
                </Form.Item>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '5px' }}>
                    <Button type="default" onClick={handleClose}>
                        Đóng
                    </Button>
                    <Button type="default" onClick={handleReject} danger>
                        Từ chối
                    </Button>
                    <Button type="primary" onClick={handleApprove} style={{ marginRight: '10px' }}>
                        Phê duyệt
                    </Button>
                </div>
            </Form>
        </Modal>
    );
};

export default ApproveImportOrderModal; 