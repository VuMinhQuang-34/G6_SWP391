import React, { useState } from 'react';
import { Table, Input, Card, Tag, Space, Select, Button, Typography, Row, Col, Tooltip } from 'antd';
import { SearchOutlined, ReloadOutlined, GlobalOutlined, PhoneOutlined, MailOutlined } from '@ant-design/icons';

const { Search } = Input;
const { Option } = Select;
const { Title } = Typography;

// Danh sách nhà cung cấp
const SUPPLIERS_DATA = [
    {
        id: 1,
        name: "Trí Tuệ - Công Ty Cổ Phần Sách & Thiết Bị Giáo Dục Trí Tuệ",
        address: "Số 10 Nguyễn Du, Q.Hai Bà Trưng, Hà Nội",
        phone: "024.3943.5656",
        email: "tritue@books.com.vn",
        status: "Active",
        taxCode: "0102345678",
        website: "www.tritue.vn"
    },
    {
        id: 2,
        name: "Công Ty Cổ Phần Sách Mcbooks",
        address: "15A Ngô Quyền, P.Tràng Tiền, Q.Hoàn Kiếm, Hà Nội",
        phone: "024.3826.7799",
        email: "mcbooks@mcbooks.vn",
        status: "Active",
        taxCode: "0103456789",
        website: "www.mcbooks.vn"
    },
    {
        id: 3,
        name: "Công Ty Cổ Phần Sách Giáo Dục Tại Thành Phố Hà Nội",
        address: "45 Trần Phú, Q.Hà Đông, Hà Nội",
        phone: "024.3856.9876",
        email: "sachgiaoduc@hn.edu.vn",
        status: "Active",
        taxCode: "0104567890",
        website: "www.sachgiaoduc-hanoi.vn"
    },
    {
        id: 4,
        name: "Công Ty Cổ Phần Dịch Vụ Xuất Bản Giáo Dục Hà Nội",
        address: "73 Lò Đúc, Q.Hai Bà Trưng, Hà Nội",
        phone: "024.3984.4321",
        email: "dvxbgd@edu.com.vn",
        status: "Active",
        taxCode: "0105678901",
        website: "www.dvxbgd.vn"
    },
    {
        id: 5,
        name: "Nhà Sách Trực Tuyến Atlazbooks",
        address: "168 Nguyễn Trãi, Q.Thanh Xuân, Hà Nội",
        phone: "024.3622.1234",
        email: "contact@atlazbooks.vn",
        status: "Active",
        taxCode: "0106789012",
        website: "www.atlazbooks.vn"
    },
    {
        id: 6,
        name: "Công Ty Cổ Phần Sách Và Thiết Bị Trường Học Hà Nội",
        address: "458 Minh Khai, Q.Hai Bà Trưng, Hà Nội",
        phone: "024.3745.6789",
        email: "thietbitruonghoc@edu.vn",
        status: "Inactive",
        taxCode: "0107890123",
        website: "www.thietbitruonghoc.vn"
    },
    {
        id: 7,
        name: "Nhà Sách Quyết Bình",
        address: "255 Giải Phóng, Q.Hai Bà Trưng, Hà Nội",
        phone: "024.3568.2345",
        email: "quyetbinh@books.vn",
        status: "Active",
        taxCode: "0108901234",
        website: "www.quyetbinh.vn"
    },
    {
        id: 8,
        name: "Công Ty Cổ Phần Truyền Thông Và Xuất Bản Amak",
        address: "86 Láng Hạ, Q.Đống Đa, Hà Nội",
        phone: "024.3678.9012",
        email: "amak@publishing.vn",
        status: "Active",
        taxCode: "0109012345",
        website: "www.amak.vn"
    },
    {
        id: 9,
        name: "Công Ty Cổ Phần Học Liệu Sư Phạm",
        address: "136 Xuân Thủy, Q.Cầu Giấy, Hà Nội",
        phone: "024.3789.0123",
        email: "hoclieusphn@edu.vn",
        status: "Active",
        taxCode: "0110123456",
        website: "www.hoclieusupham.vn"
    },
    {
        id: 10,
        name: "Nhà Sách Nguyệt Linh",
        address: "92 Khâm Thiên, Q.Đống Đa, Hà Nội",
        phone: "024.3890.1234",
        email: "nguyetlinh@books.vn",
        status: "Inactive",
        taxCode: "0111234567",
        website: "www.nguyetlinh.vn"
    },
    {
        id: 11,
        name: "Công Ty TNHH Sách Sunbooks",
        address: "227 Chùa Bộc, Q.Đống Đa, Hà Nội",
        phone: "024.3901.2345",
        email: "sunbooks@books.vn",
        status: "Active",
        taxCode: "0112345678",
        website: "www.sunbooks.vn"
    },
    {
        id: 12,
        name: "Công Ty Cổ Phần Sách QBooks",
        address: "155 Cầu Giấy, Q.Cầu Giấy, Hà Nội",
        phone: "024.3012.3456",
        email: "qbooks@books.vn",
        status: "Active",
        taxCode: "0113456789",
        website: "www.qbooks.vn"
    }
];

const Supplier = () => {
    const [searchText, setSearchText] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [filterStatus, setFilterStatus] = useState(null);
    const [sortField, setSortField] = useState(null);
    const [sortOrder, setSortOrder] = useState(null);

    // Filter suppliers based on multiple criteria
    const filteredSuppliers = SUPPLIERS_DATA.filter(supplier => {
        const matchSearch = (
            supplier.name.toLowerCase().includes(searchText.toLowerCase()) ||
            supplier.email.toLowerCase().includes(searchText.toLowerCase()) ||
            supplier.phone.includes(searchText) ||
            supplier.address.toLowerCase().includes(searchText.toLowerCase()) ||
            supplier.taxCode.includes(searchText)
        );

        const matchStatus = !filterStatus || supplier.status === filterStatus;

        return matchSearch && matchStatus;
    });

    const columns = [
        {
            title: 'Name',
            dataIndex: 'name',
            key: 'name',
            sorter: (a, b) => a.name.localeCompare(b.name),
            render: (text) => (
                <Typography.Text strong style={{ color: '#1890ff' }}>
                    {text}
                </Typography.Text>
            ),
        },
        {
            title: 'Address',
            dataIndex: 'address',
            key: 'address',
            render: (text) => (
                <Tooltip title={text}>
                    {text.length > 30 ? `${text.substring(0, 30)}...` : text}
                </Tooltip>
            ),
        },
        {
            title: 'Contact',
            key: 'contact',
            render: (_, record) => (
                <Space direction="vertical" size="small">
                    <Space>
                        <PhoneOutlined style={{ color: '#52c41a' }} />
                        {record.phone}
                    </Space>
                    <Space>
                        <MailOutlined style={{ color: '#1890ff' }} />
                        <a href={`mailto:${record.email}`}>{record.email}</a>
                    </Space>
                </Space>
            ),
        },
        {
            title: 'Website',
            dataIndex: 'website',
            key: 'website',
            render: (text) => (
                <a 
                    href={`https://${text}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{ display: 'flex', alignItems: 'center', gap: '5px' }}
                >
                    <GlobalOutlined style={{ color: '#1890ff' }} />
                    {text}
                </a>
            ),
        },
        {
            title: 'Tax Code',
            dataIndex: 'taxCode',
            key: 'taxCode',
            render: (text) => <Tag color="blue">{text}</Tag>,
        },
       
    ];

    const handleReset = () => {
        setSearchText('');
        setFilterStatus(null);
        setCurrentPage(1);
        setSortField(null);
        setSortOrder(null);
    };

    // Pagination configuration
    const paginationConfig = {
        current: currentPage,
        pageSize: pageSize,
        total: filteredSuppliers.length,
        onChange: (page, size) => {
            setCurrentPage(page);
            setPageSize(size);
        },
        showSizeChanger: true,
        showQuickJumper: true,
        pageSizeOptions: ['10', '20', '50'],
        showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} suppliers`,
    };

    return (
        <div style={{ padding: '24px' }}>
            <Card 
                bordered={false}
                style={{ 
                    borderRadius: '15px',
                    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.03), 0 2px 4px rgba(0, 0, 0, 0.03)'
                }}
            >
                <Row gutter={[0, 24]}>
                    <Col span={24}>
                        <Title level={2} style={{ margin: 0, color: '#1890ff' }}>
                            Suppliers Management
                        </Title>
                    </Col>
                    
                    <Col span={24}>
                        <Row gutter={16} align="middle">
                            <Col xs={24} sm={12} md={8} lg={6}>
                                <Search
                                    placeholder="Search by name, email, phone..."
                                    allowClear
                                    enterButton={<SearchOutlined />}
                                    size="large"
                                    value={searchText}
                                    onChange={(e) => setSearchText(e.target.value)}
                                />
                            </Col>
                            {/* <Col xs={24} sm={12} md={6} lg={4}>
                                <Select
                                    placeholder="Filter by Status"
                                    style={{ width: '100%' }}
                                    size="large"
                                    allowClear
                                    value={filterStatus}
                                    onChange={setFilterStatus}
                                >
                                    <Option value="Active">Active</Option>
                                    <Option value="Inactive">Inactive</Option>
                                </Select>
                            </Col> */}
                            <Col xs={24} sm={12} md={6} lg={4}>
                                <Button 
                                    icon={<ReloadOutlined />}
                                    size="large"
                                    onClick={handleReset}
                                    style={{ width: '100%' }}
                                >
                                    Reset Filters
                                </Button>
                            </Col>
                        </Row>
                    </Col>
                </Row>

                <div style={{ marginTop: '24px' }}>
                    <Table
                        columns={columns}
                        dataSource={filteredSuppliers}
                        rowKey="id"
                        pagination={paginationConfig}
                        scroll={{ x: 'max-content' }}
                        style={{ backgroundColor: 'white' }}
                        rowClassName={(record, index) => 
                            index % 2 === 0 ? 'table-row-light' : 'table-row-dark'
                        }
                    />
                </div>
            </Card>

            <style jsx="true">{`
                .table-row-light {
                    background-color: white;
                }
                .table-row-dark {
                    background-color: #fafafa;
                }
                .ant-table-row:hover {
                    background-color: #e6f7ff !important;
                }
            `}</style>
        </div>
    );
};

export default Supplier;
