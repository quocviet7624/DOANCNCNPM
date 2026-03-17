import React, { useState, useEffect, useCallback } from 'react';
import { Card, Row, Col, Statistic } from 'antd';
import {
  ShoppingOutlined,
  UserOutlined,
  FileTextOutlined,
  DollarOutlined,
  AppstoreOutlined
} from '@ant-design/icons';
import axios from 'axios';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalCategories: 0,
    totalUsers: 0,
    totalOrders: 0,
    totalRevenue: 0
  });
  const [loading, setLoading] = useState(true);

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = user.role === 'admin';

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');

      // Fetch products & categories (admin + staff đều xem được)
      const [productsRes, categoriesRes] = await Promise.all([
        axios.get('http://localhost:5000/api/products'),
        axios.get('http://localhost:5000/api/categories'),
      ]);

      // Fetch users — chỉ admin mới gọi được
      let usersCount = 0;
      if (isAdmin) {
        try {
          const usersRes = await axios.get('http://localhost:5000/api/auth/users', {
            headers: { Authorization: `Bearer ${token}` }
          });
          usersCount = usersRes.data.length;
        } catch (err) {
          console.log('⚠️ Không thể tải danh sách users');
        }
      }

      // Fetch orders (admin + staff đều xem được)
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
        totalCategories: categoriesRes.data.length,
        totalUsers: usersCount,
        totalOrders: ordersCount,
        totalRevenue: revenue,
      });

    } catch (err) {
      console.error('❌ Lỗi tải thống kê:', err);
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return (
    <div>
      <h2 style={{ marginBottom: 24, fontSize: 24 }}>
        📊 Tổng quan hệ thống
      </h2>

      <Row gutter={[16, 16]}>
        {/* Sản phẩm — ai cũng thấy */}
        <Col xs={24} sm={12} lg={isAdmin ? 4 : 6}>
          <Card loading={loading}>
            <Statistic
              title="Sản phẩm"
              value={stats.totalProducts}
              prefix={<ShoppingOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>

        {/* Danh mục — ai cũng thấy */}
        <Col xs={24} sm={12} lg={isAdmin ? 5 : 6}>
          <Card loading={loading}>
            <Statistic
              title="Danh mục"
              value={stats.totalCategories}
              prefix={<AppstoreOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>

        {/* Người dùng — chỉ admin */}
        {isAdmin && (
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
        )}

        {/* Đơn hàng — ai cũng thấy */}
        <Col xs={24} sm={12} lg={isAdmin ? 5 : 6}>
          <Card loading={loading}>
            <Statistic
              title="Đơn hàng"
              value={stats.totalOrders}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>

        {/* Doanh thu — ai cũng thấy */}
        <Col xs={24} sm={12} lg={isAdmin ? 5 : 6}>
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
          {isAdmin && (
            <li>👥 <strong>Quản lý người dùng:</strong> Xem và quản lý tài khoản khách hàng</li>
          )}
          <li>📋 <strong>Quản lý đơn hàng:</strong> Theo dõi và xử lý đơn đặt hàng</li>
          <li>🎬 <strong>Quản lý Banner:</strong> Cập nhật nội dung trang chủ</li>
        </ul>
      </Card>
    </div>
  );
};

export default AdminDashboard;