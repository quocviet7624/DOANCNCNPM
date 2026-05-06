import React from 'react';
import { Navigate } from 'react-router-dom';
import { message } from 'antd';

const ProtectedRoute = ({ children }) => {
    const token   = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    if (!token) {
        message.warning('Vui lòng đăng nhập để tiếp tục!');
        return <Navigate to="/login" replace />;
    }

    let user;
    try {
        user = JSON.parse(userStr);
    } catch (err) {
        console.error('❌ Lỗi parse user data:', err);
        localStorage.clear();
        message.error('Phiên đăng nhập không hợp lệ!');
        return <Navigate to="/login" replace />;
    }

    // Cho phép cả admin và staff vào khu vực quản trị
    if (!user || !['admin', 'staff'].includes(user.role)) {
        message.error('Bạn không có quyền truy cập trang này!');
        return <Navigate to="/" replace />;
    }

    return children;
};

export default ProtectedRoute;