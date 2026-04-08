import React, { useState, useEffect } from 'react';
import {
    Table, Button, Tag, Popconfirm, message,
    Space, Card, Select, Tooltip, Modal
} from 'antd';
import {
    DeleteOutlined, LockOutlined, UnlockOutlined,
    UserOutlined, CrownOutlined, TeamOutlined, SolutionOutlined,
} from '@ant-design/icons';
import axios from 'axios';

const { Option } = Select;

// Cấu hình vai trò
const ROLE_CONFIG = {
    customer: { label: 'Khách hàng', color: 'blue',   icon: '👤' },
    staff:    { label: 'Nhân viên',  color: 'purple',  icon: '🧑‍💼' },
    admin:    { label: 'Admin',      color: 'red',     icon: '👑' },
};

const UserManagement = () => {
    const [users, setUsers]     = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => { fetchUsers(); }, []);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('http://localhost:5000/api/auth/users', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUsers(res.data);
        } catch {
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
        } catch {
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
        } catch {
            message.error('Không thể xóa người dùng!');
        }
    };

    // Đổi vai trò người dùng
    const handleChangeRole = (record, newRole) => {
        const cfg = ROLE_CONFIG[newRole];
        Modal.confirm({
            title: 'Xác nhận đổi vai trò',
            content: (
                <div>
                    Đổi vai trò của <b>{record.fullName || record.username}</b> thành{' '}
                    <Tag color={cfg.color}>{cfg.icon} {cfg.label}</Tag>?
                </div>
            ),
            okText: 'Xác nhận',
            cancelText: 'Hủy',
            onOk: async () => {
                try {
                    const token = localStorage.getItem('token');
                    await axios.put(
                        `http://localhost:5000/api/auth/users/${record._id}/change-role`,
                        { role: newRole },
                        { headers: { Authorization: `Bearer ${token}` } }
                    );
                    message.success(`Đã đổi vai trò thành ${cfg.label}!`);
                    fetchUsers();
                } catch (err) {
                    message.error(err.response?.data?.message || 'Không thể đổi vai trò!');
                }
            },
        });
    };

    const columns = [
        {
            title: 'Tên đăng nhập', dataIndex: 'username', key: 'username',
            render: text => (
                <span><UserOutlined style={{ marginRight: 8 }} /><strong>{text}</strong></span>
            ),
        },
        {
            title: 'Họ và tên', dataIndex: 'fullName', key: 'fullName',
            render: text => text || <i style={{ color: '#999' }}>Chưa cập nhật</i>,
        },
        {
            title: 'Email', dataIndex: 'email', key: 'email',
            render: text => text || <i style={{ color: '#999' }}>Chưa có</i>,
        },
        {
            title: 'Số điện thoại', dataIndex: 'phone', key: 'phone',
            render: text => text || <i style={{ color: '#999' }}>Chưa có</i>,
        },
        {
            title: 'Vai trò', dataIndex: 'role', key: 'role', width: 200,
            render: (role, record) => {
                const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
                const isSelf = currentUser.id === record._id || currentUser._id === record._id;
                const cfg = ROLE_CONFIG[role] || ROLE_CONFIG.customer;

                return (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Tag color={cfg.color} style={{ minWidth: 90, textAlign: 'center' }}>
                            {cfg.icon} {cfg.label.toUpperCase()}
                        </Tag>
                        {/* Dropdown đổi role — chỉ hiện khi không phải chính mình */}
                        {!isSelf && (
                            <Tooltip title="Đổi vai trò">
                                <Select
                                    value={role}
                                    size="small"
                                    style={{ width: 120 }}
                                    onChange={newRole => {
                                        if (newRole !== role) handleChangeRole(record, newRole);
                                    }}
                                    onClick={e => e.stopPropagation()}
                                >
                                    <Option value="customer">
                                        <span>👤 Khách hàng</span>
                                    </Option>
                                    <Option value="staff">
                                        <span>🧑‍💼 Nhân viên</span>
                                    </Option>
                                    <Option value="admin">
                                        <span>👑 Admin</span>
                                    </Option>
                                </Select>
                            </Tooltip>
                        )}
                        {isSelf && (
                            <span style={{ fontSize: 11, color: '#aaa' }}>(bạn)</span>
                        )}
                    </div>
                );
            },
        },
        {
            title: 'Trạng thái', dataIndex: 'isActive', key: 'isActive', width: 120,
            render: isActive => (
                <Tag color={isActive ? 'green' : 'volcano'}>
                    {isActive ? '✓ Hoạt động' : '✗ Đã khóa'}
                </Tag>
            ),
        },
        {
            title: 'Ngày đăng ký', dataIndex: 'createdAt', key: 'createdAt', width: 130,
            render: date => new Date(date).toLocaleDateString('vi-VN'),
        },
        {
            title: 'Thao tác', key: 'action', width: 180,
            render: (_, record) => {
                const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
                const isSelf = currentUser.id === record._id || currentUser._id === record._id;

                return (
                    <Space>
                        <Tooltip title={isSelf ? 'Không thể khóa chính mình' : (record.isActive ? 'Khóa tài khoản' : 'Mở khóa')}>
                            <Button
                                icon={record.isActive ? <LockOutlined /> : <UnlockOutlined />}
                                onClick={() => handleToggleStatus(record._id, record.isActive)}
                                disabled={isSelf}
                                type={record.isActive ? 'default' : 'primary'}
                                size="small"
                            >
                                {record.isActive ? 'Khóa' : 'Mở'}
                            </Button>
                        </Tooltip>

                        <Popconfirm
                            title="Xóa người dùng này?"
                            description="Hành động này không thể hoàn tác!"
                            onConfirm={() => handleDelete(record._id)}
                            okText="Xóa" cancelText="Hủy"
                            okButtonProps={{ danger: true }}
                            disabled={isSelf}
                        >
                            <Tooltip title={isSelf ? 'Không thể xóa chính mình' : 'Xóa người dùng'}>
                                <Button
                                    danger size="small"
                                    icon={<DeleteOutlined />}
                                    disabled={isSelf}
                                >
                                    Xóa
                                </Button>
                            </Tooltip>
                        </Popconfirm>
                    </Space>
                );
            },
        },
    ];

    const stats = {
        total:     users.length,
        active:    users.filter(u => u.isActive).length,
        inactive:  users.filter(u => !u.isActive).length,
        admins:    users.filter(u => u.role === 'admin').length,
        staff:     users.filter(u => u.role === 'staff').length,
        customers: users.filter(u => u.role === 'customer').length,
    };

    return (
        <div>
            <h2 style={{ marginBottom: 20 }}>👥 Quản lý Người dùng</h2>

            {/* Thống kê */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                gap: 16, marginBottom: 24,
            }}>
                {[
                    { value: stats.total,     label: 'Tổng người dùng', color: '#1890ff', icon: <TeamOutlined /> },
                    { value: stats.active,    label: 'Đang hoạt động',  color: '#52c41a', icon: <UnlockOutlined /> },
                    { value: stats.inactive,  label: 'Đã khóa',         color: '#ff4d4f', icon: <LockOutlined /> },
                    { value: stats.admins,    label: 'Admin',           color: '#fa8c16', icon: <CrownOutlined /> },
                    { value: stats.staff,     label: 'Nhân viên',       color: '#722ed1', icon: <SolutionOutlined /> },
                    { value: stats.customers, label: 'Khách hàng',      color: '#13c2c2', icon: <UserOutlined /> },
                ].map((s, i) => (
                    <Card key={i} style={{ borderTop: `3px solid ${s.color}`, borderRadius: 8 }}>
                        <div style={{ fontSize: 24, fontWeight: 700, color: s.color }}>
                            {s.icon} {s.value}
                        </div>
                        <div style={{ color: '#666', fontSize: 13, marginTop: 4 }}>{s.label}</div>
                    </Card>
                ))}
            </div>

            <Table
                columns={columns}
                dataSource={users}
                rowKey="_id"
                loading={loading}
                scroll={{ x: 1000 }}
                pagination={{
                    pageSize: 10,
                    showTotal: total => `Tổng ${total} người dùng`,
                }}
                rowClassName={r => !r.isActive ? 'row-locked' : ''}
            />

            <style>{`.row-locked td { opacity: 0.55; }`}</style>
        </div>
    );
};

export default UserManagement;