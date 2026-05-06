// pages/admin/AdminShipping.jsx
import React, { useState, useEffect, useCallback } from 'react';
import {
    Card, Table, Button, InputNumber, Input, Tag, Modal,
    Form, message, Popconfirm, Row, Col, Statistic,
    Space, Spin, Tooltip, Badge, Divider, Alert,
} from 'antd';
import {
    CarOutlined, EditOutlined, DeleteOutlined, PlusOutlined,
    SaveOutlined, ReloadOutlined, EnvironmentOutlined,
    GiftOutlined, InfoCircleOutlined, CheckCircleOutlined,
    ThunderboltOutlined, CalculatorOutlined, AimOutlined,
} from '@ant-design/icons';
import axios from 'axios';

const API_BASE = 'http://localhost:5000/api/shipping';

const fmt = (v) => Number(v).toLocaleString('vi-VN');

const authHeader = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
};

// ── Tính phí ship từ km (dùng client-side để preview) ────────────────────────
const calcFeeFromKm = (distanceKm, tiers, baseFee) => {
    if (!tiers || tiers.length === 0) return baseFee;
    const sorted = [...tiers].sort((a, b) => a.minKm - b.minKm);
    let remaining = distanceKm;
    let total = 0;
    for (const tier of sorted) {
        if (remaining <= 0) break;
        const tierEnd = tier.maxKm !== null && tier.maxKm !== undefined ? tier.maxKm : Infinity;
        const tierLen = tierEnd - tier.minKm;
        const kmInTier = Math.min(remaining, tierLen);
        if (kmInTier > 0) { total += kmInTier * tier.pricePerKm; remaining -= kmInTier; }
    }
    return Math.max(Math.round(total / 1000) * 1000, baseFee);
};

// ── Màu tag km ────────────────────────────────────────────────────────────────
const kmColor = (km) => {
    if (km <= 50) return { bg: '#f6ffed', border: '#b7eb8f', text: '#389e0d' };
    if (km <= 200) return { bg: '#e6f4ff', border: '#91caff', text: '#0958d9' };
    if (km <= 500) return { bg: '#fff7e6', border: '#ffd591', text: '#d46b08' };
    return { bg: '#fff1f0', border: '#ffa39e', text: '#cf1322' };
};

const AdminShipping = () => {
    const [config, setConfig] = useState(null);
    const [isDirty, setIsDirty] = useState(false);
    const [pageLoading, setPageLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Threshold
    const [editThreshold, setEditThreshold] = useState(false);
    const [thresholdVal, setThresholdVal] = useState(0);

    // BaseFee
    const [editBaseFee, setEditBaseFee] = useState(false);
    const [baseFeeVal, setBaseFeeVal] = useState(0);

    // Km Tier modal
    const [tierModalOpen, setTierModalOpen] = useState(false);
    const [editingTierIdx, setEditingTierIdx] = useState(null);
    const [tierForm] = Form.useForm();

    // Province modal
    const [provModalOpen, setProvModalOpen] = useState(false);
    const [editingProv, setEditingProv] = useState(null);
    const [provForm] = Form.useForm();

    // Preview calculator
    const [previewProvince, setPreviewProvince] = useState('');
    const [previewSubtotal, setPreviewSubtotal] = useState(0);

    // Search
    const [searchText, setSearchText] = useState('');

    // ── Load config ───────────────────────────────────────────────────────────
    const loadConfig = useCallback(async () => {
        setPageLoading(true);
        try {
            const res = await axios.get(`${API_BASE}/config`);
            if (res.data.success) {
                setConfig(res.data.data);
                setThresholdVal(res.data.data.freeShipThreshold);
                setBaseFeeVal(res.data.data.baseFee);
                setIsDirty(false);
            }
        } catch {
            message.error('Không thể tải cấu hình phí ship!');
        } finally {
            setPageLoading(false);
        }
    }, []);

    useEffect(() => { loadConfig(); }, [loadConfig]);

    const markDirty = (newCfg) => { setConfig(newCfg); setIsDirty(true); };

    // ── Lưu tất cả ───────────────────────────────────────────────────────────
    const handleSaveAll = async () => {
        setSaving(true);
        try {
            // Chuyển provinceDistanceMap → body
            const body = {
                warehouseAddress: config.warehouseAddress,
                baseFee: config.baseFee,
                freeShipThreshold: config.freeShipThreshold,
                kmTiers: config.kmTiers,
                provinceDistanceMap: config.provinceDistanceMap,
            };
            const res = await axios.put(`${API_BASE}/config`, body, { headers: authHeader() });
            if (res.data.success) {
                setConfig(res.data.data);
                setIsDirty(false);
                localStorage.setItem('ShippingConfig_v2', JSON.stringify(res.data.data));
                window.dispatchEvent(new Event('shippingConfigChange'));
                message.success('Đã lưu cấu hình phí giao hàng!');
            }
        } catch (err) {
            message.error(err.response?.data?.message || 'Lưu thất bại!');
        } finally {
            setSaving(false);
        }
    };

    // ── Reset ─────────────────────────────────────────────────────────────────
    const handleReset = () => {
        Modal.confirm({
            title: 'Khôi phục về mặc định?',
            content: 'Toàn bộ cấu hình sẽ về giá trị gốc của hệ thống.',
            okText: 'Khôi phục', cancelText: 'Hủy', okButtonProps: { danger: true },
            onOk: async () => {
                try {
                    const res = await axios.post(`${API_BASE}/reset`, {}, { headers: authHeader() });
                    if (res.data.success) {
                        setConfig(res.data.data);
                        setThresholdVal(res.data.data.freeShipThreshold);
                        setBaseFeeVal(res.data.data.baseFee);
                        setIsDirty(false);
                        localStorage.setItem('ShippingConfig_v2', JSON.stringify(res.data.data));
                        window.dispatchEvent(new Event('shippingConfigChange'));
                        message.success('Đã khôi phục về mặc định!');
                    }
                } catch { message.error('Khôi phục thất bại!'); }
            },
        });
    };

    // ── Threshold ─────────────────────────────────────────────────────────────
    const handleSaveThreshold = () => {
        if (thresholdVal == null) return message.warning('Nhập giá trị hợp lệ!');
        markDirty({ ...config, freeShipThreshold: thresholdVal });
        setEditThreshold(false);
    };

    // ── BaseFee ───────────────────────────────────────────────────────────────
    const handleSaveBaseFee = () => {
        if (baseFeeVal == null) return message.warning('Nhập giá trị hợp lệ!');
        markDirty({ ...config, baseFee: baseFeeVal });
        setEditBaseFee(false);
    };

    // ── KM Tier CRUD ──────────────────────────────────────────────────────────
    const openAddTier = () => {
        setEditingTierIdx(null);
        const tiers = config.kmTiers || [];
        const lastMax = tiers.length > 0
            ? Math.max(...tiers.map(t => t.maxKm || 0))
            : 0;
        tierForm.setFieldsValue({ minKm: lastMax, maxKm: '', pricePerKm: 1000, label: '' });
        setTierModalOpen(true);
    };

    const openEditTier = (idx) => {
        setEditingTierIdx(idx);
        const t = config.kmTiers[idx];
        tierForm.setFieldsValue({
            minKm: t.minKm,
            maxKm: t.maxKm ?? '',
            pricePerKm: t.pricePerKm,
            label: t.label,
        });
        setTierModalOpen(true);
    };

    const handleSaveTier = () => {
        tierForm.validateFields().then(vals => {
            const newTier = {
                minKm: Number(vals.minKm),
                maxKm: vals.maxKm !== '' && vals.maxKm != null ? Number(vals.maxKm) : null,
                pricePerKm: Number(vals.pricePerKm),
                label: vals.label ||
                    (vals.maxKm ? `${vals.minKm} – ${vals.maxKm} km` : `> ${vals.minKm} km`),
            };

            let newTiers;
            if (editingTierIdx !== null) {
                newTiers = config.kmTiers.map((t, i) => i === editingTierIdx ? newTier : t);
            } else {
                newTiers = [...(config.kmTiers || []), newTier];
            }
            // Sắp xếp theo minKm
            newTiers.sort((a, b) => a.minKm - b.minKm);
            markDirty({ ...config, kmTiers: newTiers });
            setTierModalOpen(false);
            message.success(editingTierIdx !== null ? 'Đã cập nhật bậc giá!' : 'Đã thêm bậc giá mới!');
        });
    };

    const handleDeleteTier = (idx) => {
        const newTiers = config.kmTiers.filter((_, i) => i !== idx);
        markDirty({ ...config, kmTiers: newTiers });
        message.success('Đã xóa bậc giá!');
    };

    // ── Province CRUD ─────────────────────────────────────────────────────────
    const openAddProvince = () => {
        setEditingProv(null);
        provForm.resetFields();
        setProvModalOpen(true);
    };

    const openEditProvince = (name) => {
        setEditingProv(name);
        provForm.setFieldsValue({ name, distanceKm: config.provinceDistanceMap[name] });
        setProvModalOpen(true);
    };

    const handleSaveProvince = () => {
        provForm.validateFields().then(vals => {
            const name = vals.name.trim();
            if (!name) return message.warning('Tên tỉnh/thành không được để trống!');

            if (!editingProv && config.provinceDistanceMap[name] !== undefined)
                return message.error(`"${name}" đã tồn tại!`);

            const newMap = { ...config.provinceDistanceMap };
            if (editingProv && editingProv !== name) delete newMap[editingProv];
            newMap[name] = Number(vals.distanceKm);

            markDirty({ ...config, provinceDistanceMap: newMap });
            setProvModalOpen(false);
            message.success(editingProv ? 'Đã cập nhật!' : `Đã thêm "${name}"!`);
        });
    };

    const handleDeleteProvince = (name) => {
        const newMap = { ...config.provinceDistanceMap };
        delete newMap[name];
        markDirty({ ...config, provinceDistanceMap: newMap });
        message.success(`Đã xóa "${name}"!`);
    };

    // ── Loading ───────────────────────────────────────────────────────────────
    if (pageLoading || !config) {
        return (
            <div style={{ textAlign: 'center', padding: '80px 0' }}>
                <Spin size="large" tip="Đang tải cấu hình phí ship..." />
            </div>
        );
    }

    // ── Computed ──────────────────────────────────────────────────────────────
    const tiers = [...(config.kmTiers || [])].sort((a, b) => a.minKm - b.minKm);

    const provinceData = Object.entries(config.provinceDistanceMap || {})
        .filter(([name]) => !searchText || name.toLowerCase().includes(searchText.toLowerCase()))
        .map(([name, distanceKm]) => ({
            name,
            distanceKm,
            fee: calcFeeFromKm(distanceKm, config.kmTiers, config.baseFee),
            key: name,
        }))
        .sort((a, b) => a.distanceKm - b.distanceKm);

    // Preview
    const previewResult = previewProvince
        ? (() => {
            const km = config.provinceDistanceMap[previewProvince] ?? 0;
            const fee = calcFeeFromKm(km, config.kmTiers, config.baseFee);
            const isFree = previewSubtotal >= config.freeShipThreshold;
            return { km, fee, isFree, finalFee: isFree ? 0 : fee };
        })()
        : null;

    // ── Tier columns ──────────────────────────────────────────────────────────
    const tierColumns = [
        {
            title: 'Đoạn km', key: 'range', width: 180,
            render: (_, rec) => (
                <Tag color="blue" style={{ fontWeight: 700, fontSize: 13 }}>
                    {rec.minKm} – {rec.maxKm != null ? rec.maxKm : '∞'} km
                </Tag>
            ),
        },
        {
            title: 'Nhãn hiển thị', dataIndex: 'label',
            render: t => <span style={{ color: '#555' }}>{t}</span>,
        },
        {
            title: 'Giá / km', dataIndex: 'pricePerKm', width: 140,
            render: v => (
                <span style={{ color: '#c8232c', fontWeight: 700 }}>
                    {fmt(v)}đ<span style={{ fontSize: 11, color: '#aaa', fontWeight: 400 }}>/km</span>
                </span>
            ),
        },
        {
            title: 'Ví dụ (điểm giữa)', key: 'example', width: 160,
            render: (_, rec) => {
                const mid = rec.maxKm != null ? (rec.minKm + rec.maxKm) / 2 : rec.minKm + 100;
                const fee = calcFeeFromKm(mid, [rec], config.baseFee);
                return (
                    <Tooltip title={`Khoảng cách ${Math.round(mid)} km`}>
                        <span style={{ fontSize: 12, color: '#888' }}>≈ {fmt(fee)}đ</span>
                    </Tooltip>
                );
            },
        },
        {
            title: 'Thao tác', key: 'action', width: 140,
            render: (_, rec, idx) => (
                <Space>
                    <Button size="small" icon={<EditOutlined />} onClick={() => openEditTier(idx)}>Sửa</Button>
                    <Popconfirm
                        title="Xóa bậc giá này?"
                        onConfirm={() => handleDeleteTier(idx)}
                        okText="Xóa" cancelText="Hủy" okButtonProps={{ danger: true }}
                    >
                        <Button size="small" danger icon={<DeleteOutlined />} />
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    // ── Province columns ──────────────────────────────────────────────────────
    const provinceColumns = [
        {
            title: 'Tỉnh / Thành phố', dataIndex: 'name', width: 200,
            render: name => (
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <EnvironmentOutlined style={{ color: '#1890ff', fontSize: 13 }} />
                    <span style={{ fontWeight: 500 }}>{name}</span>
                </span>
            ),
        },
        {
            title: 'Khoảng cách từ kho', dataIndex: 'distanceKm', width: 190,
            sorter: (a, b) => a.distanceKm - b.distanceKm,
            render: (km, rec) => {
                const c = kmColor(km);
                return (
                    <Tag style={{ background: c.bg, borderColor: c.border, color: c.text, fontWeight: 600 }}>
                        📍 {km} km
                    </Tag>
                );
            },
        },
        {
            title: 'Phí ship (tính ra)', dataIndex: 'fee', width: 170,
            sorter: (a, b) => a.fee - b.fee,
            render: fee => (
                <span style={{ color: '#c8232c', fontWeight: 700 }}>
                    {fmt(fee)}đ
                </span>
            ),
        },
        {
            title: 'Thao tác', key: 'action', width: 140,
            render: (_, rec) => (
                <Space>
                    <Button size="small" icon={<EditOutlined />} onClick={() => openEditProvince(rec.name)}>Sửa</Button>
                    <Popconfirm
                        title={`Xóa "${rec.name}" khỏi danh sách?`}
                        onConfirm={() => handleDeleteProvince(rec.name)}
                        okText="Xóa" cancelText="Hủy" okButtonProps={{ danger: true }}
                    >
                        <Button size="small" danger icon={<DeleteOutlined />} />
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <div>

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
                <div>
                    <h2 style={{ margin: 0, color: '#004d40', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <CarOutlined /> Quản lý phí giao hàng theo km
                    </h2>
                    <p style={{ margin: '4px 0 0', color: '#888', fontSize: 13 }}>
                        Phí ship = tổng (km × giá/km) theo từng bậc, tính từ kho <b>{config.warehouseAddress}</b>
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
                        style={{ background: isDirty ? '#52c41a' : undefined, borderColor: isDirty ? '#52c41a' : undefined, fontWeight: 700 }}
                    >
                        {isDirty ? 'Lưu thay đổi *' : 'Đã lưu'}
                    </Button>
                </Space>
            </div>

            {/* Cảnh báo chưa lưu */}
            {isDirty && (
                <Alert
                    type="warning"
                    icon={<InfoCircleOutlined />}
                    showIcon
                    message={<span>Bạn có thay đổi chưa lưu. Nhấn <b>Lưu thay đổi</b> để lưu vào cơ sở dữ liệu.</span>}
                    style={{ marginBottom: 20 }}
                />
            )}

            {/* Thống kê */}
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                <Col xs={24} sm={12} lg={6}>
                    <Card style={{ background: '#f6ffed', border: '1px solid #b7eb8f' }}>
                        <Statistic
                            title="Ngưỡng miễn phí ship"
                            value={config.freeShipThreshold}
                            formatter={v => `${fmt(v)}đ`}
                            prefix={<GiftOutlined style={{ color: '#52c41a' }} />}
                            valueStyle={{ color: '#3f8600', fontSize: 20 }}
                        />
                        <div style={{ marginTop: 10 }}>
                            {!editThreshold ? (
                                <Button size="small" icon={<EditOutlined />} onClick={() => setEditThreshold(true)}>Chỉnh sửa</Button>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                    <InputNumber
                                        size="small" value={thresholdVal} min={0} step={50000}
                                        style={{ width: '100%' }}
                                        formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                        parser={v => v.replace(/,/g, '')}
                                        onChange={v => setThresholdVal(v)} addonAfter="đ"
                                    />
                                    <Space>
                                        <Button size="small" type="primary" onClick={handleSaveThreshold}>Xác nhận</Button>
                                        <Button size="small" onClick={() => { setThresholdVal(config.freeShipThreshold); setEditThreshold(false); }}>Hủy</Button>
                                    </Space>
                                </div>
                            )}
                        </div>
                    </Card>
                </Col>

                <Col xs={24} sm={12} lg={6}>
                    <Card style={{ background: '#fff7e6', border: '1px solid #ffd591' }}>
                        <Statistic
                            title="Phí tối thiểu"
                            value={config.baseFee}
                            formatter={v => `${fmt(v)}đ`}
                            prefix={<ThunderboltOutlined style={{ color: '#fa8c16' }} />}
                            valueStyle={{ color: '#d46b08', fontSize: 20 }}
                        />
                        <div style={{ marginTop: 10, fontSize: 12, color: '#888', marginBottom: 6 }}>
                            Áp dụng khi tính ra thấp hơn mức này
                        </div>
                        {!editBaseFee ? (
                            <Button size="small" icon={<EditOutlined />} onClick={() => setEditBaseFee(true)}>Chỉnh sửa</Button>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                <InputNumber
                                    size="small" value={baseFeeVal} min={0} step={5000}
                                    style={{ width: '100%' }}
                                    formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                    parser={v => v.replace(/,/g, '')}
                                    onChange={v => setBaseFeeVal(v)} addonAfter="đ"
                                />
                                <Space>
                                    <Button size="small" type="primary" onClick={handleSaveBaseFee}>Xác nhận</Button>
                                    <Button size="small" onClick={() => { setBaseFeeVal(config.baseFee); setEditBaseFee(false); }}>Hủy</Button>
                                </Space>
                            </div>
                        )}
                    </Card>
                </Col>

                <Col xs={24} sm={12} lg={6}>
                    <Card style={{ background: '#e6f4ff', border: '1px solid #91caff' }}>
                        <Statistic
                            title="Số bậc giá km"
                            value={config.kmTiers?.length || 0}
                            suffix="bậc"
                            prefix={<AimOutlined style={{ color: '#0958d9' }} />}
                            valueStyle={{ color: '#0958d9', fontSize: 20 }}
                        />
                        <div style={{ marginTop: 8 }}>
                            {tiers.map((t, i) => (
                                <div key={i} style={{ fontSize: 11, color: '#555', marginBottom: 2 }}>
                                    {t.label}: <b>{fmt(t.pricePerKm)}đ/km</b>
                                </div>
                            ))}
                        </div>
                    </Card>
                </Col>

                <Col xs={24} sm={12} lg={6}>
                    <Card style={{ background: '#f9f0ff', border: '1px solid #d3adf7' }}>
                        <Statistic
                            title="Số tỉnh/thành"
                            value={Object.keys(config.provinceDistanceMap || {}).length}
                            suffix="tỉnh"
                            prefix={<EnvironmentOutlined style={{ color: '#722ed1' }} />}
                            valueStyle={{ color: '#722ed1', fontSize: 20 }}
                        />
                        <div style={{ marginTop: 8, fontSize: 12, color: '#888' }}>
                            Kho: <b>{config.warehouseAddress}</b>
                        </div>
                    </Card>
                </Col>
            </Row>

            {/* Máy tính phí ship */}
            <Card
                title={<span><CalculatorOutlined style={{ marginRight: 8, color: '#1890ff' }} />Thử tính phí ship</span>}
                style={{ marginBottom: 20, border: '1px solid #91caff', background: '#f0f8ff' }}
            >
                <Row gutter={16} align="middle">
                    <Col xs={24} sm={8}>
                        <div style={{ fontSize: 13, marginBottom: 4, color: '#555', fontWeight: 500 }}>Chọn tỉnh/thành:</div>
                        <select
                            value={previewProvince}
                            onChange={e => setPreviewProvince(e.target.value)}
                            style={{ width: '100%', padding: '6px 10px', borderRadius: 6, border: '1px solid #d9d9d9', fontSize: 13 }}
                        >
                            <option value="">-- Chọn tỉnh/thành --</option>
                            {Object.keys(config.provinceDistanceMap || {}).sort().map(p => (
                                <option key={p} value={p}>{p} ({config.provinceDistanceMap[p]} km)</option>
                            ))}
                        </select>
                    </Col>
                    <Col xs={24} sm={8}>
                        <div style={{ fontSize: 13, marginBottom: 4, color: '#555', fontWeight: 500 }}>Giá trị đơn hàng:</div>
                        <InputNumber
                            value={previewSubtotal} min={0} step={50000}
                            style={{ width: '100%' }}
                            formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                            parser={v => v.replace(/,/g, '')}
                            onChange={v => setPreviewSubtotal(v || 0)}
                            addonAfter="đ"
                        />
                    </Col>
                    <Col xs={24} sm={8}>
                        {previewResult ? (
                            <div style={{ background: '#fff', borderRadius: 8, padding: '10px 14px', border: '1px solid #d9d9d9' }}>
                                <div style={{ fontSize: 12, color: '#888' }}>Khoảng cách: <b>{previewResult.km} km</b></div>
                                <div style={{ fontSize: 12, color: '#888' }}>Phí thực tế: <b style={{ color: '#c8232c' }}>{fmt(previewResult.fee)}đ</b></div>
                                <Divider style={{ margin: '6px 0' }} />
                                {previewResult.isFree ? (
                                    <Tag color="success" icon={<CheckCircleOutlined />} style={{ fontSize: 13 }}>MIỄN PHÍ SHIP 🎉</Tag>
                                ) : (
                                    <div style={{ fontSize: 16, fontWeight: 700, color: '#c8232c' }}>
                                        {fmt(previewResult.finalFee)}đ
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div style={{ color: '#aaa', fontSize: 13, textAlign: 'center', padding: '10px 0' }}>
                                Chọn tỉnh/thành để xem kết quả
                            </div>
                        )}
                    </Col>
                </Row>
            </Card>

            {/* Bảng bậc giá km */}
            <Card
                title={<span><AimOutlined style={{ marginRight: 8 }} />Bảng giá theo km (bậc thang lũy tiến)</span>}
                style={{ marginBottom: 20 }}
                extra={<Button type="primary" icon={<PlusOutlined />} onClick={openAddTier}>Thêm bậc giá</Button>}
            >
                <Alert
                    type="info" showIcon
                    message="Phí ship = tổng cộng từng đoạn km × giá/km tương ứng. Ví dụ: đơn 300 km = (50km × 2000) + (150km × 1500) + (100km × 1000) = 425.000đ"
                    style={{ marginBottom: 16 }}
                />
                <Table
                    dataSource={tiers.map((t, i) => ({ ...t, key: i }))}
                    columns={tierColumns}
                    rowKey="key"
                    pagination={false}
                    size="middle"
                />
            </Card>

            {/* Bảng tỉnh/thành */}
            <Card
                title={
                    <span>
                        <EnvironmentOutlined style={{ marginRight: 8 }} />
                        Khoảng cách các tỉnh/thành từ kho <Tag color="blue">{config.warehouseAddress}</Tag>
                        <Badge count={Object.keys(config.provinceDistanceMap || {}).length} style={{ backgroundColor: '#1890ff', marginLeft: 8 }} />
                    </span>
                }
                extra={<Button type="primary" icon={<PlusOutlined />} onClick={openAddProvince}>Thêm tỉnh/thành</Button>}
            >
                <div style={{ marginBottom: 16 }}>
                    <Input.Search
                        placeholder="Tìm tỉnh/thành..."
                        value={searchText}
                        onChange={e => setSearchText(e.target.value)}
                        style={{ width: 240 }}
                        allowClear
                    />
                    <span style={{ marginLeft: 12, color: '#888', fontSize: 13 }}>
                        Hiển thị <b>{provinceData.length}</b> / {Object.keys(config.provinceDistanceMap || {}).length} tỉnh/thành
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

            {/* Modal: Thêm/Sửa bậc giá km */}
            <Modal
                title={
                    editingTierIdx !== null
                        ? <span><EditOutlined style={{ marginRight: 6 }} />Sửa bậc giá km</span>
                        : <span><PlusOutlined style={{ marginRight: 6 }} />Thêm bậc giá km mới</span>
                }
                open={tierModalOpen}
                onOk={handleSaveTier}
                onCancel={() => setTierModalOpen(false)}
                okText="Lưu" cancelText="Hủy"
                destroyOnClose
            >
                <Form form={tierForm} layout="vertical" style={{ marginTop: 16 }}>
                    <Row gutter={12}>
                        <Col span={12}>
                            <Form.Item name="minKm" label="Từ km" rules={[{ required: true, message: 'Nhập km bắt đầu!' }]}>
                                <InputNumber min={0} style={{ width: '100%' }} addonAfter="km" />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="maxKm" label="Đến km (để trống = không giới hạn)">
                                <InputNumber min={0} style={{ width: '100%' }} addonAfter="km" placeholder="∞" />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Form.Item name="pricePerKm" label="Giá mỗi km" rules={[{ required: true, message: 'Nhập giá/km!' }]}>
                        <InputNumber
                            min={0} step={100} style={{ width: '100%' }}
                            formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                            parser={v => v.replace(/,/g, '')}
                            addonAfter="đ/km"
                        />
                    </Form.Item>
                    <Form.Item name="label" label="Nhãn hiển thị (tùy chọn)">
                        <Input placeholder="Ví dụ: Nội tỉnh, Miền Trung..." maxLength={60} />
                    </Form.Item>
                </Form>
            </Modal>

            {/* Modal: Thêm/Sửa tỉnh/thành */}
            <Modal
                title={
                    editingProv
                        ? <span><EditOutlined style={{ marginRight: 6 }} />Sửa khoảng cách "{editingProv}"</span>
                        : <span><PlusOutlined style={{ marginRight: 6 }} />Thêm tỉnh / thành phố mới</span>
                }
                open={provModalOpen}
                onOk={handleSaveProvince}
                onCancel={() => setProvModalOpen(false)}
                okText={editingProv ? 'Lưu' : 'Thêm'} cancelText="Hủy"
                destroyOnClose
            >
                <Form form={provForm} layout="vertical" style={{ marginTop: 16 }}>
                    <Form.Item
                        name="name" label="Tên tỉnh / thành phố"
                        rules={[{ required: true, message: 'Nhập tên tỉnh/thành!' }]}
                        extra="Nhập đúng tên tiếng Việt có dấu, ví dụ: Bình Thuận"
                    >
                        <Input placeholder="Ví dụ: Bình Thuận" maxLength={80} disabled={!!editingProv} />
                    </Form.Item>
                    <Form.Item
                        name="distanceKm" label={`Khoảng cách từ kho (${config.warehouseAddress})`}
                        rules={[{ required: true, message: 'Nhập khoảng cách km!' }]}
                        extra="Ước tính theo đường bộ thực tế"
                    >
                        <InputNumber
                            min={0} step={10} style={{ width: '100%' }}
                            addonAfter="km" placeholder="Ví dụ: 764"
                        />
                    </Form.Item>
                    {provForm.getFieldValue('distanceKm') > 0 && config.kmTiers?.length > 0 && (
                        <div style={{ background: '#f6f6f6', borderRadius: 6, padding: '8px 12px', fontSize: 12, color: '#555' }}>
                            Phí ship ước tính: <b style={{ color: '#c8232c' }}>
                                {fmt(calcFeeFromKm(provForm.getFieldValue('distanceKm') || 0, config.kmTiers, config.baseFee))}đ
                            </b>
                        </div>
                    )}
                </Form>
            </Modal>

        </div>
    );
};

export default AdminShipping;