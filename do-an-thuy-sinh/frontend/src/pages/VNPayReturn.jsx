import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Result, Button, Spin } from 'antd';
import axios from 'axios';

const VNPayReturn = () => {
    const [searchParams]      = useSearchParams();
    const navigate            = useNavigate();
    const [loading, setLoading] = useState(true);
    const [status, setStatus]   = useState('');

    useEffect(() => {
        const handleReturn = async () => {
            const s         = searchParams.get('status');
            const orderId   = searchParams.get('orderId');
            const amount    = searchParams.get('amount');
            const txnNo     = searchParams.get('transactionNo');

            setStatus(s);

            if (s === 'success') {
                // Lấy orderData đã lưu tạm trước khi redirect
                const pendingOrder = JSON.parse(
                    localStorage.getItem('pendingVNPayOrder') || 'null'
                );

                if (pendingOrder) {
                    try {
                        // Tạo đơn hàng thật sau khi VNPay xác nhận thành công
                        const res = await axios.post(
                            'http://localhost:5000/api/orders/checkout',
                            { ...pendingOrder, isPaid: true, paymentMethod: 'VNPay', transactionNo: txnNo }
                        );

                        // Lưu lịch sử đơn hàng
                        const history = JSON.parse(localStorage.getItem('orderHistory') || '[]');
                        history.unshift({
                            ...pendingOrder,
                            id:            res.data.order._id,
                            orderId:       res.data.order._id.slice(-8).toUpperCase(),
                            isPaid:        true,
                            paymentMethod: 'VNPay',
                            transactionNo: txnNo,
                            orderDate:     new Date().toLocaleString('vi-VN'),
                            status:        'pending',
                        });
                        localStorage.setItem('orderHistory', JSON.stringify(history));

                        // Dọn dẹp
                        localStorage.removeItem('cart');
                        localStorage.removeItem('appliedVoucher');
                        localStorage.removeItem('pendingVNPayOrder');
                        window.dispatchEvent(new Event('cartChange'));
                    } catch (err) {
                        console.error('Lỗi tạo đơn hàng:', err);
                    }
                }
            }

            setLoading(false);
        };

        handleReturn();
    }, [searchParams]);

    if (loading) return (
        <div style={{ textAlign: 'center', padding: 80 }}>
            <Spin size="large" />
            <div style={{ marginTop: 16, color: '#888' }}>Đang xác nhận thanh toán...</div>
        </div>
    );

    return (
        <div style={{ padding: '60px 20px', textAlign: 'center' }}>
            {status === 'success' ? (
                <Result
                    status="success"
                    title="Thanh toán VNPay thành công! 🎉"
                    subTitle="Đơn hàng của bạn đã được xác nhận và đang chờ xử lý."
                    extra={[
                        <Button type="primary" key="orders" onClick={() => navigate('/my-orders')}>
                            Xem đơn hàng
                        </Button>,
                        <Button key="home" onClick={() => navigate('/')}>
                            Về trang chủ
                        </Button>,
                    ]}
                />
            ) : (
                <Result
                    status="error"
                    title="Thanh toán thất bại!"
                    subTitle="Giao dịch VNPay không thành công. Vui lòng thử lại."
                    extra={[
                        <Button type="primary" key="retry" onClick={() => navigate('/checkout')}>
                            Thử lại
                        </Button>,
                        <Button key="home" onClick={() => navigate('/')}>
                            Về trang chủ
                        </Button>,
                    ]}
                />
            )}
        </div>
    );
};

export default VNPayReturn;