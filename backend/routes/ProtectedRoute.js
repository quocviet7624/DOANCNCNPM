import React from 'react';
import { Navigate } from 'react-router-dom';
import { message } from 'antd';

const ProtectedRoute = ({ children }) => {
    // Lấy thông tin từ localStorage
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    
    // Kiểm tra token
    if (!token) {
        message.warning('Vui lòng đăng nhập để tiếp tục!');
        return <Navigate to="/login" replace />;
    }

    // Parse user object
    let user;
    try {
        user = JSON.parse(userStr);
    } catch (err) {
        console.error('❌ Lỗi parse user data:', err);
        localStorage.clear();
        message.error('Phiên đăng nhập không hợp lệ!');
        return <Navigate to="/login" replace />;
    }

    // Kiểm tra role admin
    if (!user || user.role !== 'admin') {
        message.error('Bạn không có quyền truy cập trang này!');
        return <Navigate to="/" replace />;
    }

    return children;
};

export default ProtectedRoute;