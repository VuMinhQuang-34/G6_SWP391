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
import { orderStatuses, suppliersList } from "../../constants/variable";
import AddImportOrderModal from "./AddImportOrderModal";
import CheckImportOrderModal from "./CheckImportOrderModal";
import ApproveWMSImportOrderModal from "./ApproveWMSImportOrderModal";
import HorizontalTimeline from "../../components/HorizontalTimeline";
import moment from "moment";
import { toast } from "react-toastify";

// import ImportOrderForm from './ImportOrderForm';
const { Option } = Select;



const ImportOrderListWMS = () => {
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

    //danh sách book theo 1 đơn order
    const [importBooks, setImportBooks] = useState([]);

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
            const params = {
                Status: ["Receive"], // Add Status criteria
                ...(searchId && { ImportOrderId: searchId }), // Add ID criteria if provided
                ...(searchSupplier && { SupplierID: searchSupplier }), // Add supplier criteria if provided
                ...(searchDate && { ImportDate: searchDate }), // Add import date criteria if provided
            };
            const response = await axios.get("http://localhost:9999/api/import-orders", { params });
            setOrders(response.data.orders); // Đảm bảo sử dụng biến response ở đây
        } catch (error) {
            message.error("Error loading import orders list!");
        } finally {
            setLoading(false);
        }
    };

    const fetchBooks = async () => {
        try {
            const response = await axios.get("http://localhost:9999/api/books");
            setBooks(response.data.data); // Lưu ý: Dữ liệu sách nằm trong `data`
        } catch (error) {
            message.error("Error loading books list!");
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

            const bookList = await axios.get(`http://localhost:9999/api/import-orders/${orderId}/books`);
            setImportBooks(bookList.data);

            setIsEditModalOpen(true); // Open edit modal
        } catch (error) {
            message.error("Error loading import order information!");
        }
    };




    // Hàm xử lý phê duyệt nhập hàng
    const handleCheckOrder = async (body, orderId) => {
        try {
            console.log("handleCheckOrder body:", body);
            console.log("handleCheckOrder orderId:", orderId);

            const payload = {
                Status: body.Status,
                LogStatus: body.LogStatus,
                CreatedBy: user.userId,
                LogNote: body.LogNote,
                FaultBooks: body.FaultBooks,
                BinAllocations: body.BinAllocations
            };

            console.log("Final API payload:", payload);

            // Gọi API và trả về response để hàm gọi có thể xử lý
            const response = await axios.post(`http://localhost:9999/api/import-orders/${orderId}/approveWMS`, payload);

            // Refresh danh sách đơn hàng nhưng không hiển thị toast ở đây
            // Vì toast sẽ được hiển thị bởi component gọi đến handleCheckOrder
            fetchOrders();

            // Trả về response để component gọi có thể sử dụng
            return response;
        } catch (error) {
            console.error("Error in handleCheckOrder:", error);
            // Throw error để component gọi có thể bắt và xử lý
            throw error;
        }
    };

    // Hàm xử lý xác nhận xóa đơn nhập
    const handleDeleteOrder = async () => {
        try {
            await axios.delete(`http://localhost:9999/api/import-orders/${selectedOrder.ImportOrderId}`);
            message.success("Import order deleted successfully!");
            fetchOrders();
            setIsDeleteModalOpen(false);
        } catch (error) {
            message.error("Error deleting import order!");
        }
    };

    // Xử lý khi chọn sách
    const handleBookSelect = (selectedBooks) => {
        const newOrderDetails = selectedBooks.map((bookId) => ({
            BookId: bookId,
            Quantity: 1, // Mặc định số lượng là 1
            Price: 0, // Price can be updated later
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
            title: 'Import Order ID',
            dataIndex: 'ImportOrderId',
        },
        {
            title: 'Supplier',
            dataIndex: 'SupplierID',
        },
        {
            title: 'Status',
            render: (_, record) => <HorizontalTimeline statusKey={record.Status} orderStatuses={orderStatuses} />,
            //render: (_, record) => renderHorizontalTimeline(record.Status),
            width: "40%", // Chiếm 50% bảng
        },
        {
            title: 'Import Date',
            dataIndex: 'ImportDate',
            render: (text) => new Date(text).toLocaleDateString(),
        },
        {
            title: 'Note',
            dataIndex: 'Note',
        },
        {
            title: 'Action',
            render: (_, record) => (
                <Space size="middle">
                    <Link to={`/orders-import/${record.ImportOrderId}`}>View</Link>
                    <Button onClick={() => showEditOrderModal(record.ImportOrderId)}>Approve Import</Button>
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
                color: "#1890ff", // Title color
                fontWeight: "bold", // Đậm
                textShadow: "1px 1px 2px rgba(0, 0, 0, 0.1)", // Bóng đổ nhẹ
                marginBottom: "90px" // Space below title
            }}>
                Check Inventory
            </h2>
            <div style={{ marginBottom: "16px", display: "flex", justifyContent: "space-between" }}>
                <Space>
                    <Input
                        allowClear
                        placeholder="Search Import Order ID"
                        value={searchId}
                        onChange={(e) => setSearchId(e.target.value.trim())}
                    />
                    <Input
                        allowClear
                        placeholder="Search Supplier"
                        value={searchSupplier}
                        onChange={(e) => setSearchSupplier(e.target.value.trim())}
                    />
                    <DatePicker
                        allowClear
                        placeholder="Search Import Date"
                        value={searchDate}
                        onChange={(date) => setSearchDate(date)}
                    />
                    <Button type="primary" onClick={handleSearch}>Search</Button>
                    <Button onClick={handleClearSearch}>Clear</Button>
                    {/* <Button type="primary" onClick={showAddOrderModal}>Add Import Order</Button> */}
                </Space>
            </div>

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



            {/* Modal Chỉnh Sửa Đơn Nhập */}
            <ApproveWMSImportOrderModal
                visible={isEditModalOpen}
                onCancel={() => setIsEditModalOpen(false)}
                onEdit={handleCheckOrder}
                suppliers={suppliersList}
                books={importBooks}
                order={selectedOrder}
            />

            {/* Delete Confirmation Modal */}
            <Modal
                title="Confirm Delete"
                open={isDeleteModalOpen}
                onCancel={() => setIsDeleteModalOpen(false)}
                footer={[
                    <Button key="cancel" onClick={() => setIsDeleteModalOpen(false)}>
                        Cancel
                    </Button>,
                    <Button key="delete" type="primary" danger onClick={handleDeleteOrder}>
                        Delete
                    </Button>,
                ]}
            >
                <p>Are you sure you want to delete this import order?</p>
            </Modal>

            {/* Import Order Details Modal */}
            <Modal
                title="Import Order Details"
                open={isViewModalOpen}
                onCancel={() => setIsViewModalOpen(false)}
                footer={null}
            >
                {selectedOrder && (
                    <div>
                        <p>Import Order ID: {selectedOrder.ImportOrderId}</p>
                        <p>Supplier: {selectedOrder.SupplierID}</p>
                        <p>Import Date: {new Date(selectedOrder.ImportDate).toLocaleDateString()}</p>
                        <p>Note: {selectedOrder.Note}</p>
                        <p>Created By: {selectedOrder.CreatedBy}</p>
                        <p>Creation Date: {new Date(selectedOrder.Created_Date).toLocaleString()}</p>
                        <p>Status: {selectedOrder.Status || 'Undefined'}</p>

                        {/* Display total books and total price */}
                        <h3>Summary Information</h3>
                        <p>Total Books: {selectedOrder.totalQuantity}</p>
                        <p>Total Price: {selectedOrder.totalPrice} VND</p>

                        {/* Display import order detail list */}
                        <h3>Import Order Details</h3>
                        {orderDetails && orderDetails.length > 0 ? (
                            <Table
                                dataSource={orderDetails}
                                rowKey="BookId"
                                columns={[
                                    {
                                        title: 'Book ID',
                                        dataIndex: 'BookId',
                                        key: 'BookId',
                                    },
                                    {
                                        title: 'Quantity',
                                        dataIndex: 'Quantity',
                                        key: 'Quantity',
                                    },
                                    {
                                        title: 'Price',
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

export default ImportOrderListWMS;