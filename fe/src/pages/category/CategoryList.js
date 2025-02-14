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
                        title="Delete Category"
                        description="Are you sure you want to delete this category?"
                        onConfirm={() => handleDelete(record.categoryId)}
                        okText="Yes, Delete"
                        cancelText="No, Cancel"
                    >
                        <Button
                            type="primary"
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
        <div style={{ padding: '24px' }}>
            <Card>
                <Space style={{ marginBottom: '16px' }} size="large">
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => {
                            setEditingCategory(null);
                            form.resetFields();
                            setIsModalVisible(true);
                        }}
                    >
                        Add New Category
                    </Button>

                    <Input
                        placeholder="Search by ID or name..."
                        prefix={<SearchOutlined />}
                        value={searchText}
                        onChange={e => setSearchText(e.target.value)}
                        style={{ width: '300px' }}
                        allowClear
                    />
                </Space>

                <Table
                    columns={columns}
                    dataSource={filteredCategories}
                    rowKey="categoryId"
                    bordered
                    pagination={{
                        showSizeChanger: true,
                        showTotal: (total, range) =>
                            `${range[0]}-${range[1]} of ${total} items`,
                        pageSize: 10,
                        pageSizeOptions: ['10', '20', '50']
                    }}
                />
            </Card>

            <Modal
                title={editingCategory ? 'Edit Category' : 'Add New Category'}
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
                        rules={[{
                            required: true,
                            message: 'Please enter the category name!'
                        }]}
                    >
                        <Input placeholder="Enter category name" />
                    </Form.Item>

                    <Form.Item>
                        <Space>
                            <Button type="primary" htmlType="submit">
                                {editingCategory ? 'Update Category' : 'Create Category'}
                            </Button>
                            <Button onClick={() => setIsModalVisible(false)}>
                                Cancel
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default CategoryList;
