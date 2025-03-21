// src/pages/ExportOrderDetailAdvanced.js
import React, { useEffect, useState } from 'react';
import {
    Descriptions, Card, Timeline, List, Button, message, Spin, Modal, Input, Space, Tag, Row, Col
} from 'antd';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import moment from 'moment';

const { TextArea } = Input;
const { confirm } = Modal;

function ExportOrderDetailAdvanced() {
    const { id } = useParams(); // :id = ExportOrderId
    const navigate = useNavigate();

    const [order, setOrder] = useState(null);
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [statusModalVisible, setStatusModalVisible] = useState(false);
    const [reason, setReason] = useState('');

    // Status colors and available actions
    const statusColors = {
        'New': 'blue',
        'Pending': 'orange',
        'Approved': 'green',
        'Rejected': 'red',
        'Cancelled': 'gray',
        'Completed': 'purple'
    };

    const statusActions = {
        'New': ['Pending', 'Cancelled'],
        'Pending': ['Approved', 'Rejected'],
        'Approved': ['Completed'],
        'Rejected': [],
        'Cancelled': [],
        'Completed': []
    };

    const fetchOrderDetail = async () => {
        try {
            setLoading(true);

            // Lấy chi tiết phiếu xuất
            const orderRes = await axios.get(`http://localhost:9999/api/export-orders/${id}`);
            // Ở backend, code example trả về
            //   ExportOrderId, Status, Reason, Note, ...
            //   ExportOrderDetails: [ { BookId, Quantity, UnitPrice, ... Book {...} } ]
            setOrder(orderRes.data);

            // Lấy lịch sử
            const logsRes = await axios.get(`http://localhost:9999/api/export-orders/${id}/status-logs`);
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
            await axios.patch(`http://localhost:9999/api/export-orders/${id}/status`, {
                status: newStatus,
                reason: reason
            });
            message.success(`Đã cập nhật trạng thái đơn hàng sang "${newStatus}"`);
            fetchOrderDetail(); // reload detail
            setStatusModalVisible(false);
            setReason('');
        } catch (error) {
            message.error('Cập nhật trạng thái thất bại!');
        }
    };

    // Handle delete order
    const handleDelete = async () => {
        confirm({
            title: 'Delete Order',
            icon: <ExclamationCircleOutlined />,
            content: 'Are you sure you want to delete this order?',
            okText: 'Yes',
            okType: 'danger',
            cancelText: 'No',
            onOk: async () => {
                try {
                    await axios.delete(`http://localhost:9999/api/export-orders/${id}`);
                    message.success('Order deleted successfully');
                    window.location.href = '/export-orders';
                } catch (error) {
                    if (error.response?.status === 400) {
                        message.error('Cannot delete order that is not in New status');
                    } else {
                        message.error('Failed to delete order');
                    }
                }
            }
        });
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
        Reason: orderReason,
        Note,
        CreatedBy,
        ApprovedBy,
        Created_Date,
        ApprovedDate,
        ExportOrderDetails
    } = order;

    const columns = [
        {
            title: 'Product',
            dataIndex: 'productName',
            key: 'productName'
        },
        {
            title: 'Quantity',
            dataIndex: 'quantity',
            key: 'quantity'
        },
        {
            title: 'Unit Price',
            dataIndex: 'unitPrice',
            key: 'unitPrice',
            render: (price) => `$${price.toFixed(2)}`
        },
        {
            title: 'Total',
            key: 'total',
            render: (_, record) => `$${(record.quantity * record.unitPrice).toFixed(2)}`
        },
        {
            title: 'Note',
            dataIndex: 'note',
            key: 'note'
        }
    ];

    return (
        <div style={{ padding: 20 }}>
            <Button onClick={() => navigate(-1)} style={{ marginBottom: 16 }}>
                Quay lại
            </Button>

            <Card title={`Chi tiết Phiếu Xuất #${ExportOrderId}`}>
                <Descriptions bordered column={1} size="small">
                    <Descriptions.Item label="Mã Phiếu">{ExportOrderId}</Descriptions.Item>
                    <Descriptions.Item label="Trạng Thái">
                        <Tag color={statusColors[Status]}>{Status}</Tag>
                    </Descriptions.Item>
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
                        {orderReason || ''}
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
                        <>
                            <Button type="primary" onClick={() => setStatusModalVisible(true)}>
                                Submit for Approval
                            </Button>
                            <Button type="danger" onClick={handleDelete}>
                                Delete Order
                            </Button>
                        </>
                    )}
                    {Status === 'Pending' && (
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
                            <Button style={{ marginRight: 8 }} onClick={() => handleUpdateStatus('Completed')}>
                                Hoàn Tất
                            </Button>
                        </>
                    )}
                    {Status === 'Rejected' && (
                        <Button type="primary" onClick={() => handleUpdateStatus('New')}>
                            Reset to New
                        </Button>
                    )}
                    {Status === 'Cancelled' && (
                        <Button type="primary" onClick={() => handleUpdateStatus('New')}>
                            Reset to New
                        </Button>
                    )}
                    {Status === 'Completed' && (
                        <Button type="primary" onClick={() => handleUpdateStatus('Completed')}>
                            Completed
                        </Button>
                    )}
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

            <Modal
                title="Update Status"
                visible={statusModalVisible}
                onOk={() => handleUpdateStatus(statusActions[Status]?.[0])}
                onCancel={() => {
                    setStatusModalVisible(false);
                    setReason('');
                }}
            >
                <p>Are you sure you want to update the status to {statusActions[Status]?.[0]}?</p>
                <TextArea
                    rows={4}
                    placeholder="Enter reason for status change"
                    value={reason}
                    onChange={e => setReason(e.target.value)}
                />
            </Modal>
        </div>
    );
}

export default ExportOrderDetailAdvanced;
