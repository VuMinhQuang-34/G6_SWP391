import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { Table, Select, Button, Card, Space, Pagination, Popconfirm, Modal, Form, Input, InputNumber, Row, Col, Typography, Tooltip, Badge, Tag, Spin, Divider, Statistic, Alert } from "antd";
import { SearchOutlined, PlusOutlined, ReloadOutlined, DeleteOutlined, EyeOutlined, QuestionCircleOutlined, HomeOutlined, BookOutlined, InboxOutlined, DashboardOutlined, InfoCircleOutlined } from "@ant-design/icons";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './location.css'; // Tạo file CSS riêng cho component này

const API_BASE_URL = "http://localhost:9999/api"; // Cập nhật URL API

const { Option } = Select;
const { Title, Text } = Typography;

// Component mô phỏng kho với giao diện cải tiến
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

    // Tính toán số lượng kệ mỗi hàng dựa trên tổng số kệ
    const getShelvesPerRow = (totalShelves) => {
        if (totalShelves <= 4) return 2;
        if (totalShelves <= 9) return 3;
        if (totalShelves <= 16) return 4;
        return 5; // Tối đa 5 kệ mỗi hàng
    };

    // Lấy số lượng kệ mỗi hàng
    const shelvesPerRow = getShelvesPerRow(warehouseData.shelves.length);

    return (
        <div className="warehouse-visualizer">
            <div className="warehouse-header">
                <Title level={4} className="warehouse-title">
                    <HomeOutlined /> Sơ đồ kho
                </Title>
                <div className="warehouse-stats">
                    <Tag color="default" className="stat-tag">Tổng số: {statsData.total} bin</Tag>
                    <Tag color="default" className="stat-tag">Trống: {statsData.empty}</Tag>
                    <Tag color="success" className="stat-tag">Ít sách: {statsData.low}</Tag>
                    <Tag color="warning" className="stat-tag">Vừa: {statsData.medium}</Tag>
                    <Tag color="error" className="stat-tag">Đầy: {statsData.high}</Tag>
                </div>
            </div>

            <Alert
                message="Hướng dẫn"
                description="Click vào kệ để lọc danh sách bin. Hover lên bin để xem thông tin chi tiết."
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

                {/* Vẽ các kệ và bin */}
                {warehouseData.shelves.map((shelf, index) => {
                    // Tính toán vị trí kệ trong kho (layout tự động)
                    const shelfWidth = 90;  // % của cha (chia cho số kệ mỗi hàng)
                    const shelfHeight = 80; // px (giảm chiều cao)
                    const shelfMargin = 15;  // px (giảm margin)
                    
                    const row = Math.floor(index / shelvesPerRow);
                    const col = index % shelvesPerRow;
                    
                    const left = (col * (shelfWidth / shelvesPerRow + 2)) + 5; // % (điều chỉnh spacing)
                    const top = (row * (shelfHeight + shelfMargin)) + 50; // px từ trên xuống
                    
                    // Lọc bin theo kệ hiện tại
                    const shelfBins = warehouseData.allBins.filter(bin => bin.ShelfId === shelf.ShelfId);
                    
                    // Tính toán layout cho bin bên trong kệ
                    const maxBinsPerRow = Math.min(Math.ceil(Math.sqrt(shelfBins.length * 2)), 6);
                    const binGridTemplate = `repeat(auto-fill, minmax(${100/maxBinsPerRow}%, 1fr))`;
                    
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
                            title={`Kệ: ${shelf.ShelfId} - ${shelf.Name}`}
                        >
                            <div className="shelf-header">
                                <InboxOutlined className="shelf-icon" />
                                {shelf.ShelfId} - {shelf.Name}
                            </div>
                            
                            <div className="shelf-bins" style={{ display: 'grid', gridTemplateColumns: binGridTemplate }}>
                                {/* Vẽ các bin trong kệ */}
                                {shelfBins.map(bin => {
                                    // Tính màu sắc dựa trên số lượng sách
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

                {/* Tooltip thông tin bin khi hover */}
                {hoverInfo && (
                    <div className="bin-tooltip" style={{ 
                        top: '10px', 
                        right: '10px',
                    }}>
                        <div className="tooltip-header">
                            <BookOutlined /> Thông tin Bin
                        </div>
                        <div className="tooltip-content">
                            <p><strong>Mã Bin:</strong> {hoverInfo.BinId}</p>
                            <p><strong>Tên:</strong> {hoverInfo.Name}</p>
                            <p><strong>Kệ:</strong> {hoverInfo.ShelfId}</p>
                            <p><strong>Sách hiện tại:</strong> {hoverInfo.Quantity_Current}/{hoverInfo.Quantity_Max_Limit}</p>
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

            {/* Thêm chú thích màu */}
            <div className="warehouse-legend">
                <div className="legend-title">Chú thích:</div>
                <div className="legend-items">
                    <div className="legend-item">
                        <div className="legend-color bin-empty-color"></div>
                        <div className="legend-label">Trống (0 sách)</div>
                    </div>
                    <div className="legend-item">
                        <div className="legend-color bin-low-color"></div>
                        <div className="legend-label">Ít sách (&lt;50%)</div>
                    </div>
                    <div className="legend-item">
                        <div className="legend-color bin-medium-color"></div>
                        <div className="legend-label">Vừa phải (50-80%)</div>
                    </div>
                    <div className="legend-item">
                        <div className="legend-color bin-high-color"></div>
                        <div className="legend-label">Đầy (&gt;80%)</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const Location = () => {
    const [bins, setBins] = useState([]);
    const [allBins, setAllBins] = useState([]); // Thêm state cho tất cả bins
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
            title: "Mã Bin",
            dataIndex: "BinId",
            key: "BinId",
            sorter: (a, b) => a.BinId.localeCompare(b.BinId),
            render: (text) => <span className="bin-id">{text}</span>,
        },
        {
            title: "Mã Shelf",
            dataIndex: "ShelfId",
            key: "ShelfId",
            render: (text) => <Tag color="blue">{text}</Tag>,
        },
        {
            title: "Tên Bin",
            dataIndex: "Name",
            key: "Name",
        },
        {
            title: "Số lượng sách",
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
                                style={{width: `${(record.Quantity_Current/record.Quantity_Max_Limit) * 100}%`}}
                            ></div>
                        </div>
                    </div>
                </Tooltip>
            ),
            sorter: (a, b) => a.Quantity_Current - b.Quantity_Current,
        },
        {
            title: "Mô tả",
            dataIndex: "Description",
            key: "Description",
            ellipsis: true,
        },
        {
            title: "Hành động",
            key: "action",
            render: (_, record) => (
                <Space size="middle" className="action-buttons">
                    {record.Quantity_Current === 0 && (
                        <Popconfirm
                            title={`Xóa Bin ${record.BinId}`}
                            description="Bạn có chắc chắn muốn xóa bin này?"
                            icon={<QuestionCircleOutlined style={{ color: 'red' }} />}
                            onConfirm={() => handleDeleteBin(record.BinId)}
                            okText="Xóa"
                            cancelText="Hủy"
                            okButtonProps={{ danger: true, loading: deletingBinId === record.BinId }}
                        >
                            <Button 
                                danger
                                className="delete-button"
                                icon={<DeleteOutlined />}
                                loading={deletingBinId === record.BinId}
                            >
                                Xóa
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
                        <DashboardOutlined /> Quản lý Kho Sách
                    </Title>
                    <Text className="page-description">
                        Quản lý kệ, bin và phân bổ sách trong kho
                    </Text>
                </div>
                <Button 
                    type="primary" 
                    icon={<PlusOutlined />} 
                    onClick={showAddModal}
                    className="add-button"
                >
                    Thêm Bin
                </Button>
            </div>

            <Row gutter={[24, 24]} className="content-row">
                {/* Phần bên trái - Bảng dữ liệu (60%) */}
                <Col xs={24} xl={14} className="table-column">
                    <Card bordered={false} className="data-card">
                        <div className="card-title-section">
                            <Title level={4} className="card-title">
                                <InboxOutlined /> Danh sách Bin
                            </Title>
                            
                            <div className="search-section">
                                <Select
                                    showSearch
                                    placeholder="Chọn Shelf"
                                    value={searchShelfId}
                                    onChange={setSearchShelfId}
                                    className="shelf-select"
                                    allowClear
                                >
                                    <Option value="">Tất cả</Option>
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
                                        Tìm kiếm
                                    </Button>
                                    <Button 
                                        icon={<ReloadOutlined />} 
                                        onClick={resetFilters}
                                        className="action-button"
                                    >
                                        Làm mới
                                    </Button>
                                </Space>
                            </div>
                        </div>

                        <Spin spinning={loading} tip="Đang tải dữ liệu...">
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
                                showTotal={(total) => `Tổng cộng ${total} mục`}
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
                        <span>Thêm mới Bin</span>
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
                                label="Mã Bin"
                                rules={[
                                    {
                                        required: true,
                                        message: 'Vui lòng nhập mã Bin!'
                                    },
                                    {
                                        pattern: /^[A-Za-z0-9-_]+$/,
                                        message: 'Mã Bin chỉ chứa chữ cái, số, dấu gạch ngang hoặc gạch dưới'
                                    }
                                ]}
                            >
                                <Input placeholder="Nhập mã Bin" prefix={<InboxOutlined />} />
                            </Form.Item>
                        </Col>
                        
                        <Col span={12}>
                            <Form.Item
                                name="ShelfId"
                                label="Kệ"
                                rules={[
                                    {
                                        required: true,
                                        message: 'Vui lòng chọn kệ!'
                                    }
                                ]}
                            >
                                <Select
                                    showSearch
                                    placeholder="Chọn kệ"
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
                        label="Tên Bin"
                        rules={[
                            {
                                required: true,
                                message: 'Vui lòng nhập tên Bin!'
                            }
                        ]}
                    >
                        <Input placeholder="Nhập tên Bin" />
                    </Form.Item>

                    <Form.Item
                        name="Quantity_Max_Limit"
                        label="Số lượng sách tối đa"
                        rules={[
                            {
                                required: true,
                                message: 'Vui lòng nhập số lượng sách tối đa!'
                            },
                            {
                                validator: (_, value) => {
                                    if (value === undefined || value === null) {
                                        return Promise.reject('Vui lòng nhập số lượng sách tối đa!');
                                    }
                                    if (!Number.isInteger(value)) {
                                        return Promise.reject('Số lượng phải là số nguyên!');
                                    }
                                    if (value <= 0) {
                                        return Promise.reject('Số lượng phải lớn hơn 0!');
                                    }
                                    return Promise.resolve();
                                }
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
