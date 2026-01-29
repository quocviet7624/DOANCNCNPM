import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Card, message, Checkbox, Divider } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

const Login = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  // Kiểm tra đã đăng nhập chưa
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        console.log('🔍 Đã đăng nhập sẵn, role:', user.role);
        
        // Redirect nếu đã login
        if (user.role === 'admin') {
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

      console.log('📦 Response nhận được:', response.data);

      const { token, user } = response.data;

      if (!token || !user) {
        throw new Error('Không nhận được token hoặc user từ server');
      }

      console.log('✅ User info:', {
        id: user.id,
        username: user.username,
        role: user.role,
        fullName: user.fullName
      });

      // Xóa dữ liệu cũ
      localStorage.clear();

      // Lưu thông tin mới
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      console.log('💾 Đã lưu vào localStorage');

      // Kiểm tra lại
      const savedUser = JSON.parse(localStorage.getItem('user'));
      console.log('🔍 Kiểm tra lại localStorage:', savedUser);

      // Dispatch event
      window.dispatchEvent(new Event('userChanged'));

      // Hiển thị thông báo
      message.success({
        content: `Chào mừng ${user.fullName || user.username}!`,
        duration: 2
      });

      // Redirect
      console.log('🔄 Chuẩn bị redirect, role:', user.role);
      
      if (user.role === 'admin') {
        console.log('➡️ Redirect đến /admin');
        setTimeout(() => {
          window.location.href = '/admin'; // Force reload
        }, 500);
      } else {
        console.log('➡️ Redirect đến /');
        setTimeout(() => {
          window.location.href = '/'; // Force reload
        }, 500);
      }

    } catch (err) {
      console.error('❌ Lỗi đăng nhập:', err);
      console.error('❌ Error response:', err.response?.data);
      
      const errorMsg = err.response?.data?.message || err.message || 'Đăng nhập thất bại!';
      
      message.error({
        content: errorMsg,
        duration: 3
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center',
      padding: '50px 20px', 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
      minHeight: 'calc(100vh - 64px)' 
    }}>
      <Card 
        title={
          <div style={{ textAlign: 'center' }}>
            <h2 style={{ margin: 0, color: '#004d40' }}>🐟 ĐĂNG NHẬP</h2>
            <p style={{ margin: '8px 0 0 0', color: '#666', fontSize: '14px' }}>
              Đăng nhập để tiếp tục mua sắm
            </p>
          </div>
        }
        style={{ 
          width: '100%',
          maxWidth: 400,
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          borderRadius: '8px'
        }}
      >
        <Form 
          form={form}
          onFinish={onFinish} 
          layout="vertical"
          autoComplete="off"
        >
          <Form.Item 
            label="Tên đăng nhập" 
            name="username" 
            rules={[{ required: true, message: 'Vui lòng nhập tên đăng nhập!' }]}
          >
            <Input 
              prefix={<UserOutlined />} 
              placeholder="Nhập tên đăng nhập"
              size="large"
              autoComplete="off"
            />
          </Form.Item>

          <Form.Item 
            label="Mật khẩu" 
            name="password" 
            rules={[{ required: true, message: 'Vui lòng nhập mật khẩu!' }]}
          >
            <Input.Password 
              prefix={<LockOutlined />} 
              placeholder="Nhập mật khẩu"
              size="large"
              autoComplete="new-password"
            />
          </Form.Item>

          <Form.Item>
            <Form.Item name="remember" valuePropName="checked" noStyle>
              <Checkbox>Ghi nhớ đăng nhập</Checkbox>
            </Form.Item>
            <a 
              style={{ float: 'right', color: '#004d40' }} 
              href="#"
              onClick={(e) => {
                e.preventDefault();
                message.info('Tính năng đang phát triển!');
              }}
            >
              Quên mật khẩu?
            </a>
          </Form.Item>

          <Button 
            type="primary" 
            htmlType="submit" 
            block 
            size="large"
            loading={loading}
            style={{ 
              background: '#004d40', 
              borderColor: '#004d40',
              height: '45px',
              fontSize: '16px',
              fontWeight: 'bold'
            }}
          >
            {loading ? 'Đang đăng nhập...' : 'ĐĂNG NHẬP'}
          </Button>

          <Divider />

          <div style={{ textAlign: 'center' }}>
            <span style={{ color: '#666' }}>Chưa có tài khoản? </span>
            <Link to="/register" style={{ color: '#004d40', fontWeight: 'bold' }}>
              Đăng ký ngay
            </Link>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default Login;