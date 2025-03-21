import React, { useContext, useState, useEffect } from 'react';
import { Form, Input, Button, Modal, message, Tooltip, notification } from 'antd';
import { MailOutlined, LockOutlined } from '@ant-design/icons';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from "../../context/AuthContext"; // Import AuthContext
import { toast } from "react-toastify";

const LoginPage = () => {
    
    const { login, user } = useContext(AuthContext); // Lấy hàm login từ AuthContext
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [form] = Form.useForm();
    const navigate = useNavigate(); // Hook to navigate between routes
    const [loading, setLoading] = useState(false); // Trạng thái loading khi đăng nhập

    useEffect(() => {
        // Nếu user đã đăng nhập, điều hướng đến trang chính
        if (user) {
            navigate('/');
        }
    }, [user, navigate]);

    // API URL
    const apiUrl = 'http://localhost:9999/api/auth/login';

    const handleLogin = async (values) => {
        try {
            // Gửi request đăng nhập đến API
            const response = await axios.post('http://localhost:9999/api/auth/login', {
                email: values.email,
                password: values.password,
            });

            // Kiểm tra kết quả trả về từ API
            if (response.data.code == 200) {
                // Lưu token vào localStorage
                //localStorage.setItem('accessToken', response.data.tokens.accessToken);
                //localStorage.setItem('refreshToken', response.data.tokens.refreshToken);

                const { accessToken, refreshToken } = response.data.tokens;
                const user = response.data.data.user; // Lấy thông tin user từ response

                // Gọi hàm login từ AuthContext, local
                login(user, accessToken, refreshToken);
              
                //Thông báo
                toast.success(`Welcome ${user.FullName}!`, { autoClose: 2000 });

                // Chuyển hướng đến trang chính sau khi đăng nhập thành công
                navigate('/'); // Hoặc bất kỳ trang nào bạn muốn chuyển hướng đến
            } else {
                toast.error(`Please check your email or password`);
            }
        } catch (error) {
            console.error('Login error:', error);
            notification.error({
                message: 'Login Error',
                description: 'Please try again later.',
            });
            toast.error(`Please check your email or password`);
        }
    };

    const handleForgotPassword = async (values) => {
        try {
            // Gửi request quên mật khẩu đến API
            const response = await axios.post('http://localhost:9999/api/auth/forgot-password', {
                email: values.email,
            });

            // Kiểm tra kết quả trả về từ API
            if (response.data.success) {
                notification.success({
                    message: 'Password Reset Email Sent',
                    description: 'Please check your email to reset your password.',
                });
                setIsModalVisible(false);
            } else {
                notification.error({
                    message: 'Invalid Email',
                    description: 'Please check the email address you entered.',
                });
            }
        } catch (error) {
            console.error('Forgot password error:', error);
            notification.error({
                message: 'System Error',
                description: 'Please try again later.',
            });
            toast.error("System error, please try again!", { autoClose: 3000 });
        }
    };

    const showForgotPasswordModal = () => {
        setIsModalVisible(true);
    };

    const handleCancel = () => {
        setIsModalVisible(false);
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6)), url("https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80")',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
        }}>
            <div style={{
                maxWidth: 400,
                width: '90%',
                padding: '40px',
                borderRadius: '15px',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(10px)',
            }}>
                <h2 style={{
                    textAlign: 'center',
                    color: '#1a237e',
                    marginBottom: '30px',
                    fontFamily: 'Arial, sans-serif',
                    fontSize: '28px',
                    fontWeight: 'bold',
                }}>
                    System Login
                </h2>
                <Form form={form} onFinish={handleLogin}>
                    <Form.Item
                        name="email"
                        rules={[{ required: true, message: 'Please enter your email!' }, { type: 'email', message: 'Invalid email format!' }]}
                    >
                        <Input
                            prefix={<MailOutlined style={{ color: '#1a237e' }} />}
                            placeholder="Email"
                            style={{ borderRadius: '8px', padding: '12px', height: '45px' }}
                        />
                    </Form.Item>
                    <Form.Item
                        name="password"
                        rules={[{ required: true, message: 'Please enter your password!' }, { min: 6, message: 'Password must be at least 6 characters!' }]}
                    >
                        <Input.Password
                            prefix={<LockOutlined style={{ color: '#1a237e' }} />}
                            placeholder="Password"
                            style={{ borderRadius: '8px', padding: '12px', height: '45px' }}
                        />
                    </Form.Item>
                    <Form.Item>
                        <Button
                            type="primary"
                            block
                            htmlType="submit"
                            style={{
                                borderRadius: '8px',
                                backgroundColor: '#1a237e',
                                borderColor: '#1a237e',
                                fontWeight: 'bold',
                                padding: '12px',
                                height: '45px',
                                transition: 'all 0.3s ease',
                            }}
                            onMouseEnter={(e) => e.target.style.backgroundColor = '#283593'}
                            onMouseLeave={(e) => e.target.style.backgroundColor = '#1a237e'}
                        >
                            Login
                        </Button>
                    </Form.Item>
                    <Form.Item>
                        <Tooltip title="Click to reset your password">
                            <Button
                                type="link"
                                onClick={showForgotPasswordModal}
                                block
                                style={{ 
                                    fontWeight: 'bold',
                                    color: '#1a237e',
                                    height: '40px',
                                }}
                            >
                                Forgot Password?
                            </Button>
                        </Tooltip>
                    </Form.Item>
                </Form>

                <Modal
                    title="Reset Password"
                    visible={isModalVisible}
                    onCancel={handleCancel}
                    footer={null}
                    centered
                    destroyOnClose
                    style={{
                        borderRadius: '15px',
                    }}
                >
                    <Form onFinish={handleForgotPassword}>
                        <Form.Item
                            name="email"
                            rules={[{ required: true, message: 'Please enter your email!' }, { type: 'email', message: 'Invalid email format!' }]}
                        >
                            <Input
                                prefix={<MailOutlined style={{ color: '#1a237e' }} />}
                                placeholder="Enter your email"
                                style={{ borderRadius: '8px', padding: '12px', height: '45px' }}
                            />
                        </Form.Item>
                        <Form.Item>
                            <Button
                                type="primary"
                                block
                                htmlType="submit"
                                style={{
                                    borderRadius: '8px',
                                    backgroundColor: '#1a237e',
                                    borderColor: '#1a237e',
                                    fontWeight: 'bold',
                                    padding: '12px',
                                    height: '45px',
                                    transition: 'all 0.3s ease',
                                }}
                            >
                                Send Reset Link
                            </Button>
                        </Form.Item>
                    </Form>
                </Modal>
            </div>
        </div>
    );
};

export default LoginPage;
