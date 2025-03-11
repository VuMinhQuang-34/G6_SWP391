// src/pages/ConfirmExportOrder.js
import React, { useEffect, useState } from 'react';
import { Table, Button, message } from 'antd';
import axios from 'axios';

function ConfirmExportOrder() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchNewOrders = async () => {
        try {
            setLoading(true);
            // Lọc đơn hàng có Status = "New"
            const res = await axios.get('/api/export-orders?status=New');
            setOrders(res.data.orders || res.data);
        } catch (error) {
            message.error('Không thể tải danh sách đơn hàng chờ xác nhận');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNewOrders();
    }, []);

    // Xác nhận: chuyển status từ "New" -> "Confirmed"
    const handleConfirm = async (orderId) => {
        try {
            await axios.patch(`/api/export-orders/${orderId}/status`, {
                status: 'Confirmed',
                reason: 'Quản lý xác nhận đơn hàng'
            });
            message.success(`Xác nhận thành công! (Order #${orderId})`);
            fetchNewOrders();
        } catch (error) {
            message.error('Xác nhận thất bại');
        }
    };

    const columns = [
        {
            title: 'Mã Đơn',
            dataIndex: 'ExportOrderId'
        },
        {
            title: 'Người Tạo',
            dataIndex: 'CreatedBy'
        },
        {
            title: 'Ngày Tạo',
            dataIndex: 'Created_Date',
            render: (val) => val ? new Date(val).toLocaleString() : ''
        },
        {
            title: 'Hành Động',
            render: (record) => (
                <>
                    <Button
                        type="link"
                        onClick={() => window.location.href = `/export-orders/${record.ExportOrderId}`}
                    >
                        Xem Chi Tiết
                    </Button>
                    <Button
                        type="primary"
                        onClick={() => handleConfirm(record.ExportOrderId)}
                    >
                        Xác Nhận
                    </Button>
                </>
            )
        }
    ];

    return (
        <div style={{ padding: 20 }}>
            <h2>Quản lý đơn hàng chờ Xác Nhận</h2>
            <Table
                rowKey="ExportOrderId"
                columns={columns}
                dataSource={orders}
                loading={loading}
            />
        </div>
    );
}

export default ConfirmExportOrder;
