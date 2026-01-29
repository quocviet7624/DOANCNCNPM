import React, { useState } from 'react';
import { Form, Input, Button, Card, message, Divider } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, PhoneOutlined } from '@ant-design/icons';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

const { TextArea } = Input;

const Register = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  const onFinish = async (values) => {
    setLoading(true);
    try {
      // Đăng ký tài khoản
      const registerResponse = await axios.post('http://localhost:5000/api/auth/register', {
        username: values.username,
        password: values.password,
        email: values.email || '',
        fullName: values.fullName || '',
        phone: values.phone || '',
        role: 'customer'
      });

      console.log('✅ Đăng ký thành công:', registerResponse.data);
      message.success('Đăng ký thành công! Đang tự động đăng nhập...');

      // Tự động đăng nhập
      try {
        const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
          username: values.username,
          password: values.password
        });

        const { token, user } = loginResponse.data;

        // Lưu token và user info
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));

        // Dispatch event để update navbar
        window.dispatchEvent(new Event('userChanged'));

        console.log('✅ Tự động đăng nhập thành công:', user);

        message.success(`Chào mừng ${user.fullName || user.username}!`);
        
        setTimeout(() => {
          navigate('/');
        }, 500);
      } catch (loginErr) {
        console.error('⚠️ Tự động đăng nhập thất bại:', loginErr);
        message.info('Vui lòng đăng nhập để tiếp tục!');
        setTimeout(() => {
          navigate('/login');
        }, 1000);
      }
    } catch (err) {
      console.error('❌ Lỗi đăng ký:', err);
      const errorMsg = err.response?.data?.message || 'Đăng ký thất bại!';
      message.error(errorMsg);
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
            <h2 style={{ margin: 0, color: '#004d40' }}>🌿 ĐĂNG KÝ TÀI KHOẢN</h2>
            <p style={{ margin: '8px 0 0 0', color: '#666', fontSize: '14px' }}>
              Tạo tài khoản để trải nghiệm mua sắm tốt hơn
            </p>
          </div>
        }
        style={{ 
          width: '100%',
          maxWidth: 450,
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
            rules={[
              { required: true, message: 'Vui lòng nhập tên đăng nhập!' },
              { min: 3, message: 'Tên đăng nhập phải có ít nhất 3 ký tự!' },
              { pattern: /^[a-zA-Z0-9_]+$/, message: 'Chỉ được dùng chữ, số và dấu gạch dưới!' }
            ]}
          >
            <Input 
              prefix={<UserOutlined />} 
              placeholder="Nhập tên đăng nhập"
              size="large"
              disabled={loading}
            />
          </Form.Item>

          <Form.Item 
            label="Mật khẩu" 
            name="password" 
            rules={[
              { required: true, message: 'Vui lòng nhập mật khẩu!' },
              { min: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự!' }
            ]}
          >
            <Input.Password 
              prefix={<LockOutlined />} 
              placeholder="Nhập mật khẩu"
              size="large"
              disabled={loading}
            />
          </Form.Item>

          <Form.Item 
            label="Xác nhận mật khẩu" 
            name="confirmPassword" 
            dependencies={['password']}
            rules={[
              { required: true, message: 'Vui lòng xác nhận mật khẩu!' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Mật khẩu xác nhận không khớp!'));
                },
              }),
            ]}
          >
            <Input.Password 
              prefix={<LockOutlined />} 
              placeholder="Nhập lại mật khẩu"
              size="large"
              disabled={loading}
            />
          </Form.Item>

          <Divider>Thông tin cá nhân (tùy chọn)</Divider>

          <Form.Item label="Họ và tên" name="fullName">
            <Input 
              prefix={<UserOutlined />} 
              placeholder="Nguyễn Văn A"
              size="large"
              disabled={loading}
            />
          </Form.Item>

          <Form.Item 
            label="Email" 
            name="email"
            rules={[
              { type: 'email', message: 'Email không hợp lệ!' }
            ]}
          >
            <Input 
              prefix={<MailOutlined />} 
              placeholder="example@email.com"
              size="large"
              disabled={loading}
            />
          </Form.Item>

          <Form.Item 
            label="Số điện thoại" 
            name="phone"
            rules={[
              { pattern: /^[0-9]{10,11}$/, message: 'Số điện thoại không hợp lệ!' }
            ]}
          >
            <Input 
              prefix={<PhoneOutlined />} 
              placeholder="0912345678"
              size="large"
              disabled={loading}
            />
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
            {loading ? 'Đang đăng ký...' : 'ĐĂNG KÝ NGAY'}
          </Button>

          <Divider />

          <div style={{ textAlign: 'center' }}>
            <span style={{ color: '#666' }}>Đã có tài khoản? </span>
            <Link to="/login" style={{ color: '#004d40', fontWeight: 'bold' }}>
              Đăng nhập ngay
            </Link>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default Register;