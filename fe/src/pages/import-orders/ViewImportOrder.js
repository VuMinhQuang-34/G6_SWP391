import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { Card, Descriptions, Spin, Button, Table, Typography, Row, Col } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import VerticalTimeline from '../../components/VerticalTimeline'; // Import component VerticalTimeline
import OrderHistoryLog from '../../components/OrderHistoryLog'; // Import component VerticalTimeline
import { orderStatuses, suppliersList } from "../../constants/variable";

const { Title } = Typography;

const ViewImportOrder = () => {
    const { id } = useParams(); // Lấy ID từ URL
    const [orderDetails, setOrderDetails] = useState(null);
    const [loading, setLoading] = useState(true);

    console.log("ViewImportOrder => ", id);
    useEffect(() => {
        const fetchOrderDetails = async () => {
            setLoading(true);
            try {
                const response = await axios.get(`http://localhost:9999/api/import-orders/${id}`);
                setOrderDetails(response.data);
            } catch (error) {
                console.error("Lỗi khi tải thông tin đơn nhập:", error);
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchOrderDetails();
        }
    }, [id]);

    if (loading) return <Spin size="large" />; // Hiển thị loading spinner
    if (!orderDetails) return <p>Không có thông tin đơn nhập.</p>;

    // Cấu hình cột cho bảng sách
    const columns = [
        {
            title: 'ID Sách',
            dataIndex: 'BookId',
            key: 'BookId',
        },
        {
            title: 'Tên Sách',
            dataIndex: ['BookInfo', 'Title'], // Truy cập vào BookInfo.Title
            key: 'Title',
        },
        {
            title: 'Tác Giả',
            dataIndex: ['BookInfo', 'Author'], // Truy cập vào BookInfo.Author
            key: 'Author',
        },
        {
            title: 'Nhà Xuất Bản',
            dataIndex: ['BookInfo', 'Publisher'], // Truy cập vào BookInfo.Publisher
            key: 'Publisher',
        },
        {
            title: 'Số Lượng',
            dataIndex: 'Quantity',
            key: 'Quantity',
        },
        {
            title: 'Giá',
            dataIndex: 'Price',
            key: 'Price',
            render: (text) => <span style={{ color: '#ff4d4f', fontWeight: 'bold' }}>{text} VNĐ</span>, // Nổi bật giá
        },
    ];

 

    return (
        <div style={{ width: '100%', margin: '20px', padding: "20px" }}>
            <Button 
                type="primary"
                style={{ marginBottom: '20px', backgroundColor: '#52c41a', borderColor: '#52c41a' }} 
                icon={<ArrowLeftOutlined />} 
                onClick={() => window.history.back()}
            >
                Quay Lại
            </Button>

            <Row gutter={24}>
                {/* Card 1: Thông tin đơn nhập */}
                <Col span={12}>
                    <Card style={{ borderRadius: '10px', boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)', backgroundColor: '#e6f7ff', marginBottom: '20px' }}>
                        <Title level={4}>Thông Tin Đơn Nhập</Title>
                        <Descriptions bordered column={1}>
                            <Descriptions.Item label="ID Đơn Nhập">{orderDetails.ImportOrderId}</Descriptions.Item>
                            <Descriptions.Item label="Nhà Cung Cấp">{orderDetails.SupplierID}</Descriptions.Item>
                            <Descriptions.Item label="Ngày Nhập">{new Date(orderDetails.ImportDate).toLocaleDateString()}</Descriptions.Item>
                            <Descriptions.Item label="Ghi Chú">{orderDetails.Note}</Descriptions.Item>
                            <Descriptions.Item label="Trạng Thái">{orderDetails.Status}</Descriptions.Item>
                            <Descriptions.Item label="Tổng Số Lượng" style={{ color: '#52c41a', fontWeight: 'bold' }}>{orderDetails.totalQuantity}</Descriptions.Item>
                            <Descriptions.Item label="Tổng Giá" style={{ color: '#52c41a', fontWeight: 'bold' }}>{orderDetails.totalPrice} VNĐ</Descriptions.Item>
                        </Descriptions>
                    </Card>

                    {/* Card 2: Danh sách sách */}
                    <Card title="Danh Sách Sách Của Đơn Nhập" style={{ borderRadius: '10px', boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)', backgroundColor: '#fff3e6' }}>
                        <Table 
                            dataSource={orderDetails.details} 
                            columns={columns} 
                            rowKey="BookId" 
                            pagination={{ pageSize: 5 }} 
                            bordered 
                            summary={pageData => {
                                let totalQuantity = 0;
                                let totalPrice = 0;

                                pageData.forEach(({ Quantity, Price }) => {
                                    totalQuantity += Quantity;
                                    totalPrice += Price * Quantity; // Tính tổng giá
                                });

                                return (
                                    <Table.Summary fixed>
                                        <Table.Summary.Row>
                                            <Table.Summary.Cell index={0} colSpan={4}>Tổng Cộng</Table.Summary.Cell>
                                            <Table.Summary.Cell index={1} style={{ color: '#52c41a', fontWeight: 'bold' }}>{totalQuantity}</Table.Summary.Cell>
                                            <Table.Summary.Cell index={2} style={{ color: '#52c41a', fontWeight: 'bold' }}>{totalPrice} VNĐ</Table.Summary.Cell>
                                        </Table.Summary.Row>
                                    </Table.Summary>
                                );
                            }}
                        />
                    </Card>
                </Col>

                {/* Card 3: Timeline lưu trình của đơn hàng */}
                <Col span={6}>
                    <VerticalTimeline orderId={id} orderStatuses={orderStatuses} orderType="Import"/> {/* Truyền orderStatuses vào component VerticalTimeline */}
                </Col>

                {/* Card 4: Lịch sử status log của đơn hàng */}
                <Col span={6} style={{ marginTop: '0' }}>
                    <OrderHistoryLog orderId={id} orderType="Import"/>
                </Col>
            </Row>
        </div>
    );
};

export default ViewImportOrder; 