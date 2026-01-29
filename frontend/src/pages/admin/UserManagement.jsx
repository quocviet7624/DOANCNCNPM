import React, { useState, useEffect } from 'react';
import { Table, Button, Tag, Popconfirm, message, Space, Card } from 'antd';
import { DeleteOutlined, LockOutlined, UnlockOutlined, UserOutlined } from '@ant-design/icons';
import axios from 'axios';

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('http://localhost:5000/api/auth/users', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUsers(res.data);
            console.log('✅ Đã tải danh sách users:', res.data.length);
        } catch (error) {
            console.error('❌ Lỗi tải users:', error);
            message.error('Không thể tải danh sách người dùng!');
        }
        setLoading(false);
    };

    const handleToggleStatus = async (userId, currentStatus) => {
        try {
            const token = localStorage.getItem('token');
            await axios.put(
                `http://localhost:5000/api/auth/users/${userId}/toggle-status`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
            
            message.success(currentStatus ? 'Đã khóa tài khoản!' : 'Đã mở khóa tài khoản!');
            fetchUsers();
        } catch (error) {
            console.error('❌ Lỗi cập nhật trạng thái:', error);
            message.error('Không thể cập nhật trạng thái!');
        }
    };

    const handleDelete = async (userId) => {
        try {
            const token = localStorage.getItem('token');
            await axios.delete(
                `http://localhost:5000/api/auth/users/${userId}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            
            message.success('Đã xóa người dùng!');
            fetchUsers();
        } catch (error) {
            console.error('❌ Lỗi xóa user:', error);
            message.error('Không thể xóa người dùng!');
        }
    };

    const columns = [
        {
            title: 'Tên đăng nhập',
            dataIndex: 'username',
            key: 'username',
            render: (text) => (
                <span>
                    <UserOutlined style={{ marginRight: 8 }} />
                    <strong>{text}</strong>
                </span>
            )
        },
        {
            title: 'Họ và tên',
            dataIndex: 'fullName',
            key: 'fullName',
            render: (text) => text || <i style={{ color: '#999' }}>Chưa cập nhật</i>
        },
        {
            title: 'Email',
            dataIndex: 'email',
            key: 'email',
            render: (text) => text || <i style={{ color: '#999' }}>Chưa có</i>
        },
        {
            title: 'Số điện thoại',
            dataIndex: 'phone',
            key: 'phone',
            render: (text) => text || <i style={{ color: '#999' }}>Chưa có</i>
        },
        {
            title: 'Vai trò',
            dataIndex: 'role',
            key: 'role',
            render: (role) => (
                <Tag color={role === 'admin' ? 'red' : 'blue'}>
                    {role === 'admin' ? '👑 ADMIN' : '👤 KHÁCH HÀNG'}
                </Tag>
            )
        },
        {
            title: 'Trạng thái',
            dataIndex: 'isActive',
            key: 'isActive',
            render: (isActive) => (
                <Tag color={isActive ? 'green' : 'volcano'}>
                    {isActive ? '✓ Hoạt động' : '✗ Đã khóa'}
                </Tag>
            )
        },
        {
            title: 'Ngày đăng ký',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (date) => new Date(date).toLocaleDateString('vi-VN')
        },
        {
            title: 'Thao tác',
            key: 'action',
            render: (_, record) => {
                const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
                const isSelf = currentUser.id === record._id;

                return (
                    <Space>
                        <Button
                            icon={record.isActive ? <LockOutlined /> : <UnlockOutlined />}
                            onClick={() => handleToggleStatus(record._id, record.isActive)}
                            disabled={isSelf}
                            type={record.isActive ? 'default' : 'primary'}
                        >
                            {record.isActive ? 'Khóa' : 'Mở khóa'}
                        </Button>
                        
                        <Popconfirm
                            title="Bạn có chắc muốn xóa người dùng này?"
                            onConfirm={() => handleDelete(record._id)}
                            okText="Có"
                            cancelText="Không"
                            disabled={isSelf}
                        >
                            <Button 
                                danger 
                                icon={<DeleteOutlined />}
                                disabled={isSelf}
                            >
                                Xóa
                            </Button>
                        </Popconfirm>
                    </Space>
                );
            }
        }
    ];

    const stats = {
        total: users.length,
        active: users.filter(u => u.isActive).length,
        inactive: users.filter(u => !u.isActive).length,
        admins: users.filter(u => u.role === 'admin').length,
        customers: users.filter(u => u.role === 'customer').length
    };

    return (
        <div>
            <h2 style={{ marginBottom: 20 }}>
                👥 Quản lý Người dùng
            </h2>

            {/* Thống kê */}
            <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '16px',
                marginBottom: '24px'
            }}>
                <Card>
                    <h3 style={{ margin: 0, color: '#1890ff' }}>{stats.total}</h3>
                    <p style={{ margin: 0, color: '#666' }}>Tổng số người dùng</p>
                </Card>
                <Card>
                    <h3 style={{ margin: 0, color: '#52c41a' }}>{stats.active}</h3>
                    <p style={{ margin: 0, color: '#666' }}>Đang hoạt động</p>
                </Card>
                <Card>
                    <h3 style={{ margin: 0, color: '#ff4d4f' }}>{stats.inactive}</h3>
                    <p style={{ margin: 0, color: '#666' }}>Đã khóa</p>
                </Card>
                <Card>
                    <h3 style={{ margin: 0, color: '#fa8c16' }}>{stats.admins}</h3>
                    <p style={{ margin: 0, color: '#666' }}>Quản trị viên</p>
                </Card>
                <Card>
                    <h3 style={{ margin: 0, color: '#13c2c2' }}>{stats.customers}</h3>
                    <p style={{ margin: 0, color: '#666' }}>Khách hàng</p>
                </Card>
            </div>

            <Table
                columns={columns}
                dataSource={users}
                rowKey="_id"
                loading={loading}
                pagination={{
                    pageSize: 10,
                    showTotal: (total) => `Tổng ${total} người dùng`
                }}
            />
        </div>
    );
};

export default UserManagement;