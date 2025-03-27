import React, { useState, useEffect, useContext } from 'react';
import { Modal, Form, Input, Select, Button, Table, message, Col, Spin, Tooltip, Divider, Row, Card, InputNumber } from 'antd';
import { toast } from "react-toastify";
import { AuthContext } from "../../context/AuthContext";
import axios from 'axios';
import { InfoCircleOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons';
const { Option } = Select;

const ApproveWMSImportOrderModal = ({ visible, onCancel, onEdit, suppliers, books, order }) => {
    const { isAuthenticated, user, logout } = useContext(AuthContext);
    const [form] = Form.useForm();
    const [selectedBooks, setSelectedBooks] = useState([]);
    const [bins, setBins] = useState([]); // List of all bins in the warehouse
    const [loadingBins, setLoadingBins] = useState(false);

    // Change data structure to support multiple bins for each book
    // Format { bookId: [{ binId, quantity }] }
    const [bookBinAllocations, setBookBinAllocations] = useState({});

    // Fetch bin list from API when modal is displayed
    useEffect(() => {
        if (visible) {
            fetchBins();
        }
    }, [visible]);

    useEffect(() => {
        if (order) {
            form.setFieldsValue({
                SupplierID: order.SupplierID,
                ImportDate: order.ImportDate ? order.ImportDate.split('T')[0] : '',
                Note: order.Note,
            });
            setSelectedBooks(order.details || []);

            // Initialize bookBinAllocations with empty array for each book
            const initialAllocations = {};
            (order.details || []).forEach(book => {
                initialAllocations[book.BookId] = [];
            });
            setBookBinAllocations(initialAllocations);
        }
    }, [order, form, visible]);

    // Fetch bin list
    const fetchBins = async () => {
        try {
            setLoadingBins(true);
            const response = await axios.get('http://localhost:9999/api/bins');
            console.log("Bin response data:", response.data);

            // Bins data is in response.data.data (pagination structure)
            if (response.data && response.data.data) {
                setBins(response.data.data);
            } else {
                setBins([]);
                toast.error('Invalid bin data structure');
            }

            setLoadingBins(false);
        } catch (error) {
            console.error('Error fetching bins:', error);
            toast.error('Unable to retrieve bin list');
            setLoadingBins(false);
        }
    };

    // Calculate total allocated quantity for a book
    const getAllocatedQuantity = (bookId) => {
        const allocations = bookBinAllocations[bookId] || [];
        return allocations.reduce((sum, alloc) => sum + (parseInt(alloc.quantity) || 0), 0);
    };

    // Calculate remaining quantity that needs to be allocated
    const getRemainingQuantity = (bookId) => {
        const book = selectedBooks.find(b => b.BookId === bookId);
        if (!book) return 0;

        const effectiveQuantity = parseInt(book.Quantity);
        const allocatedQuantity = getAllocatedQuantity(bookId);

        return Math.max(0, effectiveQuantity - allocatedQuantity);
    };

    // Check if bin has enough capacity for required space
    const checkBinCapacity = (bin, requiredSpace) => {
        const availableSpace = bin.Quantity_Max_Limit - bin.Quantity_Current;
        return availableSpace >= requiredSpace;
    };

    // Get available bins that can accommodate the given quantity
    const getAvailableBins = (quantity) => {
        return bins.filter(bin => checkBinCapacity(bin, quantity));
    };

    // Add new bin allocation for a book
    const addAllocation = (bookId) => {
        const newAllocations = { ...bookBinAllocations };
        if (!newAllocations[bookId]) {
            newAllocations[bookId] = [];
        }

        newAllocations[bookId].push({
            binId: undefined,
            quantity: 1
        });

        setBookBinAllocations(newAllocations);
    };

    // Remove bin allocation at specified index
    const removeAllocation = (bookId, index) => {
        const newAllocations = { ...bookBinAllocations };
        if (newAllocations[bookId] && newAllocations[bookId].length > index) {
            newAllocations[bookId].splice(index, 1);
            setBookBinAllocations(newAllocations);
        }
    };

    // Update bin ID for a specific allocation
    const updateAllocationBin = (bookId, index, binId) => {
        const newAllocations = { ...bookBinAllocations };
        if (newAllocations[bookId] && newAllocations[bookId].length > index) {
            newAllocations[bookId][index].binId = binId;
            setBookBinAllocations(newAllocations);
        }
    };

    // Update quantity for a specific allocation
    const updateAllocationQuantity = (bookId, index, quantity) => {
        const book = selectedBooks.find(b => b.BookId === bookId);
        if (!book) return;

        // Đảm bảo quantity là số
        const newQuantity = parseInt(quantity) || 0;
        const totalAvailable = parseInt(book.Quantity);

        // Kiểm tra số lượng nhập vào có hợp lệ không
        if (newQuantity <= 0) {
            toast.error('Số lượng phải lớn hơn 0');
            return;
        }

        if (newQuantity > totalAvailable) {
            toast.error(`Số lượng nhập vào (${newQuantity}) không được vượt quá số lượng có thể phân bổ (${totalAvailable})`);
            return;
        }

        // Tính tổng số lượng đã phân bổ cho các bin khác
        const currentAllocations = bookBinAllocations[bookId] || [];
        const totalAllocated = currentAllocations.reduce((sum, alloc, idx) => {
            if (idx === index) return sum; // Bỏ qua allocation hiện tại
            return sum + (parseInt(alloc.quantity) || 0);
        }, 0);

        // Kiểm tra tổng số lượng sau khi thêm có vượt quá không
        const newTotal = totalAllocated + newQuantity;
        if (newTotal > totalAvailable) {
            toast.error(`Tổng số lượng phân bổ (${newTotal}) không được vượt quá số lượng có thể phân bổ (${totalAvailable})`);
            return;
        }

        // Nếu hợp lệ thì cập nhật số lượng
        const newAllocations = { ...bookBinAllocations };
        if (newAllocations[bookId] && newAllocations[bookId].length > index) {
            newAllocations[bookId][index].quantity = newQuantity;
            setBookBinAllocations(newAllocations);
        }
    };

    const handleApprove = async (action) => {
        try {
            // Validation phase
            const booksWithIncompleteAllocations = selectedBooks.filter(book => {
                return getRemainingQuantity(book.BookId) > 0;
            });

            if (booksWithIncompleteAllocations.length > 0) {
                toast.error("Please allocate all books to bins before approving");
                return;
            }

            let hasInvalidBins = false;
            Object.values(bookBinAllocations).forEach(allocations => {
                allocations.forEach(allocation => {
                    if (!allocation.binId) {
                        hasInvalidBins = true;
                    }
                });
            });

            if (hasInvalidBins) {
                toast.error("Please select valid bins for all allocations");
                return;
            }

            // Format bin allocations for API
            const binAllocations = [];
            Object.entries(bookBinAllocations).forEach(([bookId, allocations]) => {
                allocations.forEach(allocation => {
                    if (allocation.binId && allocation.quantity > 0) {
                        binAllocations.push({
                            BookId: bookId,
                            BinId: allocation.binId,
                            Quantity: allocation.quantity
                        });
                    }
                });
            });

            if (binAllocations.length === 0) {
                toast.error("No valid bin allocations found");
                return;
            }

            // Format data for API request
            const status = action === "Approve" ? "Done" : "Reject";
            const payload = {
                Status: status,
                LogStatus: status,
                LogNote: form.getFieldValue('LogNote') || '',
                BinAllocations: binAllocations
            };

            await onEdit(payload, order.ImportOrderId);

            if (action === "Approve") {
                toast.success("Import order has been approved and books assigned to bins");
            } else {
                toast.info("Import order has been rejected");
            }

            onCancel();

        } catch (error) {
            console.error("Error approving import order:", error);
            toast.error("An error occurred while processing the import order");
        }
    };

    return (
        <Modal
            title="Approve Import Order"
            open={visible}
            onCancel={onCancel}
            footer={[
                <Button key="close" onClick={onCancel}>
                    Close
                </Button>,
                <Button key="reject" type="default" danger onClick={() => handleApprove("Reject")}>
                    Reject
                </Button>,
                <Button key="approve" type="primary" onClick={() => handleApprove("Approve")}>
                    Approve
                </Button>
            ]}
            width={900}
        >
            <Form form={form} layout="vertical">
                <Table
                    dataSource={selectedBooks}
                    columns={[
                        {
                            title: 'Book ID',
                            dataIndex: 'BookId',
                            width: 80
                        },
                        {
                            title: 'Book Title',
                            render: (_, record) => (
                                <span>{record.BookInfo ? record.BookInfo.Title : 'No information'}</span>
                            ),
                            width: 200
                        },
                        {
                            title: 'Import Quantity',
                            render: (_, record) => (
                                <Input
                                    type="number"
                                    min={0}
                                    value={record.Quantity || 0}
                                    disabled
                                    style={{ width: '80px' }}
                                />
                            ),
                            width: 120
                        },
                        {
                            title: 'Allocate to Warehouse',
                            width: 400,
                            render: (_, record) => {
                                const effectiveQuantity = parseInt(record.Quantity);
                                const remainingQuantity = getRemainingQuantity(record.BookId);
                                const allocations = bookBinAllocations[record.BookId] || [];

                                return (
                                    <div style={{ padding: '10px', border: '1px solid #d9d9d9', borderRadius: '8px' }}>
                                        <div style={{ marginBottom: '12px', backgroundColor: '#f5f5f5', padding: '8px', borderRadius: '4px' }}>
                                            <span style={{ fontWeight: 'bold', fontSize: '14px', color: remainingQuantity > 0 ? '#ff4d4f' : '#52c41a' }}>
                                                Remaining to allocate: {remainingQuantity}/{effectiveQuantity}
                                            </span>
                                        </div>

                                        {allocations.map((allocation, index) => (
                                            <Row key={index} gutter={16} style={{ marginBottom: '12px' }}>
                                                <Col span={14}>
                                                    <div style={{ marginBottom: '4px' }}>
                                                        <label style={{ fontWeight: 'bold', color: '#1890ff' }}>Select Storage Location:</label>
                                                    </div>
                                                    <Select
                                                        placeholder="Choose a storage bin"
                                                        style={{ width: '100%' }}
                                                        value={allocation.binId}
                                                        onChange={(value) => updateAllocationBin(record.BookId, index, value)}
                                                        loading={loadingBins}
                                                        size="large"
                                                    >
                                                        {bins && bins.length > 0 && bins.map(bin => (
                                                            <Option key={bin.BinId} value={bin.BinId}>
                                                                <div style={{ padding: '8px 0' }}>
                                                                    <div style={{ fontWeight: 'bold' }}>{bin.Name}</div>
                                                                    <div style={{ fontSize: '12px', color: '#666' }}>
                                                                        ID: {bin.BinId} | Available Space: {bin.Quantity_Max_Limit - bin.Quantity_Current}
                                                                    </div>
                                                                </div>
                                                            </Option>
                                                        ))}
                                                    </Select>
                                                </Col>
                                                <Col span={6}>
                                                    <div style={{ marginBottom: '4px' }}>
                                                        <label style={{ fontWeight: 'bold', color: '#1890ff' }}>Quantity:</label>
                                                    </div>
                                                    <InputNumber
                                                        placeholder="Enter quantity"
                                                        style={{ width: '100%' }}
                                                        min={1}
                                                        max={remainingQuantity + allocation.quantity}
                                                        value={allocation.quantity}
                                                        onChange={(value) => updateAllocationQuantity(record.BookId, index, value)}
                                                        size="large"
                                                    />
                                                </Col>
                                                <Col span={4}>
                                                    <div style={{ marginBottom: '4px' }}>
                                                        <label style={{ color: 'transparent' }}>Action</label>
                                                    </div>
                                                    <Button
                                                        icon={<DeleteOutlined />}
                                                        onClick={() => removeAllocation(record.BookId, index)}
                                                        danger
                                                        size="large"
                                                        style={{ width: '100%' }}
                                                    >
                                                        Remove
                                                    </Button>
                                                </Col>
                                            </Row>
                                        ))}

                                        {remainingQuantity > 0 && (
                                            <Button
                                                type="dashed"
                                                onClick={() => addAllocation(record.BookId)}
                                                style={{ width: '100%', height: '40px', fontSize: '14px' }}
                                                icon={<PlusOutlined />}
                                            >
                                                Add New Storage Location
                                            </Button>
                                        )}

                                        {allocations.length === 0 && (
                                            <div style={{
                                                color: '#ff4d4f',
                                                fontSize: '14px',
                                                textAlign: 'center',
                                                padding: '16px',
                                                backgroundColor: '#fff1f0',
                                                border: '1px dashed #ff4d4f',
                                                borderRadius: '4px',
                                                marginTop: '8px'
                                            }}>
                                                Please add storage location for this book
                                            </div>
                                        )}
                                    </div>
                                );
                            }
                        },
                        {
                            title: 'Unit Price',
                            render: (_, record) => (
                                <Input
                                    type="number"
                                    min={0}
                                    value={record.Price || 0}
                                    disabled
                                    style={{ width: '80px' }}
                                />
                            ),
                            width: 100
                        },
                        {
                            title: 'Total Price',
                            render: (_, record) => (
                                <span>{(record.Quantity || 0) * (record.Price || 0)}</span>
                            ),
                            width: 100
                        },
                    ]}
                    rowKey="BookId"
                    pagination={false}
                />

                <div style={{ marginTop: 20 }}>
                    <strong>Total Book Quantity: {selectedBooks.reduce((sum, book) => sum + (parseInt(book.Quantity) || 0), 0)}</strong>
                    <br />
                </div>

                <Divider />
                <div style={{ marginBottom: '16px' }}>
                    <Tooltip title="Allocate the exact number of books to bins. The total allocation must equal the actual book quantity.">
                        <InfoCircleOutlined style={{ marginRight: '8px' }} />
                        <span>Note: You must allocate the correct number of books to bins before approval.</span>
                    </Tooltip>
                </div>

                <Form.Item
                    name="LogNote"
                    label="Note"
                >
                    <Input.TextArea rows={2} placeholder="Enter notes if any" style={{ resize: 'none' }} />
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default ApproveWMSImportOrderModal; 