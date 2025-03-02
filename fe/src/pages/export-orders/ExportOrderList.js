import React, { useContext, useEffect, useState } from "react";
import { Link } from 'react-router-dom';
import {
    Table, Button, Input, Space, DatePicker,
    Select, Card, message, Tag
} from "antd";
import { PlusOutlined } from '@ant-design/icons';
import axios from "axios";
import { AuthContext } from "../../context/AuthContext";
import HorizontalTimeline from "../../components/HorizontalTimeline";
import AddExportOrderModal from "./AddExportOrderModal";
import moment from "moment";

const { Option } = Select;
const { RangePicker } = DatePicker;

const ExportOrderList = () => {
    const { user } = useContext(AuthContext);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isAddModalVisible, setIsAddModalVisible] = useState(false);
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 10,
        total: 0
    });

    // Search states
    const [searchId, setSearchId] = useState('');
    const [searchStatus, setSearchStatus] = useState('');
    const [dateRange, setDateRange] = useState([]);

    const fetchOrders = async (params = {}) => {
        try {
            setLoading(true);
            const { current, pageSize } = params;
            const response = await axios.get("http://localhost:9999/api/export-orders", {
                params: {
                    page: current || 1,
                    limit: pageSize || 10,
                    status: searchStatus || undefined,
                    searchId: searchId || undefined,
                    fromDate: dateRange[0]?.format('YYYY-MM-DD'),
                    toDate: dateRange[1]?.format('YYYY-MM-DD')
                }
            });

            setOrders(response.data.orders);
            setPagination({
                ...params.pagination,
                total: response.data.total,
            });
        } catch (error) {
            message.error("Failed to fetch orders");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders({ current: 1, pageSize: 10 });
    }, [searchId, searchStatus, dateRange]);

    const handleTableChange = (newPagination) => {
        fetchOrders({
            current: newPagination.current,
            pageSize: newPagination.pageSize,
        });
    };

    const columns = [
        {
            title: 'Order ID',
            dataIndex: 'id',
            key: 'id',
            render: (id) => <Link to={`/orders-export/${id}`}>{id}</Link>
        },
        {
            title: 'Created By',
            dataIndex: 'createdBy',
            key: 'createdBy',
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status) => (
                <HorizontalTimeline
                    statusKey={status}
                    orderStatuses={[
                        { key: 'New', label: 'New' },
                        { key: 'Approved', label: 'Approved' },
                        { key: 'Packed', label: 'Packed' },
                        { key: 'Shipped', label: 'Shipped' }
                    ]}
                />
            )
        },
        {
            title: 'Order Date',
            dataIndex: 'orderDate',
            key: 'orderDate',
            render: (date) => moment(date).format('DD/MM/YYYY HH:mm')
        },
        {
            title: 'Approved By',
            dataIndex: 'approvedBy',
            key: 'approvedBy',
        },
        {
            title: 'Note',
            dataIndex: 'note',
            key: 'note',
            ellipsis: true
        }
    ];

    return (
        <div style={{ padding: 24 }}>
            <Card title="Export Orders">
                <Space style={{ marginBottom: 16 }} wrap>
                    <Input
                        placeholder="Search by Order ID"
                        value={searchId}
                        onChange={e => setSearchId(e.target.value)}
                        style={{ width: 200 }}
                    />
                    <Select
                        placeholder="Filter by status"
                        value={searchStatus}
                        onChange={value => setSearchStatus(value)}
                        allowClear
                        style={{ width: 150 }}
                    >
                        <Option value="New">New</Option>
                        <Option value="Approved">Approved</Option>
                        <Option value="Packed">Packed</Option>
                        <Option value="Shipped">Shipped</Option>
                    </Select>
                    <RangePicker
                        onChange={setDateRange}
                        format="DD/MM/YYYY"
                    />
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => setIsAddModalVisible(true)}
                    >
                        Create Order
                    </Button>
                </Space>

                <Table
                    columns={columns}
                    dataSource={orders}
                    rowKey="id"
                    loading={loading}
                    pagination={pagination}
                    onChange={handleTableChange}
                />
            </Card>

            <AddExportOrderModal
                visible={isAddModalVisible}
                onCancel={() => setIsAddModalVisible(false)}
                onSuccess={() => {
                    setIsAddModalVisible(false);
                    fetchOrders({ current: 1, pageSize: 10 });
                }}
            />
        </div>
    );
};

export default ExportOrderList;
