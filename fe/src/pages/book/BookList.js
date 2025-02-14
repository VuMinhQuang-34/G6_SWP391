import React, { useState, useEffect, useCallback } from 'react';
import {
    Table, Space, Button, Input, Select, Popconfirm, Card,
    message, Tag, Pagination, Modal
} from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import axios from '../../configs/axios';
import BookForm from './BookForm';
import { API_BASE_URL } from '../../configs/api';
import { EventEmitter } from '../../utils/events';

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
    const [refreshKey, setRefreshKey] = useState(0);

    // Fetch books
    const fetchBooks = useCallback(async () => {
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
            console.log('Fetched books:', response.data); // Debug log
            if (response.data && response.data.data) {
                setBooks(response.data.data);
                setTotal(response.data.total);
            }
        } catch (error) {
            message.error('Failed to fetch books');
            console.error('Error fetching books:', error);
        } finally {
            setLoading(false);
        }
    }, [page, pageSize, searchText, selectedCategory]);

    // Fetch categories for filter
    const fetchCategories = async () => {
        try {
            setCategoriesLoading(true);
            const response = await axios.get('/categories');
            setCategories(response.data);
        } catch (error) {
            message.error('Failed to fetch categories');
            console.error('Error fetching categories:', error);
        } finally {
            setCategoriesLoading(false);
        }
    };

    // Fetch books when page, size, search, or category change
    useEffect(() => {
        fetchBooks();
    }, [page, pageSize, searchText, selectedCategory, refreshKey]);

    useEffect(() => {
        fetchCategories();
    }, []);

    useEffect(() => {
        const handleRefresh = () => {
            fetchBooks();
        };

        window.addEventListener('REFRESH_BOOKS', handleRefresh);

        return () => {
            window.removeEventListener('REFRESH_BOOKS', handleRefresh);
        };
    }, [fetchBooks]);

    // Handle book deletion
    const handleDelete = async (id) => {
        try {
            // Kiểm tra token với đúng key
            const token = localStorage.getItem('accessToken');
            if (!token) {
                message.error('Please login to perform this action');
                window.location.href = '/login';
                return;
            }

            const response = await axios.delete(`/books/${id}`);
            if (response.data.success) {
                message.success('Book deleted successfully');
                setRefreshKey(prev => prev + 1); // Force refresh
            } else {
                message.error(response.data.message || 'Failed to delete book');
            }
        } catch (error) {
            const errorMessage = error.response?.data?.message ||
                error.message ||
                'Failed to delete book';
            message.error(errorMessage);
            console.error('Error deleting book:', error);
        }
    };

    // Handle modal
    const showModal = (book = null) => {
        console.log('Show modal with book:', book); // Debug log
        if (book) {
            // Đảm bảo tất cả các trường cần thiết đều có
            setEditingBook({
                BookId: book.BookId,
                Title: book.Title,
                Author: book.Author,
                CategoryId: book.CategoryId,
                Publisher: book.Publisher,
                PublishingYear: book.PublishingYear,
                NumberOfPages: book.NumberOfPages,
                Language: book.Language,
                Status: book.Status || 'Active'
            });
        } else {
            setEditingBook(null);
        }
        setModalVisible(true);
    };

    const handleModalClose = () => {
        setEditingBook(null);
        setModalVisible(false);
    };

    const handleSave = async (values) => {
        try {
            const token = localStorage.getItem('accessToken');
            if (!token) {
                message.error('Please login to perform this action');
                window.location.href = '/login';
                return;
            }

            if (editingBook) {
                const response = await axios.put(`/books/${editingBook.BookId}`, values);
                if (response.data.success) {
                    message.success('Book updated successfully');
                    handleModalClose();
                    fetchBooks(); // Gọi trực tiếp fetchBooks thay vì dùng refreshKey
                } else {
                    message.error(response.data.message || 'Failed to update book');
                }
            } else {
                const response = await axios.post('/books', values);
                if (response.data.success) {
                    message.success('Book created successfully');
                    handleModalClose();
                    fetchBooks(); // Gọi trực tiếp fetchBooks thay vì dùng refreshKey
                } else {
                    message.error(response.data.message || 'Failed to create book');
                }
            }
        } catch (error) {
            const errorMessage = error.response?.data?.message ||
                error.message ||
                'Failed to save book';
            message.error(errorMessage);
            console.error('Error saving book:', error);
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
                destroyOnClose={true}
            >
                <BookForm
                    key={editingBook?.BookId || 'new'}
                    initialValues={editingBook}
                    onCancel={handleModalClose}
                />
            </Modal>
        </Card>
    );
};

export default BookList;
