import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic } from 'antd';
import {
  ShoppingOutlined,
  UserOutlined,
  FileTextOutlined,
  DollarOutlined,
  AppstoreOutlined // <--- Mới thêm icon
} from '@ant-design/icons';
import axios from 'axios';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalCategories: 0, // <--- Mới thêm state
    totalUsers: 0,
    totalOrders: 0,
    totalRevenue: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      // Fetch products
      const productsRes = await axios.get('http://localhost:5000/api/products');
      
      // Fetch categories (MỚI)
      const categoriesRes = await axios.get('http://localhost:5000/api/categories');

      // Fetch users
      const usersRes = await axios.get('http://localhost:5000/api/auth/users', {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Fetch orders
      let ordersCount = 0;
      let revenue = 0;
      try {
        const ordersRes = await axios.get('http://localhost:5000/api/orders', {
          headers: { Authorization: `Bearer ${token}` }
        });
        ordersCount = ordersRes.data.length;
        revenue = ordersRes.data.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
      } catch (err) {
        console.log('ℹ️ Orders API chưa có hoặc chưa có đơn hàng');
      }

      setStats({
        totalProducts: productsRes.data.length,
        totalCategories: categoriesRes.data.length, // <--- Cập nhật dữ liệu
        totalUsers: usersRes.data.length,
        totalOrders: ordersCount,
        totalRevenue: revenue
      });

    } catch (err) {
      console.error('❌ Lỗi tải thống kê:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 style={{ marginBottom: 24, fontSize: 24 }}>
        📊 Tổng quan hệ thống
      </h2>

      <Row gutter={[16, 16]}>
        {/* Card Sản phẩm */}
        <Col xs={24} sm={12} lg={4}> {/* Chỉnh lại kích thước cột */}
          <Card loading={loading}>
            <Statistic
              title="Sản phẩm"
              value={stats.totalProducts}
              prefix={<ShoppingOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>

        {/* Card Danh mục (MỚI) */}
        <Col xs={24} sm={12} lg={5}>
          <Card loading={loading}>
            <Statistic
              title="Danh mục"
              value={stats.totalCategories}
              prefix={<AppstoreOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        
        {/* Card Người dùng */}
        <Col xs={24} sm={12} lg={5}>
          <Card loading={loading}>
            <Statistic
              title="Người dùng"
              value={stats.totalUsers}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        
        {/* Card Đơn hàng */}
        <Col xs={24} sm={12} lg={5}>
          <Card loading={loading}>
            <Statistic
              title="Đơn hàng"
              value={stats.totalOrders}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
        
        {/* Card Doanh thu */}
        <Col xs={24} sm={12} lg={5}>
          <Card loading={loading}>
            <Statistic
              title="Doanh thu"
              value={stats.totalRevenue}
              prefix={<DollarOutlined />}
              suffix="₫"
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
      </Row>

      <Card style={{ marginTop: 24 }}>
        <h3>🎉 Chào mừng đến với trang quản trị FC Junior!</h3>
        <p style={{ fontSize: 16, color: '#666', lineHeight: 1.6 }}>
          Đây là hệ thống quản lý cửa hàng thủy sinh. Sử dụng menu bên trái để:
        </p>
        <ul style={{ fontSize: 15, lineHeight: 2 }}>
          <li>📦 <strong>Quản lý sản phẩm & Danh mục:</strong> Thêm, sửa, xóa sản phẩm và phân loại</li>
          <li>👥 <strong>Quản lý người dùng:</strong> Xem và quản lý tài khoản khách hàng</li>
          <li>📋 <strong>Quản lý đơn hàng:</strong> Theo dõi và xử lý đơn đặt hàng</li>
          <li>🎬 <strong>Quản lý Banner:</strong> Cập nhật nội dung trang chủ</li>
        </ul>
      </Card>
    </div>
  );
};

export default AdminDashboard;