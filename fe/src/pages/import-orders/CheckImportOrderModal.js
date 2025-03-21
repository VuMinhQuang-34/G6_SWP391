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
                    Title: book.Title || '',  // Đảm bảo có BookInfo.Title
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
                return { ...book, Quantity: value }; // Cập nhật số lượng
            }
            return book;
        });
        setSelectedBooks(updatedDetails); // Cập nhật lại selectedBooks
    };

    const handleQuantityFaultBooks = (bookId, value) => {
        const updatedDetails = selectedFaultBooks.map((book) => {
            if (book.BookId === bookId) {
                return { ...book, Quantity: value }; // Cập nhật số lượng
            }
            return book;
        });
        setSelectedFaultBooks(updatedDetails); // Cập nhật lại selectedBooks
    };

    const handleChangeNoteFault = (bookId, value) => {
        const updatedDetails = selectedFaultBooks.map((book) => {
            if (book.BookId === bookId) {
                return { ...book, Note: value }; // Cập nhật note
            }
            return book;
        });
        setSelectedFaultBooks(updatedDetails); // Cập nhật lại selectedBooks
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

    //#region Check
    const handleCheck = async () => {
        // Logic for approving the order
        const values = await form.validateFields();

        await onEdit({...order, Status: "Receive", FaultBooks: selectedFaultBooks, LogNote: values.LogNote}, order.ImportOrderId);
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
                </div>
                <Form.Item
                        name="LogNote"
                        label="Ghi chú"
                    >
                        <Input.TextArea rows={2} placeholder="Nhập ghi chú nếu có" style={{ resize: 'none' }} 
                            // onChange={(e) => {
                            //     console.log(logNote);
                                
                            //     setLogNote(e.target.value)
                            // }} 
                        />
                    </Form.Item>

                <div style={{border: '1px solid red', borderRadius: '10px', padding: '10px', margin: '5px 5px'}}>
                    <h3>Xử lý sách lỗi (nếu có)</h3>
                    <Table
                        dataSource={selectedFaultBooks}
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
                                title: 'Số Lượng Sách Lỗi',
                                render: (_, record) => (
                                    <Input
                                        type="number"
                                        min={0} // Cho phép nhập số lượng bất kỳ
                                        value={record.Quantity || 0} // Sử dụng value
                                        onChange={(e) => handleQuantityFaultBooks(record.BookId, e.target.value)}
                                    />
                                ),
                            },
                            {
                                title: 'Ghi chú',
                                render: (_, record) => (
                                    <Input
                                        type="text"
                                        value={record.Note || ""} // Sử dụng value
                                        onChange={(e) => handleChangeNoteFault(record.BookId, e.target.value)}
                                    />
                                ),
                            },
                        ]}
                        rowKey="BookId"
                        pagination={false}
                    />

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

                    

                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '5px' }}>
                    <Button type="default" onClick={handleClose}>
                        Đóng
                    </Button>
                
                    <Button type="primary" onClick={handleCheck} style={{ marginRight: '10px' }}>
                        Gửi yêu cầu phê duyệt
                    </Button>
                </div>
            </Form>
        </Modal>
    );
};

export default CheckImportOrderModal; 