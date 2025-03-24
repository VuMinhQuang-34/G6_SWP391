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
            // Check token with correct key
            const token = localStorage.getItem('accessToken');
            if (!token) {
                message.error('Please login to perform this action');
                window.location.href = '/login';
                return;
            }

            const response = await axios.delete(`/books/${id}`);
            if (response.data.success) {
                message.success('Book deleted successfully');
                fetchBooks();
            } else {
                message.error(response.data.message || 'Failed to delete book');
            }
        } catch (error) {
            message.error('Error deleting book');
            console.error('Error:', error);
        }
    };

    // Show modal for add/edit
    const showModal = (book = null) => {
        setEditingBook(book);
        setModalVisible(true);
    };

    // Close the modal
    const handleModalClose = () => {
        setModalVisible(false);
        setEditingBook(null);
    };

    // Handle form save
    const handleSave = async (values) => {
        try {
            let formData = new FormData();

            // Append all form values to FormData
            Object.keys(values).forEach(key => {
                if (key === 'Image' && values[key] && values[key][0] && values[key][0].originFileObj) {
                    formData.append(key, values[key][0].originFileObj);
                } else if (values[key] !== undefined && values[key] !== null) {
                    formData.append(key, values[key]);
                }
            });

            let response;

            if (editingBook) {
                // Update existing book
                response = await axios.put(`/books/${editingBook.BookId}`, formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                });
                message.success('Book updated successfully');
            } else {
                // Create new book
                response = await axios.post('/books', formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                });
                message.success('Book added successfully');
            }

            // Close modal and refresh book list
            handleModalClose();
            fetchBooks();

        } catch (error) {
            message.error('Error saving book');
            console.error('Error saving book:', error);
        }
    };

    // Handle category filter change
    const handleCategoryChange = (value) => {
        setSelectedCategory(value);
        setPage(1); // Reset to first page when changing filter
    };

    // Table columns configuration
    const columns = [
        {
            title: 'Image',
            dataIndex: 'Image',
            key: 'Image',
            render: (text, record) => (
                <div style={{ width: '50px', height: '70px', overflow: 'hidden' }}>
                    <img
                        src={record.Image ? `${API_BASE_URL}/books/image/${record.BookId}` : 'https://via.placeholder.com/150x200?text=No+Image'}
                        alt={record.Title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                </div>
            ),
        },
        {
            title: 'Title',
            dataIndex: 'Title',
            key: 'Title',
            sorter: (a, b) => a.Title.localeCompare(b.Title),
        },
        {
            title: 'Author',
            dataIndex: 'Author',
            key: 'Author',
        },
        {
            title: 'Publisher',
            dataIndex: 'Publisher',
            key: 'Publisher',
        },
        {
            title: 'Category',
            dataIndex: 'Category',
            key: 'Category',
            render: (_, record) => record.Category?.Name || 'N/A',
        },
        {
            title: 'Publishing Year',
            dataIndex: 'PublishingYear',
            key: 'PublishingYear',
            sorter: (a, b) => a.PublishingYear - b.PublishingYear,
        },
        {
            title: 'Language',
            dataIndex: 'Language',
            key: 'Language',
        },
        {
            title: 'Status',
            dataIndex: 'Status',
            key: 'Status',
            render: (status) => (
                <Tag color={status === 'Active' ? 'green' : 'red'}>
                    {status}
                </Tag>
            ),
        },
        {
            title: 'Actions',
            key: 'action',
            render: (_, record) => (
                <Space size="middle">
                    <Button
                        type="primary"
                        icon={<EditOutlined />}
                        onClick={() => showModal(record)}
                    >
                        Edit
                    </Button>
                    <Popconfirm
                        title="Are you sure you want to delete this book?"
                        onConfirm={() => handleDelete(record.BookId)}
                        okText="Yes"
                        cancelText="No"
                    >
                        <Button
                            type="danger"
                            icon={<DeleteOutlined />}
                        >
                            Delete
                        </Button>
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    // Configure pagination
    const paginationConfig = {
        current: page,
        pageSize: pageSize,
        total: total,
        onChange: (page, pageSize) => {
            setPage(page);
            setPageSize(pageSize);
        },
        showSizeChanger: true,
        showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} books`,
    };

    return (
        <div style={{ padding: '20px' }}>
            <Card title="Book Management" bordered={false}>
                <div style={{ marginBottom: 16 }}>
                    <Space wrap>
                        <Search
                            placeholder="Search books..."
                            allowClear
                            onSearch={(value) => {
                                setSearchText(value);
                                setPage(1); // Reset to first page on new search
                            }}
                            style={{ width: 300 }}
                        />
                        <Select
                            placeholder="Filter by Category"
                            style={{ width: 200 }}
                            allowClear
                            loading={categoriesLoading}
                            onChange={handleCategoryChange}
                        >
                            {categories.map(category => (
                                <Option key={category.CategoryId} value={category.CategoryId}>
                                    {category.Name}
                                </Option>
                            ))}
                        </Select>
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={() => showModal()}
                        >
                            Add Book
                        </Button>
                    </Space>
                </div>

                <Table
                    columns={columns}
                    dataSource={books}
                    rowKey="BookId"
                    loading={loading}
                    pagination={paginationConfig}
                    scroll={{ x: 'max-content' }}
                />
            </Card>

            <Modal
                title={editingBook ? "Edit Book" : "Add New Book"}
                visible={modalVisible}
                onCancel={handleModalClose}
                footer={null}
                width={800}
                destroyOnClose
            >
                <BookForm
                    initialValues={editingBook}
                    onSave={handleSave}
                    onCancel={handleModalClose}
                    categories={categories}
                />
            </Modal>
        </div>
    );
};

export default BookList;
