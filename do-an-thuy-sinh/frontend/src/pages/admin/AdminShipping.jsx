// pages/admin/AdminShipping.jsx
import React, { useState, useEffect, useCallback } from 'react';
import {
    Card, Table, Button, InputNumber, Input, Tag, Modal,
    Form, Select, message, Popconfirm, Row, Col,
    Statistic, Badge, Space, Spin,
} from 'antd';
import {
    CarOutlined, EditOutlined, DeleteOutlined, PlusOutlined,
    SaveOutlined, ReloadOutlined, EnvironmentOutlined,
    GiftOutlined, SettingOutlined, InfoCircleOutlined,
    CheckCircleOutlined,
} from '@ant-design/icons';
import axios from 'axios';

const API_BASE = 'http://localhost:5000/api/shipping';

const ZONE_TAG_COLOR = { 1: 'blue', 2: 'orange', 3: 'red' };
const ZONE_CARD_BG = { 1: '#e6f4ff', 2: '#fff7e6', 3: '#fff1f0' };
const ZONE_BORDER = { 1: '#91caff', 2: '#ffd591', 3: '#ffa39e' };

const fmt = (v) => Number(v).toLocaleString('vi-VN');

const authHeader = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
};

const AdminShipping = () => {
    const [config, setConfig] = useState(null);
    const [isDirty, setIsDirty] = useState(false);
    const [pageLoading, setPageLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [editThreshold, setEditThreshold] = useState(false);
    const [thresholdVal, setThresholdVal] = useState(0);

    const [zoneModalOpen, setZoneModalOpen] = useState(false);
    const [editingZoneId, setEditingZoneId] = useState(null);
    const [zoneForm] = Form.useForm();

    const [provModalOpen, setProvModalOpen] = useState(false);
    const [provForm] = Form.useForm();

    const [searchText, setSearchText] = useState('');
    const [filterZone, setFilterZone] = useState(null);

    // ── Load config ───────────────────────────────────────────────────────────
    const loadConfig = useCallback(async () => {
        setPageLoading(true);
        try {
            const res = await axios.get(`${API_BASE}/config`);
            if (res.data.success) {
                setConfig(res.data.data);
                setThresholdVal(res.data.data.freeShipThreshold);
                setIsDirty(false);
            }
        } catch (err) {
            message.error('Không thể tải cấu hình phí ship từ server!');
            console.error(err);
        } finally {
            setPageLoading(false);
        }
    }, []);

    useEffect(() => { loadConfig(); }, [loadConfig]);

    // Fix ESLint warning: dùng config làm dependency thay vì config?.freeShipThreshold
    useEffect(() => {
        if (config) setThresholdVal(config.freeShipThreshold);
    }, [config]); // eslint-disable-line react-hooks/exhaustive-deps

    // ── Helpers ───────────────────────────────────────────────────────────────
    const markDirty = (newCfg) => { setConfig(newCfg); setIsDirty(true); };

    // ── Lưu config ───────────────────────────────────────────────────────────
    const handleSaveAll = async () => {
        setSaving(true);
        try {
            const res = await axios.put(`${API_BASE}/config`, config, { headers: authHeader() });
            if (res.data.success) {
                setConfig(res.data.data);
                setIsDirty(false);
                localStorage.setItem('shippingConfig', JSON.stringify(res.data.data));
                window.dispatchEvent(new Event('shippingConfigChange'));
                message.success('Đã lưu cấu hình phí giao hàng!');
            }
        } catch (err) {
            message.error(err.response?.data?.message || 'Lưu thất bại!');
        } finally {
            setSaving(false);
        }
    };

    // ── Reset về mặc định ────────────────────────────────────────────────────
    const handleReset = () => {
        Modal.confirm({
            title: 'Khôi phục về mặc định?',
            content: 'Toàn bộ thay đổi sẽ bị xóa và thay bằng cấu hình gốc của hệ thống.',
            okText: 'Khôi phục', cancelText: 'Hủy', okButtonProps: { danger: true },
            onOk: async () => {
                try {
                    const res = await axios.post(`${API_BASE}/reset`, {}, { headers: authHeader() });
                    if (res.data.success) {
                        setConfig(res.data.data);
                        setThresholdVal(res.data.data.freeShipThreshold);
                        setIsDirty(false);
                        localStorage.setItem('shippingConfig', JSON.stringify(res.data.data));
                        window.dispatchEvent(new Event('shippingConfigChange'));
                        message.success('Đã khôi phục về mặc định!');
                    }
                } catch {
                    message.error('Khôi phục thất bại!');
                }
            },
        });
    };

    // ── Threshold ─────────────────────────────────────────────────────────────
    const handleSaveThreshold = () => {
        if (thresholdVal === null || thresholdVal === undefined)
            return message.warning('Nhập giá trị hợp lệ!');
        markDirty({ ...config, freeShipThreshold: thresholdVal });
        setEditThreshold(false);
    };

    const handleCancelThreshold = () => {
        setThresholdVal(config.freeShipThreshold);
        setEditThreshold(false);
    };

    // ── Zone CRUD ─────────────────────────────────────────────────────────────
    const openAddZone = () => {
        setEditingZoneId(null);
        const existIds = Object.keys(config.zones).map(Number);
        const nextId = existIds.length > 0 ? Math.max(...existIds) + 1 : 1;
        zoneForm.setFieldsValue({ id: nextId, label: '', fee: 30000 });
        setZoneModalOpen(true);
    };

    const openEditZone = (zoneId) => {
        setEditingZoneId(zoneId);
        const z = config.zones[zoneId];
        zoneForm.setFieldsValue({ id: zoneId, label: z.label, fee: z.fee });
        setZoneModalOpen(true);
    };

    const handleSaveZone = () => {
        zoneForm.validateFields().then(vals => {
            const id = Number(vals.id);
            if (!editingZoneId && config.zones[id])
                return message.error(`Mã vùng ${id} đã tồn tại!`);
            const newZones = { ...config.zones, [id]: { label: vals.label, fee: vals.fee } };
            markDirty({ ...config, zones: newZones });
            setZoneModalOpen(false);
            message.success(editingZoneId ? 'Đã cập nhật vùng giao hàng!' : 'Đã thêm vùng mới!');
        });
    };

    const handleDeleteZone = (zoneId) => {
        const inUse = Object.values(config.provinceZoneMap).filter(z => z === zoneId).length;
        if (inUse > 0)
            return message.error(
                `Không thể xóa: vùng ${zoneId} đang có ${inUse} tỉnh/thành. Hãy chuyển chúng sang vùng khác trước!`
            );
        const newZones = { ...config.zones };
        delete newZones[zoneId];
        markDirty({ ...config, zones: newZones });
        message.success('Đã xóa vùng!');
    };

    // ── Province CRUD ─────────────────────────────────────────────────────────
    const openAddProvince = () => { provForm.resetFields(); setProvModalOpen(true); };

    const handleSaveProvince = () => {
        provForm.validateFields().then(vals => {
            const name = vals.name.trim();
            if (!name) return message.warning('Tên tỉnh/thành không được để trống!');
            if (config.provinceZoneMap[name] !== undefined)
                return message.error(`"${name}" đã tồn tại trong danh sách!`);
            const newMap = { ...config.provinceZoneMap, [name]: Number(vals.zone) };
            markDirty({ ...config, provinceZoneMap: newMap });
            setProvModalOpen(false);
            message.success(`Đã thêm "${name}" vào danh sách!`);
        });
    };

    const handleChangeProvinceZone = (province, newZone) => {
        const newMap = { ...config.provinceZoneMap, [province]: Number(newZone) };
        markDirty({ ...config, provinceZoneMap: newMap });
    };

    const handleDeleteProvince = (province) => {
        const newMap = { ...config.provinceZoneMap };
        delete newMap[province];
        markDirty({ ...config, provinceZoneMap: newMap });
        message.success(`Đã xóa "${province}" khỏi danh sách!`);
    };

    // ── Loading state ─────────────────────────────────────────────────────────
    if (pageLoading || !config) {
        return (
            <div style={{ textAlign: 'center', padding: '80px 0' }}>
                <Spin size="large" tip="Đang tải cấu hình phí ship..." />
            </div>
        );
    }

    // ── Computed ──────────────────────────────────────────────────────────────
    const totalProvinces = Object.keys(config.provinceZoneMap).length;

    const byZone = Object.entries(config.zones)
        .map(([id, z]) => ({
            id: Number(id),
            label: z.label,
            fee: z.fee,
            count: Object.values(config.provinceZoneMap).filter(zid => zid === Number(id)).length,
        }))
        .sort((a, b) => a.id - b.id);

    const provinceData = Object.entries(config.provinceZoneMap)
        .filter(([name, zone]) => {
            if (filterZone !== null && filterZone !== undefined && zone !== filterZone) return false;
            if (searchText && !name.toLowerCase().includes(searchText.toLowerCase())) return false;
            return true;
        })
        .map(([name, zone]) => ({ name, zone, key: name }))
        .sort((a, b) => a.zone - b.zone || a.name.localeCompare(b.name, 'vi'));

    const zoneOptions = Object.entries(config.zones)
        .sort(([a], [b]) => Number(a) - Number(b))
        .map(([id, z]) => ({
            value: Number(id),
            label: `Vùng ${id} — ${z.label} (${fmt(z.fee)}đ)`,
        }));

    // ── Columns ───────────────────────────────────────────────────────────────
    const zoneColumns = [
        {
            title: 'Mã vùng', dataIndex: 'id', width: 100,
            render: id => (
                <Tag color={ZONE_TAG_COLOR[id] || 'default'} style={{ fontWeight: 700 }}>
                    Vùng {id}
                </Tag>
            ),
        },
        {
            title: 'Tên vùng', dataIndex: 'label',
            render: t => <span style={{ fontWeight: 500 }}>{t}</span>,
        },
        {
            title: 'Phí giao hàng', dataIndex: 'fee', width: 160,
            render: fee => (
                <span style={{ color: '#c8232c', fontWeight: 700, fontSize: 15 }}>
                    {fmt(fee)}đ
                </span>
            ),
        },
        {
            title: 'Số tỉnh/thành', dataIndex: 'count', width: 130, align: 'center',
            render: count => (
                <Badge
                    count={count}
                    showZero
                    style={{ backgroundColor: count > 0 ? '#52c41a' : '#d9d9d9' }}
                />
            ),
        },
        {
            title: 'Thao tác', key: 'action', width: 160,
            render: (_, rec) => (
                <Space>
                    <Button size="small" icon={<EditOutlined />} onClick={() => openEditZone(rec.id)}>Sửa</Button>
                    <Popconfirm
                        title={`Xóa vùng ${rec.id}?`}
                        description="Tỉnh/thành trong vùng này phải được chuyển trước khi xóa."
                        onConfirm={() => handleDeleteZone(rec.id)}
                        okText="Xóa" cancelText="Hủy" okButtonProps={{ danger: true }}
                    >
                        <Button size="small" danger icon={<DeleteOutlined />}>Xóa</Button>
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    const provinceColumns = [
        {
            title: 'Tỉnh / Thành phố', dataIndex: 'name',
            render: name => (
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <EnvironmentOutlined style={{ color: '#1890ff', fontSize: 13 }} />
                    <span style={{ fontWeight: 500 }}>{name}</span>
                </span>
            ),
        },
        {
            title: 'Vùng giao hàng', dataIndex: 'zone', width: 280,
            render: (zone, rec) => (
                <Select
                    size="small"
                    value={zone}
                    onChange={val => handleChangeProvinceZone(rec.name, val)}
                    style={{ width: 260 }}
                    options={zoneOptions}
                />
            ),
        },
        {
            title: 'Phí áp dụng', dataIndex: 'zone', key: 'fee', width: 130,
            render: zone => {
                const zInfo = config.zones[zone];
                return zInfo
                    ? <Tag color={ZONE_TAG_COLOR[zone] || 'default'}>{fmt(zInfo.fee)}đ</Tag>
                    : <Tag color="error">Vùng không tồn tại</Tag>;
            },
        },
        {
            title: '', key: 'del', width: 60, align: 'center',
            render: (_, rec) => (
                <Popconfirm
                    title={`Xóa "${rec.name}" khỏi danh sách?`}
                    onConfirm={() => handleDeleteProvince(rec.name)}
                    okText="Xóa" cancelText="Hủy" okButtonProps={{ danger: true }}
                >
                    <Button size="small" danger icon={<DeleteOutlined />} />
                </Popconfirm>
            ),
        },
    ];

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <div>

            {/* Tiêu đề + actions */}
            <div style={{
                display: 'flex', justifyContent: 'space-between',
                alignItems: 'flex-start', marginBottom: 20,
                flexWrap: 'wrap', gap: 12,
            }}>
                <div>
                    <h2 style={{ margin: 0, color: '#004d40', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <CarOutlined /> Quản lý phí giao hàng
                    </h2>
                    <p style={{ margin: '4px 0 0', color: '#888', fontSize: 13 }}>
                        Cấu hình vùng giao hàng, mức phí và danh sách tỉnh/thành phố
                    </p>
                </div>
                <Space>
                    <Button icon={<ReloadOutlined />} onClick={loadConfig}>Tải lại</Button>
                    <Button icon={<ReloadOutlined />} onClick={handleReset} danger>Khôi phục mặc định</Button>
                    <Button
                        type="primary"
                        icon={isDirty ? <SaveOutlined /> : <CheckCircleOutlined />}
                        onClick={handleSaveAll}
                        disabled={!isDirty}
                        loading={saving}
                        style={{
                            background: isDirty ? '#52c41a' : undefined,
                            borderColor: isDirty ? '#52c41a' : undefined,
                            fontWeight: 700,
                        }}
                    >
                        {isDirty ? 'Lưu thay đổi *' : 'Đã lưu'}
                    </Button>
                </Space>
            </div>

            {/* Banner cảnh báo chưa lưu */}
            {isDirty && (
                <div style={{
                    background: '#fffbe6', border: '1px solid #ffe58f', borderRadius: 8,
                    padding: '10px 16px', marginBottom: 20,
                    display: 'flex', alignItems: 'center', gap: 8,
                }}>
                    <InfoCircleOutlined style={{ color: '#faad14', fontSize: 16 }} />
                    <span style={{ fontSize: 13, color: '#856404' }}>
                        Bạn có thay đổi chưa lưu. Nhấn <b>Lưu thay đổi</b> để lưu vào cơ sở dữ liệu.
                    </span>
                </div>
            )}

            {/* Thống kê tổng quan */}
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                <Col xs={24} sm={12} lg={6}>
                    <Card style={{ background: '#f6ffed', border: '1px solid #b7eb8f', height: '100%' }}>
                        <Statistic
                            title="Ngưỡng miễn phí ship"
                            value={config.freeShipThreshold}
                            formatter={v => `${fmt(v)}đ`}
                            prefix={<GiftOutlined style={{ color: '#52c41a' }} />}
                            valueStyle={{ color: '#3f8600', fontSize: 20 }}
                        />
                        <div style={{ marginTop: 10 }}>
                            {!editThreshold ? (
                                <Button size="small" icon={<EditOutlined />} onClick={() => setEditThreshold(true)}>
                                    Chỉnh sửa
                                </Button>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                    <InputNumber
                                        size="small"
                                        value={thresholdVal}
                                        min={0}
                                        step={50000}
                                        style={{ width: '100%' }}
                                        formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                        parser={v => v.replace(/,/g, '')}
                                        onChange={v => setThresholdVal(v)}
                                        addonAfter="đ"
                                    />
                                    <Space>
                                        <Button size="small" type="primary" onClick={handleSaveThreshold}>Xác nhận</Button>
                                        <Button size="small" onClick={handleCancelThreshold}>Hủy</Button>
                                    </Space>
                                </div>
                            )}
                        </div>
                    </Card>
                </Col>

                {byZone.map(z => (
                    <Col xs={24} sm={12} lg={6} key={z.id}>
                        <Card
                            style={{
                                background: ZONE_CARD_BG[z.id] || '#fafafa',
                                border: `1px solid ${ZONE_BORDER[z.id] || '#eee'}`,
                                height: '100%',
                            }}
                        >
                            <Statistic
                                title={
                                    <span>
                                        <Tag color={ZONE_TAG_COLOR[z.id] || 'default'} style={{ marginRight: 4 }}>
                                            Vùng {z.id}
                                        </Tag>
                                        {z.label}
                                    </span>
                                }
                                value={z.fee}
                                formatter={v => `${fmt(v)}đ`}
                                valueStyle={{ color: '#c8232c', fontSize: 20 }}
                            />
                            <div style={{ marginTop: 8 }}>
                                <Tag color={z.count > 0 ? 'green' : 'default'} style={{ fontSize: 12 }}>
                                    {z.count} tỉnh/thành
                                </Tag>
                            </div>
                        </Card>
                    </Col>
                ))}
            </Row>

            {/* Bảng vùng giao hàng */}
            <Card
                title={<span><SettingOutlined style={{ marginRight: 8 }} />Cấu hình vùng giao hàng</span>}
                style={{ marginBottom: 20 }}
                extra={<Button type="primary" icon={<PlusOutlined />} onClick={openAddZone}>Thêm vùng mới</Button>}
            >
                <Table dataSource={byZone} columns={zoneColumns} rowKey="id" pagination={false} size="middle" />
            </Card>

            {/* Bảng tỉnh/thành */}
            <Card
                title={
                    <span>
                        <EnvironmentOutlined style={{ marginRight: 8 }} />
                        Danh sách tỉnh / thành phố
                        <Tag color="blue" style={{ marginLeft: 10 }}>{totalProvinces} tỉnh/thành</Tag>
                    </span>
                }
                extra={<Button type="primary" icon={<PlusOutlined />} onClick={openAddProvince}>Thêm tỉnh/thành</Button>}
            >
                <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
                    <Input.Search
                        placeholder="Tìm tỉnh/thành..."
                        value={searchText}
                        onChange={e => setSearchText(e.target.value)}
                        style={{ width: 240 }}
                        allowClear
                    />
                    <Select
                        placeholder="Lọc theo vùng"
                        value={filterZone}
                        onChange={v => setFilterZone(v)}
                        allowClear
                        style={{ width: 230 }}
                        options={Object.entries(config.zones)
                            .sort(([a], [b]) => Number(a) - Number(b))
                            .map(([id, z]) => ({ value: Number(id), label: `Vùng ${id} — ${z.label}` }))
                        }
                    />
                    <span style={{ color: '#888', fontSize: 13 }}>
                        Hiển thị <b>{provinceData.length}</b> / {totalProvinces} tỉnh/thành
                    </span>
                </div>
                <Table
                    dataSource={provinceData}
                    columns={provinceColumns}
                    rowKey="name"
                    pagination={{ pageSize: 15, showSizeChanger: true, pageSizeOptions: ['10', '15', '20', '50'] }}
                    size="middle"
                    scroll={{ x: 640 }}
                />
            </Card>

            {/* Modal: Thêm / Sửa vùng */}
            <Modal
                title={
                    editingZoneId
                        ? <span><EditOutlined style={{ marginRight: 6 }} />Sửa vùng {editingZoneId}</span>
                        : <span><PlusOutlined style={{ marginRight: 6 }} />Thêm vùng giao hàng mới</span>
                }
                open={zoneModalOpen}
                onOk={handleSaveZone}
                onCancel={() => setZoneModalOpen(false)}
                okText="Lưu" cancelText="Hủy"
                destroyOnClose
            >
                <Form form={zoneForm} layout="vertical" style={{ marginTop: 16 }}>
                    <Form.Item name="id" label="Mã vùng (số nguyên)" rules={[{ required: true, message: 'Nhập mã vùng!' }]}>
                        <InputNumber min={1} style={{ width: '100%' }} disabled={!!editingZoneId} placeholder="Ví dụ: 4" />
                    </Form.Item>
                    <Form.Item name="label" label="Tên vùng" rules={[{ required: true, message: 'Nhập tên vùng!' }]}>
                        <Input placeholder="Ví dụ: Tây Nguyên" maxLength={60} />
                    </Form.Item>
                    <Form.Item name="fee" label="Phí giao hàng" rules={[{ required: true, message: 'Nhập phí ship!' }]}>
                        <InputNumber
                            min={0} step={5000} style={{ width: '100%' }}
                            formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                            parser={v => v.replace(/,/g, '')}
                            addonAfter="đ" placeholder="30000"
                        />
                    </Form.Item>
                </Form>
            </Modal>

            {/* Modal: Thêm tỉnh/thành */}
            <Modal
                title={<span><PlusOutlined style={{ marginRight: 6 }} />Thêm tỉnh / thành phố mới</span>}
                open={provModalOpen}
                onOk={handleSaveProvince}
                onCancel={() => setProvModalOpen(false)}
                okText="Thêm" cancelText="Hủy"
                destroyOnClose
            >
                <Form form={provForm} layout="vertical" style={{ marginTop: 16 }}>
                    <Form.Item
                        name="name" label="Tên tỉnh / thành phố"
                        rules={[{ required: true, message: 'Nhập tên tỉnh/thành!' }]}
                        extra="Nhập đúng tên tiếng Việt có dấu, ví dụ: Bình Thuận"
                    >
                        <Input placeholder="Ví dụ: Bình Thuận" maxLength={80} />
                    </Form.Item>
                    <Form.Item name="zone" label="Thuộc vùng giao hàng" rules={[{ required: true, message: 'Chọn vùng!' }]}>
                        <Select placeholder="Chọn vùng..." options={zoneOptions} />
                    </Form.Item>
                </Form>
            </Modal>

        </div>
    );
};

export default AdminShipping;