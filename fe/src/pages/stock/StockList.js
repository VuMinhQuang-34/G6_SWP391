import React, { useState, useEffect } from "react";
import axios from "axios";
import { Table, Input, Badge, Card, Spin, Alert, Tag, Button, Modal, Form, Typography, Space, Divider } from "antd";
import { SearchOutlined, EditOutlined, BookOutlined, DatabaseOutlined, WarningOutlined, InfoCircleOutlined } from "@ant-design/icons";
import { toast } from "react-toastify";
const { Search } = Input;
const { Title, Text } = Typography;

const StockManagement = () => {
  const [stocks, setStocks] = useState([]);
  const [filteredStocks, setFilteredStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStock, setEditingStock] = useState(null);
  const [form] = Form.useForm();

  const pageSize = 10;

  // Gọi API lấy dữ liệu
  useEffect(() => {
    fetchStocks();
  }, []);

  const fetchStocks = async () => {
    try {
      const response = await axios.get("http://localhost:9999/api/stocks");
      console.log("API Response:", response.data); // Log dữ liệu từ API để debug
      setStocks(response.data);
      setFilteredStocks(response.data);
    } catch (error) {
      console.error("Lỗi khi lấy dữ liệu:", error);
    } finally {
      setLoading(false);
    }
  };

  // Handle search by book ID (BookId)
  const handleSearch = (value) => {
    setSearchTerm(value);
    const filtered = stocks.filter((item) =>
      item.BookId.toString().includes(value)
    );
    setFilteredStocks(filtered);
    setCurrentPage(1);
  };

  // Display edit modal
  const showEditModal = (stock) => {
    setEditingStock(stock);
    form.setFieldsValue({
      Quantity: stock.Quantity,
      MaxStockQuantity: stock.MaxStockQuantity,
      MinStockQuantity: stock.MinStockQuantity,
      BookId: stock.BookId,
      Edit_Date: stock.Edit_Date ? new Date(stock.Edit_Date).toLocaleDateString() : "N/A",
      Note: stock.Note || "N/A",
      Status: stock.Status || "N/A",
    });
    setIsModalOpen(true);
  };

  // Xử lý cập nhật dữ liệu
  const handleUpdateStock = async () => {
    try {
      const values = form.getFieldsValue();

      // Kiểm tra số nguyên và điều kiện MinStockQuantity <= MaxStockQuantity
      if (!Number.isInteger(Number(values.MaxStockQuantity)) || !Number.isInteger(Number(values.MinStockQuantity))) {
        toast.error(`Số lượng tồn kho tối đa và tồn kho tối thiểu phải là số nguyên!`, { autoClose: 2000 });
        return;
      }

      if (values.MaxStockQuantity < 0 || values.MinStockQuantity < 0) {
        toast.error(`Số lượng cần lớn hơn 0`, { autoClose: 2000 });
        return;
      }

      if (values.MinStockQuantity >= values.MaxStockQuantity) {
        toast.error(`Số lượng tồn kho tối đa phải lớn hơn số lượng tồn kho tối thiểu`, { autoClose: 2000 });
        return;
      }

      // Gửi API cập nhật
      const payload = {
        BookId: editingStock.BookId,
        MaxStockQuantity: parseInt(values.MaxStockQuantity, 10),
        MinStockQuantity: parseInt(values.MinStockQuantity, 10),
      };

      await axios.patch("http://localhost:9999/api/stocks", payload);

      // Cập nhật state với dữ liệu mới
      setStocks((prev) =>
        prev.map((stock) =>
          stock.BookId === editingStock.BookId ? { ...stock, ...payload } : stock
        )
      );
      setFilteredStocks((prev) =>
        prev.map((stock) =>
          stock.BookId === editingStock.BookId ? { ...stock, ...payload } : stock
        )
      );

      toast.success(`Update successful`, { autoClose: 2000 });

      setIsModalOpen(false);
    } catch (error) {
      console.error("Error updating data:", error);
      toast.error(`Update failed`, { autoClose: 2000 });
    }
  };

  // Cấu hình cột bảng
  const columns = [
    {
      title: "Book ID",
      dataIndex: "BookId",
      key: "BookId",
      render: (text) => <b>{text}</b>,
    },
    {
      title: "Quantity",
      dataIndex: "Quantity",
      key: "Quantity",
      render: (value) => {
        // Đảm bảo hiển thị đúng cả khi giá trị là 0
        const quantity = Number(value);
        return (
          <Badge
            count={quantity}
            showZero={true}
            overflowCount={10000}
            style={{
              backgroundColor: quantity > 0 ? "#52c41a" : "#d9d9d9",
              color: "white",
              fontSize: '14px',
              padding: '0 8px'
            }}
          />
        );
      }
    },
    {
      title: "Max Stock Quantity",
      dataIndex: "MaxStockQuantity",
      key: "MaxStockQuantity",
      render: (value) => {
        const maxValue = Number(value);
        return (
          maxValue > 0 ?
            <Tag color="blue" style={{ fontSize: '14px', padding: '2px 10px' }}>
              <DatabaseOutlined /> {maxValue}
            </Tag> :
            <Tag color="default" style={{ fontSize: '14px', padding: '2px 10px' }}>
              <InfoCircleOutlined /> 0
            </Tag>
        );
      }
    },
    {
      title: "Min Stock Quantity",
      dataIndex: "MinStockQuantity",
      key: "MinStockQuantity",
      render: (value) => {
        const minValue = Number(value);
        return (
          minValue > 0 ?
            <Tag color="orange" style={{ fontSize: '14px', padding: '2px 10px' }}>
              <WarningOutlined /> {minValue}
            </Tag> :
            <Tag color="default" style={{ fontSize: '14px', padding: '2px 10px' }}>
              <InfoCircleOutlined /> 0
            </Tag>
        );
      }
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Button
          type="primary"
          icon={<EditOutlined />}
          onClick={() => showEditModal(record)}
          style={{ borderRadius: '6px' }}
        >
          Edit
        </Button>
      ),
    },
  ];

  return (
    <Card
      title={
        <Space align="center">
          <BookOutlined style={{ fontSize: '24px', color: '#1890ff' }} />
          <Title level={4} style={{ margin: 0 }}>Stock Management</Title>
        </Space>
      }
      bordered={false}
      style={{
        margin: "20px",
        padding: "20px",
        boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.1)",
        borderRadius: "10px",
      }}
    >
      <div className="stock-management-container">
        {/* Search bar */}
        <Search
          placeholder="🔍 Enter book ID to search..."
          onSearch={handleSearch}
          style={{
            width: "100%",
            maxWidth: "400px",
            marginBottom: 20,
            borderRadius: '8px',
            boxShadow: '0 2px 6px rgba(0, 0, 0, 0.1)'
          }}
          enterButton={
            <Button type="primary" icon={<SearchOutlined />} style={{ borderRadius: '0 8px 8px 0', height: '40px' }}>
              Search
            </Button>
          }
          size="large"
        />

        <Divider style={{ margin: '15px 0' }} />

        {/* Loading */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Spin tip="Loading data..." size="large" />
          </div>
        ) : filteredStocks.length === 0 ? (
          <Alert
            message="No data found!"
            type="warning"
            showIcon
            style={{ marginBottom: '20px', borderRadius: '8px' }}
          />
        ) : (
          <Table
            dataSource={filteredStocks}
            columns={columns}
            rowKey="StockId" // Sử dụng StockId làm khóa chính
            pagination={{
              current: currentPage,
              pageSize: pageSize,
              onChange: (page) => setCurrentPage(page),
              showSizeChanger: false,
              showTotal: (total) => `Total ${total} products`,
              style: { marginTop: '20px' }
            }}
            rowClassName={(record) => {
              // Kiểm tra MinStockQuantity và MaxStockQuantity khác 0 để tránh đánh dấu sai
              if (record.MinStockQuantity > 0 && record.Quantity < record.MinStockQuantity)
                return "low-stock";
              if (record.MaxStockQuantity > 0 && record.Quantity > record.MaxStockQuantity)
                return "over-stock";
              return "";
            }}
            style={{
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
              borderRadius: '8px',
              overflow: 'hidden'
            }}
          />
        )}

        {/* Stock edit modal */}
        <Modal
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <EditOutlined style={{ color: '#1890ff', fontSize: '20px' }} />
              <span>Edit Stock</span>
            </div>
          }
          open={isModalOpen}
          onCancel={() => setIsModalOpen(false)}
          onOk={handleUpdateStock}
          okText="Update"
          cancelText="Cancel"
          okButtonProps={{ style: { borderRadius: '6px' } }}
          cancelButtonProps={{ style: { borderRadius: '6px' } }}
          style={{ top: 20 }}
          maskStyle={{ backdropFilter: 'blur(2px)' }}
        >
          <Form form={form} layout="vertical">
            <Form.Item label="Book ID" name="BookId">
              <Input disabled style={{ borderRadius: '6px' }} />
            </Form.Item>
            <Form.Item label="Current Quantity" name="Quantity">
              <Input type="number" disabled style={{ borderRadius: '6px' }} />
            </Form.Item>
            <Form.Item
              label="Max Stock Quantity"
              name="MaxStockQuantity"
              extra="Max stock quantity must be greater than min stock quantity"
            >
              <Input type="number" style={{ borderRadius: '6px' }} />
            </Form.Item>
            <Form.Item
              label="Min Stock Quantity"
              name="MinStockQuantity"
              extra="Min stock quantity must be greater than or equal to 0"
            >
              <Input type="number" style={{ borderRadius: '6px' }} />
            </Form.Item>
          </Form>
        </Modal>

        {/* CSS tô màu hàng */}
        <style>{`
          .low-stock {
            background-color: rgba(238, 67, 93, 0.15) !important;
            color: rgb(0, 0, 0);
            font-weight: bold;
          }
          .low-stock:hover {
            background-color: rgba(238, 67, 93, 0.2) !important;
          }
          .over-stock {
            background-color: rgba(229, 241, 61, 0.15) !important;
            color: rgb(0, 0, 0);
            font-weight: bold;
          }
          .over-stock:hover {
            background-color: rgba(229, 241, 61, 0.2) !important;
          }
          .ant-table-row:hover {
            background-color: #f0f0f0 !important;
          }
          .ant-table-thead > tr > th {
            background-color: #f0f7ff;
            font-weight: bold;
            color: #333;
          }
          .stock-management-container .ant-table-pagination {
            margin: 16px 0;
          }
          .ant-input-search .ant-input {
            height: 40px;
            border-radius: 8px 0 0 8px;
          }
          .ant-input-group-addon {
            background: transparent;
          }
          .ant-badge-count {
            border-radius: 20px;
            min-width: 30px;
            height: 24px;
            line-height: 24px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
          }
        `}</style>
      </div>
    </Card>
  );
};

export default StockManagement;
