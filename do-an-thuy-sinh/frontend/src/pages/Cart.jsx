import React, { useState, useEffect, useCallback } from 'react';
import { Card, Table, Button, InputNumber, message, Empty, Input, Tag, Select } from 'antd';
import {
    DeleteOutlined, ArrowRightOutlined, HistoryOutlined,
    TagOutlined, GiftOutlined, CheckCircleOutlined,
    CloseCircleOutlined, CarOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
    calcShippingFee, PROVINCE_LIST,
    FREE_SHIP_THRESHOLD, SHIPPING_ZONES
} from '../utils/shippingFee';

const RED   = '#c8232c';
const GREEN = '#52c41a';

const Cart = ({ onCartUpdate }) => {
    const [cartItems, setCartItems]   = useState([]);
    const navigate = useNavigate();

    // ── Voucher ──
    const [voucherCode, setVoucherCode]         = useState('');
    const [voucherLoading, setVoucherLoading]   = useState(false);
    const [appliedVoucher, setAppliedVoucher]   = useState(null);

    // ── Shipping preview ──
    const [previewProvince, setPreviewProvince] = useState('');

    const loadCart = useCallback(() => {
        const cart = JSON.parse(localStorage.getItem('cart') || '[]');
        setCartItems(cart);
        if (onCartUpdate) onCartUpdate(cart.reduce((s, i) => s + i.quantity, 0));
    }, [onCartUpdate]);

    useEffect(() => {
        loadCart();
        const saved = localStorage.getItem('appliedVoucher');
        if (saved) { try { setAppliedVoucher(JSON.parse(saved)); } catch {} }
        window.addEventListener('cartChange', loadCart);
        return () => window.removeEventListener('cartChange', loadCart);
    }, [loadCart]);

    const updateQuantity = (id, quantity) => {
        if (quantity <= 0) return;
        const updated = cartItems.map(i => i._id === id ? { ...i, quantity } : i);
        setCartItems(updated);
        localStorage.setItem('cart', JSON.stringify(updated));
        window.dispatchEvent(new Event('cartChange'));
        handleRemoveVoucher();
    };

    const removeItem = (id) => {
        const updated = cartItems.filter(i => i._id !== id);
        setCartItems(updated);
        localStorage.setItem('cart', JSON.stringify(updated));
        message.success('Đã xóa sản phẩm!');
        window.dispatchEvent(new Event('cartChange'));
        handleRemoveVoucher();
    };

    // ── Tính tiền ──
    const subtotal       = cartItems.reduce((s, i) => s + i.price * i.quantity, 0);
    const discountAmount = appliedVoucher?.discountAmount || 0;
    const shippingInfo   = calcShippingFee(previewProvince, subtotal);
    const shippingFee    = shippingInfo.fee;
    const finalTotal     = subtotal - discountAmount + shippingFee;

    // ── Voucher ──
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

    const handleCheckout = () => {
        localStorage.setItem('checkoutSummary', JSON.stringify({
            subtotal, discountAmount, shippingFee, finalTotal,
            voucherCode: appliedVoucher?.code || null,
            province: previewProvince,
        }));
        navigate('/checkout');
    };

    const cartColumns = [
        {
            title: 'Sản phẩm', dataIndex: 'name', key: 'name',
            render: (text, record) => (
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <img src={record.image} alt={text} style={{ width: 50, height: 50, marginRight: 10, objectFit: 'cover', borderRadius: 4 }} />
                    <span style={{ fontWeight: 500 }}>{text}</span>
                </div>
            ),
        },
        {
            title: 'Đơn giá', dataIndex: 'price',
            render: price => <span style={{ color: RED, fontWeight: 600 }}>{price.toLocaleString()}đ</span>,
        },
        {
            title: 'Số lượng', dataIndex: 'quantity',
            render: (qty, record) => (
                <InputNumber min={1} value={qty} onChange={val => updateQuantity(record._id, val)} />
            ),
        },
        {
            title: 'Thành tiền',
            render: (_, rec) => <span style={{ color: RED, fontWeight: 700 }}>{(rec.price * rec.quantity).toLocaleString()}đ</span>,
        },
        {
            title: 'Xóa', key: 'action',
            render: (_, rec) => <Button danger icon={<DeleteOutlined />} onClick={() => removeItem(rec._id)} />,
        },
    ];

    return (
        <div style={{ padding: '30px', background: '#f0f2f5', minHeight: '100vh' }}>
            <Card
                title="🛒 Giỏ hàng của bạn"
                style={{ maxWidth: 1200, margin: 'auto' }}
                extra={
                    <Button icon={<HistoryOutlined />} onClick={() => navigate('/my-orders')}>
                        Lịch sử đơn hàng
                    </Button>
                }
            >
                {cartItems.length === 0 ? (
                    <Empty description="Giỏ hàng trống">
                        <Button type="primary" onClick={() => navigate('/products')}>Mua sắm ngay</Button>
                    </Empty>
                ) : (
                    <>
                        <Table dataSource={cartItems} columns={cartColumns} rowKey="_id" pagination={false} />

                        <div style={{ marginTop: 24, display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'flex-end' }}>

                            {/* ── Voucher box ── */}
                            <div style={{ flex: '1 1 320px', maxWidth: 400, border: '1.5px dashed #ffb3b3', borderRadius: 8, padding: '14px 16px', background: '#fff9f9' }}>
                                <div style={{ fontWeight: 700, fontSize: 14, color: '#333', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 7 }}>
                                    <GiftOutlined style={{ color: RED, fontSize: 17 }} /> Mã giảm giá
                                </div>
                                {!appliedVoucher ? (
                                    <div style={{ display: 'flex', gap: 8 }}>
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
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                                            <Tag color="success" icon={<CheckCircleOutlined />}
                                                style={{ fontSize: 13, padding: '3px 10px', fontWeight: 700, letterSpacing: 1 }}>
                                                {appliedVoucher.code}
                                            </Tag>
                                            <button onClick={handleRemoveVoucher}
                                                style={{ background: 'none', border: 'none', color: '#999', cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                                                <CloseCircleOutlined /> Bỏ mã
                                            </button>
                                        </div>
                                        {appliedVoucher.description && (
                                            <div style={{ fontSize: 12, color: '#777', marginBottom: 6 }}>{appliedVoucher.description}</div>
                                        )}
                                        <div style={{ background: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: 4, padding: '7px 12px', display: 'flex', justifyContent: 'space-between' }}>
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
                            </div>

                            {/* ── Tổng tiền box ── */}
                            <div style={{ minWidth: 300, background: '#fff', border: '1px solid #eee', borderRadius: 8, padding: '16px 20px' }}>

                                {/* Tạm tính */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 14, color: '#555' }}>
                                    <span>Tạm tính ({cartItems.length} sản phẩm):</span>
                                    <span>{subtotal.toLocaleString('vi-VN')}đ</span>
                                </div>

                                {/* Giảm giá */}
                                {discountAmount > 0 && (
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 14, color: GREEN }}>
                                        <span>Giảm giá voucher:</span>
                                        <span style={{ fontWeight: 700 }}>-{discountAmount.toLocaleString('vi-VN')}đ</span>
                                    </div>
                                )}

                                {/* ── Phí ship preview ── */}
                                <div style={{ borderTop: '1px dashed #eee', margin: '10px 0 12px', paddingTop: 12 }}>
                                    <div style={{ fontWeight: 600, fontSize: 13, color: '#555', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <CarOutlined /> Dự tính phí ship:
                                    </div>
                                    <Select
                                        showSearch
                                        style={{ width: '100%', marginBottom: 8 }}
                                        placeholder="Chọn tỉnh/thành phố..."
                                        value={previewProvince || undefined}
                                        onChange={val => setPreviewProvince(val)}
                                        options={PROVINCE_LIST.map(p => ({ value: p, label: p }))}
                                        filterOption={(input, option) =>
                                            option.label.toLowerCase().includes(input.toLowerCase())
                                        }
                                        size="small"
                                    />

                                    {previewProvince ? (
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, alignItems: 'center' }}>
                                            <span style={{ color: '#555' }}>Phí giao hàng:</span>
                                            {shippingInfo.isFree ? (
                                                <Tag color="success" icon={<CheckCircleOutlined />}>MIỄN PHÍ 🎉</Tag>
                                            ) : (
                                                <span style={{ fontWeight: 700, color: RED }}>
                                                    {shippingFee.toLocaleString('vi-VN')}đ
                                                    <span style={{ fontSize: 11, color: '#999', fontWeight: 400, marginLeft: 4 }}>
                                                        ({shippingInfo.zoneLabel})
                                                    </span>
                                                </span>
                                            )}
                                        </div>
                                    ) : (
                                        <div style={{ fontSize: 12, color: '#aaa' }}>Chọn tỉnh/thành để xem phí ship</div>
                                    )}

                                    {/* Gợi ý miễn ship */}
                                    {previewProvince && !shippingInfo.isFree && (
                                        <div style={{ marginTop: 8, fontSize: 12, color: '#d48806', background: '#fffbe6', borderRadius: 6, padding: '5px 10px', border: '1px solid #ffe58f' }}>
                                            🛒 Mua thêm <b>{(FREE_SHIP_THRESHOLD - subtotal).toLocaleString('vi-VN')}đ</b> để miễn phí ship!
                                        </div>
                                    )}

                                    {/* Bảng phí tham khảo */}
                                    <div style={{ marginTop: 10, padding: '8px 10px', background: '#fafafa', borderRadius: 6, border: '1px solid #f0f0f0' }}>
                                        {Object.entries(SHIPPING_ZONES).map(([zone, info]) => (
                                            <div key={zone} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#999', marginBottom: 3 }}>
                                                <span>📍 {info.label}</span>
                                                <span style={{ fontWeight: 600 }}>{info.fee.toLocaleString('vi-VN')}đ</span>
                                            </div>
                                        ))}
                                        <div style={{ fontSize: 11, color: GREEN, marginTop: 4, borderTop: '1px dashed #eee', paddingTop: 4 }}>
                                            ✅ Miễn ship đơn từ {FREE_SHIP_THRESHOLD.toLocaleString('vi-VN')}đ
                                        </div>
                                    </div>
                                </div>

                                <div style={{ borderTop: '1px dashed #eee', margin: '4px 0 10px' }} />

                                {/* Tổng cuối */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontWeight: 700, fontSize: 15 }}>Tổng cộng:</span>
                                    <span style={{ fontWeight: 700, fontSize: 20, color: RED }}>
                                        {finalTotal.toLocaleString('vi-VN')}đ
                                    </span>
                                </div>
                                {previewProvince && <div style={{ fontSize: 11, color: '#aaa', textAlign: 'right', marginTop: 2 }}>(đã bao gồm phí ship)</div>}

                                {discountAmount > 0 && (
                                    <div style={{ marginTop: 6, textAlign: 'right', fontSize: 12, color: GREEN }}>
                                        🎉 Tiết kiệm được {discountAmount.toLocaleString('vi-VN')}đ
                                    </div>
                                )}

                                <Button
                                    type="primary" size="large" block
                                    style={{ background: RED, borderColor: RED, fontWeight: 700, fontSize: 15, marginTop: 16, height: 48 }}
                                    icon={<ArrowRightOutlined />}
                                    onClick={handleCheckout}
                                >
                                    Tiến hành thanh toán
                                </Button>
                            </div>
                        </div>
                    </>
                )}
            </Card>
        </div>
    );
};

export default Cart;