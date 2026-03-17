import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Card, message, Checkbox, Divider } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

const Login = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    const token   = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        console.log('🔍 Đã đăng nhập sẵn, role:', user.role);
        // admin và staff đều vào /admin
        if (['admin', 'staff'].includes(user.role)) {
          navigate('/admin', { replace: true });
        } else {
          navigate('/', { replace: true });
        }
      } catch (err) {
        console.error('❌ Lỗi parse user:', err);
        localStorage.clear();
      }
    }
  }, [navigate]);

  const onFinish = async (values) => {
    setLoading(true);
    try {
      console.log('🔐 Bắt đầu đăng nhập với:', values.username);
      const response = await axios.post('http://localhost:5000/api/auth/login', {
        username: values.username,
        password: values.password
      });

      const { token, user } = response.data;
      if (!token || !user) throw new Error('Không nhận được token hoặc user từ server');

      console.log('✅ User info:', { id: user.id, username: user.username, role: user.role });

      localStorage.clear();
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      window.dispatchEvent(new Event('userChanged'));
      message.success({ content: `Chào mừng ${user.fullName || user.username}!`, duration: 2 });

      console.log('🔄 Chuẩn bị redirect, role:', user.role);

      // admin và staff đều vào /admin
      if (['admin', 'staff'].includes(user.role)) {
        console.log('➡️ Redirect đến /admin');
        setTimeout(() => { window.location.href = '/admin'; }, 500);
      } else {
        console.log('➡️ Redirect đến /');
        setTimeout(() => { window.location.href = '/'; }, 500);
      }

    } catch (err) {
      console.error('❌ Lỗi đăng nhập:', err);
      const errorMsg = err.response?.data?.message || err.message || 'Đăng nhập thất bại!';
      message.error({ content: errorMsg, duration: 3 });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex', justifyContent: 'center', alignItems: 'center',
      padding: '50px 20px',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      minHeight: 'calc(100vh - 64px)'
    }}>
      <Card
        title={
          <div style={{ textAlign: 'center' }}>
            <h2 style={{ margin: 0, color: '#004d40' }}>🐟 ĐĂNG NHẬP</h2>
            <p style={{ margin: '8px 0 0 0', color: '#666', fontSize: 14 }}>
              Đăng nhập để tiếp tục mua sắm
            </p>
          </div>
        }
        style={{ width: '100%', maxWidth: 400, boxShadow: '0 4px 20px rgba(0,0,0,0.1)', borderRadius: 8 }}
      >
        <Form form={form} onFinish={onFinish} layout="vertical" autoComplete="off">
          <Form.Item
            label="Tên đăng nhập" name="username"
            rules={[{ required: true, message: 'Vui lòng nhập tên đăng nhập!' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="Nhập tên đăng nhập" size="large" autoComplete="off" />
          </Form.Item>

          <Form.Item
            label="Mật khẩu" name="password"
            rules={[{ required: true, message: 'Vui lòng nhập mật khẩu!' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Nhập mật khẩu" size="large" autoComplete="new-password" />
          </Form.Item>

          <Form.Item>
            <Form.Item name="remember" valuePropName="checked" noStyle>
              <Checkbox>Ghi nhớ đăng nhập</Checkbox>
            </Form.Item>
            <button
              type="button"
              style={{ float: 'right', color: '#004d40', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: 14 }}
              onClick={() => message.info('Tính năng đang phát triển!')}
            >
              Quên mật khẩu?
            </button>
          </Form.Item>

          <Button
            type="primary" htmlType="submit" block size="large" loading={loading}
            style={{ background: '#004d40', borderColor: '#004d40', height: 45, fontSize: 16, fontWeight: 'bold' }}
          >
            {loading ? 'Đang đăng nhập...' : 'ĐĂNG NHẬP'}
          </Button>

          <Divider />

          <div style={{ textAlign: 'center' }}>
            <span style={{ color: '#666' }}>Chưa có tài khoản? </span>
            <Link to="/register" style={{ color: '#004d40', fontWeight: 'bold' }}>Đăng ký ngay</Link>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default Login;