import React from 'react';
import { Card, Form, Input, Button, message, Switch, List } from 'antd';
import { LockOutlined, BellOutlined } from '@ant-design/icons';

const AccountSettings = () => {
    const [form] = Form.useForm();

    const handleChangePassword = (values) => {
        // Logic giả lập đổi pass
        if (values.newPassword !== values.confirmPassword) {
            message.error('Mật khẩu xác nhận không khớp!');
            return;
        }
        message.loading({ content: 'Đang xử lý...', key: 'updatable' });
        setTimeout(() => {
            message.success({ content: 'Đổi mật khẩu thành công!', key: 'updatable', duration: 2 });
            form.resetFields();
        }, 1500);
    };

    return (
        <div style={{ padding: '30px', background: '#f0f2f5', minHeight: '100vh', display: 'flex', justifyContent: 'center' }}>
            <div style={{ width: '100%', maxWidth: 800 }}>
                <Card title="Bảo mật tài khoản" style={{ marginBottom: 20 }}>
                    <Form layout="vertical" form={form} onFinish={handleChangePassword}>
                        <Form.Item 
                            label="Mật khẩu hiện tại" 
                            name="currentPassword" 
                            rules={[{ required: true, message: 'Nhập mật khẩu cũ' }]}
                        >
                            <Input.Password prefix={<LockOutlined />} />
                        </Form.Item>
                        <Form.Item 
                            label="Mật khẩu mới" 
                            name="newPassword" 
                            rules={[{ required: true, message: 'Nhập mật khẩu mới' }, { min: 6, message: 'Tối thiểu 6 ký tự' }]}
                        >
                            <Input.Password prefix={<LockOutlined />} />
                        </Form.Item>
                        <Form.Item 
                            label="Xác nhận mật khẩu mới" 
                            name="confirmPassword" 
                            rules={[{ required: true, message: 'Xác nhận lại mật khẩu' }]}
                        >
                            <Input.Password prefix={<LockOutlined />} />
                        </Form.Item>
                        <Button type="primary" htmlType="submit" danger>Đổi mật khẩu</Button>
                    </Form>
                </Card>

                <Card title="Cài đặt thông báo">
                    <List>
                        <List.Item extra={<Switch defaultChecked />}>
                            <List.Item.Meta avatar={<BellOutlined />} title="Thông báo đơn hàng" description="Nhận email khi trạng thái đơn hàng thay đổi" />
                        </List.Item>
                        <List.Item extra={<Switch />}>
                            <List.Item.Meta avatar={<BellOutlined />} title="Tin tức & Khuyến mãi" description="Nhận thông tin về sản phẩm mới" />
                        </List.Item>
                    </List>
                </Card>
            </div>
        </div>
    );
};

export default AccountSettings;