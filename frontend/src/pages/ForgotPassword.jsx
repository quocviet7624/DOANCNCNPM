import React, { useState } from 'react';
import { Form, Input, Button, Card, message, Steps, Divider } from 'antd';
import { MailOutlined, LockOutlined, KeyOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [resetToken, setResetToken] = useState(''); // ← Thêm state lưu resetToken

  // Bước 1: Gửi mã OTP
  const onSendOtp = async (values) => {
    setLoading(true);
    try {
      await axios.post('http://localhost:5000/api/auth/forgot-password', { email: values.email });
      setEmail(values.email);
      message.success('Mã OTP đã được gửi đến email của bạn!');
      setCurrentStep(1);
    } catch (err) {
      message.error(err.response?.data?.message || 'Không thể gửi mã OTP. Vui lòng thử lại!');
    } finally {
      setLoading(false);
    }
  };

  // Bước 2: Xác minh OTP → lấy resetToken
  const onVerifyOtp = async (values) => {
    setLoading(true);
    try {
      const res = await axios.post('http://localhost:5000/api/auth/verify-otp', {
        email: email,
        otp: values.otp,
      });
      setResetToken(res.data.resetToken); // ← Lưu resetToken lại
      message.success('Xác minh OTP thành công!');
      setCurrentStep(2); // ← Chuyển sang bước đặt mật khẩu mới
    } catch (err) {
      message.error(err.response?.data?.message || 'Mã OTP không đúng hoặc đã hết hạn!');
    } finally {
      setLoading(false);
    }
  };

  // Bước 3: Đặt lại mật khẩu mới
  const onResetPassword = async (values) => {
    setLoading(true);
    try {
      await axios.post('http://localhost:5000/api/auth/reset-password', {
        email: email,
        resetToken: resetToken, // ← Gửi resetToken lên
        newPassword: values.newPassword,
      });
      message.success('Mật khẩu đã được thay đổi thành công!');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      message.error(err.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại!');
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
        style={{ width: '100%', maxWidth: 450, borderRadius: 12, boxShadow: '0 8px 30px rgba(0,0,0,0.2)' }}
      >
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <h2 style={{ color: '#004d40', marginBottom: 8 }}>🐟 KHÔI PHỤC MẬT KHẨU</h2>
          <Steps
            current={currentStep}
            size="small"
            items={[
              { title: 'Gửi mã' },
              { title: 'Xác minh' },
              { title: 'Đặt lại' },
            ]}
            style={{ marginTop: 20 }}
          />
        </div>

        {/* BƯỚC 1: NHẬP EMAIL */}
        {currentStep === 0 && (
          <Form layout="vertical" onFinish={onSendOtp}>
            <p style={{ color: '#666', textAlign: 'center', marginBottom: 20 }}>
              Vui lòng nhập email đăng ký. Chúng tôi sẽ gửi mã xác thực (OTP) để bạn đặt lại mật khẩu.
            </p>
            <Form.Item
              name="email"
              rules={[
                { required: true, message: 'Vui lòng nhập Email!' },
                { type: 'email', message: 'Email không hợp lệ!' }
              ]}
            >
              <Input prefix={<MailOutlined />} placeholder="Email của bạn" size="large" />
            </Form.Item>
            <Button
              type="primary" htmlType="submit" block size="large" loading={loading}
              style={{ background: '#004d40', borderColor: '#004d40', fontWeight: 'bold', height: 45 }}
            >
              GỬI MÃ XÁC THỰC
            </Button>
          </Form>
        )}

        {/* BƯỚC 2: NHẬP OTP */}
        {currentStep === 1 && (
          <Form layout="vertical" onFinish={onVerifyOtp}>
            <p style={{ color: '#666', textAlign: 'center', marginBottom: 20 }}>
              Nhập mã OTP 6 số đã được gửi đến <strong>{email}</strong>
            </p>
            <Form.Item
              label="Mã OTP" name="otp"
              rules={[{ required: true, message: 'Vui lòng nhập mã OTP!' }]}
            >
              <Input prefix={<KeyOutlined />} placeholder="Nhập mã 6 số từ email" size="large" />
            </Form.Item>
            <Button
              type="primary" htmlType="submit" block size="large" loading={loading}
              style={{ background: '#004d40', borderColor: '#004d40', fontWeight: 'bold', height: 45 }}
            >
              XÁC MINH MÃ OTP
            </Button>
            <Button
              type="link" block onClick={() => setCurrentStep(0)}
              style={{ marginTop: 10, color: '#666' }}
            >
              Gửi lại mã khác?
            </Button>
          </Form>
        )}

        {/* BƯỚC 3: ĐẶT MẬT KHẨU MỚI */}
        {currentStep === 2 && (
          <Form layout="vertical" onFinish={onResetPassword}>
            <p style={{ color: '#666', textAlign: 'center', marginBottom: 20 }}>
              Nhập mật khẩu mới cho tài khoản của bạn
            </p>
            <Form.Item
              label="Mật khẩu mới" name="newPassword"
              rules={[
                { required: true, message: 'Vui lòng nhập mật khẩu mới!' },
                { min: 6, message: 'Mật khẩu phải từ 6 ký tự trở lên!' }
              ]}
            >
              <Input.Password prefix={<LockOutlined />} placeholder="Mật khẩu mới" size="large" />
            </Form.Item>
            <Form.Item
              label="Xác nhận mật khẩu" name="confirm"
              dependencies={['newPassword']}
              rules={[
                { required: true, message: 'Vui lòng xác nhận mật khẩu!' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('newPassword') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('Mật khẩu xác nhận không khớp!'));
                  },
                }),
              ]}
            >
              <Input.Password prefix={<LockOutlined />} placeholder="Nhập lại mật khẩu mới" size="large" />
            </Form.Item>
            <Button
              type="primary" htmlType="submit" block size="large" loading={loading}
              style={{ background: '#004d40', borderColor: '#004d40', fontWeight: 'bold', height: 45 }}
            >
              XÁC NHẬN ĐỔI MẬT KHẨU
            </Button>
          </Form>
        )}

        <Divider />

        <div style={{ textAlign: 'center' }}>
          <Link to="/login" style={{ color: '#004d40', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <ArrowLeftOutlined /> Quay lại đăng nhập
          </Link>
        </div>
      </Card>
    </div>
  );
};

export default ForgotPassword;