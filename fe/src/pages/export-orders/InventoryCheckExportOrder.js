// src/pages/InventoryCheckExportOrder.js
import React, { useEffect, useState } from 'react';
import { Table, Button, message } from 'antd';
import axios from 'axios';

function InventoryCheckExportOrder() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchConfirmedOrders = async () => {
        try {
            setLoading(true);
            // Lọc đơn hàng "Confirmed"
            const res = await axios.get('/api/export-orders?status=Confirmed');
            setOrders(res.data.orders || res.data);
        } catch (error) {
            message.error('Không thể tải đơn hàng đã xác nhận');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchConfirmedOrders();
    }, []);

    const handleInventoryCheck = async (orderId, isStockOk) => {
        try {
            if (isStockOk) {
                // Chuyển sang "ReadyToApprove" hoặc "Approved" tùy quy trình
                await axios.patch(`/api/export-orders/${orderId}/status`, {
                    status: 'ReadyToApprove',
                    reason: 'Đã kiểm tra kho, đủ hàng'
                });
                message.success(`Order #${orderId} đủ hàng, chờ phê duyệt.`);
            } else {
                // Chuyển sang "Rejected" hoặc "StockIssue"
                await axios.patch(`/api/export-orders/${orderId}/status`, {
                    status: 'Rejected',
                    reason: 'Không đủ tồn kho'
                });
                message.warning(`Order #${orderId} không đủ hàng và đã bị từ chối.`);
            }
            fetchConfirmedOrders();
        } catch (error) {
            message.error('Kiểm tra tồn kho thất bại');
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
            title: 'Ghi Chú',
            dataIndex: 'Note'
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
                        style={{ marginRight: 8 }}
                        onClick={() => handleInventoryCheck(record.ExportOrderId, true)}
                    >
                        Đủ hàng
                    </Button>
                    <Button danger onClick={() => handleInventoryCheck(record.ExportOrderId, false)}>
                        Không đủ
                    </Button>
                </>
            )
        }
    ];

    return (
        <div style={{ padding: 20 }}>
            <h2>Kiểm Tra Tồn Kho (Đơn hàng đã xác nhận)</h2>
            <Table
                rowKey="ExportOrderId"
                columns={columns}
                dataSource={orders}
                loading={loading}
            />
        </div>
    );
}

export default InventoryCheckExportOrder;
