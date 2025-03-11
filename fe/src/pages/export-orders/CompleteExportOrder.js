// src/pages/CompleteExportOrder.js
import React, { useEffect, useState } from 'react';
import { Table, Button, message } from 'antd';
import axios from 'axios';

function CompleteExportOrder() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchShippingOrders = async () => {
        try {
            setLoading(true);
            // Lọc đơn "Shipping"
            const res = await axios.get('/api/export-orders?status=Shipping');
            setOrders(res.data.orders || res.data);
        } catch (error) {
            message.error('Không thể tải đơn hàng đang giao');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchShippingOrders();
    }, []);

    const handleComplete = async (orderId) => {
        try {
            await axios.patch(`/api/export-orders/${orderId}/status`, {
                status: 'Completed',
                reason: 'Đã giao hàng thành công'
            });
            message.success(`Order #${orderId} chuyển sang Completed`);
            fetchShippingOrders();
        } catch (error) {
            message.error('Cập nhật trạng thái thất bại');
        }
    };

    const columns = [
        {
            title: 'Mã Đơn',
            dataIndex: 'ExportOrderId'
        },
        {
            title: 'Trạng Thái',
            dataIndex: 'Status'
        },
        {
            title: 'Hành Động',
            render: (record) => (
                <>
                    <Button
                        type="link"
                        onClick={() => window.location.href = `/export-orders/${record.ExportOrderId}`}
                    >
                        Chi Tiết
                    </Button>
                    <Button onClick={() => handleComplete(record.ExportOrderId)}>
                        Hoàn Tất
                    </Button>
                </>
            )
        }
    ];

    return (
        <div style={{ padding: 20 }}>
            <h2>Hoàn Tất Đơn Hàng (Các đơn đang giao)</h2>
            <Table
                rowKey="ExportOrderId"
                columns={columns}
                dataSource={orders}
                loading={loading}
            />
        </div>
    );
}

export default CompleteExportOrder;
