import React, { useState, useEffect } from "react";
import axios from "axios";
import { Table, Input, Badge, Card, Spin, Alert, Tag, Button, Modal, Form } from "antd";
import { SearchOutlined, EditOutlined } from "@ant-design/icons";
import { toast } from "react-toastify";
const { Search } = Input;

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
      setStocks(response.data);
      setFilteredStocks(response.data);
    } catch (error) {
      console.error("Lỗi khi lấy dữ liệu:", error);
    } finally {
      setLoading(false);
    }
  };

  // Xử lý tìm kiếm theo mã sách (BookId)
  const handleSearch = (value) => {
    setSearchTerm(value);
    const filtered = stocks.filter((item) =>
      item.BookId.toString().includes(value)
    );
    setFilteredStocks(filtered);
    setCurrentPage(1);
  };

  // Hiển thị modal chỉnh sửa
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

      toast.success(`Cập nhật thành công`, { autoClose: 2000 });

      setIsModalOpen(false);
    } catch (error) {
      console.error("Lỗi khi cập nhật dữ liệu:", error);
      toast.error(`Cập nhật thất bại`, { autoClose: 2000 });

    }
  };

  // Cấu hình cột bảng
  const columns = [
    {
      title: "Mã Sách",
      dataIndex: "BookId",
      key: "BookId",
      render: (text) => <b>{text}</b>,
    },
    {
      title: "Số Lượng",
      dataIndex: "Quantity",
      key: "Quantity",
      render: (text) => <Badge
        count={text}
        style={{ backgroundColor: "#52c41a", color: "white" }} // Màu xanh
      />,
    },
    {
      title: "Số Lượng Tồn Kho Tối Đa",
      dataIndex: "MaxStockQuantity",
      key: "MaxStockQuantity",
      render: (value) => (value > 0 ? value : <Tag color="default">0</Tag>),
    },
    {
      title: "Số Lượng Tồn Kho Tối Thiểu",
      dataIndex: "MinStockQuantity",
      key: "MinStockQuantity",
      render: (value) => (value > 0 ? value : <Tag color="default">0</Tag>),
    },
    {
      title: "Thao Tác",
      key: "actions",
      render: (_, record) => (
        <Button icon={<EditOutlined />} onClick={() => showEditModal(record)}>
          Sửa
        </Button>
      ),
    },
  ];

  return (
    // <Card
    //   title="📚 Quản lý tồn kho"
    //   bordered={false}
    //   style={{
    //     margin: "20px",
    //     padding: "20px",
    //     boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.1)",
    //     borderRadius: "10px",
    //   }}
    // >
      <div style={{ padding: "20px" }}>
      {/* Thanh tìm kiếm */}
      <Search
        placeholder="🔍 Nhập mã sách để tìm..."
        onSearch={handleSearch}
        style={{ width: "100%", maxWidth: "400px", marginBottom: 20 }}
        enterButton={<SearchOutlined />}
        size="large"
      />

      {/* Loading */}
      {loading ? (
        <Spin tip="Đang tải dữ liệu..." size="large" style={{ display: "block", textAlign: "center", marginTop: 20 }} />
      ) : filteredStocks.length === 0 ? (
        <Alert message="Không tìm thấy dữ liệu!" type="warning" showIcon />
      ) : (
        <Table
          dataSource={filteredStocks}
          columns={columns}
          rowKey="StockId"
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            onChange: (page) => setCurrentPage(page),
          }}
          rowClassName={(record) => {
            if (record.Quantity < record.MinStockQuantity) return "low-stock";
            if (record.Quantity > record.MaxStockQuantity && record.MaxStockQuantity > 0)
              return "over-stock";
            return "";
          }}
        />
      )}

      {/* Modal chỉnh sửa tồn kho */}
      <Modal
        title="Chỉnh sửa tồn kho"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onOk={handleUpdateStock}
      >
        <Form form={form} layout="vertical">
          <Form.Item label="Mã Sách" name="BookId">
            <Input disabled />
          </Form.Item>
          <Form.Item label="Số Lượng" name="Quantity">
            <Input type="number" disabled />
          </Form.Item>
          <Form.Item label="Tồn Kho Tối Đa" name="MaxStockQuantity">
            <Input type="number" />
          </Form.Item>
          <Form.Item label="Tồn Kho Tối Thiểu" name="MinStockQuantity">
            <Input type="number" />
          </Form.Item>
        </Form>
      </Modal>

      {/* CSS tô màu hàng */}
      <style>{`
        .low-stock {
          background-color:rgb(238, 67, 93) !important; /* Đỏ nhạt */
          color:rgb(0, 0, 0);
          font-weight: bold;
        }
        .over-stock {
          background-color:rgb(229, 241, 61) !important; /* Xanh nhạt */
          color:rgb(0, 0, 0);
          font-weight: bold;
        }
        .ant-table-row:hover {
          background-color: #f0f0f0 !important;
        }
      `}</style>
    {/* </Card> */}
    </div>
  );
};

export default StockManagement;
