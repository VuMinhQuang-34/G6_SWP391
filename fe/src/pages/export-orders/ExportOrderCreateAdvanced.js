// src/pages/ExportOrderCreateAdvanced.js
import React, { useState } from 'react';
import {
    Form, Input, InputNumber, Button, message, Card, Space
} from 'antd';
import axios from 'axios';

function ExportOrderCreateAdvanced() {
    const [form] = Form.useForm();
    const [creating, setCreating] = useState(false);

    const handleCreateExportOrder = async (values) => {
        try {
            setCreating(true);
            const { note, items } = values;

            // Chuẩn bị payload theo đúng backend
            const payload = {
                note,
                items: items?.map((it) => ({
                    productId: it.productId,
                    quantity: it.quantity,
                    price: it.price,
                    note: it.note
                }))
            };

            await axios.post('/api/export-orders', payload);

            message.success('Tạo phiếu xuất thành công!');
            form.resetFields();
            // Có thể chuyển hướng về list:
            // window.location.href = '/export-orders';
        } catch (err) {
            message.error('Tạo phiếu xuất thất bại! ' + (err?.response?.data?.message || ''));
        } finally {
            setCreating(false);
        }
    };

    return (
        <div style={{ padding: 20 }}>
            <h2>Tạo Phiếu Xuất (Nhiều Sản Phẩm)</h2>

            <Card>
                <Form
                    form={form}
                    onFinish={handleCreateExportOrder}
                    layout="vertical"
                    initialValues={{ items: [{ productId: '', quantity: 1, price: 0 }] }}
                >
                    <Form.Item name="note" label="Ghi chú">
                        <Input.TextArea rows={2} />
                    </Form.Item>

                    {/* Form.List để thêm/xoá sản phẩm */}
                    <Form.List name="items">
                        {(fields, { add, remove }) => (
                            <div>
                                {fields.map(({ key, name, ...restField }) => (
                                    <Space
                                        key={key}
                                        style={{ display: 'flex', marginBottom: 8 }}
                                        align="baseline"
                                    >
                                        <Form.Item
                                            {...restField}
                                            name={[name, 'productId']}
                                            label="Mã Sản Phẩm"
                                            rules={[{ required: true, message: 'Nhập mã sản phẩm' }]}
                                        >
                                            <Input placeholder="VD: 101" style={{ width: 100 }} />
                                        </Form.Item>

                                        <Form.Item
                                            {...restField}
                                            name={[name, 'quantity']}
                                            label="SL"
                                            rules={[{ required: true, message: 'Nhập số lượng' }]}
                                        >
                                            <InputNumber min={1} style={{ width: 70 }} />
                                        </Form.Item>

                                        <Form.Item
                                            {...restField}
                                            name={[name, 'price']}
                                            label="Giá"
                                            rules={[{ required: true, message: 'Nhập giá xuất' }]}
                                        >
                                            <InputNumber min={0} style={{ width: 100 }} />
                                        </Form.Item>

                                        <Form.Item
                                            {...restField}
                                            name={[name, 'note']}
                                            label="Note"
                                        >
                                            <Input style={{ width: 150 }} placeholder="VD: Hàng khuyến mãi..." />
                                        </Form.Item>

                                        <Button danger onClick={() => remove(name)}>
                                            Xoá
                                        </Button>
                                    </Space>
                                ))}
                                <Button type="dashed" onClick={() => add()}>
                                    + Thêm sản phẩm
                                </Button>
                            </div>
                        )}
                    </Form.List>

                    <Form.Item>
                        <Button
                            type="primary"
                            htmlType="submit"
                            loading={creating}
                            style={{ marginTop: 16 }}
                        >
                            Tạo Phiếu Xuất
                        </Button>
                    </Form.Item>
                </Form>
            </Card>
        </div>
    );
}

export default ExportOrderCreateAdvanced;
