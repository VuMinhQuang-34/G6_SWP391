// src/pages/ShippingExportOrder.js
import React, { useEffect, useState } from 'react';
import { Table, Button, message } from 'antd';
import axios from 'axios';

function ShippingExportOrder() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchPackingOrders = async () => {
        try {
            setLoading(true);
            // Lọc đơn "Packing"
            const res = await axios.get('/api/export-orders?status=Packing');
            setOrders(res.data.orders || res.data);
        } catch (error) {
            message.error('Không thể tải đơn hàng chờ giao');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPackingOrders();
    }, []);

    const handleShip = async (orderId) => {
        try {
            // Chuyển sang "Shipping"
            await axios.patch(`/api/export-orders/${orderId}/status`, {
                status: 'Shipping',
                reason: 'Bắt đầu giao hàng'
            });
            message.success(`Order #${orderId} chuyển sang trạng thái Shipping`);
            fetchPackingOrders();
        } catch (error) {
            message.error('Chuyển trạng thái thất bại');
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
                    <Button onClick={() => handleShip(record.ExportOrderId)}>
                        Giao Hàng
                    </Button>
                </>
            )
        }
    ];

    return (
        <div style={{ padding: 20 }}>
            <h2>Giao Hàng (Các đơn đã đóng gói)</h2>
            <Table
                rowKey="ExportOrderId"
                columns={columns}
                dataSource={orders}
                loading={loading}
            />
        </div>
    );
}

export default ShippingExportOrder;
