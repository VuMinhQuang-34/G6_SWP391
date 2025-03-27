import React, { useEffect, useState } from 'react';
import { Timeline, Spin, Card } from 'antd';
import axios from 'axios';

const VerticalTimeline = ({ orderId, orderStatuses, orderType }) => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentIndex, setCurrentIndex] = useState(-1);

    useEffect(() => {
        const fetchOrderDetails = async () => {
            setLoading(true);
            try {
                const orderResponse = await axios.get(`http://localhost:9999/api/import-orders/${orderId}`);
                console.log("VerticalTimeline => orderResponse", orderResponse.data);
                
                const currentStatus = orderResponse.data.Status;
                const index = orderStatuses.findIndex(status => status.key === currentStatus);
                setCurrentIndex(index);

                const logsResponse = await axios.get(`http://localhost:9999/api/order-status-logs?orderId=${orderId}&status=${currentStatus}&orderType=${orderType}`);
                setLogs(logsResponse.data);
            } catch (error) {
                console.error("Lỗi khi lấy thông tin đơn hàng hoặc logs:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchOrderDetails();
    }, [orderId, orderType, orderStatuses]);

    if (loading) return <Spin size="large" />;

    return (
        <Card title="Import Order Flow" style={{ borderRadius: '10px', boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)' }}>
            <Timeline>
                {orderStatuses.map((status, index) => (
                    <Timeline.Item key={status.key} color={index === currentIndex ? 'green' : 'gray'}>
                        <strong>{status.label}</strong>:
                        <div>
                            <p>Ngày tạo: {logs.find(log => log.Status === status.key)?.Created_Date ? new Date(logs.find(log => log.Status === status.key).Created_Date).toLocaleDateString() : 'Chưa có'}</p>
                            <p>Người tạo: {logs.find(log => log.Status === status.key)?.CreatedBy.FullName || 'Không có thông tin'}</p>
                            <p>Ghi chú: {logs.find(log => log.Status === status.key)?.Note || 'Không có ghi chú'}</p>
                        </div>
                    </Timeline.Item>
                ))}
            </Timeline>
        </Card>
    );
};

export default VerticalTimeline;
