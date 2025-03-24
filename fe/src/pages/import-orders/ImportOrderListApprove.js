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
import ApproveImportOrderModal from "./ApproveImportOrderModal";
import HorizontalTimeline from "../../components/HorizontalTimeline";
import moment from "moment";
import { toast } from "react-toastify";

const { Option } = Select;

const ImportOrderListApprove = () => {
    const { user } = useContext(AuthContext); // Get user from AuthContext
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

    // State for search
    const [searchId, setSearchId] = useState('');
    const [searchSupplier, setSearchSupplier] = useState('');
    const [searchStatus, setSearchStatus] = useState('');
    const [searchDate, setSearchDate] = useState('');

    // State for pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    // Call API to get import orders and books
    useEffect(() => {
        fetchOrders();
        fetchBooks();
    }, []);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const params = {
                Status: ["New"], // Add Status criteria
                ...(searchId && { ImportOrderId: searchId }), // Add ID criteria if available
                ...(searchSupplier && { SupplierID: searchSupplier }), // Add supplier criteria if available
                ...(searchDate && { ImportDate: searchDate }), // Add import date criteria if available
            };
            const response = await axios.get("http://localhost:9999/api/import-orders", { params });
            setOrders(response.data.orders); // Make sure to use the response variable here
        } catch (error) {
            message.error("Error loading import order list!");
        } finally {
            setLoading(false);
        }
    };

    const fetchBooks = async () => {
        try {
            const response = await axios.get("http://localhost:9999/api/books");
            setBooks(response.data.data); // Note: Book data is in `data`
        } catch (error) {
            message.error("Error loading book list!");
        }
    };

    // Function to open add order modal
    const showAddOrderModal = () => {
        setIsAddModalOpen(true);
        form.resetFields();
    };

    // Function to open edit order modal
    const showEditOrderModal = async (orderId) => {
        try {
            const response = await axios.get(`http://localhost:9999/api/import-orders/${orderId}`);
            setSelectedOrder(response.data); // Set selected order from API response
            setIsEditModalOpen(true); // Open edit modal
        } catch (error) {
            message.error("Error loading import order information!");
        }
    };

    // Function to open delete confirmation modal
    const showDeleteOrderModal = (order) => {
        setSelectedOrder(order);
        setIsDeleteModalOpen(true);
    };


    // Function to handle order approval
    const handleApproveOrder = async (order, orderId) => {
        try {
            const payload = {
                Status: order.Status,
                LogStatus: order.LogStatus,
                CreatedBy: user.userId,
                LogNote: order.LogNote
            }
            await axios.patch(`http://localhost:9999/api/import-orders/${orderId}`, payload);
            message.success("Import order approved successfully!");
            fetchOrders(); // Refresh orders
            setIsEditModalOpen(false); // Close modal
            toast.success(`Approval successful`, { autoClose: 2000 });
        } catch (error) {
            message.error("Error updating import order!");
        }
    };

    // Function to handle delete confirmation
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

    // Handle book selection
    const handleBookSelect = (selectedBooks) => {
        const newOrderDetails = selectedBooks.map((bookId) => ({
            BookId: bookId,
            Quantity: 1, // Default quantity is 1
            Price: 0, // Price can be updated later
        }));
        setOrderDetails(newOrderDetails);
    };

    // Update price and quantity for each book
    const handleDetailChange = (index, field, value) => {
        const newDetails = [...orderDetails];
        newDetails[index][field] = value;
        setOrderDetails(newDetails);
    };

    // Calculate total price for each book
    const calculateTotalPrice = (quantity, price) => {
        return quantity * price;
    };

    // Calculate total book quantity and total amount
    const totalQuantity = orderDetails.reduce((total, detail) => total + (parseInt(detail.Quantity) || 0), 0);
    const totalPrice = orderDetails.reduce((total, detail) => total + calculateTotalPrice(detail.Quantity, detail.Price), 0);

    // Search function
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

    // Clear search data
    const handleClearSearch = () => {
        setSearchId('');
        setSearchSupplier('');
        setSearchStatus('');
        setSearchDate('');
        fetchOrders(); // Reload all data
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
            width: "40%", // Takes 40% of the table
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
            title: 'Actions',
            render: (_, record) => (
                <Space size="middle">
                    <Link to={`/orders-import/${record.ImportOrderId}`}>View</Link>
                    {record.Status === "New" && (
                        <Button onClick={() => showEditOrderModal(record.ImportOrderId)}>Approve</Button>
                    )}
                </Space>
            ),
        },
    ];

    const filteredOrders = handleSearch(); // Get filtered order list
    const paginatedOrders = filteredOrders.slice((currentPage - 1) * pageSize, currentPage * pageSize); // Paginate

    return (
        <div style={{ padding: "20px" }}>
            <h2 style={{
                textAlign: "start",
                fontSize: "24px",
                color: "#1890ff", // Title color
                fontWeight: "bold", // Bold
                textShadow: "1px 1px 2px rgba(0, 0, 0, 0.1)", // Light shadow
                marginBottom: "90px" // Bottom margin
            }}>
                Approve Import Orders
            </h2>
            <Space style={{ marginBottom: 20 }}>
                <Input
                    placeholder="Search by Import Order ID"
                    value={searchId}
                    onChange={(e) => setSearchId(e.target.value)}
                />
                <Select
                    placeholder="Select Supplier"
                    value={searchSupplier}
                    onChange={value => setSearchSupplier(value)}
                    style={{ width: 200 }}
                >
                    {suppliersList.map(supplier => (
                        <Option key={supplier} value={supplier}>{supplier}</Option>
                    ))}
                </Select>
                <Select
                    placeholder="Select Status"
                    value={searchStatus}
                    onChange={value => setSearchStatus(value)}
                    style={{ width: 200 }}
                >
                    {orderStatuses.map(status => (
                        <Option key={status.key} value={status.key}>{status.label}</Option>
                    ))}
                </Select>
                <DatePicker
                    placeholder="Search by Import Date"
                    value={searchDate ? moment(searchDate) : null}
                    onChange={(date, dateString) => setSearchDate(dateString)}
                />
                <Button type="primary" onClick={handleSearch}>Search</Button>
                <Button type="default" onClick={handleClearSearch}>Clear</Button>
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



            {/* Approve Import Order Modal */}
            <ApproveImportOrderModal
                visible={isEditModalOpen}
                onCancel={() => setIsEditModalOpen(false)}
                onEdit={handleApproveOrder}
                suppliers={suppliersList}
                books={books}
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
                        <p>Created Date: {new Date(selectedOrder.Created_Date).toLocaleString()}</p>
                        <p>Status: {selectedOrder.Status || 'Undefined'}</p>

                        {/* Display total book quantity and total price */}
                        <h3>Summary Information</h3>
                        <p>Total Book Quantity: {selectedOrder.totalQuantity}</p>
                        <p>Total Price: {selectedOrder.totalPrice} VND</p>

                        {/* Display import order details list */}
                        <h3>Import Order Details</h3>
                        {orderDetails && orderDetails.length > 0 ? (
                            <Table
                                dataSource={orderDetails}
                                rowKey="BookId" // Use primary key field
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
                            <p>No details available.</p>
                        )}
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default ImportOrderListApprove;