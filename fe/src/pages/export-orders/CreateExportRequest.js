import React, { useState, useEffect, useContext, useMemo, useCallback, memo, useRef } from 'react';
import {
    Card, Form, Input, Button, Table, InputNumber, Tag,
    message, Select, Space, Modal, Row, Col, DatePicker, Steps, Typography
} from 'antd';
import { PlusOutlined, DeleteOutlined, EyeOutlined, SearchOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { AuthContext } from "../../context/AuthContext";
import { toast } from "react-toastify";
import axios from 'axios';
import moment from 'moment';

const { TextArea } = Input;
const { Option } = Select;
const { RangePicker } = DatePicker;
const { Step } = Steps;
const { Title, Text } = Typography;

// Component chọn bin cho sản phẩm
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
            setSelectedBinItems(selectedBins);
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

// Tối ưu StatusProgress component bằng memo
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

// Bọc InputNumber lại để tránh render lại không cần thiết
const StableInputNumber = memo(({ value, onChange, ...restProps }) => {
    // Sử dụng useRef để lưu trữ giá trị callback và tránh re-render không cần thiết
    const handleChange = useCallback((newValue) => {
        if (newValue !== value) {
            onChange(newValue);
        }
    }, [value, onChange]);

    return <InputNumber value={value} onChange={handleChange} {...restProps} />;
});

// Bọc Input lại để tránh render lại không cần thiết
const StableInput = memo(({ value, onChange, ...restProps }) => {
    // Sử dụng callback để tránh re-render không cần thiết
    const handleChange = useCallback((e) => {
        if (e.target.value !== value) {
            onChange(e);
        }
    }, [value, onChange]);

    return <Input value={value} onChange={handleChange} {...restProps} />;
});

const CreateExportRequest = () => {
    const { user } = useContext(AuthContext);
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [products, setProducts] = useState([]);
    const [selectedItems, setSelectedItems] = useState([]);
    const [createModalVisible, setCreateModalVisible] = useState(false);
    const [deleteModalVisible, setDeleteModalVisible] = useState(false);
    const [orderToDelete, setOrderToDelete] = useState(null);
    const [deletingOrder, setDeletingOrder] = useState(false);
    const [orders, setOrders] = useState([]);
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 10,
        total: 0
    });
    const [filters, setFilters] = useState({
        status: '',
        searchId: '',
        dateRange: []
    });

    // Status colors for different states
    const statusColors = {
        'New': '#1890ff',
        'Pending': '#fa8c16',
        'Approved': '#52c41a',
        'Shipping': '#722ed1',
        'Completed': '#13c2c2',
        'Rejected': 'red',
        'Cancelled': 'gray'
    };

    const statusFlow = ['New', 'Pending', 'Approved', 'Shipping', 'Completed'];

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

    // Fetch orders from API
    const fetchOrders = async () => {
        try {
            setLoading(true);
            const { current, pageSize } = pagination;
            const { status, searchId, dateRange } = filters;

            const params = {
                page: current,
                limit: pageSize,
                status: status || undefined,
                searchId: searchId || undefined,
                fromDate: dateRange?.[0]?.format('YYYY-MM-DD'),
                toDate: dateRange?.[1]?.format('YYYY-MM-DD')
            };

            const response = await axios.get('http://localhost:9999/api/export-orders', { params });
            console.log('Export orders response:', response.data);

            if (response.data.success) {
                setOrders(response.data.data.orders);
                setPagination({
                    ...pagination,
                    total: response.data.data.total,
                    current: response.data.data.currentPage
                });
            } else {
                message.error(response.data.message || 'Failed to fetch orders');
            }
        } catch (error) {
            console.error('Error fetching orders:', error);
            message.error('Failed to fetch orders: ' + (error.response?.data?.message || error.message));
        } finally {
            setLoading(false);
        }
    };

    // Fetch products with inventory information
    const fetchProducts = async () => {
        try {
            setLoading(true);
            const response = await axios.get('http://localhost:9999/api/books');
            if (response.data.success) {
                setProducts(response.data.data.map(book => ({
                    BookId: book.BookId,
                    Title: book.Title,
                    Author: book.Author,
                    Publisher: book.Publisher,
                    Category: book.Category?.CategoryName,
                    Language: book.Language,
                    Status: book.Status,
                    Price: 0, // Tạm thời set giá = 0, cần bổ sung field Price vào API
                    StockQuantity: 0 // Tạm thời set số lượng = 0, cần bổ sung field StockQuantity vào API
                })));
            }
        } catch (error) {
            message.error('Failed to fetch books');
            console.error('Error fetching books:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
        fetchProducts();
    }, [pagination.current, pagination.pageSize, filters]);

    // Handle delete order
    const handleDelete = useCallback(async (orderId) => {
        try {
            console.log('Executing delete for order:', orderId);
            setDeletingOrder(true);
            message.loading('Deleting order...', 1);

            const response = await axios.delete(`http://localhost:9999/api/export-orders/${orderId}`);
            console.log('Delete response:', response.data);

            if (response.data.success) {
                message.success(response.data.message || 'Order deleted successfully');
                toast.success('🗑️ ' + (response.data.message || 'Order deleted successfully'));
                fetchOrders();
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
                message.error('Order not found. It may have been deleted already.');
                toast.error('Order not found. It may have been deleted already.');
            } else {
                message.error('Failed to delete order: ' + (error.response?.data?.message || error.message));
                toast.error('Failed to delete order: ' + (error.response?.data?.message || error.message));
            }
        } finally {
            setDeletingOrder(false);
            setDeleteModalVisible(false);
            setOrderToDelete(null);
        }
    }, [fetchOrders]);

    // Mở modal xác nhận xóa
    const showDeleteConfirm = useCallback((id) => {
        console.log('Showing delete confirmation for order:', id);
        setOrderToDelete(id);
        setDeleteModalVisible(true);
    }, []);

    // Handle book selection
    const handleBookSelect = useCallback(async (bookIds) => {
        if (!bookIds || bookIds.length === 0) {
            setSelectedItems([]);
            return;
        }

        try {
            setLoading(true);
            // Lọc những sách mới được chọn (chưa có trong selectedItems)
            const existingBookIds = selectedItems.map(item => item.BookId);
            const newBookIds = bookIds.filter(id => !existingBookIds.includes(id));

            // Giữ lại những sách đã chọn trước đó và còn nằm trong danh sách hiện tại
            const remainingItems = selectedItems.filter(item => bookIds.includes(item.BookId));

            // Nếu không có sách mới, chỉ cần cập nhật danh sách đã chọn
            if (newBookIds.length === 0) {
                setSelectedItems(remainingItems);
                setLoading(false);
                return;
            }

            // Lấy thông tin sách từ danh sách products
            const newBooks = products.filter(book => newBookIds.includes(book.BookId));

            // Lấy thông tin stock cho các sách mới
            const stockPromises = newBooks.map(book =>
                axios.get(`http://localhost:9999/api/stocks/${book.BookId}`)
                    .then(response => {
                        const stockResponse = response.data;
                        // Kiểm tra response thành công và lấy số lượng từ data
                        const stockQuantity = stockResponse.code === 200 ? stockResponse.data[0].quantity : 0;

                        return {
                            ...book,
                            StockQuantity: stockQuantity,
                            Quantity: 1,
                            Note: '',
                            SelectedBins: []
                        };
                    })
                    .catch(error => {
                        console.error(`Error fetching stock for book ${book.BookId}:`, error);
                        return {
                            ...book,
                            StockQuantity: 0,
                            Quantity: 1,
                            Note: '',
                            SelectedBins: []
                        };
                    })
            );

            const newBookItems = await Promise.all(stockPromises);
            setSelectedItems([...remainingItems, ...newBookItems]);
        } catch (error) {
            message.error('Failed to fetch stock information');
            console.error('Error fetching stock information:', error);
        } finally {
            setLoading(false);
        }
    }, [products, selectedItems]);

    // Handle bin selection - updated to support multiple bins
    const handleBinSelect = useCallback((bookId, binItems) => {
        setSelectedItems(prev =>
            prev.map(item => {
                if (item.BookId === bookId) {
                    return { ...item, SelectedBins: binItems };
                }
                return item;
            })
        );
    }, []);

    // Handle quantity change
    const handleQuantityChange = useCallback((bookId, value) => {
        // Đảm bảo giá trị là số
        const numericValue = Number(value) || 0;

        setSelectedItems(prev => {
            return prev.map(item => {
                if (item.BookId === bookId) {
                    // Nếu số lượng mới khác số lượng cũ, cần xử lý SelectedBins
                    if (numericValue !== item.Quantity) {
                        // Nếu số lượng mới = 0, xóa tất cả bins
                        if (numericValue === 0) {
                            return {
                                ...item,
                                Quantity: numericValue,
                                SelectedBins: []
                            };
                        }

                        // Nếu số lượng mới < tổng số lượng đã chọn trong các bin,
                        // cần điều chỉnh lại các bin để tổng khớp với số lượng mới
                        const currentBins = item.SelectedBins || [];
                        const totalSelectedInBins = currentBins.reduce((sum, bin) => sum + (Number(bin.quantity) || 0), 0);

                        if (numericValue < totalSelectedInBins) {
                            return {
                                ...item,
                                Quantity: numericValue,
                                SelectedBins: [] // Reset bins để người dùng chọn lại
                            };
                        }
                    }

                    return { ...item, Quantity: numericValue };
                }
                return item;
            });
        });
    }, []);

    // Handle note change
    const handleNoteChange = useCallback((bookId, value) => {
        setSelectedItems(prev => prev.map(item => {
            if (item.BookId === bookId) {
                return { ...item, Note: value };
            }
            return item;
        }));
    }, []);

    // Handle price change
    const handlePriceChange = useCallback((bookId, value) => {
        setSelectedItems(prev => prev.map(item => {
            if (item.BookId === bookId) {
                // Đảm bảo giá trị là số
                const numericValue = Number(value) || 0;
                return { ...item, Price: numericValue };
            }
            return item;
        }));
    }, []);

    // Handle form submission
    const handleSubmit = async (values) => {
        try {
            if (selectedItems.length === 0) {
                message.error('Please select at least one book');
                return;
            }

            // Validate quantities
            const invalidItems = selectedItems.filter(item =>
                !item.Quantity ||
                item.Quantity <= 0 ||
                item.Quantity > item.StockQuantity ||
                item.StockQuantity <= 0
            );

            if (invalidItems.length > 0) {
                message.error('Please check quantities. They must be greater than 0 and not exceed available stock.');
                return;
            }

            // Validate prices
            if (selectedItems.some(item => !item.Price || item.Price <= 0)) {
                message.error('Please enter valid price for all items');
                return;
            }

            // Validate bins
            const itemsWithoutBins = selectedItems.filter(item =>
                !item.SelectedBins || item.SelectedBins.length === 0
            );
            if (itemsWithoutBins.length > 0) {
                message.error('Please select at least one bin for each item');
                return;
            }

            // Check for items where bin quantity exceeds requested quantity
            const itemsWithExcessBinQuantity = selectedItems.filter(item => {
                const totalBinQuantity = item.SelectedBins.reduce((sum, bin) => sum + bin.quantity, 0);
                return totalBinQuantity > item.Quantity;
            });

            if (itemsWithExcessBinQuantity.length > 0) {
                const firstItem = itemsWithExcessBinQuantity[0];
                const binTotal = firstItem.SelectedBins.reduce((sum, bin) => sum + bin.quantity, 0);
                message.error(`Cannot create order: Selected bin quantity (${binTotal}) exceeds requested quantity (${firstItem.Quantity}) for "${firstItem.Title}"`);
                return;
            }

            // Check for items where bin quantity doesn't match requested quantity
            const itemsWithMismatchedBinQuantity = selectedItems.filter(item => {
                const totalBinQuantity = item.SelectedBins.reduce((sum, bin) => sum + bin.quantity, 0);
                return totalBinQuantity !== item.Quantity;
            });

            if (itemsWithMismatchedBinQuantity.length > 0) {
                const firstItem = itemsWithMismatchedBinQuantity[0];
                const binTotal = firstItem.SelectedBins.reduce((sum, bin) => sum + bin.quantity, 0);
                message.error(`Total bin quantity (${binTotal}) must match requested quantity (${firstItem.Quantity}) for "${firstItem.Title}"`);
                return;
            }

            // Prepare order items with multiple bin sources for each product
            const orderItems = [];
            selectedItems.forEach(item => {
                item.SelectedBins.forEach(bin => {
                    orderItems.push({
                        productId: item.BookId,
                        binId: bin.binId, // Dùng binId dạng chuỗi, phù hợp với API
                        quantity: bin.quantity,
                        price: item.Price,
                        note: item.Note || ''
                    });
                });
            });

            const orderData = {
                items: orderItems,
                note: values.Note || '',
                exportDate: values.ExportDate,
                recipientName: values.RecipientName,
                recipientPhone: values.RecipientPhone,
                shippingAddress: values.ShippingAddress,
                createdBy: user.userId
            };

            console.log('Sending order data:', orderData);
            setLoading(true);

            // Thêm thông báo đang tạo đơn hàng
            toast.info('Creating export order...');

            const response = await axios.post('http://localhost:9999/api/export-orders', orderData);

            if (response.data.success) {
                toast.success('🎉 ' + (response.data.message || 'Export order created successfully'));
                form.resetFields();
                setSelectedItems([]);
                setCreateModalVisible(false);
                fetchOrders();
            } else {
                toast.error(response.data.message || 'Failed to create export order');
            }
        } catch (error) {
            console.error('Error creating export order:', error);
            if (error.response?.data?.message) {
                toast.error('Error: ' + error.response.data.message);
            } else if (error.message) {
                toast.error('Error: ' + error.message);
            } else {
                toast.error('Failed to create export order. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    // List view columns
    const listColumns = [
        {
            title: 'Order ID',
            dataIndex: 'id',
            key: 'id',
        },
        {
            title: 'Created By',
            dataIndex: 'createdBy',
            key: 'createdBy'
        },
        {
            title: 'Recipient',
            dataIndex: 'recipientName',
            key: 'recipientName',
        },
        {
            title: 'Shipping Address',
            dataIndex: 'shippingAddress',
            key: 'shippingAddress',
            ellipsis: true,
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
            render: (date) => moment(date).format('DD/MM/YYYY HH:mm')
        },
        {
            title: 'Export Date',
            dataIndex: 'exportDate',
            key: 'exportDate',
            render: (date) => date ? moment(date).format('DD/MM/YYYY') : '-'
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_, record) => {
                return (
                    <Space>
                        {record.status === 'New' ? (
                            <>
                                <Button
                                    type="primary"
                                    icon={<EyeOutlined />}
                                    onClick={() => window.location.href = `/export-orders/${record.id}?mode=edit`}
                                >
                                    Edit
                                </Button>
                                <Button
                                    danger
                                    icon={<DeleteOutlined />}
                                    onClick={() => showDeleteConfirm(record.id)}
                                >
                                    Delete
                                </Button>
                            </>
                        ) : (
                            <Button
                                type="primary"
                                icon={<EyeOutlined />}
                                onClick={() => window.location.href = `/export-orders/${record.id}`}
                            >
                                View
                            </Button>
                        )}
                    </Space>
                );
            }
        }
    ];

    // columns memoize để tránh tạo lại mỗi lần render
    const tableColumns = useMemo(() => [
        {
            title: 'Book Title',
            dataIndex: 'Title',
            key: 'Title'
        },
        {
            title: 'Available Stock',
            dataIndex: 'StockQuantity',
            key: 'StockQuantity',
            render: (stock) => (
                <Tag color={stock > 0 ? 'green' : 'red'}>
                    {stock}
                </Tag>
            )
        },
        {
            title: 'Unit Price',
            key: 'Price',
            render: (_, record) => (
                <StableInputNumber
                    min={0}
                    value={record.Price}
                    onChange={(value) => handlePriceChange(record.BookId, value)}
                    style={{ width: '100%' }}
                    formatter={value => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    parser={value => value.replace(/\$\s?|(,*)/g, '')}
                    precision={2}
                    step={0.01}
                />
            )
        },
        {
            title: 'Quantity',
            key: 'Quantity',
            render: (_, record) => (
                <StableInputNumber
                    min={1}
                    max={record.StockQuantity}
                    value={record.Quantity}
                    onChange={(value) => handleQuantityChange(record.BookId, value)}
                    style={{ width: '100%' }}
                    disabled={record.StockQuantity <= 0}
                    precision={0}
                    parser={(value) => value ? Math.floor(Number(value)) : 0}
                />
            )
        },
        {
            title: 'Bin Selection',
            key: 'SelectedBins',
            render: (_, record) => (
                <BinSelectionWrapper
                    key={`bin-wrapper-${record.BookId}`}
                    bookId={record.BookId}
                    totalQuantity={record.Quantity || 0}
                    selectedBins={record.SelectedBins || []}
                    onSelectBins={handleBinSelect}
                />
            )
        },
        {
            title: 'Note',
            key: 'Note',
            render: (_, record) => (
                <StableInput
                    value={record.Note || ''}
                    onChange={(e) => handleNoteChange(record.BookId, e.target.value)}
                    placeholder="Add note"
                />
            )
        },
        {
            title: 'Total',
            key: 'Total',
            render: (_, record) => {
                const total = (record.Quantity || 0) * (record.Price || 0);
                return `$ ${total.toFixed(2)}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
            }
        }
    ], [handlePriceChange, handleQuantityChange, handleBinSelect, handleNoteChange]);

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
                <Col span={4}>
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => setCreateModalVisible(true)}
                    >
                        Create New Order
                    </Button>
                </Col>
            </Row>

            {/* Order List Table */}
            <Table
                columns={listColumns}
                dataSource={orders}
                rowKey="id"
                pagination={{
                    current: pagination.current,
                    pageSize: pagination.pageSize,
                    total: pagination.total,
                    onChange: (page, pageSize) => setPagination({ ...pagination, current: page, pageSize }),
                    showSizeChanger: true,
                    showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`
                }}
                loading={loading}
            />

            {/* Create Order Modal */}
            <Modal
                title="Create Export Request"
                open={createModalVisible}
                onCancel={() => {
                    setCreateModalVisible(false);
                    form.resetFields();
                    setSelectedItems([]);
                }}
                footer={null}
                width={1000}
            >
                <Form form={form} layout="vertical" onFinish={handleSubmit}>
                    <Row gutter={16}>
                        <Col span={8}>
                            <Form.Item
                                name="ExportDate"
                                label="Export Date"
                                rules={[{ required: true, message: 'Please select export date' }]}
                            >
                                <Input type="date" />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item
                                name="RecipientName"
                                label="Recipient Name"
                                rules={[{ required: true, message: 'Please enter recipient name' }]}
                            >
                                <Input placeholder="Enter recipient name" />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item
                                name="RecipientPhone"
                                label="Recipient Phone"
                                rules={[
                                    { required: true, message: 'Please enter recipient phone' },
                                    { pattern: /^[0-9]{10}$/, message: 'Please enter a valid 10-digit phone number' }
                                ]}
                            >
                                <Input placeholder="Enter recipient phone number" />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                name="ShippingAddress"
                                label="Shipping Address"
                                rules={[{ required: true, message: 'Please enter shipping address' }]}
                            >
                                <TextArea rows={1} placeholder="Enter detailed shipping address" />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                name="Note"
                                label="Order Note"
                            >
                                <TextArea rows={1} placeholder="Add note for the entire order" />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Form.Item label="Select Books">
                        <Select
                            mode="multiple"
                            placeholder="Select books to export"
                            onChange={handleBookSelect}
                            style={{ width: '100%' }}
                            optionFilterProp="children"
                            showSearch
                        >
                            {products.map((book) => (
                                <Option
                                    key={book.BookId}
                                    value={book.BookId}
                                    disabled={book.Status !== 'Active'}
                                >
                                    {book.Title} - {book.Author} - {book.Publisher} ({book.Category})
                                </Option>
                            ))}
                        </Select>
                    </Form.Item>

                    <Table
                        dataSource={selectedItems}
                        columns={tableColumns}
                        pagination={false}
                        rowKey="BookId"
                    />

                    <div style={{ marginTop: 16, textAlign: 'right' }}>
                        <Space>
                            <span style={{ marginRight: 16 }}>
                                <strong>Total Items:</strong> {selectedItems.reduce((sum, item) => sum + (item.Quantity || 0), 0)}
                            </span>
                            <span style={{ marginRight: 16 }}>
                                <strong>Total Amount:</strong> $ {selectedItems.reduce((sum, item) => sum + ((item.Quantity || 0) * (item.Price || 0)), 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                            </span>
                            <Button onClick={() => {
                                setCreateModalVisible(false);
                                form.resetFields();
                                setSelectedItems([]);
                            }}>
                                Cancel
                            </Button>
                            <Button type="primary" htmlType="submit" loading={loading}>
                                Create Order
                            </Button>
                        </Space>
                    </div>
                </Form>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal
                title="Delete Export Order"
                open={deleteModalVisible}
                onOk={() => orderToDelete && handleDelete(orderToDelete)}
                onCancel={() => {
                    setDeleteModalVisible(false);
                    setOrderToDelete(null);
                }}
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
        </Card>
    );
};

export default CreateExportRequest; 