import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Row, Col, Card, Statistic, Table, Progress, Spin, Alert, Divider, Typography, Badge, List, Tag, Space, Tooltip
} from 'antd';
import {
  TeamOutlined, BookOutlined, ShoppingCartOutlined, WarningOutlined, CheckCircleOutlined,
  ClockCircleOutlined, RiseOutlined, FallOutlined, DatabaseOutlined, FileTextOutlined,
  BankOutlined, UserOutlined, ApartmentOutlined, InboxOutlined, PercentageOutlined
} from '@ant-design/icons';
import { Pie, Bar, Line } from '@ant-design/plots';

const { Title, Text } = Typography;

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await axios.get('http://localhost:9999/api/dashboard');
        setDashboardData(response.data.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Đã xảy ra lỗi khi tải dữ liệu dashboard!');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <Spin size="large" tip="Đang tải dữ liệu..." />
      </div>
    );
  }

  if (error) {
    return (
      <Alert
        message="Lỗi"
        description={error}
        type="error"
        showIcon
        style={{ margin: '20px' }}
      />
    );
  }

  // Chuẩn bị dữ liệu cho biểu đồ status đơn nhập hàng
  const importOrderStatusData = [
    { type: 'Mới', value: dashboardData.importOrdersStats.newImportOrders },
    { type: 'Phê duyệt', value: dashboardData.importOrdersStats.approvedImportOrders },
    { type: 'Đã nhận', value: dashboardData.importOrdersStats.receivedImportOrders },
    { type: 'Nhập kho', value: dashboardData.importOrdersStats.approveImportOrders },
  ];

  // Chuẩn bị dữ liệu cho biểu đồ người dùng theo vai trò
  const userRoleData = dashboardData.usersStats.usersByRole.map(role => ({
    type: role.Role || 'Không rõ',
    value: role.count
  }));

  // Chuẩn bị dữ liệu cho biểu đồ tình trạng bin
  const binStatusData = [
    { type: 'Còn trống', value: dashboardData.binsStats.availableBins },
    { type: 'Đã đầy', value: dashboardData.binsStats.fullBins },
  ];

  // Cấu hình cho biểu đồ pie
  const pieConfig = {
    appendPadding: 10,
    data: importOrderStatusData,
    angleField: 'value',
    colorField: 'type',
    radius: 0.8,
    label: {
      type: 'outer',
      content: '{name} {percentage}',
    },
    interactions: [{ type: 'pie-legend-active' }, { type: 'element-active' }],
  };

  const userRolePieConfig = {
    ...pieConfig,
    data: userRoleData,
  };

  const binStatusPieConfig = {
    ...pieConfig,
    data: binStatusData,
  };

  return (
    <div className="dashboard-container" style={{ padding: '20px' }}>
      <Title level={2} style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <DatabaseOutlined /> Dashboard Tổng Quan
      </Title>

      {/* Section 1: Thống kê tổng quan */}
      <Title level={4} style={{ marginTop: '20px', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <RiseOutlined /> Thống Kê Tổng Quan
      </Title>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <Card bordered={false} className="dashboard-card">
            <Statistic
              title="Tổng Người Dùng"
              value={dashboardData.usersStats.totalUsers}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
            <div style={{ marginTop: '10px' }}>
              <Tag color="green">Hoạt động: {dashboardData.usersStats.totalActiveUsers}</Tag>
              <Tag color="red">Không hoạt động: {dashboardData.usersStats.totalInactiveUsers}</Tag>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card bordered={false} className="dashboard-card">
            <Statistic
              title="Tổng Sách"
              value={dashboardData.booksStats.totalBooks}
              prefix={<BookOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
            <div style={{ marginTop: '10px' }}>
              <Tag color="blue">Mới (30 ngày): {dashboardData.booksStats.recentBooks}</Tag>
              <Tag color="cyan">Số lượng: {dashboardData.booksStats.totalBookQuantity}</Tag>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card bordered={false} className="dashboard-card">
            <Statistic
              title="Đơn Nhập Hàng"
              value={dashboardData.importOrdersStats.totalImportOrders}
              prefix={<ShoppingCartOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
            <div style={{ marginTop: '10px' }}>
              <Tag color="purple">Mới: {dashboardData.importOrdersStats.newImportOrders}</Tag>
              <Tag color="geekblue">Đã phê duyệt: {dashboardData.importOrdersStats.approvedImportOrders}</Tag>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card bordered={false} className="dashboard-card">
            <Statistic
              title="Sách Lỗi"
              value={dashboardData.faultsStats.totalFaults}
              prefix={<WarningOutlined />}
              valueStyle={{ color: '#cf1322' }}
            />
            <div style={{ marginTop: '10px' }}>
              <Tag color="orange">Mới (30 ngày): {dashboardData.faultsStats.recentFaults}</Tag>
              <Progress 
                percent={Math.round((dashboardData.faultsStats.totalFaults / dashboardData.booksStats.totalBookQuantity) * 100 * 100) / 100} 
                size="small" 
                status="exception" 
              />
            </div>
          </Card>
        </Col>
      </Row>

      {/* Section 2: Thống kê chi tiết */}
      <Row gutter={[16, 16]} style={{ marginTop: '20px' }}>
        <Col xs={24} lg={12}>
          <Card 
            title={<><InboxOutlined /> Trạng Thái Đơn Nhập Hàng</>} 
            bordered={false} 
            className="dashboard-card"
          >
            <Pie {...pieConfig} />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card 
            title={<><UserOutlined /> Người Dùng Theo Vai Trò</>} 
            bordered={false} 
            className="dashboard-card"
          >
            <Pie {...userRolePieConfig} />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card 
            title={<><ApartmentOutlined /> Trạng Thái Bin</>} 
            bordered={false} 
            className="dashboard-card"
          >
            <Pie {...binStatusPieConfig} />
          </Card>
        </Col>
        <Col xs={24} lg={16}>
          <Card 
            title={<><WarningOutlined /> Cảnh Báo Tồn Kho</>} 
            bordered={false} 
            className="dashboard-card"
          >
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Statistic
                  title="Sách Tồn Kho Thấp"
                  value={dashboardData.stockStats.lowStockItems}
                  valueStyle={{ color: '#cf1322' }}
                  prefix={<FallOutlined />}
                />
                <Progress
                  percent={Math.round((dashboardData.stockStats.lowStockItems / dashboardData.booksStats.totalBooks) * 100)}
                  status="exception"
                  strokeColor="#cf1322"
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="Sách Tồn Kho Cao"
                  value={dashboardData.stockStats.overStockItems}
                  valueStyle={{ color: '#faad14' }}
                  prefix={<RiseOutlined />}
                />
                <Progress
                  percent={Math.round((dashboardData.stockStats.overStockItems / dashboardData.booksStats.totalBooks) * 100)}
                  status="normal"
                  strokeColor="#faad14"
                />
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      {/* Section 3: Thống kê chi tiết */}
      <Row gutter={[16, 16]} style={{ marginTop: '20px' }}>
        <Col xs={24} md={12}>
          <Card 
            title={<><BookOutlined /> Top 5 Sách Tồn Kho Nhiều Nhất</>} 
            bordered={false} 
            className="dashboard-card"
          >
            <List
              itemLayout="horizontal"
              dataSource={dashboardData.stockStats.topStockedBooks}
              renderItem={(item, index) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={<Badge count={index + 1} style={{ backgroundColor: index === 0 ? '#f5222d' : index === 1 ? '#fa8c16' : '#52c41a' }} />}
                    title={item.Book.Title}
                    description={`Số lượng: ${item.Quantity}`}
                  />
                  <Tag color={item.Quantity > 100 ? 'red' : item.Quantity > 50 ? 'orange' : 'green'}>
                    {item.Quantity}
                  </Tag>
                </List.Item>
              )}
            />
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card 
            title={<><FileTextOutlined /> Thống Kê Metadata</>} 
            bordered={false} 
            className="dashboard-card"
          >
            <Row gutter={[16, 16]}>
              <Col span={8}>
                <Statistic
                  title="Thể Loại"
                  value={dashboardData.metadataStats.totalCategories}
                  prefix={<BookOutlined />}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="Tác Giả"
                  value={dashboardData.metadataStats.totalAuthors}
                  prefix={<UserOutlined />}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="Nhà Xuất Bản"
                  value={dashboardData.metadataStats.totalPublishers}
                  prefix={<BankOutlined />}
                />
              </Col>
            </Row>
            <Divider />
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text strong>Tỷ lệ sách/thể loại: </Text>
              <Progress 
                percent={Math.round((dashboardData.booksStats.totalBooks / dashboardData.metadataStats.totalCategories) * 10)} 
                format={percent => `${Math.round((dashboardData.booksStats.totalBooks / dashboardData.metadataStats.totalCategories) * 100) / 100} sách/thể loại`}
              />
              <Text strong>Tỷ lệ sách/tác giả: </Text>
              <Progress 
                percent={Math.round((dashboardData.booksStats.totalBooks / dashboardData.metadataStats.totalAuthors) * 10)} 
                format={percent => `${Math.round((dashboardData.booksStats.totalBooks / dashboardData.metadataStats.totalAuthors) * 100) / 100} sách/tác giả`}
                strokeColor="#1890ff"
              />
            </Space>
          </Card>
        </Col>
      </Row>

      {/* Section 4: Thống kê bin */}
      <Row gutter={[16, 16]} style={{ marginTop: '20px' }}>
        <Col span={24}>
          <Card 
            title={<><InboxOutlined /> Thống Kê Bin</>} 
            bordered={false} 
            className="dashboard-card"
          >
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={8}>
                <Statistic
                  title="Tổng Số Bin"
                  value={dashboardData.binsStats.totalBins}
                  prefix={<InboxOutlined />}
                />
              </Col>
              <Col xs={24} sm={8}>
                <Statistic
                  title="Bin Còn Trống"
                  value={dashboardData.binsStats.availableBins}
                  prefix={<CheckCircleOutlined />}
                  valueStyle={{ color: '#3f8600' }}
                />
                <Progress 
                  percent={Math.round((dashboardData.binsStats.availableBins / dashboardData.binsStats.totalBins) * 100)} 
                  status="success" 
                />
              </Col>
              <Col xs={24} sm={8}>
                <Statistic
                  title="Bin Đã Đầy"
                  value={dashboardData.binsStats.fullBins}
                  prefix={<WarningOutlined />}
                  valueStyle={{ color: '#cf1322' }}
                />
                <Progress 
                  percent={Math.round((dashboardData.binsStats.fullBins / dashboardData.binsStats.totalBins) * 100)} 
                  status="exception" 
                />
              </Col>
              <Col span={24} style={{ marginTop: '20px' }}>
                <Statistic
                  title="Tỷ Lệ Sách Đã Phân Bổ Vào Bin"
                  value={Math.round((dashboardData.binsStats.booksInBins / dashboardData.booksStats.totalBooks) * 100)}
                  suffix="%"
                  prefix={<PercentageOutlined />}
                  valueStyle={{ color: '#1890ff' }}
                />
                <Progress 
                  percent={Math.round((dashboardData.binsStats.booksInBins / dashboardData.booksStats.totalBooks) * 100)} 
                  status="active" 
                  strokeColor="#1890ff"
                />
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      {/* CSS cho dashboard */}
      <style jsx>{`
        .dashboard-container .dashboard-card {
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
          border-radius: 8px;
          height: 100%;
        }
        
        .dashboard-container .ant-card-head {
          border-bottom: 1px solid #f0f0f0;
          padding: 0 16px;
        }
        
        .dashboard-container .ant-statistic-title {
          font-size: 14px;
          color: rgba(0, 0, 0, 0.45);
        }
        
        .dashboard-container .ant-progress-text {
          font-size: 12px;
        }
        
        .dashboard-container .ant-tag {
          margin-bottom: 5px;
        }
        
        .dashboard-container .ant-list-item-meta-title {
          margin-bottom: 0;
        }
      `}</style>
    </div>
  );
};

export default Dashboard;
