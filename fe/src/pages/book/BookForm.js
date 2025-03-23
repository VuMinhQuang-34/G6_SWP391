import React, { useState, useEffect, useMemo } from 'react';
import { Form, Input, Select, Button, InputNumber, message, Space, Upload } from 'antd';
import axios from '../../configs/axios';
import { getCurrentYear } from '../../utils/dateUtils';
import { EditOutlined, PlusOutlined } from '@ant-design/icons';

const { Option } = Select;

const LANGUAGE_OPTIONS = [
    { value: 'Vietnamese', label: 'Vietnamese' },
    { value: 'English', label: 'English' },
    { value: 'French', label: 'French' },
    { value: 'German', label: 'German' },
    { value: 'Chinese', label: 'Chinese' },
    { value: 'Japanese', label: 'Japanese' }
];

const STATUS_OPTIONS = [
    { value: 'Active', label: 'Active' },
    { value: 'Inactive', label: 'Inactive' }
];

const DEFAULT_VALUES = {
    Status: 'Active',
    Created_Date: new Date(),
    Edit_Date: new Date()
};

// Thêm hàm kiểm tra chuỗi rỗng hoặc chỉ chứa khoảng trắng
const isEmptyOrWhitespace = (str) => {
    return !str || str.trim().length === 0;
};

// Sửa lại hàm getValidationRules
const getValidationRules = () => {
    const currentYear = getCurrentYear();
    return {
        Title: [
            { required: true, message: 'Please input the title!' },
            {
                validator: (_, value) => {
                    if (isEmptyOrWhitespace(value)) {
                        return Promise.reject('Title cannot be empty or contain only whitespace!');
                    }
                    return Promise.resolve();
                }
            }
        ],
        Author: [
            { required: true, message: 'Please input the author!' },
            {
                validator: (_, value) => {
                    if (isEmptyOrWhitespace(value)) {
                        return Promise.reject('Author cannot be empty or contain only whitespace!');
                    }
                    return Promise.resolve();
                }
            }
        ],
        CategoryId: [
            { required: true, message: 'Please select the category!' }
        ],
        Publisher: [
            { required: true, message: 'Please input the publisher!' },
            {
                validator: (_, value) => {
                    if (isEmptyOrWhitespace(value)) {
                        return Promise.reject('Publisher cannot be empty or contain only whitespace!');
                    }
                    return Promise.resolve();
                }
            }
        ],
        PublishingYear: [
            { required: true, message: 'Please input the publishing year!' },
            {
                type: 'number',
                min: 1900,
                max: currentYear,
                message: `Year must be between 1900 and ${currentYear}`
            }
        ],
        NumberOfPages: [
            { required: true, message: 'Please input the number of pages!' },
            {
                type: 'number',
                min: 1,
                message: 'Number of pages must be greater than 0'
            }
        ],
        Language: [
            { required: true, message: 'Please select the language!' }
        ],
        Status: [
            { required: true, message: 'Please select the status!' }
        ]
    };
};

const BookForm = ({ initialValues, onCancel }) => {
    const [form] = Form.useForm();
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [imageUrl, setImageUrl] = useState(initialValues?.Image || null);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                setLoading(true);
                const { data } = await axios.get('/categories');
                setCategories(data);
            } catch (error) {
                message.error('Failed to fetch categories');
                console.error('Error fetching categories:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchCategories();
    }, []);

    useEffect(() => {
        console.log('initialValues in BookForm:', initialValues); // Debug log

        if (initialValues?.BookId) {
            // Đảm bảo set tất cả các trường form
            const formValues = {
                Title: initialValues.Title,
                Author: initialValues.Author,
                CategoryId: initialValues.CategoryId,
                Publisher: initialValues.Publisher,
                PublishingYear: initialValues.PublishingYear,
                NumberOfPages: initialValues.NumberOfPages,
                Language: initialValues.Language,
                Status: initialValues.Status || 'Active'
            };
            console.log('Setting form values:', formValues); // Debug log
            form.setFieldsValue(formValues);
        } else {
            console.log('Resetting form to defaults'); // Debug log
            form.resetFields();
            form.setFieldsValue(DEFAULT_VALUES);
        }
    }, [initialValues, form]);

    // Thêm hàm xử lý upload ảnh
    const handleImageChange = (info) => {
        if (info.file.status === 'uploading') {
            return;
        }
        if (info.file.status === 'done') {
            const reader = new FileReader();
            reader.addEventListener('load', () => {
                const base64String = reader.result;
                setImageUrl(base64String);
                form.setFieldsValue({ Image: base64String });
            });
            reader.readAsDataURL(info.file.originFileObj);
        }
    };

    // Hiển thị ảnh trong form
    const renderImage = () => {
        if (!imageUrl && initialValues?.Image) {
            const image = initialValues.Image;
            if (typeof image === 'string') {
                return image;
            } else if (image.type === 'Buffer' && Array.isArray(image.data)) {
                // Convert Buffer data to base64
                const bytes = new Uint8Array(image.data);
                const binary = bytes.reduce((acc, byte) => acc + String.fromCharCode(byte), '');
                return `data:image/jpeg;base64,${btoa(binary)}`;
            }
        }
        return imageUrl;
    };

    // Sửa lại hàm handleSubmit để thêm kiểm tra trước khi gửi
    const handleSubmit = async (e) => {
        e?.preventDefault();
        try {
            setSubmitting(true);
            const values = await form.validateFields();

            // Thêm ảnh vào values nếu có
            if (imageUrl) {
                values.Image = imageUrl;
            }

            // Kiểm tra thêm một lần nữa trước khi gửi
            const stringFields = ['Title', 'Author', 'Publisher'];
            for (const field of stringFields) {
                if (isEmptyOrWhitespace(values[field])) {
                    message.error(`${field} cannot be empty or contain only whitespace!`);
                    return;
                }
            }

            const currentDate = new Date();

            // Sửa lại logic kiểm tra để sử dụng BookId
            const isUpdate = initialValues?.BookId;
            const endpoint = isUpdate ? `/books/${initialValues.BookId}` : '/books';
            const method = isUpdate ? 'put' : 'post';

            // Set các giá trị ngày tháng
            values.Edit_Date = currentDate;
            if (!isUpdate) {
                values.Created_Date = currentDate;
            }

            // Trim các giá trị string trước khi gửi
            stringFields.forEach(field => {
                if (values[field]) {
                    values[field] = values[field].trim();
                }
            });

            console.log('Sending request:', { method, endpoint, values }); // Debug log

            const { data } = await axios[method](endpoint, values);

            if (data.success) {
                message.success(`Book ${isUpdate ? 'updated' : 'created'} successfully`);
                if (!isUpdate) form.resetFields();
                onCancel();
                window.dispatchEvent(new CustomEvent('REFRESH_BOOKS'));
            }
        } catch (error) {
            const errorMsg = error.response?.data?.message || 'Failed to save book';
            message.error(errorMsg);
            console.error('Error:', error);
        } finally {
            setSubmitting(false);
        }
    };

    const formItems = useMemo(() => {
        const rules = getValidationRules();
        const currentYear = getCurrentYear();

        return [
            {
                name: "Image",
                label: "Book Cover",
                component: (
                    <Upload
                        listType="picture-card"
                        showUploadList={false}
                        beforeUpload={(file) => {
                            const isImage = file.type.startsWith('image/');
                            if (!isImage) {
                                message.error('You can only upload image files!');
                            }
                            const isLt2M = file.size / 1024 / 1024 < 2;
                            if (!isLt2M) {
                                message.error('Image must smaller than 2MB!');
                            }
                            return isImage && isLt2M;
                        }}
                        customRequest={({ file, onSuccess }) => {
                            setTimeout(() => {
                                onSuccess("ok");
                            }, 0);
                        }}
                        onChange={handleImageChange}
                    >
                        {renderImage() ? (
                            <img
                                src={renderImage()}
                                alt="Book cover"
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                        ) : (
                            <div>
                                <PlusOutlined />
                                <div style={{ marginTop: 8 }}>Upload</div>
                            </div>
                        )}
                    </Upload>
                )
            },
            {
                name: "Title",
                label: "Title",
                rules: rules.Title,
                component: <Input maxLength={255} />
            },
            {
                name: "Author",
                label: "Author",
                rules: rules.Author,
                component: <Input maxLength={255} />
            },
            {
                name: "CategoryId",
                label: "Category",
                rules: rules.CategoryId,
                component: (
                    <Select loading={loading}>
                        {categories.map(category => (
                            <Option key={category.categoryId} value={category.categoryId}>
                                {category.CategoryName}
                            </Option>
                        ))}
                    </Select>
                )
            },
            {
                name: "Publisher",
                label: "Publisher",
                rules: rules.Publisher,
                component: <Input maxLength={255} />
            },
            {
                name: "PublishingYear",
                label: "Publishing Year",
                rules: rules.PublishingYear,
                component: (
                    <InputNumber
                        style={{ width: '100%' }}
                        min={1900}
                        max={currentYear}
                    />
                )
            },
            {
                name: "NumberOfPages",
                label: "Number of Pages",
                rules: rules.NumberOfPages,
                component: <InputNumber min={1} style={{ width: '100%' }} />
            },
            {
                name: "Language",
                label: "Language",
                rules: rules.Language,
                component: (
                    <Select>
                        {LANGUAGE_OPTIONS.map(option => (
                            <Option key={option.value} value={option.value}>
                                {option.label}
                            </Option>
                        ))}
                    </Select>
                )
            },
            {
                name: "Status",
                label: "Status",
                rules: rules.Status,
                component: (
                    <Select>
                        {STATUS_OPTIONS.map(option => (
                            <Option key={option.value} value={option.value}>
                                {option.label}
                            </Option>
                        ))}
                    </Select>
                )
            }
        ];
    }, [categories, loading, imageUrl]);

    if (loading) {
        return <div>Loading categories...</div>;
    }

    return (
        <Form
            form={form}
            layout="vertical"
            initialValues={initialValues || DEFAULT_VALUES}
            preserve={false}
        >
            {formItems.map(item => (
                <Form.Item
                    key={item.name}
                    name={item.name}
                    label={item.label}
                    rules={item.rules}
                >
                    {item.component}
                </Form.Item>
            ))}

            <Form.Item name="Created_Date" hidden><Input /></Form.Item>
            <Form.Item name="Edit_Date" hidden><Input /></Form.Item>

            <Form.Item>
                <Space>
                    <Button
                        type="primary"
                        onClick={handleSubmit}
                        loading={submitting}
                    >
                        {initialValues?.BookId ? 'Update' : 'Create'}
                    </Button>
                    <Button onClick={onCancel}>Cancel</Button>
                </Space>
            </Form.Item>
        </Form>
    );
};

export default BookForm;
