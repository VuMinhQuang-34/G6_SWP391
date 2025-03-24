// src/pages/ApproveExportOrder.js
import React, { useEffect, useState, memo } from 'react';
import { Table, Button, message, Tag, Space, Modal, Descriptions, Card, Row, Col, Select, Input, DatePicker, Tabs, Timeline, Steps, Title, Text } from 'antd';
import { SearchOutlined, CheckCircleOutlined, CloseCircleOutlined, EyeOutlined, HistoryOutlined } from '@ant-design/icons';
import axios from 'axios';
import moment from 'moment';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer } from 'react-toastify';

const { RangePicker } = DatePicker;
const { Option } = Select;
const { TextArea } = Input;
const { TabPane } = Tabs;
const { Step } = Steps;

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

// Custom status progress component
const StatusProgress = ({ status }) => {
    if (status === 'Rejected' || status === 'Cancelled') {
        return (
            <Tag color={status === 'Rejected' ? '#f5222d' : '#8c8c8c'} style={{ padding: '4px 8px' }}>
                {status}
            </Tag>
        );
    }

    const statusFlow = ['New', 'Pending', 'Approved', 'Shipping', 'Completed'];
    const currentIndex = statusFlow.indexOf(status);

    const stepColors = {
        'New': '#1890ff',
        'Pending': '#fa8c16',
        'Approved': '#52c41a',
        'Shipping': '#722ed1',
        'Completed': '#13c2c2'
    };

    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            {statusFlow.map((step, index) => {
                // Determine the status of this step
                let stepStatus = 'wait';
                if (index < currentIndex) stepStatus = 'finish';
                if (index === currentIndex) stepStatus = 'process';

                // Determine the color based on status
                let color = '#d9d9d9'; // wait color
                if (stepStatus === 'finish') color = '#52c41a';
                if (stepStatus === 'process') color = stepColors[step];

                return (
                    <div key={step} style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        width: '20%'
                    }}>
                        <div style={{
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            backgroundColor: color,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#fff',
                            fontSize: '12px',
                            marginBottom: '4px'
                        }}>
                            {index + 1}
                        </div>
                        <div style={{
                            fontSize: '11px',
                            color: stepStatus === 'process' ? color : 'rgba(0,0,0,0.65)',
                            fontWeight: stepStatus === 'process' ? 'bold' : 'normal',
                            textAlign: 'center'
                        }}>
                            {step}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

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

    // Status flow configuration
    const statusFlow = ['New', 'Pending', 'Approved', 'Shipping', 'Completed'];

    // Status color configuration
    const stepColors = {
        'New': '#1890ff',
        'Pending': '#fa8c16',
        'Approved': '#52c41a',
        'Shipping': '#722ed1',
        'Completed': '#13c2c2',
        'Rejected': '#f5222d',
        'Cancelled': '#8c8c8c'
    };

    // Status abbreviations for display on small screens
    const statusAbbr = {
        'New': 'New',
        'Pending': 'Pend',
        'Approved': 'Appr',
        'Shipping': 'Ship',
        'Completed': 'Done'
    };

    const getStatusStepIndex = (status) => {
        if (status === 'Rejected' || status === 'Cancelled') {
            return -1; // Special case for rejected/cancelled
        }
        return statusFlow.indexOf(status);
    };

    const getStepStatus = (orderStatus, stepStatus) => {
        if (orderStatus === 'Rejected' || orderStatus === 'Cancelled') {
            return 'error'; // All steps show error for rejected/cancelled orders
        }

        const orderIndex = getStatusStepIndex(orderStatus);
        const stepIndex = getStatusStepIndex(stepStatus);

        if (orderIndex === stepIndex) return 'process';
        if (orderIndex > stepIndex) return 'finish';
        return 'wait';
    };

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

    const columns = [
        {
            title: 'Order ID',
            dataIndex: 'id',
            key: 'id'
        },
        {
            title: 'Created By',
            dataIndex: 'createdBy',
            key: 'createdBy',
            responsive: ['md']
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
            width: 300,
            render: (status) => <StatusProgress status={status} />
        },
        {
            title: 'Order Date',
            dataIndex: 'orderDate',
            key: 'orderDate',
            render: (date) => moment(date).format('DD/MM/YYYY HH:mm'),
            responsive: ['lg']
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_, record) => (
                <Space wrap>
                    <Button
                        type="primary"
                        icon={<EyeOutlined />}
                        onClick={() => fetchOrderDetail(record.id)}
                    >
                        View Details
                    </Button>
                    {record.status === 'New' && (
                        <>
                            <Button
                                type="primary"
                                style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
                                icon={<CheckCircleOutlined />}
                                onClick={() => {
                                    setSelectedOrder(record);
                                    setApprovalModalVisible(true);
                                }}
                            >
                                Submit for Approval
                            </Button>
                            <Button
                                danger
                                icon={<CloseCircleOutlined />}
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
            title={
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span>Export Order #{selectedOrder?.id}</span>
                    {selectedOrder?.status && (
                        <Tag color={stepColors[selectedOrder.status]} style={{ marginLeft: 'auto', padding: '2px 8px' }}>
                            {selectedOrder.status}
                        </Tag>
                    )}
                </div>
            }
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
                                style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
                                icon={<CheckCircleOutlined />}
                                onClick={() => {
                                    setDetailModalVisible(false);
                                    setApprovalModalVisible(true);
                                }}
                            >
                                Submit for Approval
                            </Button>
                            <Button
                                danger
                                icon={<CloseCircleOutlined />}
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
                        <div style={{ marginBottom: 20 }}>
                            <div style={{ fontWeight: 'bold', marginBottom: 10 }}>Order Status:</div>
                            <StatusProgress status={selectedOrder.status} />
                        </div>

                        <Descriptions bordered column={{ xxl: 2, xl: 2, lg: 2, md: 2, sm: 1, xs: 1 }} style={{ marginTop: 20 }}>
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
                            size="small"
                            scroll={{ x: 'max-content' }}
                            columns={[
                                {
                                    title: 'Product Name',
                                    dataIndex: 'productName',
                                    key: 'productName'
                                },
                                {
                                    title: 'Quantity',
                                    dataIndex: 'quantity',
                                    key: 'quantity',
                                    align: 'right',
                                    width: 100
                                },
                                {
                                    title: 'Unit Price',
                                    dataIndex: 'unitPrice',
                                    key: 'unitPrice',
                                    align: 'right',
                                    width: 120,
                                    render: (price) => `$${Number(price).toFixed(2)}`
                                },
                                {
                                    title: 'Total',
                                    key: 'total',
                                    align: 'right',
                                    width: 120,
                                    render: (_, record) => `$${(Number(record.quantity) * Number(record.unitPrice)).toFixed(2)}`
                                }
                            ]}
                            summary={(data) => {
                                const total = data.reduce((sum, item) =>
                                    sum + (Number(item.quantity) * Number(item.unitPrice)), 0
                                );
                                return (
                                    <Table.Summary.Row>
                                        <Table.Summary.Cell index={0} colSpan={3} align="right">
                                            <strong>Total Amount</strong>
                                        </Table.Summary.Cell>
                                        <Table.Summary.Cell index={1} align="right">
                                            <strong>${total.toFixed(2)}</strong>
                                        </Table.Summary.Cell>
                                    </Table.Summary.Row>
                                );
                            }}
                        />
                    </TabPane>
                    <TabPane
                        tab={
                            <span>
                                <HistoryOutlined /> Status History
                            </span>
                        }
                        key="history"
                    >
                        <div style={{
                            maxHeight: '400px',
                            overflowY: 'auto',
                            padding: '0 16px'
                        }}>
                            <Timeline style={{ padding: '24px 0' }}>
                                {selectedOrderLogs.map((log) => (
                                    <Timeline.Item
                                        key={log.logId}
                                        color={stepColors[log.status]}
                                    >
                                        <Card
                                            size="small"
                                            style={{
                                                marginBottom: 16,
                                                borderRadius: '8px',
                                                boxShadow: '0 2px 8px rgba(0,0,0,0.09)'
                                            }}
                                        >
                                            <div style={{ fontSize: '14px' }}>
                                                <div style={{
                                                    fontWeight: 'bold',
                                                    color: stepColors[log.status]
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
                                                        backgroundColor: '#f5f5f5',
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
        <Card
            title={<h2 style={{ margin: 0, fontSize: '18px' }}>Export Orders Management</h2>}
            bordered={false}
            style={{ borderRadius: '8px', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}
        >
            {/* Filter Section */}
            <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
                <Col xs={24} sm={24} md={8} lg={6}>
                    <Input
                        placeholder="Search by Order ID"
                        prefix={<SearchOutlined />}
                        value={filters.searchId}
                        onChange={e => setFilters({ ...filters, searchId: e.target.value })}
                        style={{ width: '100%' }}
                    />
                </Col>
                <Col xs={24} sm={12} md={8} lg={6}>
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
                <Col xs={24} sm={12} md={8} lg={8}>
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
                    showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
                    showSizeChanger: true
                }}
                scroll={{ x: 'max-content' }}
            />
            <DetailModal />

            {/* Approval Modal */}
            <Modal
                title={
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} />
                        {selectedOrder?.status === 'New' ? 'Submit Export Order for Approval' : 'Approve Export Order'}
                    </div>
                }
                open={approvalModalVisible}
                onOk={handleApprove}
                onCancel={() => {
                    setApprovalModalVisible(false);
                    setReason('');
                }}
                okText={selectedOrder?.status === 'New' ? 'Submit' : 'Approve'}
                okButtonProps={{ style: { backgroundColor: '#52c41a', borderColor: '#52c41a' } }}
                cancelText="Cancel"
            >
                <div style={{ backgroundColor: '#f6ffed', padding: 12, borderRadius: 6, marginBottom: 16 }}>
                    <p style={{ margin: 0 }}>
                        {selectedOrder?.status === 'New'
                            ? 'Are you sure you want to submit this export order for approval?'
                            : 'Are you sure you want to approve this export order?'
                        }
                    </p>
                </div>
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
                title={
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <CloseCircleOutlined style={{ color: '#f5222d', marginRight: 8 }} />
                        Reject Export Order
                    </div>
                }
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
                <div style={{ backgroundColor: '#fff1f0', padding: 12, borderRadius: 6, marginBottom: 16 }}>
                    <p style={{ margin: 0 }}>Please provide a reason for rejecting this export order:</p>
                </div>
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
