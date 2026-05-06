import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Result, Button, Spin, Card, Descriptions, Tag } from 'antd';
import {
    CheckCircleOutlined,
    CloseCircleOutlined,
    ShoppingOutlined,
    HomeOutlined,
    ReloadOutlined,
} from '@ant-design/icons';
import axios from 'axios';

const VNPayReturn = () => {
    const [searchParams] = useSearchParams();
    const navigate       = useNavigate();

    const [loading, setLoading]   = useState(true);
    const [status, setStatus]     = useState('');
    const [orderInfo, setOrderInfo] = useState(null);
    const [error, setError]       = useState('');

    useEffect(() => {
        const handleReturn = async () => {
            const s         = searchParams.get('status');
            const orderId   = searchParams.get('orderId');
            const amount    = searchParams.get('amount');
            const txnNo     = searchParams.get('transactionNo');
            const code      = searchParams.get('code');

            setStatus(s);

            if (s === 'success') {
                const pendingOrder = JSON.parse(
                    localStorage.getItem('pendingVNPayOrder') || 'null'
                );

                if (pendingOrder) {
                    try {
                        const res = await axios.post(
                            'http://localhost:5000/api/orders/checkout',
                            {
                                ...pendingOrder,
                                isPaid:        true,
                                paymentMethod: 'VNPay',
                                transactionNo: txnNo,
                            }
                        );

                        const savedOrder = res.data.order;

                        // Dùng voucher nếu có
                        if (pendingOrder.voucherCode) {
                            try {
                                await axios.post(
                                    `http://localhost:5000/api/vouchers/confirm-use/${pendingOrder.voucherCode}`
                                );
                            } catch {}
                        }

                        const newOrderLocal = {
                            ...pendingOrder,
                            id:            savedOrder._id,
                            orderId:       savedOrder._id.slice(-8).toUpperCase(),
                            isPaid:        true,
                            paymentMethod: 'VNPay',
                            transactionNo: txnNo,
                            orderDate:     new Date().toLocaleString('vi-VN'),
                            status:        'pending',
                        };

                        const history = JSON.parse(localStorage.getItem('orderHistory') || '[]');
                        history.unshift(newOrderLocal);
                        localStorage.setItem('orderHistory', JSON.stringify(history));

                        setOrderInfo({
                            orderId:       newOrderLocal.orderId,
                            amount:        Number(amount),
                            transactionNo: txnNo,
                            paymentMethod: 'VNPay',
                            orderDate:     newOrderLocal.orderDate,
                            customerName:  pendingOrder.customerName,
                            address:       pendingOrder.address,
                            province:      pendingOrder.province,
                        });

                        // Dọn dẹp
                        localStorage.removeItem('cart');
                        localStorage.removeItem('appliedVoucher');
                        localStorage.removeItem('pendingVNPayOrder');
                        window.dispatchEvent(new Event('cartChange'));
                        window.dispatchEvent(new Event('orderChange'));

                    } catch (err) {
                        console.error('Lỗi tạo đơn hàng:', err);
                        setError('Thanh toán thành công nhưng có lỗi khi lưu đơn hàng. Vui lòng liên hệ hỗ trợ.');
                    }
                } else {
                    // pendingOrder không còn (đã xử lý rồi hoặc hết hạn)
                    setOrderInfo({
                        orderId:       orderId,
                        amount:        Number(amount),
                        transactionNo: txnNo,
                        paymentMethod: 'VNPay',
                        orderDate:     new Date().toLocaleString('vi-VN'),
                    });
                }
            } else {
                // Lấy mã lỗi để hiển thị
                const errorMessages = {
                    '07': 'Trừ tiền thành công nhưng giao dịch bị nghi ngờ gian lận.',
                    '09': 'Thẻ/Tài khoản chưa đăng ký dịch vụ InternetBanking.',
                    '10': 'Xác thực thông tin thẻ/tài khoản quá 3 lần.',
                    '11': 'Đã hết hạn chờ thanh toán.',
                    '12': 'Thẻ/Tài khoản bị khóa.',
                    '13': 'OTP không đúng. Vui lòng thử lại.',
                    '24': 'Giao dịch bị hủy.',
                    '51': 'Tài khoản không đủ số dư.',
                    '65': 'Tài khoản đã vượt hạn mức giao dịch trong ngày.',
                    '75': 'Ngân hàng đang bảo trì.',
                    '79': 'Nhập sai mật khẩu thanh toán quá số lần quy định.',
                    '99': 'Lỗi không xác định.',
                };
                setError(errorMessages[code] || `Giao dịch thất bại (Mã lỗi: ${code || 'N/A'})`);
            }

            setLoading(false);
        };

        handleReturn();
    }, [searchParams]);

    if (loading) return (
        <div style={{
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            minHeight: '60vh', gap: 16,
        }}>
            <Spin size="large" />
            <div style={{ color: '#888', fontSize: 15 }}>Đang xác nhận thanh toán VNPay...</div>
        </div>
    );

    if (status === 'success') return (
        <div style={{ padding: '40px 20px', maxWidth: 600, margin: '0 auto' }}>
            {/* Header success */}
            <div style={{ textAlign: 'center', marginBottom: 28 }}>
                <div style={{
                    width: 72, height: 72, borderRadius: '50%',
                    background: '#f6ffed', border: '2px solid #52c41a',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 16px',
                }}>
                    <CheckCircleOutlined style={{ fontSize: 38, color: '#52c41a' }} />
                </div>
                <div style={{ fontSize: 22, fontWeight: 700, color: '#333' }}>
                    Thanh toán thành công! 🎉
                </div>
                <div style={{ color: '#888', marginTop: 6, fontSize: 14 }}>
                    Đơn hàng của bạn đã được xác nhận và đang chờ xử lý.
                </div>
            </div>

            {/* Thông tin giao dịch */}
            {orderInfo && (
                <Card
                    style={{ borderRadius: 12, marginBottom: 20, boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }}
                    bodyStyle={{ padding: '20px 24px' }}
                >
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#888', marginBottom: 14, letterSpacing: 1 }}>
                        THÔNG TIN GIAO DỊCH
                    </div>
                    <Descriptions column={1} size="small" labelStyle={{ color: '#888', width: 160 }} contentStyle={{ fontWeight: 600 }}>
                        <Descriptions.Item label="Mã đơn hàng">
                            <Tag color="blue" style={{ fontWeight: 700, fontSize: 13 }}>
                                #{orderInfo.orderId}
                            </Tag>
                        </Descriptions.Item>
                        <Descriptions.Item label="Mã giao dịch VNPay">
                            <span style={{ fontFamily: 'monospace', color: '#555' }}>
                                {orderInfo.transactionNo || '—'}
                            </span>
                        </Descriptions.Item>
                        <Descriptions.Item label="Số tiền thanh toán">
                            <span style={{ color: '#c8232c', fontWeight: 700, fontSize: 15 }}>
                                {Number(orderInfo.amount).toLocaleString('vi-VN')}đ
                            </span>
                        </Descriptions.Item>
                        <Descriptions.Item label="Phương thức">
                            <Tag color="red">VNPay</Tag>
                        </Descriptions.Item>
                        <Descriptions.Item label="Thời gian">
                            {orderInfo.orderDate}
                        </Descriptions.Item>
                        {orderInfo.customerName && (
                            <Descriptions.Item label="Người nhận">
                                {orderInfo.customerName}
                            </Descriptions.Item>
                        )}
                        {orderInfo.address && (
                            <Descriptions.Item label="Địa chỉ">
                                {orderInfo.address}{orderInfo.province ? `, ${orderInfo.province}` : ''}
                            </Descriptions.Item>
                        )}
                        <Descriptions.Item label="Trạng thái đơn">
                            <Tag color="warning">Chờ xác nhận</Tag>
                        </Descriptions.Item>
                    </Descriptions>
                </Card>
            )}

            {error && (
                <div style={{
                    background: '#fff7e6', border: '1px solid #ffd591',
                    borderRadius: 8, padding: '12px 16px', marginBottom: 20,
                    fontSize: 13, color: '#d48806',
                }}>
                    ⚠️ {error}
                </div>
            )}

            {/* Buttons */}
            <div style={{ display: 'flex', gap: 12, flexDirection: 'column' }}>
                <Button
                    type="primary" size="large" block
                    icon={<ShoppingOutlined />}
                    onClick={() => navigate('/my-orders')}
                    style={{ height: 48, fontWeight: 700, background: '#c8232c', borderColor: '#c8232c' }}
                >
                    Xem đơn hàng của tôi
                </Button>
                <Button
                    size="large" block
                    icon={<HomeOutlined />}
                    onClick={() => navigate('/')}
                    style={{ height: 44 }}
                >
                    Về trang chủ
                </Button>
            </div>
        </div>
    );

    // Thất bại
    return (
        <div style={{ padding: '40px 20px', maxWidth: 520, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 28 }}>
                <div style={{
                    width: 72, height: 72, borderRadius: '50%',
                    background: '#fff2f0', border: '2px solid #ff4d4f',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 16px',
                }}>
                    <CloseCircleOutlined style={{ fontSize: 38, color: '#ff4d4f' }} />
                </div>
                <div style={{ fontSize: 22, fontWeight: 700, color: '#333' }}>
                    Thanh toán thất bại!
                </div>
                <div style={{
                    color: '#ff4d4f', marginTop: 10, fontSize: 14,
                    background: '#fff2f0', border: '1px solid #ffccc7',
                    borderRadius: 8, padding: '10px 16px', display: 'inline-block',
                }}>
                    {error || 'Giao dịch VNPay không thành công. Vui lòng thử lại.'}
                </div>
            </div>

            <div style={{ display: 'flex', gap: 12, flexDirection: 'column' }}>
                <Button
                    type="primary" size="large" block
                    icon={<ReloadOutlined />}
                    onClick={() => navigate('/checkout')}
                    style={{ height: 48, fontWeight: 700, background: '#c8232c', borderColor: '#c8232c' }}
                >
                    Thử lại thanh toán
                </Button>
                <Button
                    size="large" block
                    icon={<HomeOutlined />}
                    onClick={() => navigate('/')}
                    style={{ height: 44 }}
                >
                    Về trang chủ
                </Button>
            </div>
        </div>
    );
};

export default VNPayReturn;