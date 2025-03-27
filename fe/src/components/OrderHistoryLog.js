import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Typography, Spin, message, Timeline, List, Divider} from 'antd';
import axios from 'axios';

const { Title } = Typography;

const OrderHistoryLog = ({ orderId, orderType }) => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchOrderDetails = async () => {
            setLoading(true);
            try {
                // Bước 1: Gọi API để lấy thông tin chi tiết của order
                const orderResponse = await axios.get(`http://localhost:9999/api/import-orders/${orderId}`);
                console.log("OrderHistoryLog => orderResponse", orderResponse.data);
                
                // Bước 2: Gọi API để lấy thông tin log theo orderId và trạng thái
                const logsResponse = await axios.get(`http://localhost:9999/api/order-status-logs?orderId=${orderId}&orderType=${orderType}`);
                console.log(`http://localhost:9999/api/order-status-logs?orderId=${orderId}&orderType=${orderType}`);
                
                setLogs(logsResponse.data);
            } catch (error) {
                console.error("Lỗi khi lấy thông tin đơn hàng hoặc logs:", error);
                message.error("Lỗi khi tải lịch sử đơn hàng!");
            } finally {
                setLoading(false);
            }
        };

        if (orderId) {
            fetchOrderDetails();
        }
    }, [orderId, orderType]);

    if (loading) {
        return <Spin size="large" />;
    }

    return (
        <div style={{ padding: '20px', background: '#fff', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' }}>
            <Title level={4}>Status Order History</Title>
            <Timeline>
                {logs.map((item, index) => (
                    <Timeline.Item key={index} color={item.Status == 'Approve' ? 'green' : item.Status == 'Reject' ? 'red' : 'blue'}>
                        <p><strong>Trạng Thái: {item.Status}</strong></p>
                        <p>Người Tạo: {item.CreatedBy.FullName}</p>
                        <p>Ngày Tạo: {new Date(item.Created_Date).toLocaleString()}</p>
                        <p>Ghi Chú: {item.Note || ""}</p>
                    </Timeline.Item>
                ))}
            </Timeline>
        </div>
    );
};

export default OrderHistoryLog;