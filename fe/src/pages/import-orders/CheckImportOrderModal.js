import React, { useState, useEffect, useContext } from 'react';
import { Modal, Form, Input, Select, Button, Table, message, Col } from 'antd';
import { toast } from "react-toastify";
import { AuthContext } from "../../context/AuthContext";
const { Option } = Select;

const CheckImportOrderModal = ({ visible, onCancel, onEdit, suppliers, books, order }) => {
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

    //#region Check
    const handleCheck = async () => {
        const values = await form.validateFields();
        await onEdit({
            ...order,
            Status: "Receive",
            LogNote: values.LogNote
        }, order.ImportOrderId);

        form.setFieldsValue({
            LogNote: ''
        });
    };

    const handleClose = () => {
        onCancel();
    };

    return (
        <Modal
            title="Check Import Order"
            open={visible}
            onCancel={onCancel}
            footer={[
                <Button key="close" onClick={handleClose}>
                    Close
                </Button>,
                <Button key="check" type="primary" onClick={handleCheck}>
                    Confirm Check
                </Button>
            ]}
            width={800}
        >
            <Form form={form} layout="vertical">
                <Table
                    dataSource={selectedBooks}
                    columns={[
                        {
                            title: 'Book ID',
                            dataIndex: 'BookId',
                        },
                        {
                            title: 'Book Title',
                            render: (_, record) => (
                                <span>{record.BookInfo ? record.BookInfo.Title : 'No information'}</span>
                            ),
                        },
                        {
                            title: 'Import Quantity',
                            render: (_, record) => (
                                <Input
                                    type="number"
                                    min={0}
                                    value={record.Quantity || 0}
                                    disabled
                                />
                            ),
                        },
                        {
                            title: 'Unit Price',
                            render: (_, record) => (
                                <Input
                                    type="number"
                                    min={0}
                                    value={record.Price || 0}
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

                <div style={{ marginTop: 20 }}>
                    <strong>Total Book Quantity: {selectedBooks.reduce((sum, book) => sum + (parseInt(book.Quantity) || 0), 0)}</strong>
                    <br />
                </div>

                <Form.Item
                    name="LogNote"
                    label="Note"
                >
                    <Input.TextArea rows={2} placeholder="Enter notes if any" style={{ resize: 'none' }} />
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default CheckImportOrderModal; 