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
    const [bins, setBins] = useState([]); // Danh sách tất cả bin trong kho
    const [loadingBins, setLoadingBins] = useState(false);
    
    // Thay đổi cấu trúc dữ liệu để hỗ trợ nhiều bin cho mỗi sách
    // Dạng { bookId: [{ binId, quantity }] }
    const [bookBinAllocations, setBookBinAllocations] = useState({});

    console.log("ApproveWMSImportOrderModal books =>", books);
    console.log("ApproveWMSImportOrderModal order =>", order);
    
    // Fetch danh sách bin từ API khi modal hiển thị
    useEffect(() => {
        if (visible) {
            fetchBins();
        }
    }, [visible]);

    // Fetch danh sách bin
    const fetchBins = async () => {
        try {
            setLoadingBins(true);
            const response = await axios.get('http://localhost:9999/api/bins');
            console.log("Bin response data:", response.data);
            
            // Dữ liệu bins nằm trong response.data.data (cấu trúc phân trang)
            if (response.data && response.data.data) {
                setBins(response.data.data);
            } else {
                setBins([]);
                toast.error('Cấu trúc dữ liệu bin không hợp lệ');
            }
            
            setLoadingBins(false);
        } catch (error) {
            console.error('Error fetching bins:', error);
            toast.error('Không thể lấy danh sách bin');
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
            
            // Khởi tạo bookBinAllocations với mảng rỗng cho mỗi sách
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

    // Thêm một dòng phân bổ mới cho sách
    const addAllocation = (bookId) => {
        setBookBinAllocations(prev => {
            const bookAllocations = [...(prev[bookId] || [])];
            bookAllocations.push({ binId: null, quantity: 0 });
            return {
                ...prev,
                [bookId]: bookAllocations
            };
        });
    };

    // Xóa một dòng phân bổ
    const removeAllocation = (bookId, index) => {
        setBookBinAllocations(prev => {
            const bookAllocations = [...(prev[bookId] || [])];
            bookAllocations.splice(index, 1);
            return {
                ...prev,
                [bookId]: bookAllocations
            };
        });
    };

    // Cập nhật bin cho một dòng phân bổ
    const updateAllocationBin = (bookId, index, binId) => {
        setBookBinAllocations(prev => {
            const bookAllocations = [...(prev[bookId] || [])];
            bookAllocations[index] = { ...bookAllocations[index], binId };
            return {
                ...prev,
                [bookId]: bookAllocations
            };
        });
    };

    // Cập nhật số lượng cho một dòng phân bổ
    const updateAllocationQuantity = (bookId, index, quantity) => {
        setBookBinAllocations(prev => {
            const bookAllocations = [...(prev[bookId] || [])];
            bookAllocations[index] = { ...bookAllocations[index], quantity: parseInt(quantity) || 0 };
            return {
                ...prev,
                [bookId]: bookAllocations
            };
        });
    };

    // Tính số lượng đã phân bổ cho một sách
    const getAllocatedQuantity = (bookId) => {
        const allocations = bookBinAllocations[bookId] || [];
        return allocations.reduce((sum, alloc) => sum + (parseInt(alloc.quantity) || 0), 0);
    };

    // Tính số lượng còn lại cần phân bổ cho một sách
    const getRemainingQuantity = (bookId) => {
        const book = selectedBooks.find(b => b.BookId === bookId);
        if (!book) return 0;
        
        const faultBook = selectedFaultBooks.find(fb => fb.BookId === bookId);
        const totalQuantity = parseInt(book.Quantity) || 0;
        const faultQuantity = parseInt(faultBook?.Quantity) || 0;
        const effectiveQuantity = totalQuantity - faultQuantity;
        
        const allocatedQuantity = getAllocatedQuantity(bookId);
        return Math.max(0, effectiveQuantity - allocatedQuantity);
    };

    // Kiểm tra bin có đủ không gian không
    const checkBinCapacity = (bin, requiredSpace) => {
        const availableSpace = bin.Quantity_Max_Limit - bin.Quantity_Current;
        return availableSpace >= requiredSpace;
    };

    // Lọc bin phù hợp cho sách (chỉ hiển thị bin có đủ không gian)
    const getAvailableBins = (quantity) => {
        return bins.filter(bin => checkBinCapacity(bin, quantity));
    };

    const handleApprove = async (action) => {
        console.log("action =>", action);
        console.log("Current bookBinAllocations state:", bookBinAllocations);
        
        // Kiểm tra xem sách đã được phân bổ đủ chưa nếu action là "Approve"
        if (action === "Approve") {
            // Kiểm tra từng sách đã phân bổ đủ chưa
            for (const book of selectedBooks) {
                const faultBook = selectedFaultBooks.find(fb => fb.BookId === book.BookId);
                const effectiveQuantity = book.Quantity - (faultBook?.Quantity || 0);
                
                // Bỏ qua kiểm tra nếu số lượng thực tế là 0
                if (effectiveQuantity <= 0) continue;
                
                const allocations = bookBinAllocations[book.BookId] || [];
                const allocatedQuantity = getAllocatedQuantity(book.BookId);
                
                if (allocatedQuantity !== effectiveQuantity) {
                    toast.error(`Sách "${book.Title}" chưa được phân bổ đủ. Đã phân bổ ${allocatedQuantity}/${effectiveQuantity} quyển.`);
                    return;
                }
            }
        }
        
        try {
            // Chuẩn bị binAllocations để gửi lên server
            const binAllocations = [];
            
            if (action === "Approve") {
                // Tạo mảng các phân bổ bin cho từng sách
                Object.keys(bookBinAllocations).forEach(bookId => {
                    const allocations = bookBinAllocations[bookId] || [];
                    console.log(`Allocations for book ${bookId}:`, allocations);
                    
                    allocations.forEach(allocation => {
                        if (allocation.binId && allocation.quantity > 0) {
                            binAllocations.push({
                                BookId: parseInt(bookId),
                                BinId: allocation.binId,
                                Quantity: parseInt(allocation.quantity)
                            });
                        }
                    });
                });
            }
            
            console.log("Final binAllocations array:", binAllocations);
            
            // Chuẩn bị FaultBooks từ selectedFaultBooks
            const faultBooks = selectedFaultBooks
                .filter(book => book.Quantity > 0)
                .map(book => ({
                    BookId: book.BookId,
                    Quantity: parseInt(book.Quantity),
                    Note: book.Note || ''
                }));
            
            // Chuẩn bị payload để gửi đi
            const payload = {
                Status: action === "Approve" ? "ApproveImport" : "Rejected",
                LogStatus: action === "Approve" ? "ApproveImport" : "Rejected",
                CreatedBy: user?.userId,
                LogNote: action === "Approve" ? "Approve" : "Reject",
                FaultBooks: faultBooks
            };
            
            // Thêm BinAllocations vào payload nếu đang phê duyệt và có phân bổ
            if (action === "Approve" && binAllocations.length > 0) {
                payload.BinAllocations = binAllocations;
            }
            
            console.log("Final payload being sent:", payload);
            
            // Hiển thị loading message
            const toastLoading = toast.loading("Đang xử lý đơn nhập...");
            
            try {
                // Gọi API thông qua hàm onEdit (handleCheckOrder)
                const response = await onEdit(payload, order.ImportOrderId);
                
                // Update toast với thông báo thành công
                toast.success(toastLoading, { 
                    render: "Đơn nhập đã được phê duyệt thành công!", 
                    type: "success", 
                    isLoading: false,
                    autoClose: 3000
                });
                
                // Đóng modal sau khi phê duyệt thành công
                onCancel();
            } catch (apiError) {
                console.error("API error:", apiError);
                
                // Update toast với thông báo lỗi
                toast.success(toastLoading, { 
                    render: `Lỗi: ${apiError.response?.data?.message || apiError.message || "Đã xảy ra lỗi!"}`, 
                    type: "error", 
                    isLoading: false,
                    autoClose: 5000
                });
            }
            
        } catch (error) {
            console.error(`Error ${action === "Approve" ? "approving" : "rejecting"} import order:`, error);
            toast.error(`Lỗi khi ${action === "Approve" ? "phê duyệt" : "từ chối"} đơn nhập: ${error.message}`);
        }
    };

    const handleClose = () => {
        onCancel();
    };

    // Thêm logs trong handleAddBinAllocation (nếu bạn có hàm này)
    const handleAddBinAllocation = (bookId, binId, quantity) => {
        console.log(`Adding bin allocation: Book ${bookId}, Bin ${binId}, Quantity ${quantity}`);
        
        // Kiểm tra/cập nhật state
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
            title="Phê Duyệt Đơn Nhập"
            open={visible}
            onCancel={onCancel}
            footer={null}
            width={900}
        >
            <Form form={form} layout="vertical">
                <h3>Chi tiết đơn nhập</h3>
                <Table
                    dataSource={selectedBooks}
                    columns={[
                        {
                            title: 'ID Sách',
                            dataIndex: 'BookId',
                            width: 80
                        },
                        {
                            title: 'Tên Sách',
                            render: (_, record) => (
                                <span>{record.BookInfo ? record.BookInfo.Title : 'Không có thông tin'}</span>
                            ),
                            width: 200
                        },
                        {
                            title: 'Số Lượng Nhập',
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
                            title: 'Phân bổ vào kho',
                            render: (_, record) => {
                                // Tính số lượng thực tế sau khi trừ sách lỗi
                                const faultBook = selectedFaultBooks.find(fb => fb.BookId === record.BookId);
                                const effectiveQuantity = record.Quantity - (faultBook?.Quantity || 0);
                                const remainingQuantity = getRemainingQuantity(record.BookId);

                                // Nếu số lượng thực tế = 0, không cần phân bổ
                                if (effectiveQuantity <= 0) {
                                    return <span>Không cần (sách lỗi)</span>;
                                }

                                const allocations = bookBinAllocations[record.BookId] || [];

                                return (
                                    <div>
                                        <div style={{ marginBottom: '8px' }}>
                                            <span style={{ fontWeight: 'bold' }}>
                                                Còn lại cần phân bổ: {remainingQuantity}/{effectiveQuantity}
                                            </span>
                                        </div>
                                        
                                        {allocations.map((allocation, index) => (
                                            <Row key={index} gutter={8} style={{ marginBottom: '8px' }}>
                                                <Col span={12}>
                                                    <Select
                                                        placeholder="Chọn bin"
                                                        style={{ width: '100%' }}
                                                        value={allocation.binId}
                                                        onChange={(value) => updateAllocationBin(record.BookId, index, value)}
                                                        loading={loadingBins}
                                                    >
                                                        {bins && bins.length > 0 && bins.map(bin => (
                                                            <Option key={bin.BinId} value={bin.BinId}>
                                                                {bin.BinId} - {bin.Name} - Còn trống: {bin.Quantity_Max_Limit - bin.Quantity_Current}
                                                            </Option>
                                                        ))}
                                                    </Select>
                                                </Col>
                                                <Col span={8}>
                                                    <InputNumber
                                                        placeholder="Số lượng"
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
                                                Thêm vị trí
                                            </Button>
                                        )}
                                        
                                        {allocations.length === 0 && (
                                            <div style={{ color: 'red', fontSize: '12px' }}>
                                                Vui lòng thêm vị trí phân bổ sách
                                            </div>
                                        )}
                                    </div>
                                );
                            }
                        },
                        {
                            title: 'Đơn Giá',
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
                            title: 'Tổng Giá',
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
                    <strong>Tổng số lượng sách: {selectedBooks.reduce((sum, book) => sum + (book.Quantity || 0), 0)}</strong>
                    <br />
                </div>

                <div style={{border: '1px solid red', borderRadius: '10px', padding: '10px', margin: '5px 5px'}}>
                    <h3>Danh sách sản phẩm lỗi (nếu có)</h3>
                    <Table
                        dataSource={selectedFaultBooks}
                        columns={[
                            {
                                title: 'ID Sách',
                                dataIndex: 'BookId',
                            },
                            {
                                title: 'Tên Sách',
                                render: (_, record) => (
                                    <span>{record.Title ? record.Title : 'Không có thông tin'}</span>
                                ),
                            },
                            {
                                title: 'Số Lượng Sách Lỗi',
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
                                title: 'Ghi chú',
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
                </div>

                <Divider />
                <div style={{ marginBottom: '16px' }}>
                    <Tooltip title="Phân bổ chính xác số lượng sách vào các bin. Tổng số lượng phân bổ phải bằng với số lượng sách thực tế (sau khi trừ sách lỗi).">
                        <InfoCircleOutlined style={{ marginRight: '8px' }} />
                        <span>Lưu ý: Phải phân bổ đúng số lượng sách vào các bin trước khi phê duyệt.</span>
                    </Tooltip>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '5px' }}>
                    <Button type="default" onClick={handleClose}>
                        Đóng
                    </Button>
                    <Button type="default" danger onClick={() => handleApprove("Reject")} style={{ marginRight: '10px' }}>
                        Từ chối
                    </Button>
                    <Button type="primary" onClick={() => handleApprove("Approve")} style={{ marginRight: '10px' }}>
                        Phê duyệt nhập kho
                    </Button>
                </div>
            </Form>
        </Modal>
    );
};

export default ApproveWMSImportOrderModal; 