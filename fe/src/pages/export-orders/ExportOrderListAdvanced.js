// src/pages/ExportOrderListAdvanced.js
import React, { useEffect, useState } from 'react';
import {
    Table, Button, Select, DatePicker, Input, Space, message
} from 'antd';
import axios from 'axios';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;
const { Search } = Input;

function ExportOrderListAdvanced() {
    const [loading, setLoading] = useState(false);
    const [orders, setOrders] = useState([]);

    // Bộ lọc
    const [statusFilter, setStatusFilter] = useState('');
    const [searchId, setSearchId] = useState('');
    const [dateRange, setDateRange] = useState([]);

    // Lấy danh sách phiếu xuất
    const fetchOrders = async () => {
        try {
            setLoading(true);
            const params = {};

            // Nếu có statusFilter thì thêm vào query
            if (statusFilter) {
                params.status = statusFilter;
            }

            // Nếu có searchId
            if (searchId) {
                params.searchId = searchId;
            }

            // Nếu chọn khoảng ngày
            if (dateRange.length === 2) {
                const [start, end] = dateRange;
                params.fromDate = dayjs(start).format('YYYY-MM-DD');
                params.toDate = dayjs(end).format('YYYY-MM-DD');
            }

            const res = await axios.get('/api/export-orders', { params });
            // Backend có thể trả về: { total, totalPages, currentPage, orders: [...] }
            // Ta gán vào state:
            setOrders(res.data.orders || res.data);
        } catch (error) {
            message.error('Không thể tải danh sách phiếu xuất');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
        // eslint-disable-next-line
    }, []);

    // Filter theo trạng thái
    const handleStatusChange = (value) => {
        setStatusFilter(value);
    };

    // Chọn date range
    const handleDateRangeChange = (values) => {
        setDateRange(values || []);
    };

    // Tìm kiếm theo mã phiếu (searchId)
    const onSearchById = (value) => {
        setSearchId(value);
    };

    // Ấn nút "Lọc" => gọi lại fetchOrders
    const handleFilter = () => {
        fetchOrders();
    };

    const columns = [
        {
            title: 'Mã Phiếu',
            dataIndex: 'ExportOrderId'
        },
        {
            title: 'Trạng Thái',
            dataIndex: 'Status'
        },
        {
            title: 'Người Tạo',
            dataIndex: 'CreatedBy',
            // Nếu backend trả Creator.FullName, ta có thể map sang 1 field "CreatedByName"
            // tuỳ cách bạn trả JSON. Ví dụ:
            // render: (text, record) => record?.Creator?.FullName || ''
        },
        {
            title: 'Ngày Tạo',
            dataIndex: 'Created_Date',
            render: (value) => value ? new Date(value).toLocaleString() : ''
        },
        {
            title: 'Ghi Chú',
            dataIndex: 'Note'
        },
        {
            title: 'Hành Động',
            render: (record) => (
                <Button
                    type="link"
                    onClick={() => window.location.href = `/export-orders/${record.ExportOrderId}`}
                >
                    Detail
                </Button>
            )
        }
    ];

    return (
        <div style={{ padding: 20 }}>
            <h2>Danh sách Phiếu Xuất - Nâng Cao</h2>

            <Space style={{ marginBottom: 16, flexWrap: 'wrap' }}>
                {/* Chọn status */}
                <Select
                    placeholder="Chọn trạng thái"
                    style={{ width: 150 }}
                    allowClear
                    onChange={handleStatusChange}
                >
                    <Select.Option value="New">New</Select.Option>
                    <Select.Option value="Confirmed">Confirmed</Select.Option>
                    <Select.Option value="Approved">Approved</Select.Option>
                    <Select.Option value="Rejected">Rejected</Select.Option>
                    <Select.Option value="Packing">Packing</Select.Option>
                    <Select.Option value="Shipping">Shipping</Select.Option>
                    <Select.Option value="Completed">Completed</Select.Option>
                </Select>

                {/* Chọn khoảng ngày */}
                <RangePicker
                    onChange={handleDateRangeChange}
                    placeholder={['Từ ngày', 'Đến ngày']}
                />

                {/* Tìm kiếm theo mã phiếu (ExportOrderId) */}
                <Search
                    placeholder="Nhập mã phiếu"
                    onSearch={onSearchById}
                    allowClear
                    style={{ width: 200 }}
                />

                <Button type="primary" onClick={handleFilter}>
                    Lọc
                </Button>

                {/* Nút chuyển sang trang Tạo phiếu xuất */}
                <Button onClick={() => window.location.href = '/export-orders/create'}>
                    Tạo Phiếu Xuất
                </Button>
            </Space>

            <Table
                rowKey="ExportOrderId"
                columns={columns}
                dataSource={orders}
                loading={loading}
                pagination={{ pageSize: 8 }}
            />
        </div>
    );
}

export default ExportOrderListAdvanced;
