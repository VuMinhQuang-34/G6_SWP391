import React, { useState, useEffect } from 'react';
import { Form, Input, Select, Button, InputNumber, message } from 'antd';
import axios from '../../configs/axios';

const { Option } = Select;

const BookForm = ({ initialValues, onSave, onCancel }) => {
    const [form] = Form.useForm();
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);

    // Fetch categories
    const fetchCategories = async () => {
        try {
            setLoading(true);
            const response = await axios.get('/categories');
            setCategories(response.data);
        } catch (error) {
            message.error('Failed to fetch categories');
            console.error('Error fetching categories:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    useEffect(() => {
        if (initialValues) {
            form.setFieldsValue(initialValues);
        } else {
            form.resetFields();
            // Set default values for new book
            form.setFieldsValue({
                Status: 'Active',
                Created_Date: new Date(),
                Edit_Date: new Date()
            });
        }
    }, [initialValues, form]);

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            // Add timestamps if creating new book
            if (!initialValues) {
                values.Created_Date = new Date();
                values.Edit_Date = new Date();
            } else {
                values.Edit_Date = new Date();
            }
            onSave(values);
        } catch (error) {
            console.error('Validation failed:', error);
        }
    };

    if (loading) {
        return <div>Loading categories...</div>;
    }

    return (
        <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            initialValues={{ Status: 'Active' }}
        >
            <Form.Item
                name="Title"
                label="Title"
                rules={[{ required: true, message: 'Please input the title!' }]}
            >
                <Input maxLength={255} />
            </Form.Item>

            <Form.Item
                name="Author"
                label="Author"
                rules={[{ required: true, message: 'Please input the author!' }]}
            >
                <Input maxLength={255} />
            </Form.Item>

            <Form.Item
                name="CategoryId"
                label="Category"
                rules={[{ required: true, message: 'Please select the category!' }]}
            >
                <Select loading={loading}>
                    {categories.map(category => (
                        <Option
                            key={category.categoryId}
                            value={category.categoryId}
                        >
                            {category.CategoryName}
                        </Option>
                    ))}
                </Select>
            </Form.Item>

            <Form.Item
                name="Publisher"
                label="Publisher"
                rules={[{ required: true, message: 'Please input the publisher!' }]}
            >
                <Input maxLength={255} />
            </Form.Item>

            <Form.Item
                name="PublishingYear"
                label="Publishing Year"
                rules={[
                    { required: true, message: 'Please input the publishing year!' },
                    {
                        type: 'number',
                        min: 1900,
                        max: new Date().getFullYear(),
                        message: `Year must be between 1900 and ${new Date().getFullYear()}`
                    }
                ]}
            >
                <InputNumber
                    style={{ width: '100%' }}
                    min={1900}
                    max={new Date().getFullYear()}
                />
            </Form.Item>

            <Form.Item
                name="NumberOfPages"
                label="Number of Pages"
                rules={[
                    { required: true, message: 'Please input the number of pages!' },
                    {
                        type: 'number',
                        min: 1,
                        message: 'Number of pages must be greater than 0'
                    }
                ]}
            >
                <InputNumber min={1} style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item
                name="Language"
                label="Language"
                rules={[{ required: true, message: 'Please input the language!' }]}
            >
                <Select>
                    <Option value="Vietnamese">Vietnamese</Option>
                    <Option value="English">English</Option>
                    <Option value="French">French</Option>
                    <Option value="German">German</Option>
                    <Option value="Chinese">Chinese</Option>
                    <Option value="Japanese">Japanese</Option>
                </Select>
            </Form.Item>

            <Form.Item
                name="Status"
                label="Status"
                rules={[{ required: true, message: 'Please select the status!' }]}
            >
                <Select>
                    <Option value="Active">Active</Option>
                    <Option value="Inactive">Inactive</Option>
                </Select>
            </Form.Item>

            {/* Hidden fields for timestamps */}
            <Form.Item name="Created_Date" hidden>
                <Input />
            </Form.Item>
            <Form.Item name="Edit_Date" hidden>
                <Input />
            </Form.Item>

            <Form.Item>
                <Button type="primary" htmlType="submit" style={{ marginRight: 8 }}>
                    Save
                </Button>
                <Button onClick={onCancel}>Cancel</Button>
            </Form.Item>
        </Form>
    );
};

export default BookForm; 