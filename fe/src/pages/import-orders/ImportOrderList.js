// fe/src/pages/import-orders/ImportOrderList.js
import React, { useContext, useEffect, useState } from "react";
import { Link } from 'react-router-dom';
import {
    Table,
    Button,
    Input,
    Space,
    Modal,
    Form,
    message,
    Select,
    Card,
    Timeline,
    Tag,
    DatePicker
} from "antd";
import axios from "axios";
import { AuthContext } from "../../context/AuthContext";
import AddImportOrderModal from "./AddImportOrderModal";
import EditImportOrderModal from "./EditImportOrderModal";
import HorizontalTimeline from "../../components/HorizontalTimeline";
import moment from "moment";

// import ImportOrderForm from './ImportOrderForm';
const { Option } = Select;

const suppliersList = [
    "Trí Tuệ - Công Ty Cổ Phần Sách & Thiết Bị Giáo Dục Trí Tuệ",
    "Công Ty Cổ Phần Sách Mcbooks",
    "Công Ty Cổ Phần Sách Giáo Dục Tại Thành Phố Hà Nội",
    "Công Ty Cổ Phần Dịch Vụ Xuất Bản Giáo Dục Hà Nội",
    "Nhà Sách Trực Tuyến Atlazbooks",
    "Công Ty Cổ Phần Sách Và Thiết Bị Trường Học Hà Nội",
    "Nhà Sách Quyết Bình",
    "Công Ty Cổ Phần Truyền Thông Và Xuất Bản Amak",
    "Công Ty Cổ Phần Học Liệu Sư Phạm",
    "Nhà Sách Nguyệt Linh",
    "Công Ty TNHH Sách Sunbooks",
    "Công Ty Cổ Phần Sách QBooks",
];

const orderStatuses = [
    { key: 'New', label: 'Mới' },
    { key: 'Approve', label: 'Đã phê duyệt' },
    { key: 'Receive', label: 'Đã nhận hàng' },
    { key: 'Approve Import', label: 'Đã phê duyệt nhập' },
    { key: 'Close', label: 'Đã đóng' },
];

const ImportOrderList = () => {
    const { user } = useContext(AuthContext); // Lấy user từ AuthContext
    console.log(user);

    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [form] = Form.useForm();
    const [books, setBooks] = useState([]);
    const [orderDetails, setOrderDetails] = useState([]);
    const [suppliers, setSuppliers] = useState([]);

    // State cho tìm kiếm
    const [searchId, setSearchId] = useState('');
    const [searchSupplier, setSearchSupplier] = useState('');
    const [searchStatus, setSearchStatus] = useState('');
    const [searchDate, setSearchDate] = useState('');
    
    // State cho phân trang
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    // Gọi API lấy danh sách đơn nhập và sách
    useEffect(() => {
        fetchOrders();
        fetchBooks();
    }, []);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const response = await axios.get("http://localhost:9999/api/import-orders");
            setOrders(response.data.orders); // Đảm bảo sử dụng biến response ở đây
        } catch (error) {
            message.error("Lỗi khi tải danh sách đơn nhập!");
        } finally {
            setLoading(false);
        }
    };

    const fetchBooks = async () => {
        try {
            const response = await axios.get("http://localhost:9999/api/books");
            setBooks(response.data.data); // Lưu ý: Dữ liệu sách nằm trong `data`
        } catch (error) {
            message.error("Lỗi khi tải danh sách sách!");
        }
    };

    // Hàm mở modal thêm đơn nhập
    const showAddOrderModal = () => {
        setIsAddModalOpen(true);
        form.resetFields();
    };

    // Hàm mở modal chỉnh sửa đơn nhập
    const showEditOrderModal = async (orderId) => {
        try {
            const response = await axios.get(`http://localhost:9999/api/import-orders/${orderId}`);
            setSelectedOrder(response.data); // Set selected order from API response
            setIsEditModalOpen(true); // Open edit modal
        } catch (error) {
            message.error("Lỗi khi tải thông tin đơn nhập!");
        }
    };

    // Hàm mở modal xác nhận xóa
    const showDeleteOrderModal = (order) => {
        setSelectedOrder(order);
        setIsDeleteModalOpen(true);
    };

    // Hàm xử lý thêm đơn nhập
    const handleAddOrder = async (values) => {
        try {
            const newOrder = { ...values, Status: "New" };
            await axios.post("http://localhost:9999/api/import-orders", newOrder);
            message.success("Tạo đơn nhập thành công!");
            fetchOrders();
            setIsAddModalOpen(false);
        } catch (error) {
            message.error("Lỗi khi tạo đơn nhập!");
        }
    };

    // Hàm xử lý chỉnh sửa đơn nhập
    const handleEditOrder = async (updatedOrder, orderId) => {
        try {
            await axios.put(`http://localhost:9999/api/import-orders/${orderId}`, updatedOrder);
            message.success("Chỉnh sửa đơn nhập thành công!");
            fetchOrders(); // Refresh orders
            setIsEditModalOpen(false); // Close modal
        } catch (error) {
            message.error("Lỗi khi chỉnh sửa đơn nhập!");
        }
    };

    // Hàm xử lý xác nhận xóa đơn nhập
    const handleDeleteOrder = async () => {
        try {
            await axios.delete(`http://localhost:9999/api/import-orders/${selectedOrder.ImportOrderId}`);
            message.success("Xóa đơn nhập thành công!");
            fetchOrders();
            setIsDeleteModalOpen(false);
        } catch (error) {
            message.error("Lỗi khi xóa đơn nhập!");
        }
    };

    // Xử lý khi chọn sách
    const handleBookSelect = (selectedBooks) => {
        const newOrderDetails = selectedBooks.map((bookId) => ({
            BookId: bookId,
            Quantity: 1, // Mặc định số lượng là 1
            Price: 0, // Giá có thể được cập nhật sau
        }));
        setOrderDetails(newOrderDetails);
    };

    // Cập nhật giá và số lượng cho từng sách
    const handleDetailChange = (index, field, value) => {
        const newDetails = [...orderDetails];
        newDetails[index][field] = value;
        setOrderDetails(newDetails);
    };

    // Tính tổng giá cho từng sách
    const calculateTotalPrice = (quantity, price) => {
        return quantity * price;
    };

    // Tính tổng số lượng sách và tổng số tiền
    const totalQuantity = orderDetails.reduce((total, detail) => total + (parseInt(detail.Quantity) || 0), 0);
    const totalPrice = orderDetails.reduce((total, detail) => total + calculateTotalPrice(detail.Quantity, detail.Price), 0);

    // Hàm tìm kiếm
    const handleSearch = () => {
        const filteredOrders = orders.filter(order => {
            const matchesId = order.ImportOrderId?.toString().includes(searchId);
            const matchesSupplier = order.SupplierID?.toLowerCase().includes(searchSupplier.toLowerCase());
            const matchesStatus = order.Status?.toLowerCase().includes(searchStatus.toLowerCase());
            const matchesDate = searchDate ? new Date(order.ImportDate).toLocaleDateString() === new Date(searchDate).toLocaleDateString() : true;
            return matchesId && matchesSupplier && matchesStatus && matchesDate;
        });
        return filteredOrders;
    };

    // Hàm xóa dữ liệu tìm kiếm
    const handleClearSearch = () => {
        setSearchId('');
        setSearchSupplier('');
        setSearchStatus('');
        setSearchDate('');
        fetchOrders(); // Render lại toàn bộ dữ liệu
    };

    const columns = [
        {
            title: 'ID Đơn Nhập',
            dataIndex: 'ImportOrderId',
        },
        {
            title: 'Nhà Cung Cấp',
            dataIndex: 'SupplierID',
        },
        {
            title: 'Trạng Thái',
             render: (_, record) => <HorizontalTimeline statusKey={record.Status} orderStatuses={orderStatuses} />,
            //render: (_, record) => renderHorizontalTimeline(record.Status),
            width: "40%", // Chiếm 50% bảng
        },
        {
            title: 'Ngày Nhập',
            dataIndex: 'ImportDate',
            render: (text) => new Date(text).toLocaleDateString(),
        },
        {
            title: 'Ghi Chú',
            dataIndex: 'Note',
        },
        {
            title: 'Hành Động',
            render: (_, record) => (
                <Space size="middle">
                    <Link to={`/orders-import/${record.ImportOrderId}`}>Xem</Link>
                    <Button onClick={() => showEditOrderModal(record.ImportOrderId)}>Chỉnh Sửa</Button>
                    <Button onClick={() => showDeleteOrderModal(record)} danger>Xóa</Button>
                </Space>
            ),
        },
    ];

    const filteredOrders = handleSearch(); // Lấy danh sách đơn hàng đã lọc
    const paginatedOrders = filteredOrders.slice((currentPage - 1) * pageSize, currentPage * pageSize); // Phân trang

    return (
        <div style={{ padding: "20px" }}>
            <h2 style={{ 
                textAlign: "start", 
                fontSize: "24px", 
                color: "#1890ff", // Màu sắc tiêu đề
                fontWeight: "bold", // Đậm
                textShadow: "1px 1px 2px rgba(0, 0, 0, 0.1)", // Bóng đổ nhẹ
                marginBottom: "90px" // Khoảng cách dưới tiêu đề
            }}>
                Quản lý yêu cầu nhập hàng
            </h2>
            <Space style={{ marginBottom: 20 }}>
                <Input 
                    placeholder="Tìm ID Đơn Nhập" 
                    value={searchId} 
                    onChange={(e) => setSearchId(e.target.value)} 
                />
                <Select
                    placeholder="Chọn Nhà Cung Cấp"
                    value={searchSupplier}
                    onChange={value => setSearchSupplier(value)}
                    style={{ width: 200 }}
                >
                    {suppliersList.map(supplier => (
                        <Option key={supplier} value={supplier}>{supplier}</Option>
                    ))}
                </Select>
                <Select
                    placeholder="Chọn Trạng Thái"
                    value={searchStatus}
                    onChange={value => setSearchStatus(value)}
                    style={{ width: 200 }}
                >
                    {orderStatuses.map(status => (
                        <Option key={status.key} value={status.key}>{status.label}</Option>
                    ))}
                </Select>
                <DatePicker 
                    placeholder="Tìm Ngày Nhập" 
                    value={searchDate ? moment(searchDate) : null} 
                    onChange={(date, dateString) => setSearchDate(dateString)} 
                />
                <Button type="primary" onClick={handleSearch}>Tìm Kiếm</Button>
                <Button type="default" onClick={handleClearSearch}>Clear</Button>
                <Button type="primary" onClick={showAddOrderModal}>Thêm đơn nhập</Button>
            </Space>

            <Table
                dataSource={paginatedOrders}
                rowKey="ImportOrderId"
                loading={loading}
                bordered
                pagination={{
                    current: currentPage,
                    pageSize: pageSize,
                    total: filteredOrders.length,
                    onChange: (page, pageSize) => {
                        setCurrentPage(page);
                        setPageSize(pageSize);
                    },
                }}
                columns={columns}
            />

            {/* Modal Thêm Đơn Nhập */}
            <AddImportOrderModal
                visible={isAddModalOpen}
                onCancel={() => setIsAddModalOpen(false)}
                onAdd={handleAddOrder}
                suppliers={suppliersList}
                books={books}
            />

            {/* Modal Chỉnh Sửa Đơn Nhập */}
            <EditImportOrderModal
                visible={isEditModalOpen}
                onCancel={() => setIsEditModalOpen(false)}
                onEdit={handleEditOrder}
                suppliers={suppliersList}
                books={books}
                order={selectedOrder}
            />

            {/* Modal Xác Nhận Xóa */}
            <Modal
                title="Xác Nhận Xóa"
                open={isDeleteModalOpen}
                onCancel={() => setIsDeleteModalOpen(false)}
                footer={[
                    <Button key="cancel" onClick={() => setIsDeleteModalOpen(false)}>
                        Hủy
                    </Button>,
                    <Button key="delete" type="primary" danger onClick={handleDeleteOrder}>
                        Xóa
                    </Button>,
                ]}
            >
                <p>Bạn có chắc chắn muốn xóa đơn nhập này không?</p>
            </Modal>

            {/* Modal Chi Tiết Đơn Nhập */}
            <Modal
                title="Chi Tiết Đơn Nhập"
                open={isViewModalOpen}
                onCancel={() => setIsViewModalOpen(false)}
                footer={null}
            >
                {selectedOrder && (
                    <div>
                        <p>ID Đơn Nhập: {selectedOrder.ImportOrderId}</p>
                        <p>Nhà Cung Cấp: {selectedOrder.SupplierID}</p>
                        <p>Ngày Nhập: {new Date(selectedOrder.ImportDate).toLocaleDateString()}</p>
                        <p>Ghi Chú: {selectedOrder.Note}</p>
                        <p>Người Tạo: {selectedOrder.CreatedBy}</p>
                        <p>Ngày Tạo: {new Date(selectedOrder.Created_Date).toLocaleString()}</p>
                        <p>Trạng Thái: {selectedOrder.Status || 'Chưa xác định'}</p>

                        {/* Hiển thị tổng số sách và tổng giá */}
                        <h3>Thông Tin Tổng Hợp</h3>
                        <p>Tổng Số Sách: {selectedOrder.totalQuantity}</p>
                        <p>Tổng Giá: {selectedOrder.totalPrice} VNĐ</p>

                        {/* Hiển thị danh sách chi tiết đơn nhập */}
                        <h3>Chi Tiết Đơn Nhập</h3>
                        {orderDetails && orderDetails.length > 0 ? (
                            <Table
                                dataSource={orderDetails}
                                rowKey="BookId" // Sử dụng trường khóa chính
                                columns={[
                                    {
                                        title: 'ID Sách',
                                        dataIndex: 'BookId',
                                        key: 'BookId',
                                    },
                                    {
                                        title: 'Số Lượng',
                                        dataIndex: 'Quantity',
                                        key: 'Quantity',
                                    },
                                    {
                                        title: 'Đơn Giá',
                                        dataIndex: 'Price',
                                        key: 'Price',
                                    },
                                ]}
                            />
                        ) : (
                            <p>Không có chi tiết nào.</p>
                        )}
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default ImportOrderList;