// src/pages/PackingExportOrder.js
import React, { useEffect, useState } from 'react';
import { Table, Button, message } from 'antd';
import axios from 'axios';

function PackingExportOrder() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchApprovedOrders = async () => {
        try {
            setLoading(true);
            // Lọc đơn đã "Approved" và chưa đóng gói
            const res = await axios.get('/api/export-orders?status=Approved');
            setOrders(res.data.orders || res.data);
        } catch (error) {
            message.error('Không thể tải đơn hàng chờ đóng gói');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchApprovedOrders();
    }, []);

    const handlePack = async (orderId) => {
        try {
            // Chuyển sang "Packing"
            await axios.patch(`/api/export-orders/${orderId}/status`, {
                status: 'Packing',
                reason: 'Đang đóng gói hàng'
            });
            message.success(`Order #${orderId} chuyển sang trạng thái Packing`);
            fetchApprovedOrders();
        } catch (error) {
            message.error('Đóng gói thất bại');
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
                        Xem Chi Tiết
                    </Button>
                    <Button onClick={() => handlePack(record.ExportOrderId)}>
                        Đóng Gói
                    </Button>
                </>
            )
        }
    ];

    return (
        <div style={{ padding: 20 }}>
            <h2>Chuẩn Bị Sách (Đóng Gói)</h2>
            <Table
                rowKey="ExportOrderId"
                columns={columns}
                dataSource={orders}
                loading={loading}
            />
        </div>
    );
}

export default PackingExportOrder;
