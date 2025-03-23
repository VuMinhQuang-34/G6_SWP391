// src/pages/ExportOrderDetailAdvanced.js
import React, { useEffect, useState, useMemo, useCallback, memo } from 'react';
import {
    Descriptions, Card, Timeline, Button, message, Spin, Modal, Input, Tag, Row, Col, Table
} from 'antd';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { ExclamationCircleOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import moment from 'moment';
import { toast } from 'react-toastify';

const { TextArea } = Input;
const { confirm } = Modal;

// Memoized Header Component
const Header = memo(({ ExportOrderId, Status, statusColors, navigate }) => (
    <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
        backgroundColor: 'white',
        padding: '16px 24px',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <Button
                onClick={() => navigate(-1)}
                icon={<ArrowLeftOutlined />}
            >
                Back to List
            </Button>
            <span style={{ fontSize: '20px', fontWeight: 'bold' }}>
                Export Order #{ExportOrderId}
            </span>
        </div>
        <Tag style={{
            fontSize: '16px',
            padding: '8px 16px',
            borderRadius: '6px'
        }} color={statusColors[Status]}>
            {Status}
        </Tag>
    </div>
));

// Memoized Order Information Component
const OrderInfo = memo(({ CreatedBy, Created_Date, exportDate, Note }) => (
    <Card
        title={<span style={{ fontSize: '16px' }}>Order Information</span>}
        style={{ height: '100%' }}
        bordered={false}
    >
        <Descriptions column={1}>
            <Descriptions.Item label="Created By">{CreatedBy}</Descriptions.Item>
            <Descriptions.Item label="Created Date">
                {Created_Date ? moment(Created_Date).format('DD/MM/YYYY HH:mm:ss') : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="Export Date">
                {exportDate ? moment(exportDate).format('DD/MM/YYYY') : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="Note">{Note || '-'}</Descriptions.Item>
        </Descriptions>
    </Card>
));

// Memoized Recipient Information Component
const RecipientInfo = memo(({ recipientName, recipientPhone, shippingAddress }) => (
    <Card
        title={<span style={{ fontSize: '16px' }}>Recipient Information</span>}
        style={{ height: '100%' }}
        bordered={false}
    >
        <Descriptions column={1}>
            <Descriptions.Item label="Name">{recipientName}</Descriptions.Item>
            <Descriptions.Item label="Phone">{recipientPhone}</Descriptions.Item>
            <Descriptions.Item label="Address">{shippingAddress}</Descriptions.Item>
        </Descriptions>
    </Card>
));

// Memoized Action Buttons Component
const ActionButtons = memo(({ Status, handleDelete, handleUpdateStatus, setStatusModalVisible, onUpdate, hasChanges }) => (
    <Card bordered={false}>
        <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px'
        }}>
            {Status === 'New' && (
                <>
                    {hasChanges && (
                        <Button type="primary" onClick={onUpdate}>
                            Update Order
                        </Button>
                    )}
                    <Button danger onClick={handleDelete}>
                        Delete Order
                    </Button>
                </>
            )}
        </div>
    </Card>
));

// Memoized Status History Component
const StatusHistory = memo(({ logs, statusColors }) => (
    <Card
        title={<span style={{ fontSize: '16px' }}>Status History</span>}
        bordered={false}
        bodyStyle={{
            padding: '0 24px',
            maxHeight: 'calc(100vh - 200px)',
            overflowY: 'auto'
        }}
    >
        <Timeline style={{ padding: '24px 0' }}>
            {logs.map((log) => (
                <Timeline.Item
                    key={log.logId}
                    color={statusColors[log.status]}
                    dot={
                        <div style={{
                            backgroundColor: statusColors[log.status],
                            borderRadius: '50%',
                            width: '10px',
                            height: '10px'
                        }} />
                    }
                >
                    <Card
                        size="small"
                        style={{
                            marginBottom: 16,
                            borderRadius: '8px',
                            backgroundColor: '#fafafa'
                        }}
                    >
                        <div style={{ fontSize: '14px' }}>
                            <div style={{
                                fontWeight: 'bold',
                                color: statusColors[log.status]
                            }}>
                                {log.status}
                            </div>
                            <div style={{
                                color: '#666',
                                fontSize: '12px',
                                margin: '4px 0'
                            }}>
                                {moment(log.createdDate).format('DD/MM/YYYY HH:mm:ss')}
                            </div>
                            <div>Updated by: {log.createdBy}</div>
                            {log.note && (
                                <div style={{
                                    marginTop: 8,
                                    padding: '8px',
                                    backgroundColor: '#f0f0f0',
                                    borderRadius: '4px',
                                    fontSize: '12px'
                                }}>
                                    {log.note}
                                </div>
                            )}
                        </div>
                    </Card>
                </Timeline.Item>
            ))}
        </Timeline>
    </Card>
));

// Main Component
function ExportOrderDetailAdvanced() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [order, setOrder] = useState(null);
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [statusModalVisible, setStatusModalVisible] = useState(false);
    const [reason, setReason] = useState('');
    const [editableDetails, setEditableDetails] = useState([]);
    const [hasChanges, setHasChanges] = useState(false);
    const location = window.location;
    const isEditMode = location.search.includes('mode=edit');

    const statusColors = useMemo(() => ({
        'New': 'blue',
        'Pending': 'orange',
        'Approved': 'green',
        'Rejected': 'red',
        'Cancelled': 'gray',
        'Completed': 'purple'
    }), []);

    const statusActions = useMemo(() => ({
        'New': ['Pending', 'Cancelled'],
        'Pending': ['Approved', 'Rejected'],
        'Approved': ['Completed'],
        'Rejected': [],
        'Cancelled': [],
        'Completed': []
    }), []);

    const fetchOrderDetail = useCallback(async () => {
        try {
            setLoading(true);
            const [orderRes, logsRes] = await Promise.all([
                axios.get(`http://localhost:9999/api/export-orders/${id}`),
                axios.get(`http://localhost:9999/api/export-orders/${id}/status-logs`)
            ]);
            setOrder(orderRes.data.data);
            setLogs(logsRes.data?.data || []);
        } catch (error) {
            console.error('Error:', error);
            message.error('Cannot load export order details');
            setLogs([]);
        } finally {
            setLoading(false);
        }
    }, [id]);

    const handleDetailChange = useCallback((index, field, value) => {
        setEditableDetails(prevDetails => {
            const newDetails = [...prevDetails];
            newDetails[index] = {
                ...newDetails[index],
                [field]: value
            };
            return newDetails;
        });
        setHasChanges(true);
    }, []);

    const handleUpdateStatus = useCallback(async (newStatus) => {
        try {
            await axios.patch(`http://localhost:9999/api/export-orders/${id}/status`, {
                status: newStatus,
                reason: reason
            });
            toast.success(`✨ Status updated to "${newStatus}" successfully`);
            fetchOrderDetail();
            setStatusModalVisible(false);
            setReason('');
        } catch (error) {
            toast.error('Failed to update status');
        }
    }, [id, reason, fetchOrderDetail]);

    // const handleDelete = useCallback(() => {
    //     confirm({
    //         title: 'Delete Order',
    //         icon: <ExclamationCircleOutlined />,
    //         content: 'Are you sure you want to delete this order?',
    //         okText: 'Yes',
    //         okType: 'danger',
    //         cancelText: 'No',
    //         onOk: async () => {
    //             try {
    //                 await axios.delete(`http://localhost:9999/api/export-orders/${id}`);
    //                 toast.success('🗑️ Order deleted successfully');
    //                 navigate('/export-orders');
    //             } catch (error) {
    //                 toast.error(error.response?.status === 400
    //                     ? 'Cannot delete order that is not in New status'
    //                     : 'Failed to delete order'
    //                 );
    //             }
    //         }
    //     });
    // }, [id, navigate]);
    // const handleDelete = async () => {
    //     try {
    //         await axios.delete(`http://localhost:9999/api/export-orders/${id}`);
    //         message.success('Order deleted successfully');
    //         window.location.href = '/export-orders';
    //     } catch (error) {
    //         if (error.response?.status === 400) {
    //             message.error('Cannot delete order that is not in New status');
    //         } else {
    //             message.error('Failed to delete order');
    //         }
    //     }
    // };
    const handleUpdate = async () => {
        try {
            // Validate items before sending
            const invalidItems = editableDetails.filter(
                item => !item.quantity || item.quantity <= 0 || !item.unitPrice || item.unitPrice <= 0
            );

            if (invalidItems.length > 0) {
                toast.error('Please check quantities and prices. They must be greater than 0.');
                return;
            }

            // Format items for API request
            const formattedItems = editableDetails.map(item => ({
                productId: item.productId,
                quantity: parseInt(item.quantity),
                unitPrice: parseFloat(item.unitPrice),
                note: item.note || ''
            }));

            const response = await axios.put(`http://localhost:9999/api/export-orders/${id}`, {
                items: formattedItems
            });

            if (response.data.success) {
                toast.success('🎉 Order details updated successfully!');
                setHasChanges(false);
                fetchOrderDetail();
            } else {
                toast.error('Failed to update order details');
            }
        } catch (error) {
            if (error.response?.status === 400) {
                toast.error(error.response.data.message || 'Invalid data provided');
            } else if (error.response?.status === 404) {
                toast.error('Export order not found');
            } else {
                toast.error('Failed to update order details');
                console.error('Error updating order:', error);
            }
        }
    };

    useEffect(() => {
        fetchOrderDetail();
    }, [fetchOrderDetail]);

    useEffect(() => {
        if (order?.items) {
            setEditableDetails(order.items.map(item => ({ ...item })));
        }
    }, [order]);

    const {
        id: ExportOrderId,
        status: Status,
        note: Note,
        createdBy: CreatedBy,
        orderDate: Created_Date,
        exportDate,
        recipientName,
        recipientPhone,
        shippingAddress,
        items: ExportOrderDetails
    } = order || {};

    const columns = useMemo(() => [
        {
            title: 'Book ID',
            dataIndex: 'productId',
            width: 100,
        },
        {
            title: 'Book Title',
            dataIndex: 'productName',
        },
        {
            title: 'Quantity',
            dataIndex: 'quantity',
            width: 120,
            align: 'right',
            render: (value, record, index) =>
                Status === 'New' ? (
                    <Input
                        type="number"
                        min={1}
                        value={value}
                        onChange={(e) => handleDetailChange(index, 'quantity', parseInt(e.target.value) || 0)}
                        style={{
                            width: '100px',
                            textAlign: 'right',
                            border: 'none',
                            borderBottom: '1px solid #d9d9d9',
                            borderRadius: 0,
                            padding: '4px'
                        }}
                        onFocus={(e) => e.target.select()}
                    />
                ) : value
        },
        {
            title: 'Unit Price',
            dataIndex: 'unitPrice',
            width: 140,
            align: 'right',
            render: (value, record, index) =>
                Status === 'New' && isEditMode ? (
                    <Input
                        type="number"
                        min={0}
                        step={0.01}
                        value={value}
                        onChange={(e) => handleDetailChange(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                        style={{
                            width: '120px',
                            textAlign: 'right',
                            border: 'none',
                            borderBottom: '1px solid #d9d9d9',
                            borderRadius: 0,
                            padding: '4px'
                        }}
                        onFocus={(e) => e.target.select()}
                        prefix="$"
                    />
                ) : `$${Number(value).toFixed(2)}`
        },
        {
            title: 'Total',
            width: 140,
            align: 'right',
            render: (_, record) => (
                <span style={{ fontWeight: 'bold' }}>
                    ${(record.quantity * Number(record.unitPrice)).toFixed(2)}
                </span>
            )
        },
        {
            title: 'Note',
            dataIndex: 'note',
            render: (value, record, index) =>
                Status === 'New' ? (
                    <Input
                        value={value}
                        onChange={(e) => handleDetailChange(index, 'note', e.target.value)}
                        style={{
                            border: 'none',
                            borderBottom: '1px solid #d9d9d9',
                            borderRadius: 0,
                            padding: '4px'
                        }}
                        placeholder="Enter note"
                    />
                ) : value || '-'
        }
    ], [Status, handleDetailChange]);

    const totalAmount = useMemo(() =>
        ExportOrderDetails?.reduce((sum, item) =>
            sum + (item.quantity * Number(item.unitPrice)), 0) || 0,
        [ExportOrderDetails]
    );

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
                <Spin tip="Loading..." />
            </div>
        );
    }

    if (!order) {
        return (
            <div style={{ padding: 20 }}>
                <p>Export order does not exist or has been deleted.</p>
                <Button onClick={() => navigate(-1)}>Back</Button>
            </div>
        );
    }

    return (
        <div style={{ padding: '24px', width: '100%', backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
            <Header
                ExportOrderId={ExportOrderId}
                Status={Status}
                statusColors={statusColors}
                navigate={navigate}
            />

            <Row gutter={24}>
                <Col span={16}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        <Row gutter={24}>
                            <Col span={12}>
                                <OrderInfo
                                    CreatedBy={CreatedBy}
                                    Created_Date={Created_Date}
                                    exportDate={exportDate}
                                    Note={Note}
                                />
                            </Col>
                            <Col span={12}>
                                <RecipientInfo
                                    recipientName={recipientName}
                                    recipientPhone={recipientPhone}
                                    shippingAddress={shippingAddress}
                                />
                            </Col>
                        </Row>

                        <Card
                            title={<span style={{ fontSize: '16px' }}>Product List</span>}
                            bordered={false}
                            extra={
                                <div style={{ fontWeight: 'bold', fontSize: '16px', color: '#1890ff' }}>
                                    Total: ${totalAmount.toFixed(2)}
                                </div>
                            }
                        >
                            <Table
                                dataSource={Status === 'New' && isEditMode ? editableDetails : ExportOrderDetails || []}
                                columns={columns}
                                pagination={false}
                                rowKey="productId"
                                style={{ marginTop: 16 }}
                            />
                        </Card>

                        <ActionButtons
                            Status={Status}
                            handleDelete={handleDelete}
                            handleUpdateStatus={handleUpdateStatus}
                            setStatusModalVisible={setStatusModalVisible}
                            onUpdate={handleUpdate}
                            hasChanges={hasChanges}
                        />
                    </div>
                </Col>

                <Col span={8}>
                    <StatusHistory logs={logs} statusColors={statusColors} />
                </Col>
            </Row>

            <Modal
                title="Delete Order"
                visible={statusModalVisible}
                onOk={() => handleDelete()}
                onCancel={() => {
                    setStatusModalVisible(false);
                    setReason('');
                }}
                okText="Confirm"
                cancelText="Cancel"
            >
                <p>Are you sure you want to delete this order?</p>
                <TextArea
                    rows={4}
                    placeholder="Enter reason for deletion"
                    value={reason}
                    onChange={e => setReason(e.target.value)}
                    style={{ marginTop: 16 }}
                />
            </Modal>
        </div>
    );
}

export default memo(ExportOrderDetailAdvanced);
