import React, { useState } from 'react';
import { Input, Button, message, Tag, Spin } from 'antd';
import {
    TagOutlined, CheckCircleOutlined,
    CloseCircleOutlined, GiftOutlined
} from '@ant-design/icons';
import axios from 'axios';

const RED = '#c8232c';
const GREEN = '#52c41a';

/**
 * VoucherInput — dùng trong trang giỏ hàng / checkout
 *
 * Props:
 *   cartItems   : [{ category, price, quantity }]  — danh sách sản phẩm trong giỏ
 *   orderTotal  : number                            — tổng tiền trước giảm
 *   onApply     : ({ discountAmount, finalTotal, voucher }) => void
 *   onRemove    : () => void
 */
const VoucherInput = ({ cartItems = [], orderTotal = 0, onApply, onRemove }) => {
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [applied, setApplied] = useState(null); // { discountAmount, finalTotal, voucher }

    const handleApply = async () => {
        const trimmed = code.trim().toUpperCase();
        if (!trimmed) return message.warning('Vui lòng nhập mã voucher!');

        setLoading(true);
        try {
            const res = await axios.post('/api/vouchers/apply', {
                code: trimmed,
                cartItems,
                orderTotal,
            });

            setApplied(res.data);
            onApply && onApply(res.data);
            message.success(`Áp dụng thành công! Giảm ${res.data.discountAmount.toLocaleString('vi-VN')}đ`);
        } catch (err) {
            message.error(err.response?.data?.message || 'Mã voucher không hợp lệ!');
            setApplied(null);
        } finally {
            setLoading(false);
        }
    };

    const handleRemove = () => {
        setCode('');
        setApplied(null);
        onRemove && onRemove();
        message.info('Đã bỏ voucher');
    };

    return (
        <div style={{
            border: '1px dashed #fbb',
            borderRadius: 6,
            padding: '14px 16px',
            background: '#fff9f9',
            marginBottom: 16,
        }}>
            {/* Label */}
            <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                marginBottom: 12, fontWeight: 700, fontSize: 14, color: '#333',
            }}>
                <GiftOutlined style={{ color: RED, fontSize: 18 }} />
                Mã giảm giá
            </div>

            {!applied ? (
                /* ── Chưa áp dụng: ô nhập mã ── */
                <div style={{ display: 'flex', gap: 8 }}>
                    <Input
                        value={code}
                        onChange={e => setCode(e.target.value.toUpperCase())}
                        onPressEnter={handleApply}
                        placeholder="Nhập mã voucher..."
                        prefix={<TagOutlined style={{ color: '#bbb' }} />}
                        style={{
                            flex: 1, fontWeight: 600, letterSpacing: 1,
                            textTransform: 'uppercase',
                        }}
                        disabled={loading}
                        maxLength={30}
                    />
                    <Button
                        type="primary"
                        onClick={handleApply}
                        loading={loading}
                        style={{ background: RED, borderColor: RED, fontWeight: 600 }}
                    >
                        Áp dụng
                    </Button>
                </div>
            ) : (
                /* ── Đã áp dụng: hiển thị kết quả ── */
                <div>
                    {/* Badge mã voucher */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                        <Tag
                            color="success"
                            icon={<CheckCircleOutlined />}
                            style={{ fontSize: 13, padding: '3px 10px', fontWeight: 700, letterSpacing: 1 }}
                        >
                            {applied.voucher.code}
                        </Tag>
                        <button
                            onClick={handleRemove}
                            style={{
                                background: 'none', border: 'none', color: '#999',
                                cursor: 'pointer', fontSize: 13, display: 'flex',
                                alignItems: 'center', gap: 4,
                            }}
                        >
                            <CloseCircleOutlined /> Bỏ mã
                        </button>
                    </div>

                    {/* Mô tả */}
                    {applied.voucher.description && (
                        <div style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>
                            {applied.voucher.description}
                        </div>
                    )}

                    {/* Danh mục áp dụng */}
                    {applied.voucher.applicableCategories?.length > 0 && (
                        <div style={{ fontSize: 12, color: '#888', marginBottom: 8 }}>
                            Áp dụng cho:{' '}
                            {applied.voucher.applicableCategories.map(c => (
                                <Tag key={c} color="geekblue" style={{ fontSize: 11 }}>{c}</Tag>
                            ))}
                        </div>
                    )}

                    {/* Số tiền giảm */}
                    <div style={{
                        background: '#f6ffed',
                        border: '1px solid #b7eb8f',
                        borderRadius: 4,
                        padding: '8px 12px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                    }}>
                        <span style={{ fontSize: 13, color: '#555' }}>
                            Giảm {applied.voucher.discountPercent}%
                            {applied.voucher.maxDiscount && ` (tối đa ${applied.voucher.maxDiscount.toLocaleString('vi-VN')}đ)`}
                        </span>
                        <span style={{ fontWeight: 700, color: GREEN, fontSize: 15 }}>
                            -{applied.discountAmount.toLocaleString('vi-VN')}đ
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VoucherInput;

// ═══════════════════════════════════════════════════════════════
// CÁCH DÙNG TRONG TRANG GIỎ HÀNG:
//
//  const [discount, setDiscount] = useState(0);
//  const [voucherCode, setVoucherCode] = useState('');
//
//  const handleVoucherApply = ({ discountAmount, voucher }) => {
//      setDiscount(discountAmount);
//      setVoucherCode(voucher.code);
//  };
//
//  const handleVoucherRemove = () => {
//      setDiscount(0);
//      setVoucherCode('');
//  };
//
//  // Trong JSX:
//  <VoucherInput
//      cartItems={cartItems}
//      orderTotal={subtotal}
//      onApply={handleVoucherApply}
//      onRemove={handleVoucherRemove}
//  />
//
//  // Khi đặt hàng thành công, gọi:
//  await axios.post(`/api/vouchers/confirm-use/${voucherCode}`);
// ═══════════════════════════════════════════════════════════════