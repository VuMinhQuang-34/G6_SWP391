import React, { useEffect, useState } from "react";
import axios from "axios";
import { Table, Select, Input, Button, Card, Space } from "antd";
import { SearchOutlined, PlusOutlined, ReloadOutlined } from "@ant-design/icons";

const API_BASE_URL = "http://localhost:9999/api"; // Cập nhật URL API

const { Option } = Select;

const Location = () => {
    const [bins, setBins] = useState([]);
    const [shelves, setShelves] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchShelfId, setSearchShelfId] = useState("");
    const [searchBinId, setSearchBinId] = useState("");

    useEffect(() => {
        fetchBins();
        fetchShelves();
    }, []);

    // Lấy danh sách tất cả các Bin
    const fetchBins = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${API_BASE_URL}/bins`);
            setBins(response.data);
        } catch (error) {
            console.error("Lỗi khi lấy danh sách Bin:", error);
        } finally {
            setLoading(false);
        }
    };

    // Lấy danh sách Shelf để chọn trong dropdown
    const fetchShelves = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/shelves`);
            setShelves(response.data);
        } catch (error) {
            console.error("Lỗi khi lấy danh sách Shelf:", error);
        }
    };

    // Xử lý tìm kiếm theo `ShelfId` hoặc `BinId`
    const handleSearch = async () => {
        setLoading(true);
        let url = `${API_BASE_URL}/bins`;
        if (searchShelfId) url += `?shelfId=${searchShelfId}`;
        if (searchBinId) url += `?binId=${searchBinId}`;

        try {
            const response = await axios.get(url);
            setBins(response.data);
        } catch (error) {
            console.error("Lỗi khi tìm kiếm Bin:", error);
        } finally {
            setLoading(false);
        }
    };

    // Reset bộ lọc tìm kiếm
    const resetFilters = () => {
        setSearchShelfId("");
        setSearchBinId("");
        fetchBins();
    };

    // Cấu trúc cột của bảng
    const columns = [
        {
            title: "Mã Bin",
            dataIndex: "BinId",
            key: "BinId",
            sorter: (a, b) => a.BinId.localeCompare(b.BinId),
        },
        {
            title: "Mã Shelf",
            dataIndex: "ShelfId",
            key: "ShelfId",
        },
        {
            title: "Tên Bin",
            dataIndex: "Name",
            key: "Name",
        },
        {
            title: "Số lượng tối đa",
            dataIndex: "Quantity_Max_Limit",
            key: "Quantity_Max_Limit",
            sorter: (a, b) => a.Quantity_Max_Limit - b.Quantity_Max_Limit,
        },
        {
            title: "Số lượng hiện tại",
            dataIndex: "Quantity_Current",
            key: "Quantity_Current",
            sorter: (a, b) => a.Quantity_Current - b.Quantity_Current,
        },
        {
            title: "Mô tả",
            dataIndex: "Description",
            key: "Description",
        },
        {
            title: "Hành động",
            key: "action",
            render: (_, record) => (
                <Space size="middle">
                    <Button type="primary" onClick={() => alert(`Xem chi tiết: ${record.BinId}`)}>
                        Xem
                    </Button>
                    <Button type="danger" onClick={() => alert(`Xóa Bin: ${record.BinId}`)}>
                        Xóa
                    </Button>
                </Space>
            ),
        },
    ];

    return (
        <div className="container mx-auto p-6">
            <Card title="Quản lý Bin & Sách" bordered={false} style={{ backgroundColor: "#f5f5f5" }}>
                {/* Bộ lọc tìm kiếm */}
                <Space style={{ marginBottom: 16 }}>
                    <Select
                        showSearch
                        placeholder="Chọn Shelf"
                        value={searchShelfId}
                        onChange={setSearchShelfId}
                        style={{ width: 200 }}
                    >
                        <Option value="">Tất cả</Option>
                        {shelves.map((shelf) => (
                            <Option key={shelf.ShelfId} value={shelf.ShelfId}>
                                {shelf.ShelfId} - {shelf.Name}
                            </Option>
                        ))}
                    </Select>

                    <Input
                        placeholder="Tìm kiếm theo mã Bin"
                        value={searchBinId}
                        onChange={(e) => setSearchBinId(e.target.value)}
                        style={{ width: 200 }}
                        prefix={<SearchOutlined />}
                    />

                    <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
                        Tìm kiếm
                    </Button>
                    <Button icon={<ReloadOutlined />} onClick={resetFilters}>
                        Làm mới
                    </Button>
                    <Button type="dashed" icon={<PlusOutlined />} onClick={() => alert("Thêm mới Bin")}>
                        Thêm Bin
                    </Button>
                </Space>

                {/* Bảng danh sách Bin */}
                <Table
                    columns={columns}
                    dataSource={bins}
                    loading={loading}
                    rowKey="BinId"
                    pagination={{ pageSize: 10 }}
                    bordered
                />
            </Card>
        </div>
    );
};

export default Location;
