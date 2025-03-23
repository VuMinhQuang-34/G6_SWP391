import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Row, Col, Card, Statistic, Progress, Spin, Alert, Divider, Typography, Badge, List,
  Tag, Space, Tooltip, Tabs, Avatar, Empty, Button, Segmented, Table
} from 'antd';
import {
  TeamOutlined, BookOutlined, ShoppingCartOutlined, WarningOutlined, CheckCircleOutlined,
  ClockCircleOutlined, RiseOutlined, FallOutlined, DatabaseOutlined, FileTextOutlined,
  BankOutlined, UserOutlined, ApartmentOutlined, InboxOutlined, PercentageOutlined,
  DollarOutlined, ExportOutlined, ImportOutlined, ArrowUpOutlined,
  ArrowDownOutlined, LineChartOutlined, PieChartOutlined,
  FileDoneOutlined, SolutionOutlined, AlertOutlined, HomeOutlined, TagsOutlined
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [timeRange, setTimeRange] = useState('6months');
  const [activeTab, setActiveTab] = useState('1');

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
        <Spin size="large" tip="Đang tải dữ liệu dashboard..." />
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
        action={
          <Button size="small" type="primary" onClick={() => window.location.reload()}>
            Thử lại
          </Button>
        }
        style={{ margin: '20px' }}
      />
    );
  }

  if (!dashboardData) {
    return (
      <Empty
        description="Không có dữ liệu"
        style={{ margin: '100px auto' }}
      />
    );
  }

  const colors = {
    primary: '#1890ff',
    success: '#52c41a',
    warning: '#faad14',
    error: '#ff4d4f',
    purple: '#722ed1',
    cyan: '#13c2c2'
  };

  const timelineData = [];
  const importMonthData = {};
  const exportMonthData = {};

  if (dashboardData.importOrdersStats?.importOrdersByMonth) {
    dashboardData.importOrdersStats.importOrdersByMonth.forEach(item => {
      importMonthData[item.month] = item.count;
    });
  }

  if (dashboardData.exportOrdersStats?.exportOrdersByMonth) {
    dashboardData.exportOrdersStats.exportOrdersByMonth.forEach(item => {
      exportMonthData[item.month] = item.count;
    });
  }

  const allMonths = new Set([
    ...Object.keys(importMonthData || {}),
    ...Object.keys(exportMonthData || {})
  ]);

  [...allMonths].sort().forEach(month => {
    if (month) {
      const [year, monthNum] = month.split('-');
      const formattedMonth = `${monthNum}/${year}`;

      timelineData.push({
        key: month,
        month: formattedMonth,
        importOrders: importMonthData[month] || 0,
        exportOrders: exportMonthData[month] || 0,
      });
    }
  });

  const userRoleData = dashboardData.usersStats?.usersByRole?.map((role, index) => ({
    key: index,
    role: role.Role || 'Không xác định',
    count: role.count || 0,
    percentage: dashboardData.usersStats.totalUsers
      ? Math.round((role.count / dashboardData.usersStats.totalUsers) * 100)
      : 0
  })) || [];

  const importOrderStatusData = [
    { key: 'new', status: 'Mới', count: dashboardData.importOrdersStats?.newImportOrders || 0 },
    { key: 'approved', status: 'Phê duyệt', count: dashboardData.importOrdersStats?.approvedImportOrders || 0 },
    { key: 'received', status: 'Đã nhận', count: dashboardData.importOrdersStats?.receivedImportOrders || 0 },
    { key: 'imported', status: 'Nhập kho', count: dashboardData.importOrdersStats?.approveImportOrders || 0 }
  ];

  const exportOrderStatusData = [
    { key: 'new', status: 'Mới', count: dashboardData.exportOrdersStats?.newExportOrders || 0 },
    { key: 'approved', status: 'Phê duyệt', count: dashboardData.exportOrdersStats?.approvedExportOrders || 0 },
    { key: 'completed', status: 'Hoàn thành', count: dashboardData.exportOrdersStats?.completedExportOrders || 0 },
    { key: 'cancelled', status: 'Hủy', count: dashboardData.exportOrdersStats?.cancelledExportOrders || 0 }
  ];

  const binStatusData = [
    { key: 'available', status: 'Còn trống', count: dashboardData.warehouseStats?.availableBins || 0 },
    { key: 'full', status: 'Đã đầy', count: dashboardData.warehouseStats?.fullBins || 0 }
  ];

  const dashboardStyles = {
    dashboardContainer: {
      padding: '24px',
      background: '#f0f2f5',
      minHeight: '100vh'
    },
    dashboardHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '16px',
    },
    card: {
      boxShadow: '0 1px 2px -2px rgba(0, 0, 0, 0.16), 0 3px 6px 0 rgba(0, 0, 0, 0.12), 0 5px 12px 4px rgba(0, 0, 0, 0.09)',
      borderRadius: '8px',
      height: '100%',
    },
    statFooter: {
      marginTop: '16px',
      display: 'flex',
      justifyContent: 'space-between',
      color: 'rgba(0, 0, 0, 0.45)',
      fontSize: '12px',
    },
    cardDivider: {
      margin: '12px 0',
    },
    innerCard: {
      background: '#fafafa',
      borderRadius: '4px',
    },
    statDescription: {
      marginTop: '8px',
      fontSize: '12px',
    },
    tabsContainer: {
      marginTop: '16px',
      background: 'white',
      borderRadius: '8px',
      padding: '16px',
      boxShadow: '0 1px 2px -2px rgba(0, 0, 0, 0.16), 0 3px 6px 0 rgba(0, 0, 0, 0.12), 0 5px 12px 4px rgba(0, 0, 0, 0.09)',
    }
  };

  const timelineColumns = [
    {
      title: 'Tháng',
      dataIndex: 'month',
      key: 'month',
    },
    {
      title: 'Đơn nhập',
      dataIndex: 'importOrders',
      key: 'importOrders',
      render: value => (
        <Tag color={colors.primary}>{value}</Tag>
      )
    },
    {
      title: 'Đơn xuất',
      dataIndex: 'exportOrders',
      key: 'exportOrders',
      render: value => (
        <Tag color={colors.warning}>{value}</Tag>
      )
    }
  ];

  const userRoleColumns = [
    {
      title: 'Vai trò',
      dataIndex: 'role',
      key: 'role',
    },
    {
      title: 'Số lượng',
      dataIndex: 'count',
      key: 'count',
    },
    {
      title: 'Phần trăm',
      dataIndex: 'percentage',
      key: 'percentage',
      render: value => (
        <div>
          {value}%
          <Progress percent={value} size="small" showInfo={false} />
        </div>
      )
    }
  ];

  const orderStatusColumns = [
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
    },
    {
      title: 'Số lượng',
      dataIndex: 'count',
      key: 'count',
    },
    {
      title: 'Phần trăm',
      key: 'percentage',
      render: (_, record) => {
        const total = record.type === 'import'
          ? dashboardData.importOrdersStats?.totalImportOrders || 0
          : dashboardData.exportOrdersStats?.totalExportOrders || 0;

        const percentage = total ? Math.round((record.count / total) * 100) : 0;

        return (
          <div>
            {percentage}%
            <Progress
              percent={percentage}
              size="small"
              showInfo={false}
              strokeColor={
                record.status === 'Mới' ? colors.primary :
                  record.status === 'Phê duyệt' ? colors.success :
                    record.status === 'Đã nhận' || record.status === 'Hoàn thành' ? colors.warning :
                      record.status === 'Nhập kho' ? colors.purple :
                        colors.error
              }
            />
          </div>
        );
      }
    }
  ];

  const binStatusColumns = [
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: text => (
        <span style={{
          color: text === 'Còn trống' ? colors.success : colors.error
        }}>
          {text}
        </span>
      )
    },
    {
      title: 'Số lượng',
      dataIndex: 'count',
      key: 'count',
    },
    {
      title: 'Phần trăm',
      key: 'percentage',
      render: (_, record) => {
        const total = dashboardData.warehouseStats?.totalBins || 0;
        const percentage = total ? Math.round((record.count / total) * 100) : 0;

        return (
          <div>
            {percentage}%
            <Progress
              percent={percentage}
              size="small"
              showInfo={false}
              strokeColor={record.status === 'Còn trống' ? colors.success : colors.error}
            />
          </div>
        );
      }
    }
  ];

  return (
    <div style={dashboardStyles.dashboardContainer}>
      <div style={dashboardStyles.dashboardHeader}>
        <div>
          <Title level={2} style={{ margin: 0 }}>
            <DatabaseOutlined /> Dashboard
          </Title>
          <Text type="secondary">Tổng quan hệ thống quản lý kho sách</Text>
        </div>
        <Segmented
          options={[
            { value: '3months', label: '3 tháng' },
            { value: '6months', label: '6 tháng' },
            { value: '1year', label: 'Năm' }
          ]}
          value={timeRange}
          onChange={setTimeRange}
        />
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <Card style={dashboardStyles.card} hoverable>
            <Statistic
              title="Tổng người dùng"
              value={dashboardData.usersStats?.totalUsers}
              prefix={<TeamOutlined style={{ color: colors.primary }} />}
              valueStyle={{ color: colors.primary }}
            />
            <div style={dashboardStyles.statFooter}>
              <Tooltip title="Người dùng đang hoạt động">
                <span>
                  <Badge status="success" /> Hoạt động: {dashboardData.usersStats?.totalActiveUsers}
                </span>
              </Tooltip>
              <Tooltip title="Người dùng mới trong 30 ngày qua">
                <span>
                  <ArrowUpOutlined style={{ color: colors.success }} /> {dashboardData.usersStats?.recentUsers || 0} mới
                </span>
              </Tooltip>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card style={dashboardStyles.card} hoverable>
            <Statistic
              title="Tổng đầu sách"
              value={dashboardData.booksStats?.totalBooks}
              prefix={<BookOutlined style={{ color: colors.success }} />}
              valueStyle={{ color: colors.success }}
            />
            <div style={dashboardStyles.statFooter}>
              <Tooltip title="Tổng số lượng sách trong kho">
                <span>
                  <Badge status="processing" /> Số lượng: {dashboardData.booksStats?.totalBookQuantity || 0}
                </span>
              </Tooltip>
              <Tooltip title="Sách mới trong 30 ngày qua">
                <span>
                  <ArrowUpOutlined style={{ color: colors.success }} /> {dashboardData.booksStats?.recentBooks || 0} mới
                </span>
              </Tooltip>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card style={dashboardStyles.card} hoverable>
            <Statistic
              title="Đơn nhập hàng"
              value={dashboardData.importOrdersStats?.totalImportOrders}
              prefix={<ImportOutlined style={{ color: colors.warning }} />}
              valueStyle={{ color: colors.warning }}
            />
            <div style={dashboardStyles.statFooter}>
              <Tooltip title="Đơn nhập mới chưa xử lý">
                <span>
                  <ClockCircleOutlined style={{ color: colors.warning }} /> {dashboardData.importOrdersStats?.newImportOrders || 0} mới
                </span>
              </Tooltip>
              <Tooltip title="Tổng giá trị đơn nhập">
                <span>
                  <DollarOutlined /> {Number(dashboardData.importOrdersStats?.totalImportValue || 0).toLocaleString()} VND
                </span>
              </Tooltip>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card style={dashboardStyles.card} hoverable>
            <Statistic
              title="Đơn xuất hàng"
              value={dashboardData.exportOrdersStats?.totalExportOrders}
              prefix={<ExportOutlined style={{ color: colors.purple }} />}
              valueStyle={{ color: colors.purple }}
            />
            <div style={dashboardStyles.statFooter}>
              <Tooltip title="Đơn xuất mới chưa xử lý">
                <span>
                  <ClockCircleOutlined style={{ color: colors.warning }} /> {dashboardData.exportOrdersStats?.newExportOrders || 0} mới
                </span>
              </Tooltip>
              <Tooltip title="Tổng giá trị đơn xuất">
                <span>
                  <DollarOutlined /> {Number(dashboardData.exportOrdersStats?.totalExportValue || 0).toLocaleString()} VND
                </span>
              </Tooltip>
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: '16px' }}>
        <Col span={24}>
          <Card
            style={dashboardStyles.card}
            title={
              <Space>
                <LineChartOutlined style={{ color: colors.primary }} />
                <span>Biểu đồ đơn hàng theo thời gian</span>
              </Space>
            }
            hoverable
          >
            <Table
              dataSource={timelineData}
              columns={timelineColumns}
              pagination={false}
              size="middle"
              style={{ overflowX: 'auto' }}
              summary={pageData => {
                let totalImport = 0;
                let totalExport = 0;

                pageData.forEach(({ importOrders, exportOrders }) => {
                  totalImport += importOrders || 0;
                  totalExport += exportOrders || 0;
                });

                return (
                  <Table.Summary.Row>
                    <Table.Summary.Cell index={0}>
                      <strong>Tổng</strong>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={1}>
                      <Tag color={colors.primary}><strong>{totalImport}</strong></Tag>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={2}>
                      <Tag color={colors.warning}><strong>{totalExport}</strong></Tag>
                    </Table.Summary.Cell>
                  </Table.Summary.Row>
                );
              }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: '16px' }}>
        <Col xs={24} lg={12}>
          <Card
            style={dashboardStyles.card}
            title={
              <Space>
                <PieChartOutlined />
                <span>Đơn nhập hàng theo trạng thái</span>
              </Space>
            }
          >
            <Table
              dataSource={importOrderStatusData.map(item => ({ ...item, type: 'import' }))}
              columns={orderStatusColumns}
              pagination={false}
              size="middle"
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card
            style={dashboardStyles.card}
            title={
              <Space>
                <PieChartOutlined />
                <span>Đơn xuất hàng theo trạng thái</span>
              </Space>
            }
          >
            <Table
              dataSource={exportOrderStatusData.map(item => ({ ...item, type: 'export' }))}
              columns={orderStatusColumns}
              pagination={false}
              size="middle"
            />
          </Card>
        </Col>
      </Row>

      <div style={dashboardStyles.tabsContainer}>
        <Tabs
          defaultActiveKey="1"
          items={[
            {
              key: "1",
              label: <span><TeamOutlined /> Quản lý người dùng & sách</span>,
              children: (
                <Row gutter={[16, 16]}>
                  <Col xs={24} md={12}>
                    <Card
                      title={
                        <Space>
                          <UserOutlined />
                          <span>Người dùng theo vai trò</span>
                        </Space>
                      }
                      style={dashboardStyles.card}
                    >
                      <Table
                        dataSource={userRoleData}
                        columns={userRoleColumns}
                        pagination={false}
                        size="middle"
                      />
                    </Card>
                  </Col>
                  <Col xs={24} md={12}>
                    <Card
                      title={
                        <Space>
                          <BookOutlined />
                          <span>Top 5 sách tồn kho nhiều nhất</span>
                        </Space>
                      }
                      style={dashboardStyles.card}
                    >
                      <List
                        dataSource={dashboardData.stockStats?.topStockedBooks || []}
                        renderItem={(item, index) => (
                          <List.Item>
                            <List.Item.Meta
                              avatar={
                                <Avatar
                                  style={{
                                    backgroundColor:
                                      index === 0 ? colors.error :
                                        index === 1 ? colors.warning :
                                          index === 2 ? colors.primary : colors.success
                                  }}
                                >
                                  {index + 1}
                                </Avatar>
                              }
                              title={item.Book?.Title}
                              description={`Tác giả: ${item.Book?.Author || 'Không rõ'}`}
                            />
                            <div>
                              <Tag color={item.Quantity > 100 ? 'red' : item.Quantity > 50 ? 'orange' : 'green'}>
                                {item.Quantity} cuốn
                              </Tag>
                            </div>
                          </List.Item>
                        )}
                        locale={{ emptyText: 'Không có dữ liệu' }}
                      />
                    </Card>
                  </Col>
                </Row>
              )
            },
            {
              key: "2",
              label: <span><ApartmentOutlined /> Quản lý kho & bin</span>,
              children: (
                <Row gutter={[16, 16]}>
                  <Col xs={24} md={8}>
                    <Card
                      title={
                        <Space>
                          <ApartmentOutlined />
                          <span>Trạng thái bin</span>
                        </Space>
                      }
                      style={dashboardStyles.card}
                    >
                      <Table
                        dataSource={binStatusData}
                        columns={binStatusColumns}
                        pagination={false}
                        size="middle"
                      />
                      <Divider style={dashboardStyles.cardDivider} />
                      <Row gutter={16}>
                        <Col span={12}>
                          <Statistic
                            title="Tổng số bin"
                            value={dashboardData.warehouseStats?.totalBins}
                            prefix={<InboxOutlined />}
                          />
                        </Col>
                        <Col span={12}>
                          <Statistic
                            title="Tổng số kệ"
                            value={dashboardData.warehouseStats?.totalShelves}
                            prefix={<ApartmentOutlined />}
                          />
                        </Col>
                      </Row>
                    </Card>
                  </Col>
                  <Col xs={24} md={16}>
                    <Card
                      title={
                        <Space>
                          <AlertOutlined />
                          <span>Cảnh báo tồn kho</span>
                        </Space>
                      }
                      style={dashboardStyles.card}
                    >
                      <Row gutter={[16, 16]}>
                        <Col span={12}>
                          <Statistic
                            title="Sách tồn kho thấp"
                            value={dashboardData.stockStats?.lowStockItems}
                            valueStyle={{ color: colors.error }}
                            prefix={<FallOutlined />}
                          />
                          <Progress
                            percent={dashboardData.booksStats?.totalBooks
                              ? Math.round((dashboardData.stockStats?.lowStockItems / dashboardData.booksStats.totalBooks) * 100)
                              : 0}
                            status="exception"
                          />
                          <Paragraph>
                            <Text type="secondary">
                              {dashboardData.stockStats?.lowStockItems} đầu sách có số lượng tồn kho thấp hơn mức tối thiểu. Cần nhập thêm hàng.
                            </Text>
                          </Paragraph>
                        </Col>
                        <Col span={12}>
                          <Statistic
                            title="Sách tồn kho cao"
                            value={dashboardData.stockStats?.overStockItems}
                            valueStyle={{ color: colors.warning }}
                            prefix={<RiseOutlined />}
                          />
                          <Progress
                            percent={dashboardData.booksStats?.totalBooks
                              ? Math.round((dashboardData.stockStats?.overStockItems / dashboardData.booksStats.totalBooks) * 100)
                              : 0}
                            status="normal"
                            strokeColor={colors.warning}
                          />
                          <Paragraph>
                            <Text type="secondary">
                              {dashboardData.stockStats?.overStockItems} đầu sách có số lượng tồn kho vượt quá mức tối đa. Nên xuất hàng.
                            </Text>
                          </Paragraph>
                        </Col>
                      </Row>
                      <Divider style={dashboardStyles.cardDivider} />
                      <Row gutter={[16, 16]}>
                        <Col span={24}>
                          <Statistic
                            title="Tỷ lệ sách đã phân bổ vào bin"
                            value={dashboardData.booksStats?.totalBooks
                              ? Math.round((dashboardData.warehouseStats?.booksInBins / dashboardData.booksStats.totalBooks) * 100)
                              : 0}
                            suffix="%"
                            valueStyle={{ color: colors.primary }}
                          />
                          <Progress
                            percent={dashboardData.booksStats?.totalBooks
                              ? Math.round((dashboardData.warehouseStats?.booksInBins / dashboardData.booksStats.totalBooks) * 100)
                              : 0}
                            status="active"
                            strokeColor={colors.primary}
                          />
                        </Col>
                      </Row>
                    </Card>
                  </Col>
                </Row>
              )
            },
            {
              key: "3",
              label: <span><WarningOutlined /> Quản lý lỗi & trạng thái</span>,
              children: (
                <Row gutter={[16, 16]}>
                  <Col xs={24} md={12}>
                    <Card
                      title={
                        <Space>
                          <WarningOutlined />
                          <span>Thống kê lỗi</span>
                        </Space>
                      }
                      style={dashboardStyles.card}
                    >
                      <Row gutter={[16, 16]}>
                        <Col span={12}>
                          <Statistic
                            title="Tổng số lỗi"
                            value={dashboardData.faultsStats?.totalFaults}
                            valueStyle={{ color: colors.error }}
                            prefix={<WarningOutlined />}
                          />
                        </Col>
                        <Col span={12}>
                          <Statistic
                            title="Lỗi mới (30 ngày)"
                            value={dashboardData.faultsStats?.recentFaults}
                            valueStyle={{ color: colors.warning }}
                            prefix={<ClockCircleOutlined />}
                          />
                        </Col>
                      </Row>
                      <Divider orientation="left">Lỗi gần đây</Divider>
                      <List
                        size="small"
                        dataSource={dashboardData.faultsStats?.recentFaultsList || []}
                        renderItem={(item) => (
                          <List.Item>
                            <List.Item.Meta
                              title={item.Book?.Title || 'Không xác định'}
                              description={`Số lượng: ${item.Quantity} - Ngày: ${new Date(item.FaultDate).toLocaleDateString()}`}
                            />
                            <Tag color="red">{item.OrderType}</Tag>
                          </List.Item>
                        )}
                        locale={{ emptyText: 'Không có dữ liệu lỗi' }}
                      />
                    </Card>
                  </Col>
                  <Col xs={24} md={12}>
                    <Card
                      title={
                        <Space>
                          <FileDoneOutlined />
                          <span>Thống kê trạng thái đơn hàng</span>
                        </Space>
                      }
                      style={dashboardStyles.card}
                    >
                      <Row gutter={[16, 16]}>
                        <Col span={12}>
                          <Statistic
                            title="Tổng thay đổi trạng thái"
                            value={dashboardData.statusLogsStats?.totalStatusChanges || 0}
                            valueStyle={{ color: colors.primary }}
                            prefix={<SolutionOutlined />}
                          />
                        </Col>
                        <Col span={12}>
                          <Statistic
                            title="Thay đổi gần đây (30 ngày)"
                            value={dashboardData.statusLogsStats?.recentStatusChanges || 0}
                            valueStyle={{ color: colors.cyan }}
                            prefix={<ClockCircleOutlined />}
                          />
                        </Col>
                      </Row>
                      <Divider orientation="left">Trạng thái phổ biến</Divider>
                      <List
                        size="small"
                        dataSource={dashboardData.statusLogsStats?.mostCommonStatus || []}
                        renderItem={(item) => (
                          <List.Item>
                            <List.Item.Meta
                              title={item.Status}
                              description={`Số lần xuất hiện: ${item.count}`}
                            />
                            <Progress
                              percent={Math.round((item.count / (dashboardData.statusLogsStats?.totalStatusChanges || 1)) * 100)}
                              size="small"
                              status="active"
                              showInfo={false}
                            />
                          </List.Item>
                        )}
                        locale={{ emptyText: 'Không có dữ liệu trạng thái' }}
                      />
                    </Card>
                  </Col>
                </Row>
              )
            }
          ]}
        />
      </div>

      <Row gutter={[16, 16]} style={{ marginTop: '16px' }}>
        <Col span={24}>
          <Card
            title={
              <Space>
                <FileTextOutlined />
                <span>Thống kê metadata</span>
              </Space>
            }
            style={dashboardStyles.card}
          >
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={8}>
                <Card style={dashboardStyles.innerCard}>
                  <Statistic
                    title="Thể loại"
                    value={dashboardData.metadataStats?.totalCategories}
                    prefix={<BookOutlined />}
                    valueStyle={{ color: colors.primary }}
                  />
                  <div style={dashboardStyles.statDescription}>
                    <Text type="secondary">
                      Trung bình {dashboardData.metadataStats?.totalCategories && dashboardData.booksStats?.totalBooks
                        ? Math.round((dashboardData.booksStats.totalBooks / dashboardData.metadataStats.totalCategories) * 100) / 100
                        : 0} sách/thể loại
                    </Text>
                  </div>
                </Card>
              </Col>
              <Col xs={24} sm={8}>
                <Card style={dashboardStyles.innerCard}>
                  <Statistic
                    title="Tác giả"
                    value={dashboardData.metadataStats?.totalAuthors}
                    prefix={<UserOutlined />}
                    valueStyle={{ color: colors.success }}
                  />
                  <div style={dashboardStyles.statDescription}>
                    <Text type="secondary">
                      Trung bình {dashboardData.metadataStats?.totalAuthors && dashboardData.booksStats?.totalBooks
                        ? Math.round((dashboardData.booksStats.totalBooks / dashboardData.metadataStats.totalAuthors) * 100) / 100
                        : 0} sách/tác giả
                    </Text>
                  </div>
                </Card>
              </Col>
              <Col xs={24} sm={8}>
                <Card style={dashboardStyles.innerCard}>
                  <Statistic
                    title="Nhà xuất bản"
                    value={dashboardData.metadataStats?.totalPublishers}
                    prefix={<BankOutlined />}
                    valueStyle={{ color: colors.purple }}
                  />
                  <div style={dashboardStyles.statDescription}>
                    <Text type="secondary">
                      Trung bình {dashboardData.metadataStats?.totalPublishers && dashboardData.booksStats?.totalBooks
                        ? Math.round((dashboardData.booksStats.totalBooks / dashboardData.metadataStats.totalPublishers) * 100) / 100
                        : 0} sách/NXB
                    </Text>
                  </div>
                </Card>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
