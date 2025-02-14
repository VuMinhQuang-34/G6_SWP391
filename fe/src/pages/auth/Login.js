import React, { useState } from 'react';
import { Form, Input, Button, message } from 'antd';
import axios from '../../configs/axios';
import { useNavigate } from 'react-router-dom';

const Login = () => {
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const onFinish = async (values) => {
        try {
            setLoading(true);
            const response = await axios.post('/auth/login', values);

            console.log('Login response:', response.data); // Debug log

            if (response.data.code === 200) {
                // Đảm bảo tokens tồn tại trong response
                if (response.data.tokens && response.data.tokens.accessToken) {
                    // Lưu token vào localStorage
                    localStorage.setItem('accessToken', response.data.tokens.accessToken);
                    localStorage.setItem('refreshToken', response.data.tokens.refreshToken);

                    // Lưu thông tin user nếu cần
                    if (response.data.data && response.data.data.user) {
                        localStorage.setItem('user', JSON.stringify(response.data.data.user));
                    }

                    message.success('Login successful!');
                    navigate('/');
                } else {
                    throw new Error('No tokens in response');
                }
            } else {
                throw new Error(response.data.message || 'Login failed');
            }
        } catch (error) {
            console.error('Login error:', error);
            const errorMsg = error.response?.data?.message || error.message || 'Login failed';
            message.error(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ maxWidth: 400, margin: '100px auto', padding: '20px' }}>
            <h1>Login</h1>
            <Form
                name="login"
                onFinish={onFinish}
                autoComplete="off"
                layout="vertical"
            >
                <Form.Item
                    label="Username"
                    name="username"
                    rules={[{ required: true, message: 'Please input your username!' }]}
                >
                    <Input />
                </Form.Item>

                <Form.Item
                    label="Password"
                    name="password"
                    rules={[{ required: true, message: 'Please input your password!' }]}
                >
                    <Input.Password />
                </Form.Item>

                <Form.Item>
                    <Button type="primary" htmlType="submit" loading={loading} block>
                        Login
                    </Button>
                </Form.Item>
            </Form>
        </div>
    );
};

export default Login; 