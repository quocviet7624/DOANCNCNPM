import React, { useState, useEffect } from 'react';
import { Card, Form, Input, Button, Avatar, message, Upload } from 'antd';
import { UserOutlined, UploadOutlined, SaveOutlined } from '@ant-design/icons';

const UserProfile = () => {
    const [loading, setLoading] = useState(false);
    const [form] = Form.useForm();
    const [user, setUser] = useState(null);

    useEffect(() => {
        // Load thông tin từ localStorage
        const userStr = localStorage.getItem('user');
        if (userStr) {
            const userData = JSON.parse(userStr);
            setUser(userData);
            form.setFieldsValue(userData);
        }
    }, [form]);

    const handleUpdate = (values) => {
        setLoading(true);
        setTimeout(() => {
            // Cập nhật localStorage giả lập backend
            const updatedUser = { ...user, ...values };
            localStorage.setItem('user', JSON.stringify(updatedUser));
            setUser(updatedUser);
            
            // Bắn sự kiện để Navbar cập nhật lại tên hiển thị ngay lập tức
            window.dispatchEvent(new Event('userChanged'));
            
            message.success('Cập nhật thông tin thành công!');
            setLoading(false);
        }, 1000);
    };

    return (
        <div style={{ padding: '30px', background: '#f0f2f5', minHeight: '100vh', display: 'flex', justifyContent: 'center' }}>
            <Card title="Hồ sơ cá nhân" style={{ width: 600, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                <div style={{ textAlign: 'center', marginBottom: 30 }}>
                    <Avatar size={100} icon={<UserOutlined />} src={user?.avatar} style={{ marginBottom: 15 }} />
                    <br />
                    <Upload showUploadList={false} beforeUpload={() => false}>
                        <Button icon={<UploadOutlined />}>Đổi ảnh đại diện</Button>
                    </Upload>
                </div>

                <Form layout="vertical" form={form} onFinish={handleUpdate}>
                    <Form.Item label="Họ và tên" name="fullName" rules={[{ required: true, message: 'Vui lòng nhập họ tên' }]}>
                        <Input size="large" />
                    </Form.Item>
                    
                    <Form.Item label="Email" name="email">
                        <Input size="large" disabled /> 
                    </Form.Item>

                    <Form.Item label="Số điện thoại" name="phone">
                        <Input size="large" />
                    </Form.Item>

                    <Form.Item label="Địa chỉ" name="address">
                        <Input.TextArea rows={3} />
                    </Form.Item>

                    <Form.Item>
                        <Button type="primary" htmlType="submit" loading={loading} icon={<SaveOutlined />} block size="large">
                            Lưu thay đổi
                        </Button>
                    </Form.Item>
                </Form>
            </Card>
        </div>
    );
};

export default UserProfile;