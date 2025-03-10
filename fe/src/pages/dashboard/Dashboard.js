import React, { useEffect, useState } from "react";
import {
  Layout,
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Progress,
  Tabs,
  List,
  Spin,
  Tag,
} from "antd";
import axios from "axios";
import {
  ArrowUpOutlined,
  ArrowDownOutlined,
  BookOutlined,
  UserOutlined,
  DollarOutlined,
  ShoppingCartOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  MedicineBoxOutlined
} from "@ant-design/icons";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  Legend,
} from "recharts";
import "antd/dist/reset.css";

const { Content } = Layout;
const { TabPane } = Tabs;

const dashboardData = {
  users: 5200,
  books: 1250,
  bookImports: 340,
  bookExports: 290,
  revenue: 120000,
  pendingOrders: 45,
};

const bookStats = [
  { name: "Fiction", value: 400 },
  { name: "Non-fiction", value: 300 },
  { name: "Science", value: 200 },
  { name: "Others", value: 150 },
];

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

const monthlySales = [
  { name: "Jan", sales: 4000 },
  { name: "Feb", sales: 3000 },
  { name: "Mar", sales: 5000 },
  { name: "Apr", sales: 7000 },
  { name: "May", sales: 6000 },
  { name: "Jun", sales: 8000 },
];

const recentTransactions = [
  { key: "1", type: "Import", book: "Data Structures", quantity: 50 },
  { key: "2", type: "Export", book: "Machine Learning", quantity: 20 },
  { key: "3", type: "Import", book: "JavaScript Fundamentals", quantity: 40 },
  { key: "4", type: "Export", book: "Python for Data Science", quantity: 35 },
];

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  useEffect(() => {
    console.log("Fetching data..."); // 
    axios.get("http://localhost:9999/api/dashboard")
      .then((response) => {
        console.log("API Response:", response.data); // 
        // setData({...response.data.data});
        setData(response.data.data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Lỗi khi lấy dữ liệu dashboard:", error.response || error);
        setLoading(false);
      });
  }, []);
  console.log(data);

  if (loading) {
    return (
      <Layout style={{ padding: 20, background: "#f0f2f5", minHeight: "100vh" }}>
        <Content>
          <Spin size="large" />
        </Content>
      </Layout>
    );
  }

  if (!data) {
    return null; // Không render gì cả nếu không có dữ liệu
  }


  return (
    <Layout style={{ padding: 20, background: "#f0f2f5" }}>
      <Content>
        <Row gutter={16}>
          {[
            {
              title: "Nhân viên",
              value: data.totalUsers,
              icon: <UserOutlined />,
              color: "#1890ff",
              extra: (
                <div style={{ marginTop: 10, display: "flex", justifyContent: "center", gap: "" }}>
                  <Tag color="green">
                    <CheckCircleOutlined /> {data.totalUsersActive} Active
                  </Tag>
                  <Tag color="red">
                    <CloseCircleOutlined /> {data.totalUsersInactive} Inactive
                  </Tag>
              </div>
              ),
            },
            {
              title: "Số lượng sách",
              value: data.totalBook,
              icon: <ShoppingCartOutlined />,
              color: "#13c2c2",
            },
            {
              title: "Tổng hàng tồn kho",
              value: data.totalStockQuantity,
              icon: <MedicineBoxOutlined />,
              color: "#52c41a",
            },
            {
              title: "Tổng đơn nhập sách",
              value: data.totalIO,
              icon: <ArrowUpOutlined />,
              color: "#ff4d4f",
            },
            {
              title: "Tổng đơn",
              value: 'Chưa cập nhật',
              icon: <ArrowDownOutlined />,
              color: "#722ed1",
            },
            // {
            //   title: "Total Revenue",
            //   value: `$${dashboardData.revenue}`,
            //   icon: <DollarOutlined />,
            //   color: "#faad14",
            // },
           
          ].map((stat, index) => (
            <Col span={4} key={index}>
              <Card style={{ background: stat.color, color: "white" }}>
                <Statistic
                  title={stat.title}
                  value={stat.value}
                  prefix={stat.icon}
                  valueStyle={{ color: "white" }}
                />
                {stat.extra && <div style={{ marginTop: 10 }}>{stat.extra}</div>}
              </Card>
            </Col>
          ))}
        </Row>
        <Row gutter={16} style={{ marginTop: 20 }}></Row>

        <Row gutter={16} style={{ marginTop: 20 }}>
          <Col span={12}>
            <Card title="Book Categories Distribution">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={bookStats}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label
                  >
                    {bookStats.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Legend verticalAlign="bottom" height={36} />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <List
                dataSource={bookStats}
                renderItem={(item) => (
                  <List.Item>
                    <Tag
                      color={COLORS[bookStats.indexOf(item) % COLORS.length]}
                    >
                      {item.name}
                    </Tag>
                    <span>{item.value} books</span>
                  </List.Item>
                )}
              />
            </Card>
          </Col>
          <Col span={12}>
            <Card title="Monthly Sales Trend">
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={monthlySales}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="sales"
                    stroke="#1890ff"
                    fill="#1890ff"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </Card>
          </Col>
        </Row>

        <Row gutter={16} style={{ marginTop: 20 }}>
          <Col span={24}>
            <Card title="Recent Transactions">
              <Table
                dataSource={recentTransactions}
                pagination={false}
                columns={[
                  { title: "Type", dataIndex: "type", key: "type" },
                  { title: "Book", dataIndex: "book", key: "book" },
                  { title: "Quantity", dataIndex: "quantity", key: "quantity" },
                ]}
              />
            </Card>
          </Col>
        </Row>
      </Content>
    </Layout>
  );
};

export default Dashboard;
