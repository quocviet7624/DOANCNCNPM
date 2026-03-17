import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Avatar, message, Upload, Modal, Tag, Tooltip } from 'antd';
import {
    UserOutlined, UploadOutlined, SaveOutlined,
    PlusOutlined, EditOutlined, DeleteOutlined,
    HomeOutlined, CheckCircleFilled, EnvironmentOutlined
} from '@ant-design/icons';

const RED = '#c8232c';

// ─── Helper ───────────────────────────────────────────────────────────────────
const getUserFromStorage = () => {
    try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; }
};
const saveUserToStorage = (data) => {
    localStorage.setItem('user', JSON.stringify(data));
    window.dispatchEvent(new Event('userChanged'));
};

// ─── AddressCard ──────────────────────────────────────────────────────────────
const AddressCard = ({ addr, isDefault, onSetDefault, onEdit, onDelete }) => (
    <div style={{
        border: `1.5px solid ${isDefault ? RED : '#e8e8e8'}`,
        borderRadius: 8,
        padding: '14px 16px',
        marginBottom: 12,
        background: isDefault ? '#fff8f8' : '#fff',
        position: 'relative',
        transition: 'border-color 0.2s',
    }}>
        {isDefault && (
            <Tag color={RED} style={{ position: 'absolute', top: 12, right: 12, fontSize: 11, borderRadius: 4 }}>
                <CheckCircleFilled style={{ marginRight: 3 }} /> Mặc định
            </Tag>
        )}

        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <EnvironmentOutlined style={{ color: isDefault ? RED : '#999', fontSize: 18, marginTop: 2, flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: '#222', marginBottom: 2 }}>
                    {addr.name}
                    <span style={{ fontWeight: 400, color: '#666', marginLeft: 10, fontSize: 13 }}>
                        {addr.phone}
                    </span>
                </div>
                <div style={{ fontSize: 13, color: '#555', lineHeight: 1.6 }}>
                    {addr.detail}
                    {addr.city && <>, {addr.city}</>}
                </div>
            </div>
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 12, paddingTop: 10, borderTop: '1px solid #f0f0f0' }}>
            {!isDefault && (
                <button
                    onClick={() => onSetDefault(addr.id)}
                    style={{
                        background: 'none', border: `1px solid ${RED}`, color: RED,
                        borderRadius: 4, padding: '3px 12px', fontSize: 12,
                        cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = RED; e.currentTarget.style.color = '#fff'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = RED; }}
                >
                    Đặt mặc định
                </button>
            )}
            <button
                onClick={() => onEdit(addr)}
                style={{
                    background: 'none', border: '1px solid #d9d9d9', color: '#555',
                    borderRadius: 4, padding: '3px 12px', fontSize: 12,
                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
                    transition: 'all 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = '#999'}
                onMouseLeave={e => e.currentTarget.style.borderColor = '#d9d9d9'}
            >
                <EditOutlined /> Sửa
            </button>
            {!isDefault && (
                <Tooltip title="Không thể xóa địa chỉ mặc định" trigger={isDefault ? 'hover' : []}>
                    <button
                        onClick={() => onDelete(addr.id)}
                        style={{
                            background: 'none', border: '1px solid #ffa39e', color: '#ff4d4f',
                            borderRadius: 4, padding: '3px 12px', fontSize: 12,
                            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
                            transition: 'all 0.2s',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#fff1f0'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'none'; }}
                    >
                        <DeleteOutlined /> Xóa
                    </button>
                </Tooltip>
            )}
        </div>
    </div>
);

// ─── AddressModal ─────────────────────────────────────────────────────────────
const AddressModal = ({ open, onClose, onSave, editingAddr }) => {
    const [form] = Form.useForm();

    useEffect(() => {
        if (open) {
            form.resetFields();
            if (editingAddr) form.setFieldsValue(editingAddr);
        }
    }, [open, editingAddr, form]);

    const handleOk = () => {
        form.validateFields().then(values => {
            onSave(values);
            form.resetFields();
        });
    };

    return (
        <Modal
            title={
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: RED }}>
                    <HomeOutlined />
                    {editingAddr ? 'Sửa địa chỉ' : 'Thêm địa chỉ mới'}
                </div>
            }
            open={open}
            onCancel={onClose}
            onOk={handleOk}
            okText={editingAddr ? 'Lưu thay đổi' : 'Thêm địa chỉ'}
            cancelText="Hủy"
            okButtonProps={{ style: { background: RED, borderColor: RED } }}
            width={480}
        >
            <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
                    <Form.Item
                        label="Họ tên người nhận"
                        name="name"
                        rules={[{ required: true, message: 'Vui lòng nhập tên!' }]}
                    >
                        <Input prefix={<UserOutlined style={{ color: '#ccc' }} />} placeholder="Nguyễn Văn A" />
                    </Form.Item>
                    <Form.Item
                        label="Số điện thoại"
                        name="phone"
                        rules={[
                            { required: true, message: 'Vui lòng nhập SĐT!' },
                            { pattern: /^[0-9]{9,11}$/, message: 'SĐT không hợp lệ!' }
                        ]}
                    >
                        <Input placeholder="0852192629" />
                    </Form.Item>
                </div>

                <Form.Item
                    label="Tỉnh / Thành phố"
                    name="city"
                    rules={[{ required: true, message: 'Vui lòng nhập tỉnh/thành!' }]}
                >
                    <Input placeholder="Đà Nẵng" />
                </Form.Item>

                <Form.Item
                    label="Địa chỉ chi tiết"
                    name="detail"
                    rules={[{ required: true, message: 'Vui lòng nhập địa chỉ!' }]}
                >
                    <Input.TextArea
                        rows={2}
                        placeholder="Số nhà, tên đường, phường/xã..."
                    />
                </Form.Item>
            </Form>
        </Modal>
    );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const UserProfile = () => {
    const [profileForm] = Form.useForm();
    const [loading, setLoading]           = useState(false);
    const [user, setUser]                 = useState(null);
    const [addresses, setAddresses]       = useState([]);
    const [defaultAddressId, setDefaultAddressId] = useState(null);
    const [modalOpen, setModalOpen]       = useState(false);
    const [editingAddr, setEditingAddr]   = useState(null);
    const [activeTab, setActiveTab]       = useState('profile'); // 'profile' | 'addresses'

    useEffect(() => {
        const userData = getUserFromStorage();
        setUser(userData);
        profileForm.setFieldsValue(userData);

        // Load addresses từ localStorage
        const saved = JSON.parse(localStorage.getItem('addresses') || '[]');
        setAddresses(saved);
        const defId = localStorage.getItem('defaultAddressId');
        setDefaultAddressId(defId || saved[0]?.id || null);
    }, [profileForm]);

    // ── Profile ────────────────────────────────────────────────────────────────
    const handleUpdateProfile = (values) => {
        setLoading(true);
        setTimeout(() => {
            const updated = { ...user, ...values };
            saveUserToStorage(updated);
            setUser(updated);
            message.success('Cập nhật thông tin thành công!');
            setLoading(false);
        }, 800);
    };

    // ── Addresses ──────────────────────────────────────────────────────────────
    const saveAddresses = (list, defId) => {
        localStorage.setItem('addresses', JSON.stringify(list));
        if (defId !== undefined) {
            localStorage.setItem('defaultAddressId', defId);
            setDefaultAddressId(defId);
        }
        setAddresses(list);
    };

    const handleSaveAddress = (values) => {
        let newList;
        if (editingAddr) {
            newList = addresses.map(a => a.id === editingAddr.id ? { ...a, ...values } : a);
            message.success('Đã cập nhật địa chỉ!');
        } else {
            const newAddr = { ...values, id: Date.now().toString() };
            newList = [...addresses, newAddr];
            // Nếu là địa chỉ đầu tiên → tự đặt mặc định
            if (newList.length === 1) {
                saveAddresses(newList, newAddr.id);
                setModalOpen(false);
                setEditingAddr(null);
                return;
            }
            message.success('Đã thêm địa chỉ mới!');
        }
        saveAddresses(newList, undefined);
        setModalOpen(false);
        setEditingAddr(null);
    };

    const handleSetDefault = (id) => {
        localStorage.setItem('defaultAddressId', id);
        setDefaultAddressId(id);
        message.success('Đã đặt địa chỉ mặc định!');
    };

    const handleEdit = (addr) => {
        setEditingAddr(addr);
        setModalOpen(true);
    };

    const handleDelete = (id) => {
        Modal.confirm({
            title: 'Xóa địa chỉ này?',
            content: 'Bạn không thể hoàn tác thao tác này.',
            okText: 'Xóa',
            cancelText: 'Hủy',
            okButtonProps: { danger: true },
            onOk: () => {
                const newList = addresses.filter(a => a.id !== id);
                // Nếu xóa địa chỉ đang mặc định → chuyển sang cái đầu tiên còn lại
                const newDefId = id === defaultAddressId
                    ? (newList[0]?.id || null)
                    : defaultAddressId;
                saveAddresses(newList, newDefId);
                message.success('Đã xóa địa chỉ!');
            },
        });
    };

    // ─── Render ───────────────────────────────────────────────────────────────
    const TAB_STYLE = (active) => ({
        padding: '10px 24px',
        border: 'none',
        borderBottom: active ? `3px solid ${RED}` : '3px solid transparent',
        background: 'transparent',
        color: active ? RED : '#555',
        fontWeight: active ? 700 : 400,
        fontSize: 14,
        cursor: 'pointer',
        transition: 'all 0.2s',
    });

    return (
        <div style={{ padding: '30px 16px', background: '#f5f5f5', minHeight: '100vh' }}>
            <div style={{ maxWidth: 680, margin: '0 auto' }}>

                {/* Header card */}
                <div style={{
                    background: '#fff', borderRadius: 8, padding: '20px 24px',
                    marginBottom: 16, border: '1px solid #e8e8e8',
                    display: 'flex', alignItems: 'center', gap: 16,
                }}>
                    <Avatar size={64} icon={<UserOutlined />} src={user?.avatar}
                        style={{ background: RED, flexShrink: 0 }} />
                    <div>
                        <div style={{ fontWeight: 700, fontSize: 18, color: '#222' }}>
                            {user?.fullName || user?.username || 'Người dùng'}
                        </div>
                        <div style={{ color: '#888', fontSize: 13 }}>{user?.email}</div>
                        <div style={{ marginTop: 6 }}>
                            <Upload showUploadList={false} beforeUpload={() => false}>
                                <Button size="small" icon={<UploadOutlined />} style={{ fontSize: 12 }}>
                                    Đổi ảnh
                                </Button>
                            </Upload>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div style={{ background: '#fff', borderRadius: '8px 8px 0 0', borderBottom: '2px solid #f0f0f0', display: 'flex' }}>
                    <button style={TAB_STYLE(activeTab === 'profile')} onClick={() => setActiveTab('profile')}>
                        👤 Thông tin cá nhân
                    </button>
                    <button style={TAB_STYLE(activeTab === 'addresses')} onClick={() => setActiveTab('addresses')}>
                        📍 Địa chỉ giao hàng
                        {addresses.length > 0 && (
                            <span style={{
                                marginLeft: 6, background: RED, color: '#fff',
                                borderRadius: 10, padding: '0px 6px', fontSize: 11, fontWeight: 700,
                            }}>{addresses.length}</span>
                        )}
                    </button>
                </div>

                {/* Tab content */}
                <div style={{ background: '#fff', borderRadius: '0 0 8px 8px', padding: 24, border: '1px solid #e8e8e8', borderTop: 'none' }}>

                    {/* ── Tab: Thông tin cá nhân ── */}
                    {activeTab === 'profile' && (
                        <Form layout="vertical" form={profileForm} onFinish={handleUpdateProfile}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
                                <Form.Item
                                    label="Họ và tên"
                                    name="fullName"
                                    rules={[{ required: true, message: 'Vui lòng nhập họ tên!' }]}
                                >
                                    <Input size="large" prefix={<UserOutlined style={{ color: '#ccc' }} />} />
                                </Form.Item>
                                <Form.Item label="Số điện thoại" name="phone">
                                    <Input size="large" placeholder="0852..." />
                                </Form.Item>
                            </div>

                            <Form.Item label="Email" name="email">
                                <Input size="large" disabled />
                            </Form.Item>

                            <Form.Item label="Địa chỉ" name="address">
                                <Input.TextArea rows={2} placeholder="Địa chỉ mặc định..." />
                            </Form.Item>

                            <Form.Item style={{ marginBottom: 0 }}>
                                <Button
                                    type="primary" htmlType="submit"
                                    loading={loading} icon={<SaveOutlined />}
                                    size="large" block
                                    style={{ background: RED, borderColor: RED, fontWeight: 700 }}
                                >
                                    Lưu thay đổi
                                </Button>
                            </Form.Item>
                        </Form>
                    )}

                    {/* ── Tab: Địa chỉ giao hàng ── */}
                    {activeTab === 'addresses' && (
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                                <div style={{ color: '#666', fontSize: 13 }}>
                                    {addresses.length === 0
                                        ? 'Chưa có địa chỉ nào. Thêm để thanh toán nhanh hơn!'
                                        : `${addresses.length} địa chỉ đã lưu`
                                    }
                                </div>
                                <Button
                                    type="primary" icon={<PlusOutlined />}
                                    style={{ background: RED, borderColor: RED, fontWeight: 600 }}
                                    onClick={() => { setEditingAddr(null); setModalOpen(true); }}
                                    disabled={addresses.length >= 5}
                                >
                                    Thêm địa chỉ
                                </Button>
                            </div>

                            {addresses.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '40px 0', color: '#bbb' }}>
                                    <EnvironmentOutlined style={{ fontSize: 48, marginBottom: 12, display: 'block' }} />
                                    <div style={{ fontSize: 14 }}>Bạn chưa có địa chỉ nào</div>
                                </div>
                            ) : (
                                addresses.map(addr => (
                                    <AddressCard
                                        key={addr.id}
                                        addr={addr}
                                        isDefault={addr.id === defaultAddressId}
                                        onSetDefault={handleSetDefault}
                                        onEdit={handleEdit}
                                        onDelete={handleDelete}
                                    />
                                ))
                            )}

                            {addresses.length >= 5 && (
                                <div style={{ textAlign: 'center', color: '#faad14', fontSize: 12, marginTop: 8 }}>
                                    Tối đa 5 địa chỉ. Xóa bớt để thêm mới.
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Modal thêm/sửa địa chỉ */}
            <AddressModal
                open={modalOpen}
                onClose={() => { setModalOpen(false); setEditingAddr(null); }}
                onSave={handleSaveAddress}
                editingAddr={editingAddr}
            />
        </div>
    );
};

export default UserProfile;