import React, { useState, useEffect, useCallback } from 'react';
import { Card, Table, Button, InputNumber, message, Empty } from 'antd';
import { DeleteOutlined, ArrowRightOutlined, HistoryOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const Cart = ({ onCartUpdate }) => {
    const [cartItems, setCartItems] = useState([]);
    const navigate = useNavigate();

    const loadCart = useCallback(() => {
        const cart = JSON.parse(localStorage.getItem('cart') || '[]');
        setCartItems(cart);
        if (onCartUpdate) {
            const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
            onCartUpdate(totalItems);
        }
    }, [onCartUpdate]);

    useEffect(() => {
        loadCart();
        const handleCartChange = () => loadCart();
        window.addEventListener('cartChange', handleCartChange);
        return () => window.removeEventListener('cartChange', handleCartChange);
    }, [loadCart]);

    const updateQuantity = (id, quantity) => {
        if (quantity <= 0) return;
        const updatedCart = cartItems.map(item =>
            item._id === id ? { ...item, quantity } : item
        );
        setCartItems(updatedCart);
        localStorage.setItem('cart', JSON.stringify(updatedCart));
        window.dispatchEvent(new Event('cartChange'));
    };

    const removeItem = (id) => {
        const updatedCart = cartItems.filter(item => item._id !== id);
        setCartItems(updatedCart);
        localStorage.setItem('cart', JSON.stringify(updatedCart));
        message.success('Đã xóa sản phẩm!');
        window.dispatchEvent(new Event('cartChange'));
    };

    const calculateTotal = () => {
        return cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    };

    const cartColumns = [
        {
            title: 'Sản phẩm',
            dataIndex: 'name',
            key: 'name',
            render: (text, record) => (
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <img src={record.image} alt={text} style={{ width: 50, height: 50, marginRight: 10, objectFit: 'cover' }} />
                    <span>{text}</span>
                </div>
            )
        },
        { title: 'Đơn giá', dataIndex: 'price', render: price => `${price.toLocaleString()} đ` },
        {
            title: 'Số lượng', dataIndex: 'quantity',
            render: (qty, record) => (
                <InputNumber min={1} value={qty} onChange={(val) => updateQuantity(record._id, val)} />
            )
        },
        { title: 'Tổng', render: (_, rec) => `${(rec.price * rec.quantity).toLocaleString()} đ` },
        {
            title: 'Xóa', key: 'action',
            render: (_, rec) => (
                <Button danger icon={<DeleteOutlined />} onClick={() => removeItem(rec._id)} />
            )
        }
    ];

    return (
        <div style={{ padding: '30px', background: '#f0f2f5', minHeight: '100vh' }}>
            <Card
                title="🛒 Giỏ hàng của bạn"
                style={{ maxWidth: '1200px', margin: 'auto' }}
                extra={
                    <Button
                        icon={<HistoryOutlined />}
                        onClick={() => navigate('/my-orders')}
                    >
                        Lịch sử đơn hàng
                    </Button>
                }
            >
                {cartItems.length === 0 ? (
                    <Empty description="Giỏ hàng trống">
                        <Button type="primary" onClick={() => navigate('/products')}>
                            Mua sắm ngay
                        </Button>
                    </Empty>
                ) : (
                    <>
                        <Table
                            dataSource={cartItems}
                            columns={cartColumns}
                            rowKey="_id"
                            pagination={false}
                        />
                        <div style={{ marginTop: 20, textAlign: 'right', padding: 20, background: '#fff' }}>
                            <h2 style={{ color: '#d48806' }}>
                                Tổng cộng: {calculateTotal().toLocaleString()} VNĐ
                            </h2>
                            <Button
                                type="primary"
                                size="large"
                                style={{ background: '#fadb14', borderColor: '#fadb14', color: '#000', marginTop: 10 }}
                                icon={<ArrowRightOutlined />}
                                onClick={() => navigate('/checkout')}
                            >
                                Tiến hành thanh toán
                            </Button>
                        </div>
                    </>
                )}
            </Card>
        </div>
    );
};

export default Cart;