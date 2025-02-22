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
                toast.success(`Chào mừng ${user.FullName}!`, { autoClose: 2000 });

                // Chuyển hướng đến trang chính sau khi đăng nhập thành công
                navigate('/'); // Hoặc bất kỳ trang nào bạn muốn chuyển hướng đến
            } else {
                toast.error(`Vui lòng kiểm tra lại email hoặc mật khẩu`);
            }
        } catch (error) {
            console.error('Login error:', error);
            notification.error({
                message: 'Đã xảy ra lỗi khi đăng nhập',
                description: 'Vui lòng thử lại sau.',
            });
            toast.error(`Vui lòng kiểm tra lại email hoặc mật khẩu`);
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
                    message: 'Mật khẩu đã được gửi lại qua email',
                    description: 'Kiểm tra email của bạn để lấy lại mật khẩu.',
                });
                setIsModalVisible(false);
            } else {
                notification.error({
                    message: 'Email không tồn tại hoặc có lỗi xảy ra',
                    description: 'Vui lòng kiểm tra lại email đã nhập.',
                });
            }
        } catch (error) {
            console.error('Forgot password error:', error);
            notification.error({
                message: 'Đã xảy ra lỗi khi gửi yêu cầu',
                description: 'Vui lòng thử lại sau.',
            });
            toast.error("Lỗi hệ thống, vui lòng thử lại!", { autoClose: 3000 });
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
                    rules={[{ required: true, message: 'Vui lòng nhập email!' }, { type: 'email', message: 'Email không hợp lệ!' }]}
                >
                    <Input
                        prefix={<MailOutlined />}
                        placeholder="Email"
                        style={{ borderRadius: '5px', padding: '10px' }}
                    />
                </Form.Item>
                <Form.Item
                    name="password"
                    rules={[{ required: true, message: 'Vui lòng nhập mật khẩu!' }, { min: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự!' }]}
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
                        rules={[{ required: true, message: 'Vui lòng nhập email!' }, { type: 'email', message: 'Email không hợp lệ!' }]}
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
