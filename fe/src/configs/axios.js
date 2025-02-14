import axios from 'axios';
import { API_BASE_URL } from './api';

// Cấu hình mặc định cho axios
axios.defaults.baseURL = API_BASE_URL;

// Add request interceptor
axios.interceptors.request.use(
    config => {
        // Lấy token từ localStorage
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    error => {
        return Promise.reject(error);
    }
);

// Add response interceptor
axios.interceptors.response.use(
    response => response,
    error => {
        if (error.response?.status === 401) {
            // Handle unauthorized error (e.g., redirect to login)
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default axios; 