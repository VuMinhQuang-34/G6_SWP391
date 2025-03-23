// src/pages/ApproveExportOrder.js
import React, { useEffect, useState, memo } from 'react';
import { Table, Button, message, Tag, Space, Modal, Descriptions, Card, Row, Col, Select, Input, DatePicker, Tabs, Timeline } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import axios from 'axios';
import moment from 'moment';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer } from 'react-toastify';

const { RangePicker } = DatePicker;
const { Option } = Select;
const { TextArea } = Input;
const { TabPane } = Tabs;

const ActionButtons = memo(({ Status, onApprove, onReject }) => (
    <Card bordered={false}>
        <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px'
        }}>
            {(Status === 'New' || Status === 'Pending') && (
                <>
                    <Button type="primary" onClick={onApprove}>
                        {Status === 'New' ? 'Submit for Approval' : 'Approve Order'}
                    </Button>
                    <Button danger onClick={onReject}>
                        Reject Order
                    </Button>
                </>
            )}
        </div>
    </Card>
));

function ApproveExportOrder() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [detailModalVisible, setDetailModalVisible] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [filters, setFilters] = useState({
        status: '',
        searchId: '',
        dateRange: []
    });
    const [approvalModalVisible, setApprovalModalVisible] = useState(false);
    const [rejectModalVisible, setRejectModalVisible] = useState(false);
    const [reason, setReason] = useState('');
    const [selectedOrderLogs, setSelectedOrderLogs] = useState([]);
    const [activeModalTab, setActiveModalTab] = useState('details');

    const fetchApprovalList = async () => {
        try {
            setLoading(true);
            const params = {
                status: filters.status,
                searchId: filters.searchId,
                fromDate: filters.dateRange[0]?.format('YYYY-MM-DD'),
                toDate: filters.dateRange[1]?.format('YYYY-MM-DD')
            };

            const res = await axios.get('http://localhost:9999/api/export-orders', { params });
            if (res.data.success) {
                setOrders(res.data.data.orders);
            } else {
                toast.error('Failed to load orders');
            }
        } catch (error) {
            toast.error('Failed to load approval list');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchApprovalList();
    }, [filters]);

    const fetchOrderDetail = async (orderId) => {
        try {
            const [orderRes, logsRes] = await Promise.all([
                axios.get(`http://localhost:9999/api/export-orders/${orderId}`),
                axios.get(`http://localhost:9999/api/export-orders/${orderId}/status-logs`)
            ]);
            if (orderRes.data.success) {
                setSelectedOrder(orderRes.data.data);
                setSelectedOrderLogs(logsRes.data?.data || []);
                setDetailModalVisible(true);
            } else {
                toast.error('Failed to load order details');
            }
        } catch (error) {
            toast.error('Failed to load order details');
            console.error(error);
        }
    };

    // Approve order
    const handleApprove = async () => {
        try {
            if (selectedOrder.status !== 'New') {
                toast.error('Only orders in New status can be approved');
                return;
            }

            const currentUser = JSON.parse(localStorage.getItem('user'));
            await axios.patch(`http://localhost:9999/api/export-orders/${selectedOrder.id}/status`, {
                status: 'Pending',
                updatedBy: currentUser.userId,
                reason: reason
            });
            toast.success('Order submitted for approval successfully');
            setApprovalModalVisible(false);
            setReason('');
            fetchApprovalList();
        } catch (error) {
            console.error('Error approving order:', error);
            toast.error(error.response?.data?.message || 'Failed to approve order');
        }
    };

    // Reject order
    const handleReject = async () => {
        try {
            if (selectedOrder.status !== 'New') {
                toast.error('Only orders in New status can be rejected');
                return;
            }

            if (!reason.trim()) {
                toast.error('Please provide a reason for rejection');
                return;
            }

            const currentUser = JSON.parse(localStorage.getItem('user'));
            await axios.patch(`http://localhost:9999/api/export-orders/${selectedOrder.id}/status`, {
                status: 'Rejected',
                updatedBy: currentUser.userId,
                reason: reason
            });
            toast.success('Order rejected successfully');
            setRejectModalVisible(false);
            setReason('');
            fetchApprovalList();
        } catch (error) {
            console.error('Error rejecting order:', error);
            toast.error(error.response?.data?.message || 'Failed to reject order');
        }
    };

    const statusColors = {
        'New': 'blue',
        'Pending': 'orange',
        'Approved': 'green',
        'Rejected': 'red',
        'Cancelled': 'gray',
        'Completed': 'purple'
    };

    const columns = [
        {
            title: 'Order ID',
            dataIndex: 'id',
            key: 'id'
        },
        {
            title: 'Created By',
            dataIndex: 'createdBy',
            key: 'createdBy'
        },
        {
            title: 'Recipient',
            dataIndex: 'recipientName',
            key: 'recipientName'
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status) => (
                <Tag color={statusColors[status]}>
                    {status}
                </Tag>
            )
        },
        {
            title: 'Order Date',
            dataIndex: 'orderDate',
            key: 'orderDate',
            render: (date) => moment(date).format('DD/MM/YYYY HH:mm')
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_, record) => (
                <Space>
                    <Button
                        type="link"
                        onClick={() => fetchOrderDetail(record.id)}
                    >
                        View Details
                    </Button>
                    {record.status === 'New' && (
                        <>
                            <Button
                                type="primary"
                                onClick={() => {
                                    setSelectedOrder(record);
                                    setApprovalModalVisible(true);
                                }}
                            >
                                Submit for Approval
                            </Button>
                            <Button
                                danger
                                onClick={() => {
                                    setSelectedOrder(record);
                                    setRejectModalVisible(true);
                                }}
                            >
                                Reject
                            </Button>
                        </>
                    )}
                </Space>
            )
        }
    ];

    const DetailModal = () => (
        <Modal
            title={`Export Order Details #${selectedOrder?.id}`}
            open={detailModalVisible}
            onCancel={() => {
                setDetailModalVisible(false);
                setActiveModalTab('details');
            }}
            footer={
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                    <Button onClick={() => setDetailModalVisible(false)}>
                        Close
                    </Button>
                    {selectedOrder?.status === 'New' && (
                        <>
                            <Button
                                type="primary"
                                onClick={() => {
                                    setDetailModalVisible(false);
                                    setApprovalModalVisible(true);
                                }}
                            >
                                Submit for Approval
                            </Button>
                            <Button
                                danger
                                onClick={() => {
                                    setDetailModalVisible(false);
                                    setRejectModalVisible(true);
                                }}
                            >
                                Reject
                            </Button>
                        </>
                    )}
                </div>
            }
            width={800}
        >
            {selectedOrder && (
                <Tabs activeKey={activeModalTab} onChange={setActiveModalTab}>
                    <TabPane tab="Order Details" key="details">
                        <Descriptions bordered column={2}>
                            <Descriptions.Item label="Status">
                                <Tag color={statusColors[selectedOrder.status]}>
                                    {selectedOrder.status}
                                </Tag>
                            </Descriptions.Item>
                            <Descriptions.Item label="Created By">
                                {selectedOrder.createdBy}
                            </Descriptions.Item>
                            <Descriptions.Item label="Order Date">
                                {moment(selectedOrder.orderDate).format('DD/MM/YYYY HH:mm')}
                            </Descriptions.Item>
                            <Descriptions.Item label="Export Date">
                                {moment(selectedOrder.exportDate).format('DD/MM/YYYY')}
                            </Descriptions.Item>
                            <Descriptions.Item label="Recipient Name">
                                {selectedOrder.recipientName}
                            </Descriptions.Item>
                            <Descriptions.Item label="Recipient Phone">
                                {selectedOrder.recipientPhone}
                            </Descriptions.Item>
                            <Descriptions.Item label="Shipping Address" span={2}>
                                {selectedOrder.shippingAddress}
                            </Descriptions.Item>
                            <Descriptions.Item label="Note" span={2}>
                                {selectedOrder.note || 'N/A'}
                            </Descriptions.Item>
                        </Descriptions>

                        <h3 style={{ margin: '20px 0 10px' }}>Order Items</h3>
                        <Table
                            dataSource={selectedOrder.items}
                            pagination={false}
                            columns={[
                                {
                                    title: 'Product Name',
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
                                    render: (price) => `$${Number(price).toFixed(2)}`
                                },
                                {
                                    title: 'Total',
                                    key: 'total',
                                    render: (_, record) => `$${(Number(record.quantity) * Number(record.unitPrice)).toFixed(2)}`
                                }
                            ]}
                            summary={(data) => {
                                const total = data.reduce((sum, item) =>
                                    sum + (Number(item.quantity) * Number(item.unitPrice)), 0
                                );
                                return (
                                    <Table.Summary.Row>
                                        <Table.Summary.Cell index={0} colSpan={3}>
                                            <strong>Total Amount</strong>
                                        </Table.Summary.Cell>
                                        <Table.Summary.Cell index={1}>
                                            <strong>${total.toFixed(2)}</strong>
                                        </Table.Summary.Cell>
                                    </Table.Summary.Row>
                                );
                            }}
                        />
                    </TabPane>
                    <TabPane tab="Status History" key="history">
                        <div style={{
                            maxHeight: '400px',
                            overflowY: 'auto',
                            padding: '0 16px'
                        }}>
                            <Timeline style={{ padding: '24px 0' }}>
                                {selectedOrderLogs.map((log) => (
                                    <Timeline.Item
                                        key={log.logId}
                                        color={statusColors[log.status]}
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
                        </div>
                    </TabPane>
                </Tabs>
            )}
        </Modal>
    );

    return (
        <Card title="Export Orders Management">
            {/* Filter Section */}
            <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
                <Col span={6}>
                    <Input
                        placeholder="Search by Order ID"
                        prefix={<SearchOutlined />}
                        value={filters.searchId}
                        onChange={e => setFilters({ ...filters, searchId: e.target.value })}
                    />
                </Col>
                <Col span={6}>
                    <Select
                        style={{ width: '100%' }}
                        placeholder="Filter by Status"
                        value={filters.status}
                        onChange={value => setFilters({ ...filters, status: value })}
                        allowClear
                    >
                        <Option value="New">New</Option>
                        <Option value="Pending">Pending</Option>
                        <Option value="Approved">Approved</Option>
                        <Option value="Rejected">Rejected</Option>
                        <Option value="Cancelled">Cancelled</Option>
                        <Option value="Completed">Completed</Option>
                    </Select>
                </Col>
                <Col span={8}>
                    <RangePicker
                        style={{ width: '100%' }}
                        value={filters.dateRange}
                        onChange={(dates) => setFilters({ ...filters, dateRange: dates })}
                    />
                </Col>
            </Row>

            <Table
                rowKey="id"
                columns={columns}
                dataSource={orders}
                loading={loading}
                pagination={{
                    total: orders.length,
                    pageSize: 10,
                    showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`
                }}
            />
            <DetailModal />

            {/* Approval Modal */}
            <Modal
                title={selectedOrder?.status === 'New' ? 'Submit Export Order for Approval' : 'Approve Export Order'}
                open={approvalModalVisible}
                onOk={handleApprove}
                onCancel={() => {
                    setApprovalModalVisible(false);
                    setReason('');
                }}
                okText={selectedOrder?.status === 'New' ? 'Submit' : 'Approve'}
                cancelText="Cancel"
            >
                <p>
                    {selectedOrder?.status === 'New'
                        ? 'Are you sure you want to submit this export order for approval?'
                        : 'Are you sure you want to approve this export order?'
                    }
                </p>
                <TextArea
                    rows={4}
                    placeholder={selectedOrder?.status === 'New' ? 'Enter submission note (optional)' : 'Enter approval note (optional)'}
                    value={reason}
                    onChange={e => setReason(e.target.value)}
                    style={{ marginTop: 16 }}
                />
            </Modal>

            {/* Reject Modal */}
            <Modal
                title="Reject Export Order"
                open={rejectModalVisible}
                onOk={handleReject}
                onCancel={() => {
                    setRejectModalVisible(false);
                    setReason('');
                }}
                okText="Reject"
                okType="danger"
                cancelText="Cancel"
            >
                <p>Please provide a reason for rejecting this export order:</p>
                <TextArea
                    rows={4}
                    placeholder="Enter rejection reason"
                    value={reason}
                    onChange={e => setReason(e.target.value)}
                    style={{ marginTop: 16 }}
                />
            </Modal>

            <ToastContainer
                position="top-right"
                autoClose={3000}
                hideProgressBar={false}
                newestOnTop
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="light"
            />
        </Card>
    );
}

export default ApproveExportOrder;
