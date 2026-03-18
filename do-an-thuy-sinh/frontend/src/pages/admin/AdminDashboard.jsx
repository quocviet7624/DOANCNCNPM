import React, { useState, useEffect, useCallback } from 'react';
import { Card, Row, Col, Statistic } from 'antd';
import {
  ShoppingOutlined,
  UserOutlined,
  FileTextOutlined,
  DollarOutlined,
  AppstoreOutlined,
  StarOutlined,
} from '@ant-design/icons';
import axios from 'axios';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalProducts:   0,
    totalCategories: 0,
    totalUsers:      0,
    totalOrders:     0,
    totalRevenue:    0,
    totalReviews:    0,
    avgRating:       0,
  });
  const [loading, setLoading] = useState(true);

  const user    = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = user.role === 'admin';

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');

      // Fetch products & categories
      const [productsRes, categoriesRes] = await Promise.all([
        axios.get('http://localhost:5000/api/products'),
        axios.get('http://localhost:5000/api/categories'),
      ]);

      // Fetch users — chỉ admin
      let usersCount = 0;
      if (isAdmin) {
        try {
          const usersRes = await axios.get('http://localhost:5000/api/auth/users', {
            headers: { Authorization: `Bearer ${token}` }
          });
          usersCount = usersRes.data.length;
        } catch { console.log('⚠️ Không thể tải danh sách users'); }
      }

      // Fetch orders
      let ordersCount = 0;
      let revenue     = 0;
      try {
        const ordersRes = await axios.get('http://localhost:5000/api/orders', {
          headers: { Authorization: `Bearer ${token}` }
        });
        ordersCount = ordersRes.data.length;
        revenue     = ordersRes.data.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
      } catch { console.log('ℹ️ Orders API chưa có hoặc chưa có đơn hàng'); }

      // Fetch review stats
      let totalReviews = 0;
      let avgRating    = 0;
      try {
        const reviewsRes = await axios.get('http://localhost:5000/api/reviews/stats', {
          headers: { Authorization: `Bearer ${token}` }
        });
        totalReviews = reviewsRes.data.total     || 0;
        avgRating    = reviewsRes.data.avgRating || 0;
      } catch {
        // Fallback: tính từ products nếu /api/reviews/stats chưa sẵn sàng
        try {
          const allReviews = [];
          productsRes.data.forEach(p => (p.reviews || []).forEach(r => allReviews.push(r)));
          totalReviews = allReviews.length;
          avgRating    = totalReviews
            ? (allReviews.reduce((s, r) => s + r.rating, 0) / totalReviews).toFixed(1)
            : 0;
        } catch {}
      }

      setStats({
        totalProducts:   productsRes.data.length,
        totalCategories: categoriesRes.data.length,
        totalUsers:      usersCount,
        totalOrders:     ordersCount,
        totalRevenue:    revenue,
        totalReviews,
        avgRating,
      });

    } catch (err) {
      console.error('❌ Lỗi tải thống kê:', err);
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  // Số cột động theo role
  const lg = isAdmin ? 4 : 5;

  return (
    <div>
      <h2 style={{ marginBottom: 24, fontSize: 24 }}>📊 Tổng quan hệ thống</h2>

      <Row gutter={[16, 16]}>
        {/* Sản phẩm */}
        <Col xs={24} sm={12} lg={lg}>
          <Card loading={loading}>
            <Statistic
              title="Sản phẩm"
              value={stats.totalProducts}
              prefix={<ShoppingOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>

        {/* Danh mục */}
        <Col xs={24} sm={12} lg={lg}>
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
          <Col xs={24} sm={12} lg={lg}>
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

        {/* Đơn hàng */}
        <Col xs={24} sm={12} lg={lg}>
          <Card loading={loading}>
            <Statistic
              title="Đơn hàng"
              value={stats.totalOrders}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>

        {/* Doanh thu */}
        <Col xs={24} sm={12} lg={lg}>
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

        {/* Đánh giá */}
        <Col xs={24} sm={12} lg={lg}>
          <Card loading={loading}>
            <Statistic
              title="Đánh giá"
              value={stats.totalReviews}
              prefix={<StarOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
            {!loading && stats.totalReviews > 0 && (
              <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>
                ⭐ TB: {stats.avgRating} / 5
              </div>
            )}
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
          <li>💬 <strong>Quản lý đánh giá:</strong> Kiểm duyệt đánh giá sản phẩm</li>
        </ul>
      </Card>
    </div>
  );
};

export default AdminDashboard;