import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Space, Card, Popconfirm } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { toast } from 'react-toastify';
import axios from 'axios';

const BASE_URL = 'http://localhost:9999/api';

const CategoryList = () => {
    const [categories, setCategories] = useState([]);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [searchText, setSearchText] = useState('');
    const [filteredCategories, setFilteredCategories] = useState([]);
    const [form] = Form.useForm();

    // Fetch categories
    const fetchCategories = async () => {
        try {
            const response = await axios.get(`${BASE_URL}/categories`);
            setCategories(response.data);
            setFilteredCategories(response.data);

        } catch (error) {
            toast.error('Error: Unable to fetch categories. Please try again later.');
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    // Handle search and filter
    useEffect(() => {
        const filtered = categories.filter(category =>
            category.CategoryName.toLowerCase().includes(searchText.toLowerCase()) ||
            category.categoryId.toString().includes(searchText)
        );
        setFilteredCategories(filtered);
    }, [searchText, categories]);

    // Handle create/update
    const handleSubmit = async (values) => {
        try {
            if (editingCategory) {
                // Update
                await axios.put(`${BASE_URL}/categories/${editingCategory.categoryId}`, {
                    CategoryName: values.CategoryName
                });
                toast.success('Success: Category has been updated successfully!');
            } else {
                // Create
                await axios.post(`${BASE_URL}/categories`, {
                    CategoryName: values.CategoryName
                });
                toast.success('Success: New category has been created successfully!');
            }
            setIsModalVisible(false);
            form.resetFields();
            fetchCategories();
        } catch (error) {
            console.log(error);
            
            toast.error(editingCategory
                ? 'Error: Failed to update category. Please try again.'
                : 'Error: Failed to create category. Please try again.'
            );
        }
    };

    // Handle delete
    const handleDelete = async (id) => {
        try {
            await axios.delete(`${BASE_URL}/categories/${id}`);
            toast.success('Success: Category has been deleted successfully!');
            fetchCategories();
        } catch (error) {
            toast.error('Error: Failed to delete category. Please try again.');
        }
    };

    // Table columns with sorting
    const columns = [
        {
            title: 'Category ID',
            dataIndex: 'categoryId',
            key: 'categoryId',
            sorter: (a, b) => a.categoryId - b.categoryId,
        },
        {
            title: 'Category Name',
            dataIndex: 'CategoryName',
            key: 'CategoryName',
            sorter: (a, b) => a.CategoryName.localeCompare(b.CategoryName),
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_, record) => (
                <Space>
                    <Button
                        type="primary"
                        icon={<EditOutlined />}
                        onClick={() => {
                            setEditingCategory(record);
                            form.setFieldsValue({
                                CategoryName: record.CategoryName
                            });
                            setIsModalVisible(true);
                        }}
                    >
                        Edit
                    </Button>
                    <Popconfirm
                        title="Are you sure you want to delete this category?"
                        onConfirm={() => handleDelete(record.categoryId)}
                        okText="Yes"
                        cancelText="No"
                        okButtonProps={{ danger: true }}
                    >
                        <Button
                            danger
                            icon={<DeleteOutlined />}
                        >
                            Delete
                        </Button>
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <Card
            title="Category Management"
            extra={
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => {
                        setEditingCategory(null);
                        form.resetFields();
                        setIsModalVisible(true);
                    }}
                >
                    Add Category
                </Button>
            }
            style={{ margin: '20px' }}
        >
            <Space direction="vertical" style={{ width: '100%' }}>
                <Input
                    placeholder="Search categories..."
                    prefix={<SearchOutlined />}
                    value={searchText}
                    onChange={e => setSearchText(e.target.value)}
                    style={{ width: 300, marginBottom: 16 }}
                />

                <Table
                    columns={columns}
                    dataSource={filteredCategories}
                    rowKey="categoryId"
                    pagination={{
                        defaultPageSize: 10,
                        showSizeChanger: true,
                        pageSizeOptions: ['10', '20', '50'],
                        showTotal: (total) => `Total ${total} items`
                    }}
                />

                <Modal
                    title={editingCategory ? "Edit Category" : "Add New Category"}
                    open={isModalVisible}
                    onCancel={() => {
                        setIsModalVisible(false);
                        form.resetFields();
                    }}
                    footer={null}
                >
                    <Form
                        form={form}
                        layout="vertical"
                        onFinish={handleSubmit}
                    >
                        <Form.Item
                            name="CategoryName"
                            label="Category Name"
                            rules={[
                                { required: true, message: 'Please enter a category name' },
                                { min: 2, message: 'Category name must be at least 2 characters' },
                                { max: 100, message: 'Category name cannot exceed 100 characters' }
                            ]}
                        >
                            <Input placeholder="Enter category name" />
                        </Form.Item>

                        <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
                            <Space>
                                <Button onClick={() => {
                                    setIsModalVisible(false);
                                    form.resetFields();
                                }}>
                                    Cancel
                                </Button>
                                <Button type="primary" htmlType="submit">
                                    {editingCategory ? 'Update' : 'Create'}
                                </Button>
                            </Space>
                        </Form.Item>
                    </Form>
                </Modal>
            </Space>
        </Card>
    );
};

export default CategoryList;
