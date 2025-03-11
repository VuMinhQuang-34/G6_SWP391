// src/pages/ApproveExportOrder.js
import React, { useEffect, useState } from 'react';
import { Table, Button, message } from 'antd';
import axios from 'axios';

function ApproveExportOrder() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchApprovalList = async () => {
        try {
            setLoading(true);
            // Lọc những đơn ở status = "ReadyToApprove" hoặc "Confirmed" (tùy quy trình)
            const res = await axios.get('/api/export-orders?status=ReadyToApprove');
            setOrders(res.data.orders || res.data);
        } catch (error) {
            message.error('Không thể tải danh sách cần phê duyệt');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchApprovalList();
    }, []);

    // Phê duyệt
    const handleApprove = async (orderId) => {
        try {
            await axios.patch(`/api/export-orders/${orderId}/status`, {
                status: 'Approved',
                reason: 'Quản lý phê duyệt'
            });
            message.success(`Order #${orderId} đã được phê duyệt!`);
            fetchApprovalList();
        } catch (error) {
            message.error('Phê duyệt thất bại');
        }
    };

    // Từ chối
    const handleReject = async (orderId) => {
        try {
            await axios.patch(`/api/export-orders/${orderId}/status`, {
                status: 'Rejected',
                reason: 'Quản lý từ chối sau kiểm tra'
            });
            message.success(`Order #${orderId} đã bị từ chối!`);
            fetchApprovalList();
        } catch (error) {
            message.error('Từ chối thất bại');
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
                    <Button style={{ marginRight: 8 }} onClick={() => handleApprove(record.ExportOrderId)}>
                        Phê Duyệt
                    </Button>
                    <Button danger onClick={() => handleReject(record.ExportOrderId)}>
                        Từ Chối
                    </Button>
                </>
            )
        }
    ];

    return (
        <div style={{ padding: 20 }}>
            <h2>Phê Duyệt Đơn Hàng</h2>
            <Table
                rowKey="ExportOrderId"
                columns={columns}
                dataSource={orders}
                loading={loading}
            />
        </div>
    );
}

export default ApproveExportOrder;
