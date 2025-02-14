import React, { useState, useEffect } from 'react';
import {
    Table, Space, Button, Input, Select, Popconfirm, Card,
    message, Tag, Pagination, Modal
} from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import axios from '../../configs/axios';
import BookForm from './BookForm';
import { API_BASE_URL } from '../../configs/api';

const { Search } = Input;
const { Option } = Select;

const BookList = () => {
    const [books, setBooks] = useState([]);
    const [loading, setLoading] = useState(false);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [searchText, setSearchText] = useState('');
    const [modalVisible, setModalVisible] = useState(false);
    const [editingBook, setEditingBook] = useState(null);
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [categoriesLoading, setCategoriesLoading] = useState(false);

    // Fetch books
    const fetchBooks = async () => {
        try {
            setLoading(true);
            const response = await axios.get('/books', {
                params: {
                    page,
                    limit: pageSize,
                    search: searchText,
                    categoryId: selectedCategory
                }
            });
            setBooks(response.data.data);
            setTotal(response.data.total);
        } catch (error) {
            message.error('Failed to fetch books');
        } finally {
            setLoading(false);
        }
    };

    // Fetch categories for filter
    const fetchCategories = async () => {
        try {
            setCategoriesLoading(true);
            const response = await axios.get('/categories');
            // API trả về trực tiếp mảng nên không cần .data.data
            setCategories(response.data);
            // console.log('Categories in BookList:', response.data); // Debug log
        } catch (error) {
            message.error('Failed to fetch categories');
            console.error('Error fetching categories:', error);
        } finally {
            setCategoriesLoading(false);
        }
    };

    // Tách riêng useEffect cho categories
    useEffect(() => {
        fetchCategories();
        // console.log(categories);
    }, []); // Chỉ fetch categories một lần khi component mount

    // useEffect riêng cho việc fetch books
    useEffect(() => {
        fetchBooks();
    }, [page, pageSize, searchText, selectedCategory]);

    // Handle book deletion
    const handleDelete = async (id) => {
        try {
            await axios.delete(`${API_BASE_URL}/books/${id}`);
            message.success('Book deleted successfully');
            fetchBooks();
        } catch (error) {
            message.error('Failed to delete book');
        }
    };

    // Handle modal
    const showModal = (book = null) => {
        setEditingBook(book);
        setModalVisible(true);
    };

    const handleModalClose = () => {
        setEditingBook(null);
        setModalVisible(false);
    };

    const handleSave = async (values) => {
        try {
            if (editingBook) {
                await axios.put(`${API_BASE_URL}/books/${editingBook.BookId}`, values);
                message.success('Book updated successfully');
            } else {
                await axios.post(`${API_BASE_URL}/books`, values);
                message.success('Book created successfully');
            }
            handleModalClose();
            fetchBooks();
        } catch (error) {
            message.error('Failed to save book');
        }
    };

    // Handle category change
    const handleCategoryChange = (value) => {
        setSelectedCategory(value);
        setPage(1); // Reset về trang 1 khi thay đổi filter
    };

    // Table columns
    const columns = [
        {
            title: 'Title',
            dataIndex: 'Title',
            key: 'Title',
            sorter: (a, b) => a.Title.localeCompare(b.Title)
        },
        {
            title: 'Author',
            dataIndex: 'Author',
            key: 'Author'
        },
        {
            title: 'Category',
            dataIndex: ['Category', 'CategoryName'],
            key: 'Category',
            render: (text, record) => record.Category?.CategoryName || 'N/A'
        },
        {
            title: 'Publisher',
            dataIndex: 'Publisher',
            key: 'Publisher'
        },
        {
            title: 'Status',
            dataIndex: 'Status',
            key: 'Status',
            render: (status) => (
                <Tag color={status === 'Active' ? 'green' : 'red'}>
                    {status}
                </Tag>
            )
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_, record) => (
                <Space>
                    <Button
                        type="primary"
                        icon={<EditOutlined />}
                        onClick={() => showModal(record)}
                    >
                        Edit
                    </Button>
                    <Popconfirm
                        title="Are you sure to delete this book?"
                        onConfirm={() => handleDelete(record.BookId)}
                        okText="Yes"
                        cancelText="No"
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
            )
        }
    ];

    return (
        <Card title="Book Management">
            <Space direction="vertical" style={{ width: '100%', marginBottom: 16 }}>
                <Space>
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => showModal()}
                    >
                        Add New Book
                    </Button>
                    <Search
                        placeholder="Search books..."
                        allowClear
                        onSearch={value => setSearchText(value)}
                        style={{ width: 300 }}
                    />
                    <Select
                        placeholder="Filter by category"
                        style={{ width: 200 }}
                        allowClear
                        value={selectedCategory}
                        onChange={handleCategoryChange}
                    >
                        {categories && categories.length > 0 && categories.map(category => (
                            <Option
                                key={category.categoryId}
                                value={category.categoryId}
                            >
                                {category.CategoryName}
                            </Option>
                        ))}
                    </Select>
                </Space>

                <Table
                    columns={columns}
                    dataSource={books}
                    rowKey="BookId"
                    loading={loading}
                    pagination={false}
                />

                <Pagination
                    total={total}
                    current={page}
                    pageSize={pageSize}
                    onChange={(page, pageSize) => {
                        setPage(page);
                        setPageSize(pageSize);
                    }}
                    showSizeChanger
                    showTotal={(total) => `Total ${total} items`}
                />
            </Space>

            <Modal
                title={editingBook ? 'Edit Book' : 'Add New Book'}
                open={modalVisible}
                onCancel={handleModalClose}
                footer={null}
                width={800}
            >
                <BookForm
                    initialValues={editingBook}
                    onSave={handleSave}
                    onCancel={handleModalClose}
                />
            </Modal>
        </Card>
    );
};

export default BookList;
