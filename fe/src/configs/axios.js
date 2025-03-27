import axios from 'axios';
import { API_BASE_URL } from './api';

const instance = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000, // Tăng timeout lên 30 giây để xử lý hình ảnh lớn
    maxContentLength: 50 * 1024 * 1024 // Tăng kích thước tối đa của phản hồi lên 50MB
});

// Add a request interceptor
instance.interceptors.request.use(
    (config) => {
        // Get token from localStorage
        const token = localStorage.getItem('accessToken');

        // Log để debug
        console.log('Raw token:', token);

        // If token exists and is valid, add it to headers
        if (token && typeof token === 'string' && token.length > 0) {
            try {
                // Đảm bảo token không có dấu ngoặc kép
                const cleanToken = token.replace(/^"(.*)"$/, '$1');
                config.headers.Authorization = `Bearer ${cleanToken}`;

                // Log headers để debug
                console.log('Final Authorization header:', config.headers.Authorization);
            } catch (error) {
                console.error('Error processing token:', error);
                localStorage.removeItem('accessToken'); // Xóa token không hợp lệ
            }
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add a response interceptor
instance.interceptors.response.use(
    (response) => response,
    (error) => {
        console.log('Response Error:', error.response);

        // Handle 401 Unauthorized errors
        // if (error.response?.status === 401) {
        //     // Clear tokens and redirect to login
        //     localStorage.removeItem('accessToken');
        //     localStorage.removeItem('refreshToken');
        //     localStorage.removeItem('user');
        //     window.location.href = '/login';
        // }

        return Promise.reject(error);
    }
);

export default instance; 