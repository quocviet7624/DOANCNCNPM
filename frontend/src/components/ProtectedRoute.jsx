import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  // 1. Lấy token
  const token = localStorage.getItem('token');
  
  // 2. Lấy user string và parse ra object
  const userStr = localStorage.getItem('user');
  let user = null;
  
  try {
    if (userStr) {
      user = JSON.parse(userStr);
    }
  } catch (error) {
    console.error('Lỗi parse user trong ProtectedRoute:', error);
    // Nếu data lỗi, coi như chưa đăng nhập
    localStorage.clear();
    return <Navigate to="/login" replace />;
  }

  // 3. Kiểm tra điều kiện: Phải có token VÀ role là admin
  if (!token || !user || user.role !== 'admin') {
    // Nếu không thỏa mãn, đá về login
    return <Navigate to="/login" replace />;
  }

  // 4. Nếu ok thì cho vào
  return children;
};

export default ProtectedRoute;