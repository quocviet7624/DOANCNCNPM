import React, { useState } from 'react';
import { Card, Form, Input, Button, message, Switch, List } from 'antd';
import { LockOutlined, BellOutlined } from '@ant-design/icons';
import axios from 'axios';

const API = 'http://localhost:5000/api';

const AccountSettings = () => {
    const [form]    = Form.useForm();
    const [loading, setLoading] = useState(false);

    const handleChangePassword = async (values) => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');

            await axios.put(
                `${API}/auth/change-password`,
                {
                    oldPassword: values.currentPassword,   // ← tên field khớp với form
                    newPassword: values.newPassword,
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            message.success('Đổi mật khẩu thành công! Vui lòng đăng nhập lại.');
            form.resetFields();
        } catch (err) {
            const msg = err.response?.data?.message || 'Đổi mật khẩu thất bại!';
            message.error(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: '30px', background: '#f0f2f5', minHeight: '100vh', display: 'flex', justifyContent: 'center' }}>
            <div style={{ width: '100%', maxWidth: 800 }}>
                <Card title="Bảo mật tài khoản" style={{ marginBottom: 20 }}>
                    <Form layout="vertical" form={form} onFinish={handleChangePassword}>
                        <Form.Item
                            label="Mật khẩu hiện tại"
                            name="currentPassword"
                            rules={[{ required: true, message: 'Nhập mật khẩu hiện tại!' }]}
                        >
                            <Input.Password prefix={<LockOutlined />} placeholder="Nhập mật khẩu hiện tại" />
                        </Form.Item>

                        <Form.Item
                            label="Mật khẩu mới"
                            name="newPassword"
                            rules={[
                                { required: true, message: 'Nhập mật khẩu mới!' },
                                { min: 6, message: 'Tối thiểu 6 ký tự!' },
                            ]}
                        >
                            <Input.Password prefix={<LockOutlined />} placeholder="Ít nhất 6 ký tự" />
                        </Form.Item>

                        <Form.Item
                            label="Xác nhận mật khẩu mới"
                            name="confirmPassword"
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
                            <Input.Password prefix={<LockOutlined />} placeholder="Nhập lại mật khẩu mới" />
                        </Form.Item>

                        <Button
                            type="primary" htmlType="submit"
                            danger loading={loading}
                            style={{ fontWeight: 600 }}
                        >
                            Đổi mật khẩu
                        </Button>
                    </Form>
                </Card>

                <Card title="Cài đặt thông báo">
                    <List>
                        <List.Item extra={<Switch defaultChecked />}>
                            <List.Item.Meta
                                avatar={<BellOutlined />}
                                title="Thông báo đơn hàng"
                                description="Nhận email khi trạng thái đơn hàng thay đổi"
                            />
                        </List.Item>
                        <List.Item extra={<Switch />}>
                            <List.Item.Meta
                                avatar={<BellOutlined />}
                                title="Tin tức & Khuyến mãi"
                                description="Nhận thông tin về sản phẩm mới"
                            />
                        </List.Item>
                    </List>
                </Card>
            </div>
        </div>
    );
};

export default AccountSettings;