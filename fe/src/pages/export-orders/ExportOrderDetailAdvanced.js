// src/pages/ExportOrderDetailAdvanced.js
import React, { useEffect, useState, useMemo, useCallback, memo, useRef } from 'react';
import {
    Descriptions, Card, Timeline, Button, message, Spin, Modal, Input, Tag, Row, Col, Table,
    Typography, InputNumber, Select, Space
} from 'antd';
import axios from 'axios';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ExclamationCircleOutlined, ArrowLeftOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import moment from 'moment';
import { toast } from 'react-toastify';

const { TextArea } = Input;
const { confirm } = Modal;
const { Title, Text } = Typography;
const { Option } = Select;

// BinSelection component từ CreateExportRequest.js
const BinSelection = React.memo(({ bookId, onSelectBins, totalQuantity, selectedBins = [] }) => {
    const [bins, setBins] = useState([]);
    const [loading, setLoading] = useState(false);
    const [availableBins, setAvailableBins] = useState([]);
    const [selectedBinItems, setSelectedBinItems] = useState([]);
    const [totalSelected, setTotalSelected] = useState(0);
    const [lastUpdated, setLastUpdated] = useState(null);
    const prevBinsRef = useRef(selectedBins);
    const onSelectBinsRef = useRef(onSelectBins);

    // Cập nhật ref khi onSelectBins thay đổi
    useEffect(() => {
        onSelectBinsRef.current = onSelectBins;
    }, [onSelectBins]);

    // Khởi tạo selectedBinItems từ selectedBins ban đầu
    useEffect(() => {
        if (selectedBins && selectedBins.length > 0 &&
            JSON.stringify(selectedBins) !== JSON.stringify(prevBinsRef.current)) {
            // Gộp các bin có cùng binId
            const groupedBins = {};
            selectedBins.forEach(bin => {
                if (!groupedBins[bin.binId]) {
                    groupedBins[bin.binId] = {
                        binId: bin.binId,
                        binName: bin.binName,
                        quantity: 0,
                        maxQuantity: bin.maxQuantity || bin.quantity
                    };
                }
                groupedBins[bin.binId].quantity += bin.quantity;
            });

            setSelectedBinItems(Object.values(groupedBins));
            prevBinsRef.current = selectedBins;
        }
    }, [selectedBins]);

    // Lấy danh sách bin có sẵn khi bookId thay đổi
    useEffect(() => {
        const fetchBins = async () => {
            if (!bookId) return;

            setLoading(true);
            try {
                const response = await axios.get(`http://localhost:9999/api/books/${bookId}/bins`);
                if (response.data.success) {
                    setBins(response.data.data);
                    setAvailableBins(response.data.data);
                }
            } catch (error) {
                message.error('Failed to load bin data');
                console.error('Error fetching bins:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchBins();
    }, [bookId]);

    // Tính toán tổng số lượng đã chọn 
    useEffect(() => {
        const total = selectedBinItems.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
        setTotalSelected(total);

        // Gọi onSelectBins chỉ khi selectedBinItems thay đổi bởi người dùng (thông qua addBin, removeBin, updateQuantity)
        if (lastUpdated) {
            const formattedBins = selectedBinItems.map(item => ({
                binId: item.binId,
                binName: item.binName,
                quantity: Number(item.quantity) || 0,
                maxQuantity: item.maxQuantity
            }));

            // Sử dụng ref để tránh vòng lặp vô hạn
            onSelectBinsRef.current(formattedBins);
        }
    }, [selectedBinItems, lastUpdated]);

    // Add new bin
    const addBin = (binId) => {
        const bin = bins.find(b => b.binId === binId);
        if (!bin) return;

        // Check if adding a new bin would exceed the total requested quantity
        const remainingQuantity = totalQuantity - totalSelected;

        if (remainingQuantity <= 0) {
            message.warning(`Cannot add more bins. Total requested quantity (${totalQuantity}) has already been allocated.`);
            return;
        }

        // Limit the quantity to either remaining quantity or available bin quantity
        const quantity = Math.min(remainingQuantity, bin.availableQuantity);

        const newItem = {
            binId: bin.binId,
            binName: bin.binName,
            quantity: quantity || 0,
            maxQuantity: bin.availableQuantity
        };

        setSelectedBinItems(prev => [...prev, newItem]);
        setLastUpdated('add');
    };

    // Xóa bin
    const removeBin = (index) => {
        setSelectedBinItems(prev => {
            const newItems = [...prev];
            newItems.splice(index, 1);
            return newItems;
        });
        setLastUpdated('remove');
    };

    // Update quantity for bin
    const updateQuantity = (index, quantity) => {
        // Calculate what the new total would be if we apply this change
        const newQuantity = Number(quantity) || 0;
        const currentTotal = selectedBinItems.reduce((sum, item, idx) =>
            sum + (idx === index ? 0 : (Number(item.quantity) || 0)), 0);
        const newTotal = currentTotal + newQuantity;

        // Don't allow the change if it would exceed the total requested quantity
        if (newTotal > totalQuantity) {
            message.warning(`Cannot exceed the requested quantity of ${totalQuantity}`);
            return;
        }

        setSelectedBinItems(prev => {
            const newItems = [...prev];
            newItems[index] = {
                ...newItems[index],
                quantity: Math.min(newQuantity, newItems[index].maxQuantity)
            };
            return newItems;
        });
        setLastUpdated('update');
    };

    // Tính tổng số lượng sách có sẵn trong tất cả các bin
    const totalAvailable = useMemo(() => {
        return bins.reduce((sum, bin) => sum + (Number(bin.availableQuantity) || 0), 0);
    }, [bins]);

    return (
        <div>
            <div style={{ marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span>Total Requested Quantity: <strong>{totalQuantity}</strong></span>
                    <span style={{ color: totalSelected > totalQuantity ? 'red' : 'inherit' }}>
                        Selected: <strong>{totalSelected}</strong> / {totalQuantity}
                    </span>
                </div>

                {totalAvailable < totalQuantity && (
                    <div style={{ color: 'red', marginBottom: 8 }}>
                        Warning: Total available quantity ({totalAvailable}) is less than requested quantity ({totalQuantity})
                    </div>
                )}

                {totalSelected > totalQuantity && (
                    <div style={{ color: 'red', marginBottom: 8, fontWeight: 'bold', backgroundColor: '#ffebee', padding: '4px 8px', borderRadius: '4px' }}>
                        Warning: Total selected quantity ({totalSelected}) exceeds requested quantity ({totalQuantity})
                    </div>
                )}
            </div>

            {selectedBinItems.map((item, index) => (
                <div key={index} style={{ display: 'flex', marginBottom: 8, alignItems: 'center' }}>
                    <div style={{ width: '60%', paddingRight: 8 }}>
                        <Tag color="blue">
                            {item.binName} (Max: {item.maxQuantity})
                        </Tag>
                    </div>
                    <div style={{ width: '30%', paddingRight: 8 }}>
                        <InputNumber
                            style={{ width: '100%' }}
                            min={1}
                            max={item.maxQuantity}
                            value={item.quantity}
                            onChange={(value) => updateQuantity(index, value)}
                            precision={0}
                            parser={(value) => value ? Math.floor(Number(value)) : 0}
                        />
                    </div>
                    <div style={{ width: '10%' }}>
                        <Button
                            type="text"
                            danger
                            icon={<DeleteOutlined />}
                            onClick={() => removeBin(index)}
                        />
                    </div>
                </div>
            ))}

            {/* Dropdown để thêm bin mới */}
            <Select
                style={{ width: '100%', marginTop: 8 }}
                placeholder="Add new bin"
                onChange={addBin}
                loading={loading}
                disabled={loading || totalSelected >= totalQuantity}
                value={null}
            >
                {bins
                    .filter(bin => !selectedBinItems.some(item => item.binId === bin.binId))
                    .map(bin => (
                        <Option
                            key={bin.binId}
                            value={bin.binId}
                            disabled={bin.availableQuantity <= 0}
                        >
                            {bin.binName} ({bin.availableQuantity} available)
                        </Option>
                    ))
                }
            </Select>
        </div>
    );
});

// Tạo BinSelection component với React.memo và tách riêng để tránh re-render không cần thiết
const BinSelectionWrapper = memo(({ bookId, totalQuantity, selectedBins, onSelectBins }) => {
    // Tạo memoized callback để tránh re-render khi parent component re-render
    const handleSelectBins = useCallback((bins) => {
        onSelectBins(bookId, bins);
    }, [bookId, onSelectBins]);

    return (
        <BinSelection
            key={`bin-selection-${bookId}`}
            bookId={bookId}
            onSelectBins={handleSelectBins}
            totalQuantity={totalQuantity || 0}
            selectedBins={selectedBins || []}
        />
    );
});

// Custom status progress component
const StatusProgress = memo(({ status }) => {
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
});

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
        <div style={{ width: '300px' }}>
            <StatusProgress status={Status} />
        </div>
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
const ActionButtons = memo(({ Status, handleDelete, handleUpdateStatus, setStatusModalVisible, onUpdate, hasChanges, showDeleteConfirm }) => (
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
                    <Button danger onClick={showDeleteConfirm}>
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
const ExportOrderDetailAdvanced = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const isEditMode = location.search.includes('mode=edit');

    const [order, setOrder] = useState(null);
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [deleteModalVisible, setDeleteModalVisible] = useState(false);
    const [statusModalVisible, setStatusModalVisible] = useState(false);
    const [reason, setReason] = useState('');
    const [editableDetails, setEditableDetails] = useState([]);
    const [itemBins, setItemBins] = useState({});
    const [hasChanges, setHasChanges] = useState(false);
    const [deletingOrder, setDeletingOrder] = useState(false);

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

            // Nếu thay đổi quantity, cần kiểm tra và xóa bins nếu tổng qty vượt quá
            if (field === 'quantity') {
                const detail = newDetails[index];
                const detailBins = itemBins[detail.productId] || [];

                const totalBinQuantity = detailBins.reduce((sum, bin) => sum + bin.quantity, 0);

                // Nếu quantity mới nhỏ hơn tổng bin hiện tại, reset bins
                if (value < totalBinQuantity) {
                    setItemBins(prev => ({
                        ...prev,
                        [detail.productId]: [] // Reset bins for this product
                    }));
                }
            }

            return newDetails;
        });
        setHasChanges(true);
    }, [itemBins]);

    // Hàm xử lý khi chọn bin cho sản phẩm
    const handleBinSelect = useCallback((productId, bins) => {
        setItemBins(prev => ({
            ...prev,
            [productId]: bins
        }));
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

    // Hàm xử lý xóa đơn hàng
    const handleDelete = useCallback(async () => {
        try {
            console.log('Executing delete for order:', id);
            setDeletingOrder(true);
            message.loading('Deleting order...', 1);

            const response = await axios.delete(`http://localhost:9999/api/export-orders/${id}`);
            console.log('Delete response:', response.data);

            if (response.data.success) {
                message.success('Order deleted successfully');
                toast.success('🗑️ Order deleted successfully');
                navigate('/export-orders');
            } else {
                message.error(response.data.message || 'Failed to delete order');
                toast.error(response.data.message || 'Failed to delete order');
            }
        } catch (error) {
            console.error('Error deleting order:', error);

            if (error.response?.status === 400) {
                message.error('Cannot delete order that is not in New status');
                toast.error('⚠️ Cannot delete order that is not in New status');
            } else if (error.response?.status === 404) {
                message.error('Order not found');
                toast.error('Order not found. It may have been deleted already.');
            } else {
                message.error('Failed to delete order');
                toast.error('Failed to delete order: ' + (error.response?.data?.message || error.message));
            }
        } finally {
            setDeletingOrder(false);
            setDeleteModalVisible(false);
        }
    }, [id, navigate]);

    // Function to show delete confirmation dialog - thay vì dùng Modal.confirm, mở modal riêng
    const showDeleteConfirm = useCallback(() => {
        console.log('Showing delete confirmation modal');
        setDeleteModalVisible(true);
    }, []);

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

            // Log để debug
            console.log('Item bins:', itemBins);
            console.log('Editable details:', editableDetails);

            // Validate bin selections
            for (const item of editableDetails) {
                const bins = itemBins[item.productId] || [];
                console.log(`Bins for product ${item.productId}:`, bins);

                const totalBinQuantity = bins.reduce((sum, bin) => sum + bin.quantity, 0);

                if (bins.length === 0) {
                    toast.error(`Please select at least one bin for "${item.productName}"`);
                    return;
                }

                if (totalBinQuantity !== item.quantity) {
                    toast.error(`Total bin quantity (${totalBinQuantity}) must match requested quantity (${item.quantity}) for "${item.productName}"`);
                    return;
                }
            }

            // Prepare bin allocations for each product
            const items = [];
            editableDetails.forEach(item => {
                const bins = itemBins[item.productId] || [];

                // For each bin allocation, create an item entry
                bins.forEach(bin => {
                    items.push({
                        productId: item.productId,
                        binId: bin.binId,
                        quantity: bin.quantity,
                        price: item.unitPrice,
                        note: item.note || ''
                    });
                });
            });

            console.log('Submitting items:', items);

            // Hiển thị thông báo đang xử lý
            toast.info('Updating export order...');

            const response = await axios.put(`http://localhost:9999/api/export-orders/${id}`, {
                items
            });

            if (response.data.success) {
                toast.success('🎉 Order details updated successfully!');
                setHasChanges(false);
                // Navigate back to view mode
                navigate(`/export-orders/`);
            } else {
                toast.error('Failed to update order details');
            }
        } catch (error) {
            console.error('Error updating order:', error);
            if (error.response?.status === 400) {
                toast.error(error.response.data.message || 'Invalid data provided');
            } else if (error.response?.status === 404) {
                toast.error('Export order not found');
            } else {
                toast.error('Failed to update order details');
            }
        }
    };

    useEffect(() => {
        fetchOrderDetail();
    }, [fetchOrderDetail]);

    useEffect(() => {
        if (order?.items) {
            setEditableDetails(order.items.map(item => ({ ...item })));

            // Initialize bins from order data
            const initialBins = {};

            // Khởi tạo mảng promise để fetch thông tin bin cho từng sản phẩm
            const fetchPromises = [];

            order.items.forEach(item => {
                if (item.bins && item.bins.length > 0) {
                    // Gộp các bin có cùng ID
                    const groupedBins = {};
                    item.bins.forEach(bin => {
                        const binKey = bin.binId;
                        if (!groupedBins[binKey]) {
                            groupedBins[binKey] = {
                                binId: bin.binId,
                                binName: bin.binName,
                                quantity: 0,
                                maxQuantity: bin.quantity // Mặc định là số lượng hiện tại
                            };
                        }
                        groupedBins[binKey].quantity += bin.quantity;
                    });

                    initialBins[item.productId] = Object.values(groupedBins);

                    // Thêm promise để fetch thông tin mới nhất về các bin có sẵn
                    fetchPromises.push(
                        axios.get(`http://localhost:9999/api/books/${item.productId}/bins`)
                            .then(response => {
                                if (response.data.success) {
                                    const availableBins = response.data.data;

                                    // Cập nhật thông tin maxQuantity từ dữ liệu mới nhất
                                    initialBins[item.productId] = initialBins[item.productId].map(selectedBin => {
                                        const matchingBin = availableBins.find(b => b.binId === selectedBin.binId);
                                        if (matchingBin) {
                                            // maxQuantity = số lượng đã chọn + số lượng còn lại trong kho
                                            return {
                                                ...selectedBin,
                                                maxQuantity: selectedBin.quantity + matchingBin.availableQuantity
                                            };
                                        }
                                        return selectedBin;
                                    });
                                }
                            })
                            .catch(error => {
                                console.error(`Error fetching bins for product ${item.productId}:`, error);
                            })
                    );
                }
            });

            // Set giá trị ban đầu trước khi fetch data
            setItemBins(initialBins);

            // Chạy tất cả promise để lấy thông tin cập nhật
            if (fetchPromises.length > 0) {
                Promise.all(fetchPromises)
                    .then(() => {
                        // Sau khi tất cả bin được cập nhật, set lại itemBins
                        setItemBins({ ...initialBins });
                    })
                    .catch(error => {
                        console.error('Error updating bin information:', error);
                    });
            }
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

    const columns = useMemo(() => {
        // Base columns
        const baseColumns = [
            {
                title: 'Book ID',
                dataIndex: 'productId',
                width: 100,
            },
            {
                title: 'Book Title',
                dataIndex: 'productName',
                width: 250,
            }
        ];

        // Additional columns based on mode
        if (Status === 'New' && isEditMode) {
            return [
                ...baseColumns,
                {
                    title: 'Quantity',
                    dataIndex: 'quantity',
                    width: 120,
                    render: (value, record, index) => (
                        <InputNumber
                            min={1}
                            value={value}
                            onChange={(value) => handleDetailChange(index, 'quantity', parseInt(value) || 0)}
                            style={{ width: '100%' }}
                        />
                    )
                },
                {
                    title: 'Unit Price',
                    dataIndex: 'unitPrice',
                    width: 120,
                    render: (value, record, index) => (
                        <InputNumber
                            min={0.01}
                            step={0.01}
                            value={value}
                            onChange={(value) => handleDetailChange(index, 'unitPrice', parseFloat(value) || 0)}
                            style={{ width: '100%' }}
                            prefix="$"
                        />
                    )
                },
                {
                    title: 'Bin Selection',
                    key: 'bins',
                    width: 400,
                    render: (_, record) => (
                        <BinSelectionWrapper
                            bookId={record.productId}
                            totalQuantity={record.quantity || 0}
                            selectedBins={itemBins[record.productId] || []}
                            onSelectBins={handleBinSelect}
                        />
                    )
                },
                {
                    title: 'Note',
                    dataIndex: 'note',
                    render: (value, record, index) => (
                        <Input
                            value={value}
                            onChange={(e) => handleDetailChange(index, 'note', e.target.value)}
                            placeholder="Add note"
                        />
                    )
                },
                {
                    title: 'Total',
                    width: 100,
                    align: 'right',
                    render: (_, record) => (
                        <span style={{ fontWeight: 'bold' }}>
                            ${(record.quantity * Number(record.unitPrice)).toFixed(2)}
                        </span>
                    )
                }
            ];
        } else {
            return [
                ...baseColumns,
                {
                    title: 'Quantity',
                    dataIndex: 'quantity',
                    width: 120,
                    align: 'right',
                },
                {
                    title: 'Unit Price',
                    dataIndex: 'unitPrice',
                    width: 140,
                    align: 'right',
                    render: (value) => `$${Number(value).toFixed(2)}`
                },
                {
                    title: 'Bins',
                    key: 'bins',
                    render: (_, record) => (
                        <div style={{ maxWidth: '300px' }}>
                            {record.bins?.map((bin, idx) => (
                                <Tag key={idx} color="blue" style={{ margin: '2px' }}>
                                    {bin.binName} (Qty: {bin.quantity})
                                </Tag>
                            ))}
                        </div>
                    )
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
                    render: (value) => value || '-'
                }
            ];
        }
    }, [Status, isEditMode, handleDetailChange, handleBinSelect, itemBins]);

    const totalAmount = useMemo(() => {
        if (Status === 'New' && isEditMode) {
            return editableDetails?.reduce((sum, item) =>
                sum + (item.quantity * Number(item.unitPrice)), 0) || 0;
        }
        return ExportOrderDetails?.reduce((sum, item) =>
            sum + (item.quantity * Number(item.unitPrice)), 0) || 0;
    }, [ExportOrderDetails, editableDetails, Status, isEditMode]);

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

    // Header Component
    const Header = (
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
                    Export Order #{ExportOrderId} {isEditMode && <Tag color="blue">Edit Mode</Tag>}
                </span>
            </div>
            <div style={{ width: '300px' }}>
                <StatusProgress status={Status} />
            </div>
        </div>
    );

    return (
        <div style={{ padding: '24px', width: '100%', backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
            {Header}

            <Row gutter={24}>
                <Col span={isEditMode ? 24 : 16}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%' }}>
                        <Row gutter={24}>
                            <Col span={isEditMode ? 12 : 12}>
                                <OrderInfo
                                    CreatedBy={CreatedBy}
                                    Created_Date={Created_Date}
                                    exportDate={exportDate}
                                    Note={Note}
                                />
                            </Col>
                            <Col span={isEditMode ? 12 : 12}>
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
                            style={{ width: '100%' }}
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
                                style={{ marginTop: 16, width: '100%' }}
                                scroll={{ x: isEditMode ? 1200 : 1000 }}
                            />
                        </Card>

                        {Status === 'New' && (
                            <Card bordered={false} style={{ width: '100%' }}>
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'flex-end',
                                    gap: '12px'
                                }}>
                                    {isEditMode ? (
                                        <>
                                            <Button
                                                type="primary"
                                                onClick={handleUpdate}
                                                disabled={!hasChanges}
                                            >
                                                Save Changes
                                            </Button>
                                        </>
                                    ) : (
                                        <>
                                            <Button danger onClick={showDeleteConfirm}>
                                                Delete Order
                                            </Button>
                                        </>
                                    )}
                                </div>
                            </Card>
                        )}
                    </div>
                </Col>

                {!isEditMode && (
                    <Col span={8}>
                        <StatusHistory logs={logs} statusColors={statusColors} />
                    </Col>
                )}
            </Row>

            {/* Delete Confirmation Modal */}
            <Modal
                title="Delete Export Order"
                visible={deleteModalVisible}
                onOk={handleDelete}
                onCancel={() => setDeleteModalVisible(false)}
                okText="Yes, Delete"
                cancelText="No, Cancel"
                okButtonProps={{ danger: true, loading: deletingOrder }}
                closable={!deletingOrder}
                maskClosable={!deletingOrder}
            >
                <div>
                    <ExclamationCircleOutlined style={{ color: '#ff4d4f', fontSize: 24, marginRight: 16 }} />
                    <span style={{ fontSize: 16 }}>
                        Are you sure you want to delete this order? Only orders in "New" status can be deleted.
                    </span>
                </div>
            </Modal>

            {/* Status Modal (original) */}
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
