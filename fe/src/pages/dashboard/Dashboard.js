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
        setError('An error occurred while loading dashboard data!');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <Spin size="large" tip="Loading dashboard data..." />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '20px' }}>
        <Alert
          message="Error"
          description={error}
          type="error"
          showIcon
        />
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div style={{ padding: '20px' }}>
        <Alert
          message="No Data"
          description="No dashboard data available"
          type="warning"
          showIcon
        />
      </div>
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
    { key: 'new', status: 'New', count: dashboardData.importOrdersStats?.newImportOrders || 0 },
    { key: 'approved', status: 'Approved', count: dashboardData.importOrdersStats?.approvedImportOrders || 0 },
    { key: 'received', status: 'Received', count: dashboardData.importOrdersStats?.receivedImportOrders || 0 },
    { key: 'imported', status: 'Imported', count: dashboardData.importOrdersStats?.approveImportOrders || 0 }
  ];

  const exportOrderStatusData = [
    { key: 'new', status: 'New', count: dashboardData.exportOrdersStats?.newExportOrders || 0 },
    { key: 'approved', status: 'Approved', count: dashboardData.exportOrdersStats?.approvedExportOrders || 0 },
    { key: 'completed', status: 'Completed', count: dashboardData.exportOrdersStats?.completedExportOrders || 0 },
    { key: 'cancelled', status: 'Cancelled', count: dashboardData.exportOrdersStats?.cancelledExportOrders || 0 }
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
      title: 'Month',
      dataIndex: 'month',
      key: 'month',
    },
    {
      title: 'Import Orders',
      dataIndex: 'importOrders',
      key: 'importOrders',
      render: value => (
        <Tag color={colors.primary}>{value}</Tag>
      )
    },
    {
      title: 'Export Orders',
      dataIndex: 'exportOrders',
      key: 'exportOrders',
      render: value => (
        <Tag color={colors.warning}>{value}</Tag>
      )
    }
  ];

  const userRoleColumns = [
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
    },
    {
      title: 'Count',
      dataIndex: 'count',
      key: 'count',
    },
    {
      title: 'Percentage',
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
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
    },
    {
      title: 'Count',
      dataIndex: 'count',
      key: 'count',
    },
    {
      title: 'Percentage',
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
                record.status === 'New' ? colors.primary :
                  record.status === 'Approved' ? colors.success :
                    record.status === 'Received' || record.status === 'Completed' ? colors.warning :
                      record.status === 'Imported' ? colors.purple :
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
      title: 'Status',
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
      title: 'Count',
      dataIndex: 'count',
      key: 'count',
    },
    {
      title: 'Percentage',
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
          <Text type="secondary">Overview of Book Warehouse Management System</Text>
        </div>
        <Segmented
          options={[
            { value: '3months', label: '3 months' },
            { value: '6months', label: '6 months' },
            { value: '1year', label: 'Year' }
          ]}
          value={timeRange}
          onChange={setTimeRange}
        />
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <Card style={dashboardStyles.card} hoverable>
            <Statistic
              title="Total Users"
              value={dashboardData.usersStats?.totalUsers}
              prefix={<TeamOutlined style={{ color: colors.primary }} />}
              valueStyle={{ color: colors.primary }}
            />
            <div style={dashboardStyles.statFooter}>
              <Tooltip title="Active Users">
                <span>
                  <Badge status="success" /> Active: {dashboardData.usersStats?.totalActiveUsers}
                </span>
              </Tooltip>
              <Tooltip title="New Users in the past 30 days">
                <span>
                  <ArrowUpOutlined style={{ color: colors.success }} /> {dashboardData.usersStats?.recentUsers || 0} new
                </span>
              </Tooltip>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card style={dashboardStyles.card} hoverable>
            <Statistic
              title="Total Book Titles"
              value={dashboardData.booksStats?.totalBooks}
              prefix={<BookOutlined style={{ color: colors.success }} />}
              valueStyle={{ color: colors.success }}
            />
            <div style={dashboardStyles.statFooter}>
              <Tooltip title="Total number of books in stock">
                <span>
                  <Badge status="processing" /> Quantity: {dashboardData.booksStats?.totalBookQuantity || 0}
                </span>
              </Tooltip>
              <Tooltip title="New books in the past 30 days">
                <span>
                  <ArrowUpOutlined style={{ color: colors.success }} /> {dashboardData.booksStats?.recentBooks || 0} new
                </span>
              </Tooltip>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card style={dashboardStyles.card} hoverable>
            <Statistic
              title="Total Import Orders"
              value={dashboardData.importOrdersStats?.totalImportOrders}
              prefix={<ImportOutlined style={{ color: colors.warning }} />}
              valueStyle={{ color: colors.warning }}
            />
            <div style={dashboardStyles.statFooter}>
              <Tooltip title="Total import orders">
                <span>
                  <ClockCircleOutlined style={{ color: colors.warning }} /> {dashboardData.importOrdersStats?.newImportOrders || 0} new
                </span>
              </Tooltip>
              <Tooltip title="Total value of import orders">
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
              title="Total Export Orders"
              value={dashboardData.exportOrdersStats?.totalExportOrders}
              prefix={<ExportOutlined style={{ color: colors.purple }} />}
              valueStyle={{ color: colors.purple }}
            />
            <div style={dashboardStyles.statFooter}>
              <Tooltip title="Total export orders">
                <span>
                  <ClockCircleOutlined style={{ color: colors.warning }} /> {dashboardData.exportOrdersStats?.newExportOrders || 0} new
                </span>
              </Tooltip>
              <Tooltip title="Total value of export orders">
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
                <span>Orders Timeline Chart</span>
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
                      <strong>Total</strong>
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
                <span>Import Orders by Status</span>
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
                <span>Export Orders by Status</span>
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
              label: <span><TeamOutlined /> User & Book Management</span>,
              children: (
                <Row gutter={[16, 16]}>
                  <Col xs={24} md={12}>
                    <Card
                      title={
                        <Space>
                          <UserOutlined />
                          <span>Users by Role</span>
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
                          <span>Top 5 Books with Highest Stock</span>
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
                              description={`Author: ${item.Book?.Author || 'Unknown'}`}
                            />
                            <div>
                              <Tag color={item.Quantity > 100 ? 'red' : item.Quantity > 50 ? 'orange' : 'green'}>
                                {item.Quantity} books
                              </Tag>
                            </div>
                          </List.Item>
                        )}
                        locale={{ emptyText: 'No data available' }}
                      />
                    </Card>
                  </Col>
                </Row>
              )
            },
            {
              key: "2",
              label: <span><ApartmentOutlined /> Bin Management</span>,
              children: (
                <Row gutter={[16, 16]}>
                  <Col xs={24} md={8}>
                    <Card
                      title={
                        <Space>
                          <ApartmentOutlined />
                          <span>Bin Status</span>
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
                            title="Total Bins"
                            value={dashboardData.warehouseStats?.totalBins}
                            prefix={<InboxOutlined />}
                          />
                        </Col>
                        <Col span={12}>
                          <Statistic
                            title="Total Shelves"
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
                          <span>Stock Level Management</span>
                        </Space>
                      }
                      style={dashboardStyles.card}
                    >
                      <Row gutter={[16, 16]}>
                        <Col span={12}>
                          <Statistic
                            title="Low Stock Books"
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
                              {dashboardData.stockStats?.lowStockItems} book titles have stock levels below the minimum threshold. Reordering required.
                            </Text>
                          </Paragraph>
                        </Col>
                        <Col span={12}>
                          <Statistic
                            title="High Stock Books"
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
                              {dashboardData.stockStats?.overStockItems} book titles have stock levels exceeding the maximum threshold. Consider exporting.
                            </Text>
                          </Paragraph>
                        </Col>
                      </Row>
                      <Divider style={dashboardStyles.cardDivider} />
                      <Row gutter={[16, 16]}>
                        <Col span={24}>
                          <Statistic
                            title="Books Allocated to Bins Ratio"
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
              label: <span><WarningOutlined /> Error & Status Management</span>,
              children: (
                <Row gutter={[16, 16]}>
                  <Col xs={24} md={12}>
                    <Card
                      title={
                        <Space>
                          <WarningOutlined />
                          <span>Error Statistics</span>
                        </Space>
                      }
                      style={dashboardStyles.card}
                    >
                      <Row gutter={[16, 16]}>
                        <Col span={12}>
                          <Statistic
                            title="Total Errors"
                            value={dashboardData.faultsStats?.totalFaults}
                            valueStyle={{ color: colors.error }}
                            prefix={<WarningOutlined />}
                          />
                        </Col>
                        <Col span={12}>
                          <Statistic
                            title="New Errors (30 days)"
                            value={dashboardData.faultsStats?.recentFaults}
                            valueStyle={{ color: colors.warning }}
                            prefix={<ClockCircleOutlined />}
                          />
                        </Col>
                      </Row>
                      <Divider orientation="left">Recent Errors</Divider>
                      <List
                        size="small"
                        dataSource={dashboardData.faultsStats?.recentFaultsList || []}
                        renderItem={(item) => (
                          <List.Item>
                            <List.Item.Meta
                              title={item.Book?.Title || 'Unknown'}
                              description={`Quantity: ${item.Quantity} - Date: ${new Date(item.FaultDate).toLocaleDateString()}`}
                            />
                            <Tag color="red">{item.OrderType}</Tag>
                          </List.Item>
                        )}
                        locale={{ emptyText: 'No error data available' }}
                      />
                    </Card>
                  </Col>
                  <Col xs={24} md={12}>
                    <Card
                      title={
                        <Space>
                          <FileDoneOutlined />
                          <span>Order Status Statistics</span>
                        </Space>
                      }
                      style={dashboardStyles.card}
                    >
                      <Row gutter={[16, 16]}>
                        <Col span={12}>
                          <Statistic
                            title="Total Status Changes"
                            value={dashboardData.statusLogsStats?.totalStatusChanges || 0}
                            valueStyle={{ color: colors.primary }}
                            prefix={<SolutionOutlined />}
                          />
                        </Col>
                        <Col span={12}>
                          <Statistic
                            title="Recent Changes (30 days)"
                            value={dashboardData.statusLogsStats?.recentStatusChanges || 0}
                            valueStyle={{ color: colors.cyan }}
                            prefix={<ClockCircleOutlined />}
                          />
                        </Col>
                      </Row>
                      <Divider orientation="left">Popular Statuses</Divider>
                      <List
                        size="small"
                        dataSource={dashboardData.statusLogsStats?.mostCommonStatus || []}
                        renderItem={(item) => (
                          <List.Item>
                            <List.Item.Meta
                              title={item.Status}
                              description={`Occurrence Count: ${item.count}`}
                            />
                            <Progress
                              percent={Math.round((item.count / (dashboardData.statusLogsStats?.totalStatusChanges || 1)) * 100)}
                              size="small"
                              status="active"
                              showInfo={false}
                            />
                          </List.Item>
                        )}
                        locale={{ emptyText: 'No status data available' }}
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
                <span>Metadata Statistics</span>
              </Space>
            }
            style={dashboardStyles.card}
          >
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={8}>
                <Card style={dashboardStyles.innerCard}>
                  <Statistic
                    title="Total Categories"
                    value={dashboardData.metadataStats?.totalCategories}
                    prefix={<BookOutlined />}
                    valueStyle={{ color: colors.primary }}
                  />
                  <div style={dashboardStyles.statDescription}>
                    <Text type="secondary">
                      Average {dashboardData.metadataStats?.totalCategories && dashboardData.booksStats?.totalBooks
                        ? Math.round((dashboardData.booksStats.totalBooks / dashboardData.metadataStats.totalCategories) * 100) / 100
                        : 0} books/category
                    </Text>
                  </div>
                </Card>
              </Col>
              <Col xs={24} sm={8}>
                <Card style={dashboardStyles.innerCard}>
                  <Statistic
                    title="Total Authors"
                    value={dashboardData.metadataStats?.totalAuthors}
                    prefix={<UserOutlined />}
                    valueStyle={{ color: colors.success }}
                  />
                  <div style={dashboardStyles.statDescription}>
                    <Text type="secondary">
                      Average {dashboardData.metadataStats?.totalAuthors && dashboardData.booksStats?.totalBooks
                        ? Math.round((dashboardData.booksStats.totalBooks / dashboardData.metadataStats.totalAuthors) * 100) / 100
                        : 0} books/author
                    </Text>
                  </div>
                </Card>
              </Col>
              <Col xs={24} sm={8}>
                <Card style={dashboardStyles.innerCard}>
                  <Statistic
                    title="Total Publishers"
                    value={dashboardData.metadataStats?.totalPublishers}
                    prefix={<BankOutlined />}
                    valueStyle={{ color: colors.purple }}
                  />
                  <div style={dashboardStyles.statDescription}>
                    <Text type="secondary">
                      Average {dashboardData.metadataStats?.totalPublishers && dashboardData.booksStats?.totalBooks
                        ? Math.round((dashboardData.booksStats.totalBooks / dashboardData.metadataStats.totalPublishers) * 100) / 100
                        : 0} books/publisher
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
