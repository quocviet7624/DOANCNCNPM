import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Row, Col, Card, Radio, Button, Input, Form,
    Divider, List, Typography, Space, message, Tag,
    Modal, Popconfirm, Tooltip, Select, Spin,
} from 'antd';
import {
    EnvironmentOutlined, CreditCardOutlined,
    UserOutlined, PhoneOutlined,
    PlusOutlined, EditOutlined, DeleteOutlined,
    TagOutlined, GiftOutlined, CheckCircleOutlined,
    CloseCircleOutlined, CarOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;
const RED = '#c8232c';
const GREEN = '#52c41a';
const BLUE = '#1890ff';

const SHIPPING_API = 'http://localhost:5000/api/shipping/config';

// ─── Helper: đọc/ghi địa chỉ dùng chung với UserProfile ─────────────────────
const loadAddresses = () => {
    try {
        const list = JSON.parse(localStorage.getItem('addresses') || '[]');
        const defId = localStorage.getItem('defaultAddressId');
        return { list, defaultId: defId || list[0]?.id || null };
    } catch { return { list: [], defaultId: null }; }
};

const saveAddresses = (list, defaultId) => {
    localStorage.setItem('addresses', JSON.stringify(list));
    if (defaultId !== undefined && defaultId !== null)
        localStorage.setItem('defaultAddressId', defaultId);
};

// ─── Tính phí ship từ config do admin cài đặt (theo km) ─────────────────────
const calcFeeFromKm = (distanceKm, tiers, baseFee) => {
    if (!tiers || tiers.length === 0) return baseFee || 0;
    const sorted = [...tiers].sort((a, b) => a.minKm - b.minKm);
    let remaining = distanceKm;
    let total = 0;
    for (const tier of sorted) {
        if (remaining <= 0) break;
        const tierEnd = (tier.maxKm !== null && tier.maxKm !== undefined) ? tier.maxKm : Infinity;
        const tierLen = tierEnd - tier.minKm;
        const kmInTier = Math.min(remaining, tierLen);
        if (kmInTier > 0) { total += kmInTier * tier.pricePerKm; remaining -= kmInTier; }
    }
    return Math.max(Math.round(total / 1000) * 1000, baseFee || 0);
};

const calcShippingFee = (province, subtotal, shippingConfig) => {
    if (!shippingConfig || !province) return { fee: 0, isFree: false, zoneLabel: '', originalFee: 0 };

    const { freeShipThreshold, kmTiers, baseFee, provinceDistanceMap } = shippingConfig;

    // Guard: nếu API chưa trả về đủ dữ liệu
    if (!provinceDistanceMap) return { fee: 0, isFree: false, zoneLabel: '', originalFee: 0 };

    const distanceKm = provinceDistanceMap[province];
    if (distanceKm === undefined) return { fee: 0, isFree: false, zoneLabel: 'Không xác định', originalFee: 0 };

    const originalFee = calcFeeFromKm(distanceKm, kmTiers, baseFee);
    const zoneLabel = distanceKm + ' km';

    if (subtotal >= freeShipThreshold) {
        return { fee: 0, isFree: true, zoneLabel, originalFee };
    }
    return { fee: originalFee, isFree: false, zoneLabel, originalFee };
};
// ─────────────────────────────────────────────────────────────────────────────

const Checkout = () => {
    const navigate = useNavigate();
    const [cartItems, setCartItems] = useState([]);
    const [userInfo, setUserInfo] = useState(null);
    const [savedAddresses, setSavedAddresses] = useState([]);
    const [selectedAddressId, setSelectedAddressId] = useState(null);
    const [isAddingNew, setIsAddingNew] = useState(false);
    const [addForm] = Form.useForm();
    const [isEditing, setIsEditing] = useState(false);
    const [editingAddress, setEditingAddress] = useState(null);
    const [editForm] = Form.useForm();
    const [paymentMethod, setPaymentMethod] = useState('cod');
    const [isProcessing, setIsProcessing] = useState(false);

    // PayPal modal
    const [paypalModalOpen, setPaypalModalOpen] = useState(false);
    const [paypalStep, setPaypalStep] = useState('form');
    const [paypalForm] = Form.useForm();

    // VNPay
    const [vnpayLoading, setVnpayLoading] = useState(false);

    // Voucher
    const [voucherCode, setVoucherCode] = useState('');
    const [voucherLoading, setVoucherLoading] = useState(false);
    const [appliedVoucher, setAppliedVoucher] = useState(null);

    // Shipping
    const [selectedProvince, setSelectedProvince] = useState('');

    // ── Shipping config từ API ───────────────────────────────────────────────
    const [shippingConfig, setShippingConfig] = useState(null);
    const [shippingConfigLoading, setShippingConfigLoading] = useState(true);

    // ── Shipping fee tính từ API (luôn đồng bộ với backend) ─────────────────
    const [shippingInfo, setShippingInfo] = useState({ fee: 0, isFree: false, zoneLabel: '', originalFee: 0 });
    const [shippingFeeLoading, setShippingFeeLoading] = useState(false);

    // ── Load shipping config từ server (admin quản lý) ──────────────────────
    useEffect(() => {
        const fetchShippingConfig = async () => {
            setShippingConfigLoading(true);
            try {
                // Ưu tiên dùng cache localStorage nếu có, để tránh chờ quá lâu
                const cached = localStorage.getItem('ShippingConfig_v2');
                if (cached) {
                    try { setShippingConfig(JSON.parse(cached)); } catch { }
                }
                // Luôn fetch mới nhất từ server để đảm bảo đúng config admin đã cài
                const res = await axios.get(SHIPPING_API);
                if (res.data.success) {
                    setShippingConfig(res.data.data);
                    localStorage.setItem('ShippingConfig_v2', JSON.stringify(res.data.data));
                }
            } catch (err) {
                console.error('Không thể tải config phí ship:', err);
                message.warning('Không thể tải phí ship từ server. Vui lòng thử lại!');
            } finally {
                setShippingConfigLoading(false);
            }
        };

        fetchShippingConfig();

        // Lắng nghe khi admin thay đổi config (cùng tab hoặc tab khác)
        const onConfigChange = () => {
            fetchShippingConfig();
        };
        window.addEventListener('shippingConfigChange', onConfigChange);
        return () => window.removeEventListener('shippingConfigChange', onConfigChange);
    }, []);

    // ── KHỞI TẠO DỮ LIỆU ────────────────────────────────────────────────────
    useEffect(() => {
        const cart = JSON.parse(localStorage.getItem('cart') || '[]');
        if (cart.length === 0) { message.warning('Giỏ hàng trống!'); navigate('/products'); return; }
        setCartItems(cart);

        const userStr = localStorage.getItem('user');
        if (!userStr) { navigate('/login'); return; }
        const user = JSON.parse(userStr);
        setUserInfo(user);

        const { list, defaultId } = loadAddresses();

        if (list.length === 0 && user.address) {
            const migrated = [{
                id: Date.now().toString(),
                name: user.fullName || user.username || 'Tôi',
                phone: user.phone || '',
                detail: user.address,
                city: user.city || user.province || '',
            }];
            saveAddresses(migrated, migrated[0].id);
            setSavedAddresses(migrated);
            setSelectedAddressId(migrated[0].id);
            setSelectedProvince(migrated[0].city || '');
        } else {
            setSavedAddresses(list);
            setSelectedAddressId(defaultId);
            const def = list.find(a => a.id === defaultId);
            if (def?.city) setSelectedProvince(def.city);
        }

        if (list.length === 0 && !user.address) setIsAddingNew(true);

        const savedVoucher = localStorage.getItem('appliedVoucher');
        if (savedVoucher) { try { setAppliedVoucher(JSON.parse(savedVoucher)); } catch { } }
    }, [navigate]);

    useEffect(() => {
        if (!selectedAddressId) return;
        const addr = savedAddresses.find(a => a.id === selectedAddressId);
        setSelectedProvince(addr?.city || '');
    }, [selectedAddressId, savedAddresses]);

    // ── Tính phí ship qua API backend (luôn dùng config mới nhất) ────────────
    const subtotal = cartItems.reduce((s, i) => s + i.price * i.quantity, 0);

    useEffect(() => {
        if (!selectedProvince) {
            setShippingInfo({ fee: 0, isFree: false, zoneLabel: '', originalFee: 0 });
            return;
        }
        const fetchFee = async () => {
            setShippingFeeLoading(true);
            try {
                const res = await axios.post('http://localhost:5000/api/shipping/calculate', {
                    province: selectedProvince,
                    subtotal,
                });
                if (res.data.success) {
                    const { fee, originalFee, isFree, distanceKm } = res.data.data;
                    setShippingInfo({
                        fee,
                        isFree,
                        originalFee,
                        zoneLabel: distanceKm + ' km',
                    });
                }
            } catch (err) {
                console.error('Không thể tính phí ship:', err);
                // fallback client-side nếu API lỗi
                const fallback = calcShippingFee(selectedProvince, subtotal, shippingConfig);
                setShippingInfo(fallback);
            } finally {
                setShippingFeeLoading(false);
            }
        };
        fetchFee();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedProvince, subtotal]);

    // ── TÍNH TIỀN ────────────────────────────────────────────────────────────
    const discountAmount = appliedVoucher?.discountAmount || 0;
    const shippingFee = shippingInfo.fee;
    const finalTotal = subtotal - discountAmount + shippingFee;

    // ── QUẢN LÝ ĐỊA CHỈ ─────────────────────────────────────────────────────
    const persistAddresses = (newList, defaultId) => {
        saveAddresses(newList, defaultId);
        setSavedAddresses(newList);
    };

    const handleAddNewAddress = (values) => {
        const newAddr = {
            id: Date.now().toString(),
            name: values.name,
            phone: values.phone,
            detail: values.detail,
            city: values.province || '',
        };
        const newList = [...savedAddresses, newAddr];
        const newDefId = newList.length === 1 ? newAddr.id : localStorage.getItem('defaultAddressId');
        persistAddresses(newList, newDefId);
        setSelectedAddressId(newAddr.id);
        setSelectedProvince(newAddr.city);
        setIsAddingNew(false);
        addForm.resetFields();
        message.success('Đã thêm địa chỉ mới!');
    };

    const handleDeleteAddress = (e, id) => {
        e.stopPropagation();
        const newList = savedAddresses.filter(a => a.id !== id);
        const currentDefId = localStorage.getItem('defaultAddressId');
        const newDefId = id === currentDefId ? (newList[0]?.id || null) : currentDefId;
        persistAddresses(newList, newDefId);
        message.success('Đã xóa địa chỉ!');
        if (id === selectedAddressId) {
            const next = newList[0] || null;
            setSelectedAddressId(next?.id || null);
            setSelectedProvince(next?.city || '');
            if (!next) setIsAddingNew(true);
        }
    };

    const openEditModal = (e, address) => {
        e.stopPropagation();
        setEditingAddress(address);
        editForm.setFieldsValue({
            name: address.name,
            phone: address.phone,
            detail: address.detail,
            province: address.city || '',
        });
        setIsEditing(true);
    };

    const handleUpdateAddress = () => {
        editForm.validateFields().then(values => {
            const newList = savedAddresses.map(a =>
                a.id === editingAddress.id
                    ? { ...a, name: values.name, phone: values.phone, detail: values.detail, city: values.province || '' }
                    : a
            );
            persistAddresses(newList, localStorage.getItem('defaultAddressId'));
            if (editingAddress.id === selectedAddressId) setSelectedProvince(values.province || '');
            setIsEditing(false);
            setEditingAddress(null);
            message.success('Cập nhật địa chỉ thành công!');
        });
    };

    // ── VOUCHER ──────────────────────────────────────────────────────────────
    const handleApplyVoucher = async () => {
        const trimmed = voucherCode.trim().toUpperCase();
        if (!trimmed) return message.warning('Vui lòng nhập mã voucher!');
        setVoucherLoading(true);
        try {
            const res = await axios.post('http://localhost:5000/api/vouchers/apply', {
                code: trimmed,
                cartItems: cartItems.map(i => ({ category: i.category, price: i.price, quantity: i.quantity })),
                orderTotal: subtotal,
            });
            const voucher = { ...res.data.voucher, discountAmount: res.data.discountAmount };
            setAppliedVoucher(voucher);
            localStorage.setItem('appliedVoucher', JSON.stringify(voucher));
            message.success(`Áp dụng thành công! Giảm ${res.data.discountAmount.toLocaleString('vi-VN')}đ`);
        } catch (err) {
            message.error(err.response?.data?.message || 'Mã voucher không hợp lệ!');
        } finally {
            setVoucherLoading(false);
        }
    };

    const handleRemoveVoucher = () => {
        setAppliedVoucher(null);
        setVoucherCode('');
        localStorage.removeItem('appliedVoucher');
    };

    // ── ĐẶT HÀNG ────────────────────────────────────────────────────────────
    const submitOrder = async (extraData = {}) => {
        if (!selectedAddressId) return message.error('Vui lòng chọn địa chỉ giao hàng!');
        if (!selectedProvince) return message.error('Vui lòng chọn tỉnh/thành phố để tính phí ship!');

        setIsProcessing(true);
        const addr = savedAddresses.find(a => a.id === selectedAddressId);
        const isPaid = paymentMethod === 'paypal';

        const orderData = {
            userId: userInfo._id || userInfo.id,
            customerName: addr.name,
            phone: addr.phone,
            address: addr.detail,
            province: selectedProvince,
            items: cartItems,
            subtotalAmount: subtotal,
            discountAmount,
            shippingFee,
            totalAmount: finalTotal,
            voucherCode: appliedVoucher?.code || null,
            paymentMethod: isPaid ? 'PayPal' : 'COD',
            isPaid,
            status: 'Chờ xác nhận',
            ...extraData,
        };

        try {
            const res = await axios.post('http://localhost:5000/api/orders/checkout', orderData);
            const savedOrder = res.data.order;

            if (appliedVoucher?.code) {
                try { await axios.post(`http://localhost:5000/api/vouchers/confirm-use/${appliedVoucher.code}`); } catch { }
            }

            const newOrderLocal = {
                id: savedOrder._id,
                orderId: savedOrder._id.slice(-8).toUpperCase(),
                items: cartItems,
                subtotalAmount: subtotal,
                discountAmount,
                shippingFee,
                totalAmount: finalTotal,
                voucherCode: appliedVoucher?.code || null,
                orderDate: new Date().toLocaleString('vi-VN'),
                status: 'pending',
                isPaid,
                paymentMethod: isPaid ? 'PayPal' : 'COD',
                customerName: addr.name,
                phone: addr.phone,
                address: addr.detail,
                province: selectedProvince,
            };
            const history = JSON.parse(localStorage.getItem('orderHistory') || '[]');
            history.unshift(newOrderLocal);
            localStorage.setItem('orderHistory', JSON.stringify(history));

            localStorage.removeItem('cart');
            localStorage.removeItem('appliedVoucher');
            localStorage.removeItem('checkoutSummary');
            window.dispatchEvent(new Event('cartChange'));
            window.dispatchEvent(new Event('orderChange'));

            message.success('Đặt hàng thành công!');
            navigate('/my-orders');
        } catch (err) {
            console.error(err);
            message.error('Đặt hàng thất bại! Vui lòng thử lại.');
        } finally {
            setIsProcessing(false);
        }
    };

    // ── XỬ LÝ THANH TOÁN VNPAY ──────────────────────────────────────────────
    const handleVNPayPayment = async () => {
        if (!selectedAddressId) return message.error('Vui lòng chọn địa chỉ giao hàng!');
        if (!selectedProvince) return message.error('Vui lòng chọn tỉnh/thành phố để tính phí ship!');

        setVnpayLoading(true);
        try {
            const addr = savedAddresses.find(a => a.id === selectedAddressId);
            const orderId = 'FCJR' + Date.now().toString().slice(-8);

            const pendingOrder = {
                userId: userInfo._id || userInfo.id,
                customerName: addr.name,
                phone: addr.phone,
                address: addr.detail,
                province: selectedProvince,
                items: cartItems,
                subtotalAmount: subtotal,
                discountAmount,
                shippingFee,
                totalAmount: finalTotal,
                voucherCode: appliedVoucher?.code || null,
                paymentMethod: 'VNPay',
                isPaid: false,
                status: 'Chờ xác nhận',
                vnpayOrderId: orderId,
            };
            localStorage.setItem('pendingVNPayOrder', JSON.stringify(pendingOrder));

            const res = await axios.post('http://localhost:5000/api/vnpay/create-payment', {
                amount: finalTotal,
                orderInfo: `Thanh toan don hang FC Junior`,
                orderId: orderId,
            });

            window.location.href = res.data.paymentUrl;

        } catch (err) {
            console.error('VNPay error:', err);
            message.error('Không thể kết nối VNPay. Vui lòng thử lại!');
        } finally {
            setVnpayLoading(false);
        }
    };

    const handlePlaceOrder = () => {
        if (!selectedAddressId) return message.error('Vui lòng chọn địa chỉ giao hàng!');
        if (!selectedProvince) return message.error('Vui lòng chọn tỉnh/thành phố để tính phí ship!');

        if (paymentMethod === 'paypal') {
            setPaypalStep('form');
            paypalForm.resetFields();
            setPaypalModalOpen(true);
        } else if (paymentMethod === 'vnpay') {
            handleVNPayPayment();
        } else {
            submitOrder();
        }
    };

    const handlePaypalConfirm = () => {
        paypalForm.validateFields()
            .then(() => {
                setPaypalStep('processing');
                setTimeout(() => setPaypalStep('success'), 2000);
            })
            .catch(() => { });
    };

    const handlePaypalSuccess = () => {
        setPaypalModalOpen(false);
        submitOrder();
    };

    // ── Màu nút ──────────────────────────────────────────────────────────────
    const getButtonStyle = () => {
        if (paymentMethod === 'paypal') return { background: '#003087', borderColor: '#003087' };
        if (paymentMethod === 'vnpay') return { background: '#e30019', borderColor: '#e30019' };
        return { background: RED, borderColor: RED };
    };

    const getButtonText = () => {
        if (paymentMethod === 'paypal') return 'Pay with PayPal';
        if (paymentMethod === 'vnpay') return 'Thanh toán qua VNPay';
        return 'ĐẶT HÀNG NGAY';
    };

    // ── Province list từ shippingConfig ──────────────────────────────────────
    const provinceList = shippingConfig?.provinceDistanceMap
        ? Object.keys(shippingConfig.provinceDistanceMap).sort((a, b) => a.localeCompare(b, 'vi'))
        : [];

    // ── ShippingBadge dùng API backend ──────────────────────────────────────
    const ShippingBadge = () => {
        if (shippingConfigLoading || shippingFeeLoading) return <Spin size="small" />;
        if (!selectedProvince) return (
            <span style={{ color: '#aaa', fontSize: 13 }}>Chọn tỉnh/thành để xem phí ship</span>
        );
        if (shippingInfo.isFree) return (
            <Tag color="success" icon={<CheckCircleOutlined />} style={{ fontSize: 13 }}>
                MIỄN PHÍ SHIP 🎉
            </Tag>
        );
        return (
            <span style={{ color: RED, fontWeight: 700 }}>
                {shippingFee.toLocaleString('vi-VN')}đ
                <span style={{ fontSize: 11, color: '#888', fontWeight: 400, marginLeft: 6 }}>
                    ({shippingInfo.zoneLabel})
                </span>
            </span>
        );
    };

    return (
        <div style={{ padding: '30px', background: '#f5f5f5', minHeight: '100vh' }}>
            <div style={{ maxWidth: 1200, margin: '0 auto' }}>
                <Title level={2} style={{ textAlign: 'center', marginBottom: 30 }}>Thanh Toán</Title>

                <Row gutter={24}>
                    {/* ── CỘT TRÁI ── */}
                    <Col xs={24} lg={14}>

                        {/* Địa chỉ */}
                        <Card
                            title={<span><EnvironmentOutlined /> Địa chỉ nhận hàng</span>}
                            style={{ marginBottom: 20 }}
                            extra={
                                // Nút "Thêm địa chỉ" chỉ hiện khi đã có địa chỉ, chưa mở form, và chưa đủ 5
                                savedAddresses.length > 0 && !isAddingNew && savedAddresses.length < 5 && (
                                    <Button type="link" icon={<PlusOutlined />} onClick={() => setIsAddingNew(true)}>
                                        Thêm địa chỉ mới
                                    </Button>
                                )
                            }
                        >
                            {/* ── CASE 1: Chưa có địa chỉ nào → hiện form luôn ── */}
                            {savedAddresses.length === 0 && (
                                <div style={{ background: '#fafafa', padding: 20, borderRadius: 8, border: '1px dashed #d9d9d9' }}>
                                    <div style={{ marginBottom: 16, color: '#666', fontSize: 13 }}>
                                        Bạn chưa có địa chỉ giao hàng. Vui lòng thêm địa chỉ mới.
                                    </div>
                                    <Form
                                        form={addForm}
                                        layout="vertical"
                                        onFinish={handleAddNewAddress}
                                        initialValues={{ name: userInfo?.fullName, phone: userInfo?.phone }}
                                    >
                                        <Row gutter={16}>
                                            <Col span={12}>
                                                <Form.Item name="name" label="Người nhận" rules={[{ required: true, message: 'Nhập tên' }]}>
                                                    <Input prefix={<UserOutlined />} placeholder="Tên người nhận" />
                                                </Form.Item>
                                            </Col>
                                            <Col span={12}>
                                                <Form.Item name="phone" label="Số điện thoại" rules={[{ required: true, message: 'Nhập SĐT' }]}>
                                                    <Input prefix={<PhoneOutlined />} placeholder="Số điện thoại" />
                                                </Form.Item>
                                            </Col>
                                            <Col span={24}>
                                                <Form.Item name="province" label="Tỉnh / Thành phố" rules={[{ required: true, message: 'Chọn tỉnh/thành' }]}>
                                                    <Select
                                                        showSearch
                                                        placeholder={shippingConfigLoading ? 'Đang tải...' : 'Chọn tỉnh/thành phố'}
                                                        loading={shippingConfigLoading}
                                                        options={provinceList.map(p => ({ value: p, label: p }))}
                                                        filterOption={(input, option) =>
                                                            option.label.toLowerCase().includes(input.toLowerCase())
                                                        }
                                                    />
                                                </Form.Item>
                                            </Col>
                                            <Col span={24}>
                                                <Form.Item name="detail" label="Địa chỉ chi tiết" rules={[{ required: true, message: 'Nhập địa chỉ' }]}>
                                                    <Input.TextArea rows={2} placeholder="Số nhà, tên đường, phường/xã..." />
                                                </Form.Item>
                                            </Col>
                                        </Row>
                                        <Button type="primary" htmlType="submit" block>
                                            Lưu địa chỉ
                                        </Button>
                                    </Form>
                                </div>
                            )}

                            {/* ── CASE 2: Đã có địa chỉ → danh sách chọn ── */}
                            {savedAddresses.length > 0 && (
                                <>
                                    <List
                                        dataSource={savedAddresses}
                                        renderItem={item => (
                                            <div
                                                onClick={() => setSelectedAddressId(item.id)}
                                                style={{
                                                    cursor: 'pointer',
                                                    border: selectedAddressId === item.id ? `2px solid ${BLUE}` : '1px solid #e8e8e8',
                                                    padding: 15, marginBottom: 10, borderRadius: 8,
                                                    backgroundColor: selectedAddressId === item.id ? '#f0f9ff' : 'white',
                                                    transition: 'all .3s',
                                                }}
                                            >
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                                                        <Radio checked={selectedAddressId === item.id} />
                                                        <div style={{ marginLeft: 10 }}>
                                                            <Space>
                                                                <Text strong>{item.name}</Text>
                                                                <Divider type="vertical" />
                                                                <Text type="secondary">{item.phone}</Text>
                                                                {item.id === localStorage.getItem('defaultAddressId') && (
                                                                    <Tag color="blue">Mặc định</Tag>
                                                                )}
                                                            </Space>
                                                            <div style={{ marginTop: 4, color: '#555' }}>{item.detail}</div>
                                                            {item.city && (
                                                                <div style={{ marginTop: 2, fontSize: 12, color: '#888' }}>
                                                                    📍 {item.city}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <Space>
                                                        <Tooltip title="Sửa địa chỉ">
                                                            <Button type="text" icon={<EditOutlined style={{ color: BLUE }} />}
                                                                onClick={e => openEditModal(e, item)} />
                                                        </Tooltip>
                                                        <Popconfirm
                                                            title="Bạn có chắc muốn xóa địa chỉ này?"
                                                            onConfirm={e => handleDeleteAddress(e, item.id)}
                                                            onCancel={e => e.stopPropagation()}
                                                            okText="Xóa" cancelText="Hủy"
                                                        >
                                                            <Button type="text" danger icon={<DeleteOutlined />}
                                                                onClick={e => e.stopPropagation()} />
                                                        </Popconfirm>
                                                    </Space>
                                                </div>
                                            </div>
                                        )}
                                    />

                                    {/* Form thêm địa chỉ mới — chỉ mở khi bấm nút "Thêm địa chỉ mới" */}
                                    {isAddingNew && (
                                        <div style={{
                                            marginTop: 12, background: '#fafafa', padding: 20,
                                            borderRadius: 8, border: '1px dashed #91caff',
                                        }}>
                                            <Title level={5} style={{ marginTop: 0, marginBottom: 16, color: BLUE }}>
                                                <PlusOutlined style={{ marginRight: 6 }} />Thêm địa chỉ giao hàng mới
                                            </Title>
                                            <Form
                                                form={addForm}
                                                layout="vertical"
                                                onFinish={handleAddNewAddress}
                                            >
                                                <Row gutter={16}>
                                                    <Col span={12}>
                                                        <Form.Item name="name" label="Người nhận" rules={[{ required: true, message: 'Nhập tên' }]}>
                                                            <Input prefix={<UserOutlined />} placeholder="Tên người nhận" />
                                                        </Form.Item>
                                                    </Col>
                                                    <Col span={12}>
                                                        <Form.Item name="phone" label="Số điện thoại" rules={[{ required: true, message: 'Nhập SĐT' }]}>
                                                            <Input prefix={<PhoneOutlined />} placeholder="Số điện thoại" />
                                                        </Form.Item>
                                                    </Col>
                                                    <Col span={24}>
                                                        <Form.Item name="province" label="Tỉnh / Thành phố" rules={[{ required: true, message: 'Chọn tỉnh/thành' }]}>
                                                            <Select
                                                                showSearch
                                                                placeholder={shippingConfigLoading ? 'Đang tải...' : 'Chọn tỉnh/thành phố'}
                                                                loading={shippingConfigLoading}
                                                                options={provinceList.map(p => ({ value: p, label: p }))}
                                                                filterOption={(input, option) =>
                                                                    option.label.toLowerCase().includes(input.toLowerCase())
                                                                }
                                                            />
                                                        </Form.Item>
                                                    </Col>
                                                    <Col span={24}>
                                                        <Form.Item name="detail" label="Địa chỉ chi tiết" rules={[{ required: true, message: 'Nhập địa chỉ' }]}>
                                                            <Input.TextArea rows={2} placeholder="Số nhà, tên đường, phường/xã..." />
                                                        </Form.Item>
                                                    </Col>
                                                </Row>
                                                <Space>
                                                    <Button type="primary" htmlType="submit">Lưu địa chỉ</Button>
                                                    <Button onClick={() => { setIsAddingNew(false); addForm.resetFields(); }}>Hủy</Button>
                                                </Space>
                                            </Form>
                                        </div>
                                    )}

                                    {/* Cảnh báo nếu địa chỉ được chọn không có tỉnh/thành */}
                                    {!isAddingNew && selectedAddressId && !selectedProvince && (
                                        <div style={{
                                            marginTop: 12, padding: '12px 16px',
                                            background: '#fffbe6', border: '1px solid #ffe58f', borderRadius: 8,
                                        }}>
                                            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: '#856404' }}>
                                                ⚠️ Địa chỉ này chưa có tỉnh/thành phố. Vui lòng chọn để tính phí ship:
                                            </div>
                                            <Select
                                                showSearch
                                                style={{ width: '100%' }}
                                                placeholder={shippingConfigLoading ? 'Đang tải danh sách...' : 'Chọn tỉnh/thành phố...'}
                                                loading={shippingConfigLoading}
                                                value={selectedProvince || undefined}
                                                onChange={val => setSelectedProvince(val)}
                                                options={provinceList.map(p => ({ value: p, label: p }))}
                                                filterOption={(input, option) =>
                                                    option.label.toLowerCase().includes(input.toLowerCase())
                                                }
                                            />
                                        </div>
                                    )}
                                </>
                            )}
                        </Card>

                        {/* Phương thức thanh toán */}
                        <Card title={<span><CreditCardOutlined /> Phương thức thanh toán</span>} style={{ marginBottom: 20 }}>
                            <Radio.Group onChange={e => setPaymentMethod(e.target.value)} value={paymentMethod} style={{ width: '100%' }}>
                                <Space direction="vertical" style={{ width: '100%' }}>
                                    <Radio value="cod" style={{ width: '100%', padding: 15, border: '1px solid #d9d9d9', borderRadius: 4 }}>
                                        <Space>
                                            <img src="https://cdn-icons-png.flaticon.com/512/2331/2331941.png" alt="cod" width={24} />
                                            <div>
                                                <Text strong>Thanh toán khi nhận hàng (COD)</Text>
                                                <div style={{ fontSize: 12, color: '#888' }}>Thanh toán bằng tiền mặt khi nhận hàng</div>
                                                <Tag color="warning" style={{ marginTop: 4, fontSize: 11 }}>Chưa thanh toán</Tag>
                                            </div>
                                        </Space>
                                    </Radio>
                                    <Radio value="paypal" style={{ width: '100%', padding: 15, border: '1px solid #d9d9d9', borderRadius: 4 }}>
                                        <Space>
                                            <img src="https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg" alt="paypal" width={60} />
                                            <div>
                                                <Text strong>Thanh toán qua PayPal</Text>
                                                <div style={{ fontSize: 12, color: '#888' }}>Thẻ Visa, MasterCard, hoặc ví PayPal</div>
                                                <Tag color="success" style={{ marginTop: 4, fontSize: 11 }}>Đã thanh toán ngay</Tag>
                                            </div>
                                        </Space>
                                    </Radio>
                                    <Radio value="vnpay" style={{ width: '100%', padding: 15, border: paymentMethod === 'vnpay' ? '2px solid #e30019' : '1px solid #d9d9d9', borderRadius: 4, background: paymentMethod === 'vnpay' ? '#fff5f5' : 'white', transition: 'all 0.3s' }}>
                                        <Space>
                                            <img src="https://cdn.haitrieu.com/wp-content/uploads/2022/10/Icon-VNPAY-QR.png" alt="vnpay" width={40} style={{ objectFit: 'contain' }} />
                                            <div>
                                                <Text strong>Thanh toán qua VNPay</Text>
                                                <div style={{ fontSize: 12, color: '#888' }}>ATM, Visa, MasterCard, QR Code, Ví điện tử</div>
                                                <Tag color="red" style={{ marginTop: 4, fontSize: 11 }}>Thanh toán online an toàn</Tag>
                                            </div>
                                        </Space>
                                    </Radio>
                                </Space>
                            </Radio.Group>
                        </Card>

                        {/* Voucher */}
                        <Card title={<span><GiftOutlined style={{ color: RED }} /> Mã giảm giá</span>} style={{ marginBottom: 20 }}>
                            {!appliedVoucher ? (
                                <div style={{ display: 'flex', gap: 10 }}>
                                    <Input
                                        value={voucherCode}
                                        onChange={e => setVoucherCode(e.target.value.toUpperCase())}
                                        onPressEnter={handleApplyVoucher}
                                        placeholder="Nhập mã voucher..."
                                        prefix={<TagOutlined style={{ color: '#ccc' }} />}
                                        style={{ fontWeight: 600, letterSpacing: 1 }}
                                        maxLength={30}
                                    />
                                    <Button type="primary" onClick={handleApplyVoucher} loading={voucherLoading}
                                        style={{ background: RED, borderColor: RED, fontWeight: 600 }}>
                                        Áp dụng
                                    </Button>
                                </div>
                            ) : (
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                                        <Tag color="success" icon={<CheckCircleOutlined />}
                                            style={{ fontSize: 13, padding: '4px 12px', fontWeight: 700, letterSpacing: 1 }}>
                                            {appliedVoucher.code}
                                        </Tag>
                                        <button onClick={handleRemoveVoucher}
                                            style={{ background: 'none', border: 'none', color: '#999', cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', gap: 4 }}>
                                            <CloseCircleOutlined /> Bỏ mã
                                        </button>
                                    </div>
                                    {appliedVoucher.description && (
                                        <div style={{ fontSize: 13, color: '#666', marginBottom: 8 }}>{appliedVoucher.description}</div>
                                    )}
                                    <div style={{ background: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: 4, padding: '8px 12px', display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ fontSize: 13, color: '#555' }}>
                                            Giảm {appliedVoucher.discountPercent}%
                                            {appliedVoucher.maxDiscount ? ` (tối đa ${appliedVoucher.maxDiscount.toLocaleString('vi-VN')}đ)` : ''}
                                        </span>
                                        <span style={{ fontWeight: 700, color: GREEN, fontSize: 14 }}>
                                            -{appliedVoucher.discountAmount.toLocaleString('vi-VN')}đ
                                        </span>
                                    </div>
                                </div>
                            )}
                        </Card>
                    </Col>

                    {/* ── CỘT PHẢI ── */}
                    <Col xs={24} lg={10}>
                        <Card title="Đơn hàng của bạn" style={{ position: 'sticky', top: 20 }}>
                            <List
                                itemLayout="horizontal"
                                dataSource={cartItems}
                                renderItem={item => (
                                    <List.Item>
                                        <List.Item.Meta
                                            avatar={<img src={item.image} alt="product" style={{ width: 50, height: 50, objectFit: 'cover', borderRadius: 4 }} />}
                                            title={<Text style={{ fontSize: 14 }}>{item.name}</Text>}
                                            description={
                                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                    <span>x{item.quantity}</span>
                                                    <Text strong>{(item.price * item.quantity).toLocaleString('vi-VN')}đ</Text>
                                                </div>
                                            }
                                        />
                                    </List.Item>
                                )}
                            />

                            <Divider style={{ margin: '12px 0' }} />

                            <div style={{ padding: '4px 0' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 14, color: '#555' }}>
                                    <span>Tạm tính ({cartItems.length} sp):</span>
                                    <span>{subtotal.toLocaleString('vi-VN')}đ</span>
                                </div>

                                {discountAmount > 0 && (
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 14, color: GREEN }}>
                                        <span><TagOutlined style={{ marginRight: 5 }} />
                                            Voucher {appliedVoucher?.code ? `(${appliedVoucher.code})` : ''}:
                                        </span>
                                        <span style={{ fontWeight: 700 }}>-{discountAmount.toLocaleString('vi-VN')}đ</span>
                                    </div>
                                )}

                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 14, color: '#555', alignItems: 'center' }}>
                                    <span><CarOutlined style={{ marginRight: 5 }} />Phí giao hàng:</span>
                                    <ShippingBadge />
                                </div>

                                {/* Gợi ý mua thêm để miễn ship */}
                                {selectedProvince && shippingConfig && !shippingInfo.isFree && subtotal > 0 && (
                                    <div style={{
                                        background: '#fff7e6', border: '1px solid #ffd591',
                                        borderRadius: 6, padding: '7px 12px',
                                        fontSize: 12, color: '#d48806', marginBottom: 10,
                                    }}>
                                        🛒 Mua thêm <b>{(shippingConfig.freeShipThreshold - subtotal).toLocaleString('vi-VN')}đ</b> để được miễn phí ship!
                                    </div>
                                )}

                                <Divider style={{ margin: '10px 0' }} />

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                                    <Title level={4} style={{ margin: 0 }}>Tổng cộng:</Title>
                                    <Title level={3} style={{ margin: 0, color: RED }}>
                                        {finalTotal.toLocaleString('vi-VN')}đ
                                    </Title>
                                </div>

                                {/* Tag trạng thái thanh toán */}
                                <div style={{ textAlign: 'right', marginBottom: 8 }}>
                                    {paymentMethod === 'paypal' && (
                                        <Tag color="success" icon={<CheckCircleOutlined />} style={{ fontSize: 12 }}>
                                            Đã thanh toán (PayPal)
                                        </Tag>
                                    )}
                                    {paymentMethod === 'vnpay' && (
                                        <Tag color="red" icon={<CheckCircleOutlined />} style={{ fontSize: 12 }}>
                                            Thanh toán online (VNPay)
                                        </Tag>
                                    )}
                                    {paymentMethod === 'cod' && (
                                        <Tag color="warning" icon={<CloseCircleOutlined />} style={{ fontSize: 12 }}>
                                            Chưa thanh toán (COD)
                                        </Tag>
                                    )}
                                </div>

                                {(discountAmount > 0 || shippingInfo.isFree) && (
                                    <div style={{ textAlign: 'right', fontSize: 12, color: GREEN, marginBottom: 8 }}>
                                        🎉 Tiết kiệm được {(discountAmount + (shippingInfo.isFree ? shippingInfo.originalFee : 0)).toLocaleString('vi-VN')}đ
                                    </div>
                                )}
                            </div>

                            <Button
                                type="primary" block size="large"
                                loading={isProcessing || vnpayLoading}
                                onClick={handlePlaceOrder}
                                disabled={isAddingNew || savedAddresses.length === 0 || !selectedProvince || shippingConfigLoading}
                                style={{
                                    height: 50,
                                    fontWeight: 700, fontSize: 15, marginTop: 8,
                                    ...getButtonStyle(),
                                }}
                            >
                                {getButtonText()}
                            </Button>

                            {/* Bảng phí giao hàng từ config admin */}
                            {shippingConfig && shippingConfig.kmTiers && shippingConfig.kmTiers.length > 0 && (
                                <div style={{ marginTop: 16, background: '#fafafa', borderRadius: 8, padding: '10px 14px', border: '1px solid #f0f0f0' }}>
                                    <div style={{ fontSize: 12, fontWeight: 700, color: '#666', marginBottom: 8 }}>
                                        <CarOutlined /> Bảng phí giao hàng theo khoảng cách:
                                    </div>
                                    {[...shippingConfig.kmTiers]
                                        .sort((a, b) => a.minKm - b.minKm)
                                        .map((tier, idx) => (
                                            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#888', marginBottom: 4 }}>
                                                <span>📍 {tier.label}</span>
                                                <span style={{ fontWeight: 600, color: '#555' }}>{tier.pricePerKm.toLocaleString('vi-VN')}đ/km</span>
                                            </div>
                                        ))
                                    }
                                    <div style={{ fontSize: 11, color: GREEN, marginTop: 6, borderTop: '1px dashed #eee', paddingTop: 6 }}>
                                        ✅ Miễn phí ship cho đơn hàng từ {shippingConfig.freeShipThreshold.toLocaleString('vi-VN')}đ
                                    </div>
                                </div>
                            )}
                        </Card>
                    </Col>
                </Row>
            </div>

            {/* ── MODAL SỬA ĐỊA CHỈ ── */}
            <Modal
                title="Cập nhật địa chỉ"
                open={isEditing}
                onOk={handleUpdateAddress}
                onCancel={() => { setIsEditing(false); setEditingAddress(null); }}
                okText="Lưu thay đổi" cancelText="Hủy"
            >
                <Form form={editForm} layout="vertical">
                    <Form.Item name="name" label="Người nhận" rules={[{ required: true, message: 'Nhập tên' }]}>
                        <Input prefix={<UserOutlined />} />
                    </Form.Item>
                    <Form.Item name="phone" label="Số điện thoại" rules={[{ required: true, message: 'Nhập SĐT' }]}>
                        <Input prefix={<PhoneOutlined />} />
                    </Form.Item>
                    <Form.Item name="province" label="Tỉnh / Thành phố" rules={[{ required: true, message: 'Chọn tỉnh/thành' }]}>
                        <Select
                            showSearch
                            placeholder={shippingConfigLoading ? 'Đang tải...' : 'Chọn tỉnh/thành phố'}
                            loading={shippingConfigLoading}
                            options={provinceList.map(p => ({ value: p, label: p }))}
                            filterOption={(input, option) =>
                                option.label.toLowerCase().includes(input.toLowerCase())
                            }
                        />
                    </Form.Item>
                    <Form.Item name="detail" label="Địa chỉ chi tiết" rules={[{ required: true, message: 'Nhập địa chỉ' }]}>
                        <Input.TextArea rows={2} />
                    </Form.Item>
                </Form>
            </Modal>

            {/* ── MODAL PAYPAL ── */}
            <Modal
                title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <img src="https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg" alt="paypal" width={70} />
                        <span style={{ fontSize: 15, fontWeight: 600 }}>Thanh toán PayPal</span>
                    </div>
                }
                open={paypalModalOpen}
                onCancel={() => { if (paypalStep !== 'processing') setPaypalModalOpen(false); }}
                closable={paypalStep !== 'processing'}
                maskClosable={false}
                footer={null}
                width={460}
            >
                {paypalStep === 'form' && (
                    <div>
                        <div style={{
                            background: '#f0f7ff', border: '1px solid #bbd6f8',
                            borderRadius: 8, padding: '12px 16px', marginBottom: 20,
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        }}>
                            <span style={{ color: '#555', fontSize: 14 }}>Số tiền thanh toán:</span>
                            <span style={{ fontWeight: 700, fontSize: 18, color: '#003087' }}>
                                {finalTotal.toLocaleString('vi-VN')}đ
                            </span>
                        </div>

                        <Form form={paypalForm} layout="vertical">
                            <Form.Item name="email" label="Email PayPal"
                                rules={[{ required: true, message: 'Nhập email PayPal!' }, { type: 'email', message: 'Email không hợp lệ!' }]}>
                                <Input prefix={<span style={{ color: '#003087', fontSize: 14 }}>@</span>}
                                    placeholder="example@email.com" size="large" />
                            </Form.Item>
                            <Form.Item name="cardNumber" label="Số thẻ"
                                rules={[{ required: true, message: 'Nhập số thẻ!' },
                                { validator: (_, v) => !v || /^\d{16}$/.test(v) ? Promise.resolve() : Promise.reject('Số thẻ gồm 16 chữ số!') }]}>
                                <Input placeholder="1234 5678 9012 3456" maxLength={16} size="large"
                                    prefix={<CreditCardOutlined style={{ color: '#003087' }} />}
                                    onChange={e => paypalForm.setFieldValue('cardNumber', e.target.value.replace(/\D/g, ''))} />
                            </Form.Item>

                            <Row gutter={12}>
                                <Col span={12}>
                                    <Form.Item name="expiry" label="Ngày hết hạn"
                                        rules={[{ required: true, message: 'Nhập ngày hết hạn!' },
                                        { validator: (_, v) => !v || /^(0[1-9]|1[0-2])\/\d{2}$/.test(v) ? Promise.resolve() : Promise.reject('Định dạng MM/YY') }]}>
                                        <Input placeholder="MM/YY" maxLength={5} size="large"
                                            onChange={e => {
                                                let d = e.target.value.replace(/[^\d]/g, '');
                                                paypalForm.setFieldValue('expiry', d.length >= 3 ? d.slice(0, 2) + '/' + d.slice(2, 4) : d);
                                            }} />
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item name="cvv" label="CVV"
                                        rules={[{ required: true, message: 'Nhập CVV!' },
                                        { validator: (_, v) => !v || /^\d{3,4}$/.test(v) ? Promise.resolve() : Promise.reject('CVV gồm 3-4 số!') }]}>
                                        <Input.Password placeholder="•••" maxLength={4} size="large"
                                            onChange={e => paypalForm.setFieldValue('cvv', e.target.value.replace(/\D/g, ''))} />
                                    </Form.Item>
                                </Col>
                            </Row>

                            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                                {['Visa', 'MC', 'Amex'].map(card => (
                                    <div key={card} style={{ border: '1px solid #e8e8e8', borderRadius: 4, padding: '3px 10px', fontSize: 11, color: '#888', background: '#fafafa' }}>{card}</div>
                                ))}
                            </div>

                            <Button type="primary" block size="large" onClick={handlePaypalConfirm}
                                style={{ background: '#003087', borderColor: '#003087', fontWeight: 700, height: 48 }}>
                                Thanh toán {finalTotal.toLocaleString('vi-VN')}đ
                            </Button>
                            <Button block size="large" style={{ marginTop: 8 }} onClick={() => setPaypalModalOpen(false)}>Hủy</Button>
                        </Form>

                        <div style={{ textAlign: 'center', marginTop: 12, fontSize: 11, color: '#aaa' }}>
                            🔒 Thông tin được mã hóa SSL 256-bit
                        </div>
                    </div>
                )}

                {paypalStep === 'processing' && (
                    <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                        <div style={{
                            width: 56, height: 56, borderRadius: '50%',
                            border: '4px solid #e8e8e8', borderTopColor: '#003087',
                            animation: 'spin 0.8s linear infinite', margin: '0 auto 20px',
                        }} />
                        <div style={{ fontSize: 16, fontWeight: 600, color: '#003087', marginBottom: 8 }}>Đang xử lý thanh toán...</div>
                        <div style={{ fontSize: 13, color: '#888' }}>Vui lòng không tắt trang này</div>
                        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                    </div>
                )}

                {paypalStep === 'success' && (
                    <div style={{ textAlign: 'center', padding: '30px 20px' }}>
                        <div style={{
                            width: 64, height: 64, borderRadius: '50%',
                            background: '#f6ffed', border: '2px solid #52c41a',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
                        }}>
                            <CheckCircleOutlined style={{ fontSize: 32, color: '#52c41a' }} />
                        </div>
                        <div style={{ fontSize: 18, fontWeight: 700, color: '#333', marginBottom: 6 }}>Thanh toán thành công!</div>
                        <div style={{ fontSize: 14, color: '#888', marginBottom: 4 }}>
                            Số tiền: <b style={{ color: '#003087' }}>{finalTotal.toLocaleString('vi-VN')}đ</b>
                        </div>
                        <div style={{ fontSize: 13, color: '#aaa', marginBottom: 24 }}>
                            Mã giao dịch: <b>PP{Date.now().toString().slice(-10).toUpperCase()}</b>
                        </div>
                        <Button type="primary" block size="large" onClick={handlePaypalSuccess} loading={isProcessing}
                            style={{ background: '#003087', borderColor: '#003087', fontWeight: 700, height: 48 }}>
                            Xác nhận & Hoàn tất đặt hàng
                        </Button>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default Checkout;