import React, { useState, useEffect, useContext } from 'react';
import { Modal, Form, Input, Select, Button, Table, message, Col, Spin, Tooltip, Divider, Row, Card, InputNumber } from 'antd';
import { toast } from "react-toastify";
import { AuthContext } from "../../context/AuthContext";
import axios from 'axios';
import { InfoCircleOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons';
const { Option } = Select;

const ApproveWMSImportOrderModal = ({ visible, onCancel, onEdit, suppliers, books, order }) => {
    console.log(" ApproveWMSImportOrderModal => ", { visible, onCancel, onEdit, suppliers, books, order })
    const { isAuthenticated, user, logout } = useContext(AuthContext);
    const [form] = Form.useForm();
    const [selectedBooks, setSelectedBooks] = useState([]);
    const [selectedFaultBooks, setSelectedFaultBooks] = useState([]);
    const [logNote, setLogNote] = useState('');
    const [bins, setBins] = useState([]); // List of all bins in the warehouse
    const [loadingBins, setLoadingBins] = useState(false);

    // Change data structure to support multiple bins for each book
    // Format { bookId: [{ binId, quantity }] }
    const [bookBinAllocations, setBookBinAllocations] = useState({});

    console.log("ApproveWMSImportOrderModal books =>", books);
    console.log("ApproveWMSImportOrderModal order =>", order);

    // Fetch bin list from API when modal is displayed
    useEffect(() => {
        if (visible) {
            fetchBins();
        }
    }, [visible]);

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

    useEffect(() => {
        if (order) {
            form.setFieldsValue({
                SupplierID: order.SupplierID,
                ImportDate: order.ImportDate ? order.ImportDate.split('T')[0] : '',
                Note: order.Note,
            });
            setSelectedBooks(order.details || []);
            setSelectedFaultBooks(order?.faultBooks || []);

            // Initialize bookBinAllocations with empty array for each book
            const initialAllocations = {};
            (order.details || []).forEach(book => {
                initialAllocations[book.BookId] = [];
            });
            setBookBinAllocations(initialAllocations);
        }
    }, [order, form, visible]);

    const handleBookSelect = (bookIds) => {
        const selected = books.filter(book => bookIds.includes(book.BookId));
        const updatedBooks = selected.map(book => {
            const existingBook = selectedFaultBooks.find(b => b.BookId === book.BookId);
            return {
                ...book,
                Quantity: existingBook ? existingBook.Quantity : 0,
                Price: existingBook ? existingBook.Price : 0,
                Note: existingBook ? existingBook.Note : ""
            };
        });
        setSelectedFaultBooks(updatedBooks);
    };

    const handleQuantityChange = (bookId, value) => {
        const updatedDetails = selectedBooks.map((book) => {
            if (book.BookId === bookId) {
                return { ...book, Quantity: value };
            }
            return book;
        });
        setSelectedBooks(updatedDetails);
    };

    const handleQuantityFaultBooks = (bookId, value) => {
        const updatedDetails = selectedFaultBooks.map((book) => {
            if (book.BookId === bookId) {
                return { ...book, Quantity: value };
            }
            return book;
        });
        setSelectedFaultBooks(updatedDetails);
    };

    const handleChangeNoteFault = (bookId, value) => {
        const updatedDetails = selectedFaultBooks.map((book) => {
            if (book.BookId === bookId) {
                return { ...book, Note: value };
            }
            return book;
        });
        setSelectedFaultBooks(updatedDetails);
    };

    const handlePriceChange = (bookId, value) => {
        const updatedDetails = selectedBooks.map((book) => {
            if (book.BookId === bookId) {
                return { ...book, Price: value };
            }
            return book;
        });
        setSelectedBooks(updatedDetails);
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

        // Tìm sách lỗi tương ứng (nếu có)
        const faultBook = selectedFaultBooks.find(fb => fb.BookId === bookId);
        const faultQuantity = faultBook ? parseInt(faultBook.Quantity) || 0 : 0;

        // Tổng số lượng có thể phân bổ = Số lượng nhập - Số lượng lỗi
        const totalAvailable = parseInt(book.Quantity) - faultQuantity;

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

    // Calculate total allocated quantity for a book
    const getAllocatedQuantity = (bookId) => {
        const allocations = bookBinAllocations[bookId] || [];
        return allocations.reduce((sum, alloc) => sum + (parseInt(alloc.quantity) || 0), 0);
    };

    // Calculate remaining quantity that needs to be allocated
    const getRemainingQuantity = (bookId) => {
        const book = selectedBooks.find(b => b.BookId === bookId);
        if (!book) return 0;

        const faultBook = selectedFaultBooks.find(fb => fb.BookId === bookId);
        const faultQuantity = faultBook ? parseInt(faultBook.Quantity) || 0 : 0;

        const effectiveQuantity = parseInt(book.Quantity) - faultQuantity;
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

    const handleApprove = async (action) => {
        try {
            // Validation phase
            // 1. Check if all books have proper bin allocations
            const booksWithIncompleteAllocations = selectedBooks.filter(book => {
                // Skip fault books (they don't need bin allocation)
                const faultBook = selectedFaultBooks.find(fb => fb.BookId === book.BookId);
                const faultQuantity = faultBook ? parseInt(faultBook.Quantity) || 0 : 0;

                // If all books are faulty, skip bin allocation check
                if (faultQuantity >= parseInt(book.Quantity)) {
                    return false;
                }

                // Check if this book has the correct number of allocations
                return getRemainingQuantity(book.BookId) > 0;
            });

            if (booksWithIncompleteAllocations.length > 0) {
                toast.error("Please allocate all books to bins before approving");
                return;
            }

            // 2. Check if all allocations have valid bin IDs
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

            if (binAllocations.length === 0 && selectedBooks.some(book => {
                const faultBook = selectedFaultBooks.find(fb => fb.BookId === book.BookId);
                const faultQuantity = faultBook ? parseInt(faultBook.Quantity) || 0 : 0;
                return faultQuantity < parseInt(book.Quantity);
            })) {
                toast.error("No valid bin allocations found");
                return;
            }

            // Format data for API request
            const status = action === "Approve" ? "Done" : "Reject";
            const payload = {
                Status: status,
                LogStatus: status,
                LogNote: form.getFieldValue('LogNote') || '',
                FaultBooks: selectedFaultBooks,
                BinAllocations: binAllocations
            };

            const response = await onEdit(payload, order.ImportOrderId);
            console.log("API Response:", response);

            // Success handling
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

    const handleClose = () => {
        onCancel();
    };

    const handleAddBinAllocation = (bookId, binId, quantity) => {
        const newAllocations = { ...bookBinAllocations };
        if (!newAllocations[bookId]) {
            newAllocations[bookId] = [];
        }

        newAllocations[bookId].push({
            binId,
            quantity: parseInt(quantity)
        });

        console.log("Updated bookBinAllocations:", newAllocations);
        setBookBinAllocations(newAllocations);
    };

    return (
        <Modal
            title="Approve Import Order"
            open={visible}
            onCancel={onCancel}
            footer={null}
            width={900}
        >
            <Form form={form} layout="vertical">
                <h3>Import Order Details</h3>
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
                                    onChange={(e) => handleQuantityChange(record.BookId, e.target.value)}
                                    required
                                    disabled
                                    style={{ width: '80px' }}
                                />
                            ),
                            width: 120
                        },
                        {
                            title: 'Allocate to Warehouse',
                            render: (_, record) => {
                                // Calculate actual quantity after subtracting defective books
                                const faultBook = selectedFaultBooks.find(fb => fb.BookId === record.BookId);
                                const effectiveQuantity = record.Quantity - (faultBook?.Quantity || 0);
                                const remainingQuantity = getRemainingQuantity(record.BookId);

                                // If actual quantity = 0, no allocation needed
                                if (effectiveQuantity <= 0) {
                                    return <span>Not needed (defective books)</span>;
                                }

                                const allocations = bookBinAllocations[record.BookId] || [];

                                return (
                                    <div>
                                        <div style={{ marginBottom: '8px' }}>
                                            <span style={{ fontWeight: 'bold' }}>
                                                Remaining to allocate: {remainingQuantity}/{effectiveQuantity}
                                            </span>
                                        </div>

                                        {allocations.map((allocation, index) => (
                                            <Row key={index} gutter={8} style={{ marginBottom: '8px' }}>
                                                <Col span={12}>
                                                    <Select
                                                        placeholder="Select bin"
                                                        style={{ width: '100%' }}
                                                        value={allocation.binId}
                                                        onChange={(value) => updateAllocationBin(record.BookId, index, value)}
                                                        loading={loadingBins}
                                                    >
                                                        {bins && bins.length > 0 && bins.map(bin => (
                                                            <Option key={bin.BinId} value={bin.BinId}>
                                                                {bin.BinId} - {bin.Name} - Available: {bin.Quantity_Max_Limit - bin.Quantity_Current}
                                                            </Option>
                                                        ))}
                                                    </Select>
                                                </Col>
                                                <Col span={8}>
                                                    <InputNumber
                                                        placeholder="Quantity"
                                                        style={{ width: '100%' }}
                                                        min={1}
                                                        max={remainingQuantity + allocation.quantity}
                                                        value={allocation.quantity}
                                                        onChange={(value) => updateAllocationQuantity(record.BookId, index, value)}
                                                    />
                                                </Col>
                                                <Col span={4}>
                                                    <Button
                                                        icon={<DeleteOutlined />}
                                                        onClick={() => removeAllocation(record.BookId, index)}
                                                        danger
                                                    />
                                                </Col>
                                            </Row>
                                        ))}

                                        {remainingQuantity > 0 && (
                                            <Button
                                                type="dashed"
                                                onClick={() => addAllocation(record.BookId)}
                                                style={{ width: '100%' }}
                                                icon={<PlusOutlined />}
                                            >
                                                Add Location
                                            </Button>
                                        )}

                                        {allocations.length === 0 && (
                                            <div style={{ color: 'red', fontSize: '12px' }}>
                                                Please add bin allocation locations
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
                                    onChange={(e) => handlePriceChange(record.BookId, e.target.value)}
                                    required
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
                    <strong>Total Book Quantity: {selectedBooks.reduce((sum, book) => sum + (book.Quantity || 0), 0)}</strong>
                    <br />
                </div>

                {/* <div style={{ border: '1px solid red', borderRadius: '10px', padding: '10px', margin: '5px 5px' }}>
                    <h3>Defective Product List (if any)</h3>
                    <Table
                        dataSource={selectedFaultBooks}
                        columns={[
                            {
                                title: 'Book ID',
                                dataIndex: 'BookId',
                            },
                            {
                                title: 'Book Title',
                                render: (_, record) => (
                                    <span>{record.Title ? record.Title : 'No information'}</span>
                                ),
                            },
                            {
                                title: 'Defective Book Quantity',
                                render: (_, record) => (
                                    <Input
                                        type="number"
                                        min={0}
                                        value={record.Quantity || 0}
                                        onChange={(e) => handleQuantityFaultBooks(record.BookId, e.target.value)}
                                    />
                                ),
                            },
                            {
                                title: 'Note',
                                render: (_, record) => (
                                    <Input
                                        type="text"
                                        value={record.Note || ""}
                                        onChange={(e) => handleChangeNoteFault(record.BookId, e.target.value)}
                                    />
                                ),
                            },
                        ]}
                        rowKey="BookId"
                        pagination={false}
                    />
                </div> */}


                <Divider />
                <div style={{ marginBottom: '16px' }}>
                    <Tooltip title="Allocate the exact number of books to bins. The total allocation must equal the actual book quantity (after subtracting defective books).">
                        <InfoCircleOutlined style={{ marginRight: '8px' }} />
                        <span>Note: You must allocate the correct number of books to bins before approval.</span>
                    </Tooltip>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '5px' }}>
                    <Button type="default" onClick={handleClose}>
                        Close
                    </Button>
                    <Button type="default" danger onClick={() => handleApprove("Reject")} style={{ marginRight: '10px' }}>
                        Reject
                    </Button>
                    <Button type="primary" onClick={() => handleApprove("Approve")} style={{ marginRight: '10px' }}>
                        Approve Warehouse Import
                    </Button>
                </div>
            </Form>
        </Modal>
    );
};

export default ApproveWMSImportOrderModal; 