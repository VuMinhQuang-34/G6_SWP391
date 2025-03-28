import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { Table, Select, Button, Card, Space, Pagination, Popconfirm, Modal, Form, Input, InputNumber, Row, Col, Typography, Tooltip, Badge, Tag, Spin, Divider, Statistic, Alert } from "antd";
import { SearchOutlined, PlusOutlined, ReloadOutlined, DeleteOutlined, EyeOutlined, QuestionCircleOutlined, HomeOutlined, BookOutlined, InboxOutlined, DashboardOutlined, InfoCircleOutlined } from "@ant-design/icons";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './location.css'; // Tạo file CSS riêng cho component này

const API_BASE_URL = "http://localhost:9999/api"; // Update API URL

const { Option } = Select;
const { Title, Text } = Typography;

// Component simulating warehouse with improved interface
const WarehouseVisualizer = ({ shelves, bins, selectedShelf, onSelectShelf }) => {
    const [warehouseData, setWarehouseData] = useState({
        shelves: [],
        allBins: []
    });
    const [hoverInfo, setHoverInfo] = useState(null);

    useEffect(() => {
        if (shelves && bins) {
            setWarehouseData({
                shelves: shelves,
                allBins: bins
            });
        }
    }, [shelves, bins]);

    // Tính toán số liệu thống kê
    const statsData = React.useMemo(() => {
        if (!bins || bins.length === 0) return { empty: 0, low: 0, medium: 0, high: 0, total: 0 };

        let empty = 0, low = 0, medium = 0, high = 0;
        bins.forEach(bin => {
            const ratio = bin.Quantity_Current / bin.Quantity_Max_Limit;
            if (bin.Quantity_Current === 0) empty++;
            else if (ratio < 0.5) low++;
            else if (ratio < 0.8) medium++;
            else high++;
        });

        return { empty, low, medium, high, total: bins.length };
    }, [bins]);

    // Calculate the number of shelves per row based on total shelves
    const getShelvesPerRow = (totalShelves) => {
        if (totalShelves <= 4) return 2;
        if (totalShelves <= 9) return 3;
        if (totalShelves <= 16) return 4;
        return 5; // Maximum 5 shelves per row
    };

    // Get the number of shelves per row
    const shelvesPerRow = getShelvesPerRow(warehouseData.shelves.length);

    return (
        <div className="warehouse-visualizer">
            <div className="warehouse-header">
                <Title level={4} className="warehouse-title">
                    <HomeOutlined /> Warehouse Layout
                </Title>
                <div className="warehouse-stats">
                    <Tag color="default" className="stat-tag">Total: {statsData.total} bins</Tag>
                    <Tag color="default" className="stat-tag">Empty: {statsData.empty}</Tag>
                    <Tag color="success" className="stat-tag">Low books: {statsData.low}</Tag>
                    <Tag color="warning" className="stat-tag">Medium books: {statsData.medium}</Tag>
                    <Tag color="error" className="stat-tag">High books: {statsData.high}</Tag>
                </div>
            </div>

            <Alert
                message="Instructions"
                description="Click on a shelf to filter the bin list. Hover over a bin to see detailed information."
                type="info"
                showIcon
                closable
                className="warehouse-guide"
            />

            <div className="warehouse-container">
                {/* Background grid */}
                <div className="warehouse-grid"></div>

                {/* Cửa ra vào */}
                <div className="warehouse-door">
                    <div className="door-label">Cửa ra vào</div>
                </div>

                {/* Draw shelves and bins */}
                {warehouseData.shelves.map((shelf, index) => {
                    // Calculate shelf position in warehouse (automatic layout)
                    const shelfWidth = 90;  // % of parent (divided by number of shelves per row)
                    const shelfHeight = 80; // px (giảm chiều cao)
                    const shelfMargin = 15;  // px (giảm margin)

                    const row = Math.floor(index / shelvesPerRow);
                    const col = index % shelvesPerRow;

                    const left = (col * (shelfWidth / shelvesPerRow + 2)) + 5; // % (điều chỉnh spacing)
                    const top = (row * (shelfHeight + shelfMargin)) + 50; // px từ trên xuống

                    // Filter bins by current shelf
                    const shelfBins = warehouseData.allBins.filter(bin => bin.ShelfId === shelf.ShelfId);

                    // Calculate layout for bins inside shelf
                    const maxBinsPerRow = Math.min(Math.ceil(Math.sqrt(shelfBins.length * 2)), 6);
                    const binGridTemplate = `repeat(auto-fill, minmax(${100 / maxBinsPerRow}%, 1fr))`;

                    const isSelected = selectedShelf === shelf.ShelfId;

                    return (
                        <div
                            key={shelf.ShelfId}
                            className={`warehouse-shelf ${isSelected ? 'shelf-selected' : ''}`}
                            style={{
                                left: `${left}%`,
                                top: `${top}px`,
                                width: `${shelfWidth / shelvesPerRow}%`,
                                height: `${shelfHeight}px`,
                            }}
                            onClick={() => onSelectShelf(shelf.ShelfId)}
                            title={`Shelf: ${shelf.ShelfId} - ${shelf.Name}`}
                        >
                            <div className="shelf-header">
                                <InboxOutlined className="shelf-icon" />
                                {shelf.ShelfId} - {shelf.Name}
                            </div>

                            <div className="shelf-bins" style={{ display: 'grid', gridTemplateColumns: binGridTemplate }}>
                                {/* Draw bins in shelf */}
                                {shelfBins.map(bin => {
                                    // Calculate color based on book quantity
                                    const binFillPercentage = bin.Quantity_Current / bin.Quantity_Max_Limit;
                                    let binClass = "bin-empty";

                                    if (bin.Quantity_Current > 0) {
                                        if (binFillPercentage < 0.5) {
                                            binClass = "bin-low";
                                        } else if (binFillPercentage < 0.8) {
                                            binClass = "bin-medium";
                                        } else {
                                            binClass = "bin-high";
                                        }
                                    }

                                    return (
                                        <div
                                            key={bin.BinId}
                                            className={`warehouse-bin ${binClass}`}
                                            onMouseEnter={() => setHoverInfo(bin)}
                                            onMouseLeave={() => setHoverInfo(null)}
                                        >
                                            <div className="bin-fill" style={{ height: `${binFillPercentage * 100}%` }}></div>
                                            <div className="bin-label">{bin.BinId}</div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}

                {/* Bin information tooltip on hover */}
                {hoverInfo && (
                    <div className="bin-tooltip" style={{
                        top: '10px',
                        right: '10px',
                    }}>
                        <div className="tooltip-header">
                            <BookOutlined /> Bin Information
                        </div>
                        <div className="tooltip-content">
                            <p><strong>Bin ID:</strong> {hoverInfo.BinId}</p>
                            <p><strong>Shelf:</strong> {hoverInfo.ShelfId}</p>
                            <p><strong>Current Books:</strong> {hoverInfo.Quantity_Current}/{hoverInfo.Quantity_Max_Limit}</p>
                            <div className="tooltip-progress">
                                <div
                                    className="progress-bar"
                                    style={{ width: `${(hoverInfo.Quantity_Current / hoverInfo.Quantity_Max_Limit) * 100}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Color legend */}
            <div className="warehouse-legend">
                <div className="legend-title">Legend:</div>
                <div className="legend-items">
                    <div className="legend-item">
                        <div className="legend-color bin-empty-color"></div>
                        <div className="legend-label">Empty (0 books)</div>
                    </div>
                    <div className="legend-item">
                        <div className="legend-color bin-low-color"></div>
                        <div className="legend-label">Low books (&lt;50%)</div>
                    </div>
                    <div className="legend-item">
                        <div className="legend-color bin-medium-color"></div>
                        <div className="legend-label">Medium books (50-80%)</div>
                    </div>
                    <div className="legend-item">
                        <div className="legend-color bin-high-color"></div>
                        <div className="legend-label">High books (&gt;80%)</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const Location = () => {
    const [bins, setBins] = useState([]);
    const [allBins, setAllBins] = useState([]); // Add state for all bins
    const [shelves, setShelves] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchShelfId, setSearchShelfId] = useState("");
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 10,
        total: 0
    });
    const [deletingBinId, setDeletingBinId] = useState(null);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [form] = Form.useForm();
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        fetchShelves();
        fetchAllBins(); // Lấy tất cả bins cho visualizer
    }, []);

    useEffect(() => {
        fetchBins();
    }, [pagination.current, pagination.pageSize]);

    // Lấy tất cả bins không phân trang cho visualizer
    const fetchAllBins = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/bins?limit=1000`); // Limit cao để lấy tất cả
            setAllBins(response.data.data || response.data);
        } catch (error) {
            console.error("Lỗi khi lấy tất cả bins:", error);
        }
    };

    // Lấy danh sách tất cả các Bin với phân trang và tìm kiếm
    const fetchBins = async () => {
        setLoading(true);
        try {
            const params = {
                page: pagination.current,
                limit: pagination.pageSize,
                ...(searchShelfId && { shelfId: searchShelfId })
            };

            // Chuyển đổi params thành query string
            const queryString = Object.keys(params)
                .map(key => `${key}=${params[key]}`)
                .join('&');

            const response = await axios.get(`${API_BASE_URL}/bins?${queryString}`);

            setBins(response.data.data || response.data);
            setPagination({
                ...pagination,
                total: response.data.total || response.data.length
            });
        } catch (error) {
            console.error("Lỗi khi lấy danh sách Bin:", error);
        } finally {
            setLoading(false);
        }
    };

    // Lấy danh sách Shelf để chọn trong dropdown
    const fetchShelves = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/shelfs`);
            setShelves(response.data);
        } catch (error) {
            console.error("Lỗi khi lấy danh sách Shelf:", error);
        }
    };

    // Xử lý tìm kiếm theo `ShelfId`
    const handleSearch = async () => {
        setPagination({
            ...pagination,
            current: 1 // Reset về trang đầu tiên khi tìm kiếm
        });
        await fetchBins();
    };

    // Reset bộ lọc tìm kiếm
    const resetFilters = () => {
        setSearchShelfId("");
        setPagination({
            ...pagination,
            current: 1
        });
        fetchBins();
    };

    // Xử lý chọn kệ từ visualizer
    const handleSelectShelf = (shelfId) => {
        setSearchShelfId(shelfId);
        handleSearch();
    };

    // Xử lý thay đổi trang
    const handleTableChange = (page, pageSize) => {
        setPagination({
            ...pagination,
            current: page,
            pageSize: pageSize
        });
    };

    // Hiển thị modal thêm mới Bin
    const showAddModal = () => {
        form.resetFields();
        setIsModalVisible(true);
    };

    // Đóng modal
    const handleCancel = () => {
        setIsModalVisible(false);
        form.resetFields();
    };

    // Xử lý thêm mới Bin
    const handleAddBin = async (values) => {
        setIsSaving(true);
        try {
            // Validate Quantity_Max_Limit before sending
            if (!values.Quantity_Max_Limit || values.Quantity_Max_Limit <= 0) {
                toast.error('Số lượng sách tối đa phải lớn hơn 0!');
                setIsSaving(false);
                return;
            }

            const binData = {
                ...values,
                Quantity_Current: 0 // Mặc định số lượng hiện tại là 0
            };

            const response = await axios.post(`${API_BASE_URL}/bins`, binData);

            if (response.status === 201) {
                toast.success("Thêm bin mới thành công", { autoClose: 2000 });
                setIsModalVisible(false);
                fetchBins();
                fetchAllBins(); // Cập nhật visualizer
            } else {
                toast.error("Thêm bin thất bại");
            }
        } catch (error) {
            if (error.response && error.response.data && error.response.data.error) {
                toast.error(`Thêm bin thất bại: ${error.response.data.error}`);
            } else {
                toast.error("Lỗi khi thêm bin mới");
            }
            console.error("Lỗi khi thêm bin:", error);
        } finally {
            setIsSaving(false);
        }
    };

    // Xử lý xóa bin
    const handleDeleteBin = async (binId) => {
        setDeletingBinId(binId); // Bắt đầu loading
        try {
            const response = await axios.delete(`${API_BASE_URL}/bins/${binId}`);

            if (response.data.success) {
                toast.success(`Xóa bin ${binId} thành công`, { autoClose: 2000 });
                // Refresh danh sách bin sau khi xóa
                fetchBins();
                fetchAllBins(); // Cập nhật visualizer
            } else {
                toast.error(`Xóa bin thất bại: ${response.data.message}`);
            }
        } catch (error) {
            if (error.response && error.response.data && error.response.data.message) {
                toast.error(`Xóa bin thất bại: ${error.response.data.message}`);
            } else {
                toast.error('Lỗi khi xóa bin');
            }
            console.error("Lỗi khi xóa bin:", error);
        } finally {
            setDeletingBinId(null); // Kết thúc loading
        }
    };

    // Columns with improved styling
    const columns = [
        {
            title: "Bin ID",
            dataIndex: "BinId",
            key: "BinId",
            sorter: (a, b) => a.BinId.localeCompare(b.BinId),
            render: (text) => <span className="bin-id">{text}</span>,
        },
        {
            title: "Shelf ID",
            dataIndex: "ShelfId",
            key: "ShelfId",
            render: (text) => <Tag color="blue">{text}</Tag>,
        },
        {
            title: "Bin Name",
            dataIndex: "Name",
            key: "Name",
        },
        {
            title: "Book Quantity",
            key: "book_quantity",
            render: (_, record) => (
                <Tooltip title={`${record.Quantity_Current} / ${record.Quantity_Max_Limit}`}>
                    <div className="quantity-container">
                        <div className="quantity-text">
                            {record.Quantity_Current}/{record.Quantity_Max_Limit}
                        </div>
                        <div className="quantity-bar">
                            <div
                                className={`quantity-progress ${getQuantityClass(record.Quantity_Current, record.Quantity_Max_Limit)}`}
                                style={{ width: `${(record.Quantity_Current / record.Quantity_Max_Limit) * 100}%` }}
                            ></div>
                        </div>
                    </div>
                </Tooltip>
            ),
            sorter: (a, b) => a.Quantity_Current - b.Quantity_Current,
        },
        {
            title: "Description",
            dataIndex: "Description",
            key: "Description",
            ellipsis: true,
        },
        {
            title: "Actions",
            key: "action",
            render: (_, record) => (
                <Space size="middle" className="action-buttons">
                    {record.Quantity_Current === 0 && (
                        <Popconfirm
                            title={`Delete Bin ${record.BinId}`}
                            description="Are you sure you want to delete this bin?"
                            icon={<QuestionCircleOutlined style={{ color: 'red' }} />}
                            onConfirm={() => handleDeleteBin(record.BinId)}
                            okText="Delete"
                            cancelText="Cancel"
                            okButtonProps={{ danger: true, loading: deletingBinId === record.BinId }}
                        >
                            <Button
                                danger
                                className="delete-button"
                                icon={<DeleteOutlined />}
                                loading={deletingBinId === record.BinId}
                            >
                                Delete
                            </Button>
                        </Popconfirm>
                    )}
                </Space>
            ),
        },
    ];

    // Helper function to determine quantity class for styling
    const getQuantityClass = (current, max) => {
        const ratio = current / max;
        if (current === 0) return 'empty';
        if (ratio < 0.5) return 'low';
        if (ratio < 0.8) return 'medium';
        return 'high';
    };

    return (
        <div className="location-page">
            <ToastContainer position="top-right" />

            <div className="page-header">
                <div>
                    <Title level={3} className="page-title">
                        <DashboardOutlined /> Manage Book Warehouse
                    </Title>
                    <Text className="page-description">
                        Manage shelves, bins and distribute books in the warehouse
                    </Text>
                </div>
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={showAddModal}
                    className="add-button"
                >
                    Add Bin
                </Button>
            </div>

            <Row gutter={[24, 24]} className="content-row">
                {/* Phần bên trái - Bảng dữ liệu (60%) */}
                <Col xs={24} xl={14} className="table-column">
                    <Card bordered={false} className="data-card">
                        <div className="card-title-section">
                            <Title level={4} className="card-title">
                                <InboxOutlined /> Bin List
                            </Title>

                            <div className="search-section">
                                <Select
                                    showSearch
                                    placeholder="Select Shelf"
                                    value={searchShelfId}
                                    onChange={setSearchShelfId}
                                    className="shelf-select"
                                    allowClear
                                >
                                    <Option value="">All</Option>
                                    {shelves.map((shelf) => (
                                        <Option key={shelf.ShelfId} value={shelf.ShelfId}>
                                            {shelf.ShelfId} - {shelf.Name}
                                        </Option>
                                    ))}
                                </Select>

                                <Space>
                                    <Button
                                        type="primary"
                                        icon={<SearchOutlined />}
                                        onClick={handleSearch}
                                        className="action-button search-button"
                                    >
                                        Search
                                    </Button>
                                    <Button
                                        icon={<ReloadOutlined />}
                                        onClick={resetFilters}
                                        className="action-button"
                                    >
                                        Refresh
                                    </Button>
                                </Space>
                            </div>
                        </div>

                        <Spin spinning={loading} tip="Loading data...">
                            <Table
                                columns={columns}
                                dataSource={bins}
                                rowKey="BinId"
                                pagination={false}
                                className="data-table"
                                rowClassName={(record) => `bin-row ${getQuantityClass(record.Quantity_Current, record.Quantity_Max_Limit)}-row`}
                            />
                        </Spin>

                        <div className="pagination-container">
                            <Pagination
                                current={pagination.current}
                                pageSize={pagination.pageSize}
                                total={pagination.total}
                                onChange={handleTableChange}
                                showSizeChanger
                                showTotal={(total) => `Total ${total} items`}
                                className="custom-pagination"
                            />
                        </div>
                    </Card>
                </Col>

                {/* Phần bên phải - Mô phỏng kho (40%) */}
                <Col xs={24} xl={10} className="visualization-column">
                    <Card bordered={false} className="visualization-card">
                        <WarehouseVisualizer
                            shelves={shelves}
                            bins={allBins}
                            selectedShelf={searchShelfId}
                            onSelectShelf={handleSelectShelf}
                        />
                    </Card>
                </Col>
            </Row>

            {/* Modal thêm mới Bin */}
            <Modal
                title={
                    <div className="modal-title">
                        <PlusOutlined className="modal-icon" />
                        <span>Add New Bin</span>
                    </div>
                }
                visible={isModalVisible}
                onCancel={handleCancel}
                footer={null}
                maskClosable={false}
                className="custom-modal"
                destroyOnClose
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleAddBin}
                    className="bin-form"
                >
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                name="BinId"
                                label="Bin ID"
                                rules={[
                                    {
                                        required: true,
                                        message: 'Please enter Bin ID!'
                                    },
                                    {
                                        pattern: /^[A-Za-z0-9-_]+$/,
                                        message: 'Bin ID can only contain letters, numbers, dash or underscore'
                                    }
                                ]}
                            >
                                <Input placeholder="Enter Bin ID" prefix={<InboxOutlined />} />
                            </Form.Item>
                        </Col>

                        <Col span={12}>
                            <Form.Item
                                name="ShelfId"
                                label="Shelf"
                                rules={[
                                    {
                                        required: true,
                                        message: 'Please select a shelf!'
                                    }
                                ]}
                            >
                                <Select
                                    showSearch
                                    placeholder="Select shelf"
                                    optionFilterProp="children"
                                >
                                    {shelves.map((shelf) => (
                                        <Option key={shelf.ShelfId} value={shelf.ShelfId}>
                                            {shelf.ShelfId} - {shelf.Name}
                                        </Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        </Col>
                    </Row>

                    <Form.Item
                        name="Name"
                        label="Bin Name"
                        rules={[
                            {
                                required: true,
                                message: 'Please enter Bin Name!'
                            }
                        ]}
                    >
                        <Input placeholder="Enter Bin Name" />
                    </Form.Item>

                    <Form.Item
                        name="Quantity_Max_Limit"
                        label="Maximum Book Quantity"
                        rules={[
                            {
                                required: true,
                                message: 'Vui lòng nhập số lượng sách tối đa!'
                            },
                            {
                                type: 'number',
                                min: 1,
                                message: 'Số lượng phải lớn hơn 0!'
                            }
                        ]}
                    >
                        <InputNumber
                            placeholder="Nhập số lượng tối đa"
                            style={{ width: '100%' }}
                            min={1}
                            precision={0}
                            onKeyDown={(e) => {
                                // Ngăn nhập dấu âm, chữ e (exponential) và các ký tự không phải số
                                if (e.key === '-' || e.key === 'e' || e.key === '.' || e.key === ',') {
                                    e.preventDefault();
                                }
                            }}
                            parser={(value) => {
                                // Chuyển đổi giá trị thành số nguyên dương
                                const parsed = parseInt(value, 10);
                                if (isNaN(parsed) || parsed <= 0) {
                                    return '';
                                }
                                return parsed;
                            }}
                        />
                    </Form.Item>

                    <Form.Item
                        name="Description"
                        label="Mô tả"
                    >
                        <Input.TextArea
                            placeholder="Nhập mô tả cho Bin (không bắt buộc)"
                            rows={4}
                        />
                    </Form.Item>

                    <Form.Item className="form-actions">
                        <Space>
                            <Button onClick={handleCancel} className="cancel-button">
                                Hủy
                            </Button>
                            <Button type="primary" htmlType="submit" loading={isSaving} className="submit-button">
                                Thêm mới
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default Location;
