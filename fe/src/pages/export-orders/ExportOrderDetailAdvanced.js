// src/pages/ExportOrderDetailAdvanced.js
import React, { useEffect, useState } from 'react';
import {
    Descriptions, Card, Timeline, List, Button, message, Spin
} from 'antd';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';

function ExportOrderDetailAdvanced() {
    const { id } = useParams(); // :id = ExportOrderId
    const navigate = useNavigate();

    const [order, setOrder] = useState(null);
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchOrderDetail = async () => {
        try {
            setLoading(true);

            // Lấy chi tiết phiếu xuất
            const orderRes = await axios.get(`/api/export-orders/${id}`);
            // Ở backend, code example trả về
            //   ExportOrderId, Status, Reason, Note, ...
            //   ExportOrderDetails: [ { BookId, Quantity, UnitPrice, ... Book {...} } ]
            setOrder(orderRes.data);

            // Lấy lịch sử
            const logsRes = await axios.get(`/api/export-orders/${id}/status-logs`);
            setLogs(logsRes.data);
        } catch (error) {
            message.error('Không thể tải chi tiết phiếu xuất');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrderDetail();
        // eslint-disable-next-line
    }, [id]);

    // Cập nhật trạng thái
    const handleUpdateStatus = async (newStatus) => {
        try {
            await axios.patch(`/api/export-orders/${id}/status`, {
                status: newStatus,
                reason: `Cập nhật sang trạng thái ${newStatus}`
            });
            message.success(`Đã cập nhật trạng thái đơn hàng sang "${newStatus}"`);
            fetchOrderDetail(); // reload detail
        } catch (error) {
            message.error('Cập nhật trạng thái thất bại!');
        }
    };

    if (loading) {
        return (
            <div style={{ padding: 20 }}>
                <Spin tip="Đang tải..." />
            </div>
        );
    }

    if (!order) {
        return (
            <div style={{ padding: 20 }}>
                <p>Phiếu xuất không tồn tại hoặc đã bị xoá.</p>
                <Button onClick={() => navigate(-1)}>Quay lại</Button>
            </div>
        );
    }

    // Gọi tắt cho đỡ dài
    const {
        ExportOrderId,
        Status,
        Reason,
        Note,
        CreatedBy,
        ApprovedBy,
        Created_Date,
        ApprovedDate,
        ExportOrderDetails
    } = order;

    return (
        <div style={{ padding: 20 }}>
            <Button onClick={() => navigate(-1)} style={{ marginBottom: 16 }}>
                Quay lại
            </Button>

            <Card title={`Chi tiết Phiếu Xuất #${ExportOrderId}`}>
                <Descriptions bordered column={1} size="small">
                    <Descriptions.Item label="Mã Phiếu">{ExportOrderId}</Descriptions.Item>
                    <Descriptions.Item label="Trạng Thái">{Status}</Descriptions.Item>
                    <Descriptions.Item label="Người Tạo">
                        {CreatedBy?.FullName || CreatedBy || ''}
                    </Descriptions.Item>
                    <Descriptions.Item label="Người Duyệt">
                        {ApprovedBy?.FullName || ApprovedBy || ''}
                    </Descriptions.Item>
                    <Descriptions.Item label="Ngày Tạo">
                        {Created_Date ? new Date(Created_Date).toLocaleString() : ''}
                    </Descriptions.Item>
                    <Descriptions.Item label="Ngày Duyệt">
                        {ApprovedDate ? new Date(ApprovedDate).toLocaleString() : ''}
                    </Descriptions.Item>
                    <Descriptions.Item label="Ghi Chú">{Note || ''}</Descriptions.Item>
                    <Descriptions.Item label="Lý Do (nếu bị từ chối)">
                        {Reason || ''}
                    </Descriptions.Item>
                </Descriptions>

                {/* Hiển thị chi tiết sản phẩm */}
                <h3 style={{ marginTop: 16 }}>Danh sách sản phẩm</h3>
                <List
                    bordered
                    dataSource={ExportOrderDetails || []}
                    renderItem={(detail) => (
                        <List.Item>
                            <List.Item.Meta
                                title={`Sách #${detail.BookId} - ${detail.Book?.Title || ''}`}
                                description={`
                  Số lượng: ${detail.Quantity},
                  Đơn giá: ${detail.UnitPrice || 0},
                  Note: ${detail.Note || ''}
                `}
                            />
                        </List.Item>
                    )}
                />

                {/* Nút cập nhật trạng thái (tùy Status) */}
                <div style={{ marginTop: 16 }}>
                    {Status === 'New' && (
                        <Button type="primary" onClick={() => handleUpdateStatus('Confirmed')}>
                            Xác Nhận
                        </Button>
                    )}
                    {Status === 'Confirmed' && (
                        <>
                            <Button style={{ marginRight: 8 }} onClick={() => handleUpdateStatus('Approved')}>
                                Phê Duyệt
                            </Button>
                            <Button danger onClick={() => handleUpdateStatus('Rejected')}>
                                Từ Chối
                            </Button>
                        </>
                    )}
                    {Status === 'Approved' && (
                        <>
                            <Button style={{ marginRight: 8 }} onClick={() => handleUpdateStatus('Packing')}>
                                Đóng Gói
                            </Button>
                            <Button style={{ marginRight: 8 }} onClick={() => handleUpdateStatus('Shipping')}>
                                Giao Hàng
                            </Button>
                            <Button type="primary" onClick={() => handleUpdateStatus('Completed')}>
                                Hoàn Tất
                            </Button>
                        </>
                    )}
                    {/* Tuỳ logic, bạn thêm nút cho 'Packing' -> 'Shipping' -> 'Completed'... */}
                </div>

                {/* Hiển thị lịch sử thay đổi trạng thái */}
                <h3 style={{ marginTop: 24 }}>Lịch sử trạng thái</h3>
                <Timeline style={{ marginTop: 16 }}>
                    {logs.map((log) => (
                        <Timeline.Item key={log.LogId}>
                            <p><b>{log.Status}</b> - {new Date(log.Created_Date).toLocaleString()}</p>
                            <p>Người thao tác: {log.User?.FullName || log.CreatedBy}</p>
                            <p>Ghi chú: {log.Note}</p>
                        </Timeline.Item>
                    ))}
                </Timeline>
            </Card>
        </div>
    );
}

export default ExportOrderDetailAdvanced;
