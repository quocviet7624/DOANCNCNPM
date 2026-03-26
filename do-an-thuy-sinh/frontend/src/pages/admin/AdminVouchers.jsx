import React, { useState, useEffect } from 'react';
import {
    Table, Button, Modal, Form, Input, InputNumber,
    Select, DatePicker, Switch, Tag, Space, Popconfirm,
    message, Tooltip
} from 'antd';
import {
    PlusOutlined, EditOutlined, DeleteOutlined,
    TagOutlined, CheckCircleOutlined, CloseCircleOutlined
} from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;
const { Option } = Select;

const RED = '#c8232c';
const BASE = 'http://localhost:5000';

const AdminVouchers = () => {
    const [vouchers, setVouchers] = useState([]);
    const [categories, setCategories] = useState([]);   // 👈 fetch từ API
    const [loading, setLoading] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingVoucher, setEditingVoucher] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [form] = Form.useForm();

    // ===== FETCH =====
    const fetchVouchers = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${BASE}/api/vouchers/admin`);
            setVouchers(res.data);
        } catch (err) {
            message.error('Lỗi tải danh sách voucher: ' + (err.response?.data?.message || err.message));
        } finally {
            setLoading(false);
        }
    };

    const fetchCategories = async () => {
        try {
            const res = await axios.get(`${BASE}/api/categories`);
            // Category model thường có field "name"
            setCategories(res.data.map(c => c.name || c).filter(Boolean));
        } catch {
            message.warning('Không tải được danh mục, dùng danh sách mặc định');
            setCategories([]);
        }
    };

    useEffect(() => {
        fetchVouchers();
        fetchCategories();
    }, []);

    // ===== MODAL =====
    const openCreate = () => {
        setEditingVoucher(null);
        form.resetFields();
        form.setFieldsValue({ applicableCategories: [], minOrderValue: 0, isActive: true });
        setModalOpen(true);
    };

    const openEdit = (record) => {
        setEditingVoucher(record);
        form.setFieldsValue({
            code: record.code,
            description: record.description,
            discountPercent: record.discountPercent,
            applicableCategories: record.applicableCategories || [],
            minOrderValue: record.minOrderValue || 0,
            maxDiscount: record.maxDiscount || undefined,
            usageLimit: record.usageLimit || undefined,
            isActive: record.isActive,
            dateRange: [dayjs(record.startDate), dayjs(record.endDate)],
        });
        setModalOpen(true);
    };

    const handleDelete = async (id) => {
        try {
            await axios.delete(`${BASE}/api/vouchers/admin/${id}`);
            message.success('Đã xóa voucher');
            fetchVouchers();
        } catch {
            message.error('Lỗi xóa voucher');
        }
    };

    const handleToggleActive = async (record) => {
        try {
            await axios.put(`${BASE}/api/vouchers/admin/${record._id}`, { isActive: !record.isActive });
            message.success(record.isActive ? 'Đã tắt voucher' : 'Đã bật voucher');
            fetchVouchers();
        } catch {
            message.error('Lỗi cập nhật');
        }
    };

    const handleSubmit = async (values) => {
        setSubmitting(true);
        try {
            const { dateRange, maxDiscount, usageLimit, ...rest } = values;

            const payload = {
                ...rest,
                startDate: dateRange[0].toISOString(),
                endDate:   dateRange[1].toISOString(),
                // Chuyển về null nếu để trống (tránh gửi undefined lên server)
                maxDiscount:  maxDiscount  ? Number(maxDiscount)  : null,
                usageLimit:   usageLimit   ? Number(usageLimit)   : null,
                minOrderValue: rest.minOrderValue || 0,
                applicableCategories: rest.applicableCategories || [],
            };

            if (editingVoucher) {
                await axios.put(`${BASE}/api/vouchers/admin/${editingVoucher._id}`, payload);
                message.success('Cập nhật voucher thành công!');
            } else {
                await axios.post(`${BASE}/api/vouchers/admin`, payload);
                message.success('Tạo voucher thành công!');
            }
            setModalOpen(false);
            fetchVouchers();
        } catch (err) {
            message.error(err.response?.data?.message || 'Lỗi lưu voucher');
        } finally {
            setSubmitting(false);
        }
    };

    const getStatus = (v) => {
        const now = new Date();
        if (!v.isActive) return { label: 'Tắt', color: 'default' };
        if (now < new Date(v.startDate)) return { label: 'Chưa bắt đầu', color: 'blue' };
        if (now > new Date(v.endDate))   return { label: 'Hết hạn', color: 'red' };
        if (v.usageLimit !== null && v.usedCount >= v.usageLimit) return { label: 'Hết lượt', color: 'orange' };
        return { label: 'Đang hoạt động', color: 'green' };
    };

    // ===== COLUMNS =====
    const columns = [
        {
            title: 'Mã voucher',
            dataIndex: 'code',
            render: code => (
                <Tag color={RED} style={{ fontWeight: 700, fontSize: 13, letterSpacing: 1 }}>
                    <TagOutlined /> {code}
                </Tag>
            ),
        },
        {
            title: 'Giảm',
            dataIndex: 'discountPercent',
            render: (v, r) => (
                <span style={{ fontWeight: 700, color: RED, fontSize: 15 }}>
                    -{v}%
                    {r.maxDiscount && (
                        <span style={{ fontSize: 11, color: '#888', fontWeight: 400, marginLeft: 4 }}>
                            (tối đa {r.maxDiscount.toLocaleString('vi-VN')}đ)
                        </span>
                    )}
                </span>
            ),
        },
        {
            title: 'Danh mục áp dụng',
            dataIndex: 'applicableCategories',
            render: cats =>
                !cats || cats.length === 0
                    ? <Tag color="purple">Tất cả</Tag>
                    : cats.map(c => <Tag key={c} color="geekblue" style={{ marginBottom: 2 }}>{c}</Tag>),
        },
        {
            title: 'Đơn tối thiểu',
            dataIndex: 'minOrderValue',
            render: v => v > 0 ? `${v.toLocaleString('vi-VN')}đ` : <span style={{ color: '#bbb' }}>—</span>,
        },
        {
            title: 'Lượt dùng',
            render: (_, r) => (
                <span>
                    {r.usedCount}
                    {r.usageLimit != null
                        ? <span style={{ color: '#888' }}>/{r.usageLimit}</span>
                        : <span style={{ color: '#bbb' }}>/∞</span>
                    }
                </span>
            ),
        },
        {
            title: 'Hạn dùng',
            render: (_, r) => (
                <div style={{ fontSize: 12 }}>
                    <div>{dayjs(r.startDate).format('DD/MM/YYYY')}</div>
                    <div style={{ color: '#888' }}>→ {dayjs(r.endDate).format('DD/MM/YYYY')}</div>
                </div>
            ),
        },
        {
            title: 'Trạng thái',
            render: (_, r) => {
                const s = getStatus(r);
                return <Tag color={s.color}>{s.label}</Tag>;
            },
        },
        {
            title: 'Bật/Tắt',
            render: (_, r) => (
                <Switch
                    checked={r.isActive}
                    onChange={() => handleToggleActive(r)}
                    checkedChildren="ON"
                    unCheckedChildren="OFF"
                    style={{ background: r.isActive ? RED : undefined }}
                />
            ),
        },
        {
            title: '',
            render: (_, r) => (
                <Space>
                    <Tooltip title="Chỉnh sửa">
                        <Button icon={<EditOutlined />} size="small" onClick={() => openEdit(r)} />
                    </Tooltip>
                    <Popconfirm
                        title="Xóa voucher này?"
                        onConfirm={() => handleDelete(r._id)}
                        okText="Xóa" cancelText="Hủy"
                        okButtonProps={{ danger: true }}
                    >
                        <Tooltip title="Xóa">
                            <Button icon={<DeleteOutlined />} size="small" danger />
                        </Tooltip>
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    // ===== RENDER =====
    return (
        <div style={{ padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div>
                    <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>
                        <TagOutlined style={{ color: RED, marginRight: 8 }} />
                        Quản lý Voucher
                    </h2>
                    <p style={{ margin: 0, color: '#888', fontSize: 13 }}>
                        Tạo và quản lý mã giảm giá theo danh mục sản phẩm
                    </p>
                </div>
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={openCreate}
                    style={{ background: RED, borderColor: RED, fontWeight: 600 }}
                >
                    Tạo Voucher Mới
                </Button>
            </div>

            <Table
                dataSource={vouchers}
                columns={columns}
                rowKey="_id"
                loading={loading}
                pagination={{ pageSize: 10 }}
                bordered
                size="middle"
            />

            {/* ===== MODAL TẠO / SỬA ===== */}
            <Modal
                title={
                    <span style={{ fontWeight: 700, fontSize: 16 }}>
                        <TagOutlined style={{ color: RED, marginRight: 8 }} />
                        {editingVoucher ? 'Chỉnh sửa Voucher' : 'Tạo Voucher Mới'}
                    </span>
                }
                open={modalOpen}
                onCancel={() => setModalOpen(false)}
                footer={null}
                width={560}
                destroyOnClose
            >
                <Form form={form} layout="vertical" onFinish={handleSubmit} style={{ marginTop: 16 }}>

                    <Form.Item
                        name="code"
                        label="Mã voucher"
                        rules={[{ required: true, message: 'Nhập mã voucher!' }]}
                        extra="Mã sẽ tự động viết hoa"
                    >
                        <Input
                            placeholder="VD: SUMMER10"
                            style={{ textTransform: 'uppercase', fontWeight: 700, letterSpacing: 1 }}
                            disabled={!!editingVoucher}
                            onChange={e => form.setFieldValue('code', e.target.value.toUpperCase())}
                        />
                    </Form.Item>

                    <Form.Item name="description" label="Mô tả">
                        <Input placeholder="VD: Giảm 10% cho cá cảnh tháng 6" />
                    </Form.Item>

                    <Form.Item
                        name="discountPercent"
                        label="Phần trăm giảm (%)"
                        rules={[{ required: true, message: 'Nhập % giảm!' }]}
                    >
                        <InputNumber min={1} max={100} style={{ width: '100%' }} addonAfter="%" />
                    </Form.Item>

                    <Form.Item
                        name="applicableCategories"
                        label="Áp dụng cho danh mục"
                        extra="Để trống = áp dụng tất cả danh mục"
                    >
                        <Select
                            mode="multiple"
                            placeholder="Chọn danh mục (bỏ trống = tất cả)"
                            allowClear
                            loading={categories.length === 0}
                        >
                            {categories.map(c => (
                                <Option key={c} value={c}>{c}</Option>
                            ))}
                        </Select>
                    </Form.Item>

                    <Form.Item name="minOrderValue" label="Giá trị đơn hàng tối thiểu">
                        <InputNumber
                            min={0}
                            style={{ width: '100%' }}
                            formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                            parser={v => v.replace(/,/g, '')}
                            addonAfter="đ"
                            placeholder="0 = không giới hạn"
                        />
                    </Form.Item>

                    <Form.Item name="maxDiscount" label="Giảm tối đa">
                        <InputNumber
                            min={0}
                            style={{ width: '100%' }}
                            formatter={v => v ? `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : ''}
                            parser={v => v.replace(/,/g, '')}
                            addonAfter="đ"
                            placeholder="Để trống = không giới hạn"
                        />
                    </Form.Item>

                    <Form.Item name="usageLimit" label="Giới hạn lượt dùng">
                        <InputNumber
                            min={1}
                            style={{ width: '100%' }}
                            placeholder="Để trống = không giới hạn"
                        />
                    </Form.Item>

                    <Form.Item
                        name="dateRange"
                        label="Thời gian hiệu lực"
                        rules={[{ required: true, message: 'Chọn thời gian!' }]}
                    >
                        <RangePicker
                            style={{ width: '100%' }}
                            format="DD/MM/YYYY"
                            disabledDate={d => d && d < dayjs().startOf('day')}
                        />
                    </Form.Item>

                    <Form.Item name="isActive" label="Trạng thái" valuePropName="checked">
                        <Switch
                            checkedChildren={<><CheckCircleOutlined /> Bật</>}
                            unCheckedChildren={<><CloseCircleOutlined /> Tắt</>}
                        />
                    </Form.Item>

                    <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
                        <Button onClick={() => setModalOpen(false)}>Hủy</Button>
                        <Button
                            type="primary"
                            htmlType="submit"
                            loading={submitting}
                            style={{ background: RED, borderColor: RED }}
                        >
                            {editingVoucher ? 'Cập nhật' : 'Tạo Voucher'}
                        </Button>
                    </div>
                </Form>
            </Modal>
        </div>
    );
};

export default AdminVouchers;