import React, { useState, useEffect, useCallback } from 'react';
import { Card, Table, Button, InputNumber, message, Tabs, Empty } from 'antd';
import { DeleteOutlined, ShoppingCartOutlined, HistoryOutlined, ArrowRightOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom'; // Import useNavigate

const Cart = ({ onCartUpdate }) => {
    const [cartItems, setCartItems] = useState([]);
    const [orderHistory, setOrderHistory] = useState([]);
    const [activeTab, setActiveTab] = useState('1');
    const navigate = useNavigate(); // Hook chuyển trang

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
        // Load lịch sử đơn hàng
        const history = JSON.parse(localStorage.getItem('orderHistory') || '[]');
        setOrderHistory(history);

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

    // Cấu hình cột bảng (Giữ nguyên như cũ)
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
            render: (qty, record) => <InputNumber min={1} value={qty} onChange={(val) => updateQuantity(record._id, val)} /> 
        },
        { title: 'Tổng', render: (_, rec) => `${(rec.price * rec.quantity).toLocaleString()} đ` },
        { 
            title: 'Xóa', key: 'action', 
            render: (_, rec) => <Button danger icon={<DeleteOutlined />} onClick={() => removeItem(rec._id)} /> 
        }
    ];

    const historyColumns = [
        { title: 'Mã đơn', dataIndex: 'orderId', render: t => <b>{t}</b> },
        { title: 'Ngày đặt', dataIndex: 'orderDate' },
        { title: 'Tổng tiền', dataIndex: 'totalAmount', render: t => `${t.toLocaleString()} đ` },
        { title: 'Trạng thái', dataIndex: 'status', render: t => <span style={{color: t === 'completed' ? 'green' : 'orange'}}>{t === 'completed' ? 'Hoàn thành' : 'Đang xử lý'}</span> }
    ];

    const tabItems = [
        {
            key: '1',
            label: <span><ShoppingCartOutlined /> Giỏ hàng ({cartItems.length})</span>,
            children: cartItems.length === 0 ? <Empty description="Giỏ hàng trống" /> : (
                <>
                    <Table dataSource={cartItems} columns={cartColumns} rowKey="_id" pagination={false} />
                    <div style={{ marginTop: 20, textAlign: 'right', padding: 20, background: '#fff' }}>
                        <h2 style={{ color: '#d48806' }}>Tổng cộng: {calculateTotal().toLocaleString()} VNĐ</h2>
                        <Button 
                            type="primary" size="large" 
                            style={{ background: '#fadb14', borderColor: '#fadb14', color: '#000', marginTop: 10 }}
                            icon={<ArrowRightOutlined />}
                            onClick={() => navigate('/checkout')} // CHUYỂN HƯỚNG SANG TRANG CHECKOUT
                        >
                            Tiến hành thanh toán
                        </Button>
                    </div>
                </>
            )
        },
        {
            key: '2',
            label: <span><HistoryOutlined /> Lịch sử đơn hàng</span>,
            children: <Table dataSource={orderHistory} columns={historyColumns} rowKey="id" />
        }
    ];

    return (
        <div style={{ padding: '30px', background: '#f0f2f5', minHeight: '100vh' }}>
            <Card style={{ maxWidth: '1200px', margin: 'auto' }}>
                <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />
            </Card>
        </div>
    );
};

export default Cart;