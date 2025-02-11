import React, { useState } from 'react';
import { Form, Input, Button, Modal, message, Tooltip } from 'antd';
import { MailOutlined, LockOutlined } from '@ant-design/icons';

const LoginPage = () => {
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [form] = Form.useForm();

    const handleLogin = (values) => {
        // Xử lý đăng nhập (có thể thay bằng API thực tế)
        console.log('Login values:', values);
        message.success('Đăng nhập thành công');
    };

    const handleForgotPassword = () => {
        // Xử lý quên mật khẩu (có thể thay bằng API thực tế)
        console.log('Quên mật khẩu');
        message.success('Mật khẩu đã được gửi lại qua email');
        setIsModalVisible(false);
    };

    const showForgotPasswordModal = () => {
        setIsModalVisible(true);
    };

    const handleCancel = () => {
        setIsModalVisible(false);
    };

    return (
        <div style={{
            maxWidth: 400,
            margin: '50px auto',
            padding: '20px',
            borderRadius: '10px',
            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
            backgroundColor: '#fff',
        }}>
            <h2 style={{
                textAlign: 'center',
                color: '#1890ff',
                marginBottom: '30px',
                fontFamily: 'Arial, sans-serif',
            }}>
                Đăng nhập
            </h2>
            <Form form={form} onFinish={handleLogin}>
                <Form.Item
                    name="email"
                    rules={[
                        { required: true, message: 'Vui lòng nhập email!' },
                        { type: 'email', message: 'Email không hợp lệ!' }
                    ]}
                >
                    <Input
                        prefix={<MailOutlined />}
                        placeholder="Email"
                        style={{ borderRadius: '5px', padding: '10px' }}
                    />
                </Form.Item>
                <Form.Item
                    name="password"
                    rules={[
                        { required: true, message: 'Vui lòng nhập mật khẩu!' },
                        { min: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự!' }
                    ]}
                >
                    <Input.Password
                        prefix={<LockOutlined />}
                        placeholder="Mật khẩu"
                        style={{ borderRadius: '5px', padding: '10px' }}
                    />
                </Form.Item>
                <Form.Item>
                    <Button
                        type="primary"
                        block
                        htmlType="submit"
                        style={{
                            borderRadius: '5px',
                            backgroundColor: '#1890ff',
                            borderColor: '#1890ff',
                            fontWeight: 'bold',
                            padding: '12px',
                            transition: 'all 0.3s ease',
                        }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = '#40a9ff'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = '#1890ff'}
                    >
                        Đăng nhập
                    </Button>
                </Form.Item>
                <Form.Item>
                    <Tooltip title="Nhấp để lấy lại mật khẩu của bạn">
                        <Button
                            type="link"
                            onClick={showForgotPasswordModal}
                            block
                            style={{ fontWeight: 'bold' }}
                        >
                            Quên mật khẩu?
                        </Button>
                    </Tooltip>
                </Form.Item>
            </Form>

            <Modal
                title="Quên mật khẩu"
                visible={isModalVisible}
                onCancel={handleCancel}
                footer={null}
                centered
                destroyOnClose
                style={{
                    borderRadius: '10px',
                }}
            >
                <Form onFinish={handleForgotPassword}>
                    <Form.Item
                        name="email"
                        rules={[
                            { required: true, message: 'Vui lòng nhập email!' },
                            { type: 'email', message: 'Email không hợp lệ!' }
                        ]}
                    >
                        <Input
                            prefix={<MailOutlined />}
                            placeholder="Nhập email của bạn"
                            style={{ borderRadius: '5px', padding: '10px' }}
                        />
                    </Form.Item>
                    <Form.Item>
                        <Button
                            type="primary"
                            block
                            htmlType="submit"
                            style={{
                                borderRadius: '5px',
                                backgroundColor: '#1890ff',
                                borderColor: '#1890ff',
                                fontWeight: 'bold',
                                padding: '12px',
                                transition: 'all 0.3s ease',
                            }}
                        >
                            Gửi mật khẩu
                        </Button>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default LoginPage;
