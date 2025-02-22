import React, { useEffect, useState } from 'react';
import { Timeline, Spin } from 'antd';
import axios from 'axios';

const VerticalTimeline = ({ orderId, orderStatuses, orderType }) => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [orderStatus, setOrderStatus] = useState('');

    useEffect(() => {
        const fetchOrderDetails = async () => {
            try {
                // Bước 1: Gọi API để lấy thông tin chi tiết của order
                const orderResponse = await axios.get(`http://localhost:9999/api/import-orders/${orderId}`);
                console.log("VerticalTimeline => orderResponse", orderResponse.data);
                console.log("VerticalTimeline => orderResponse.data.Status", orderResponse.data.Status);
                
                // Bước 2: Gọi API để lấy thông tin log theo orderId và trạng thái
                const logsResponse = await axios.get(`http://localhost:9999/api/order-status-logs?orderId=${orderId}&status=${orderResponse.data.Status}&orderType=${orderType}`);
                setLogs(logsResponse.data);
            } catch (error) {
                console.error("Lỗi khi lấy thông tin đơn hàng hoặc logs:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchOrderDetails();
    }, [orderId]);

    if (loading) return <Spin size="large" />; // Hiển thị loading spinner

    // Kết hợp logs với orderStatuses để hiển thị đầy đủ trạng thái
    const combinedLogs = orderStatuses.map(status => {
        const logEntry = logs.find(log => log.Status === status.key) || {};
        return {
            ...status,
            Created_Date: logEntry.Created_Date || '',
            CreatedBy: logEntry.CreatedBy || 'Không có thông tin',
            Note: logEntry.Note || 'Không có ghi chú',
        };
    });

    return (
        <Timeline>
            {combinedLogs.map((log, index) => (
                <Timeline.Item key={index}>
                    <strong>{log.label}</strong>: {/* Hiển thị trạng thái */}
                    <div>
                        <p>Ngày tạo: {log.Created_Date ? new Date(log.Created_Date).toLocaleDateString() : 'Chưa có'}</p>
                        <p>Người tạo: {log.CreatedBy.FullName}</p>
                        <p>Số điện thoại: {log.CreatedBy.PhoneNumber}</p>
                        <p>Ghi chú: {log.Note}</p>
                    </div>
                </Timeline.Item>
            ))}
        </Timeline>
    );
};

export default VerticalTimeline;
