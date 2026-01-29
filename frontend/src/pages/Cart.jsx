import React, { useState, useEffect } from 'react';
import { Card, Table, Button, InputNumber, message, Modal, Form, Input, Tabs, Tag, Space } from 'antd';
import { DeleteOutlined, ShoppingCartOutlined, HistoryOutlined, CheckCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';
import axios from 'axios';

const Cart = ({ onCartUpdate }) => {
    const [cartItems, setCartItems] = useState([]);
    const [orderHistory, setOrderHistory] = useState([]);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [form] = Form.useForm();
    const [activeTab, setActiveTab] = useState('1');

    useEffect(() => {
        loadCart();
        loadOrderHistory();
    }, []);

    const loadCart = () => {
        const cart = JSON.parse(localStorage.getItem('cart') || '[]');
        setCartItems(cart);
        // Cập nhật số lượng giỏ hàng lên component cha
        if (onCartUpdate) {
            const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
            onCartUpdate(totalItems);
        }
    };

    const loadOrderHistory = () => {
        const history = JSON.parse(localStorage.getItem('orderHistory') || '[]');
        setOrderHistory(history);
    };

    const updateQuantity = (id, quantity) => {
        if (quantity <= 0) return;
        const updatedCart = cartItems.map(item => 
            item._id === id ? { ...item, quantity } : item
        );
        setCartItems(updatedCart);
        localStorage.setItem('cart', JSON.stringify(updatedCart));
        
        // Cập nhật số lượng
        if (onCartUpdate) {
            const totalItems = updatedCart.reduce((sum, item) => sum + item.quantity, 0);
            onCartUpdate(totalItems);
        }
    };

    const removeItem = (id) => {
        const updatedCart = cartItems.filter(item => item._id !== id);
        setCartItems(updatedCart);
        localStorage.setItem('cart', JSON.stringify(updatedCart));
        message.success('Đã xóa sản phẩm khỏi giỏ hàng!');
        
        // Cập nhật số lượng
        if (onCartUpdate) {
            const totalItems = updatedCart.reduce((sum, item) => sum + item.quantity, 0);
            onCartUpdate(totalItems);
        }
    };

    const calculateTotal = () => {
        return cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    };

    const handleCheckout = async (values) => {
        if (cartItems.length === 0) {
            return message.warning('Giỏ hàng trống!');
        }

        const orderData = {
            customerName: values.customerName,
            phone: values.phone,
            address: values.address,
            items: cartItems,
            totalAmount: calculateTotal(),
            orderDate: new Date().toLocaleString('vi-VN'),
            status: 'pending'
        };

        try {
            // Gọi API (nếu có backend)
            // await axios.post('http://localhost:5000/api/orders/checkout', orderData);
            
            // Lưu vào lịch sử đơn hàng
            const history = JSON.parse(localStorage.getItem('orderHistory') || '[]');
            const newOrder = {
                ...orderData,
                orderId: `DH${Date.now()}`,
                id: Date.now()
            };
            history.unshift(newOrder);
            localStorage.setItem('orderHistory', JSON.stringify(history));
            
            message.success('Đặt hàng thành công! Chúng tôi sẽ liên hệ sớm nhất.');
            localStorage.removeItem('cart');
            setCartItems([]);
            setOrderHistory(history);
            setIsModalVisible(false);
            form.resetFields();
            
            // Cập nhật số lượng về 0
            if (onCartUpdate) {
                onCartUpdate(0);
            }
            
            // Chuyển sang tab lịch sử
            setActiveTab('2');
        } catch (error) {
            message.error('Lỗi đặt hàng, vui lòng thử lại!');
        }
    };

    const cartColumns = [
        {
            title: 'Sản phẩm',
            dataIndex: 'name',
            key: 'name',
            render: (text, record) => (
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <img 
                        src={record.image || 'https://via.placeholder.com/60'} 
                        alt={text}
                        style={{ width: 60, height: 60, marginRight: 10, borderRadius: '4px', objectFit: 'cover' }}
                    />
                    <span>{text}</span>
                </div>
            )
        },
        {
            title: 'Đơn giá',
            dataIndex: 'price',
            key: 'price',
            render: price => `${price.toLocaleString()} VNĐ`
        },
        {
            title: 'Số lượng',
            dataIndex: 'quantity',
            key: 'quantity',
            render: (quantity, record) => (
                <InputNumber
                    min={1}
                    value={quantity}
                    onChange={(value) => updateQuantity(record._id, value)}
                />
            )
        },
        {
            title: 'Thành tiền',
            key: 'total',
            render: (_, record) => `${(record.price * record.quantity).toLocaleString()} VNĐ`
        },
        {
            title: 'Xóa',
            key: 'action',
            render: (_, record) => (
                <Button 
                    danger 
                    icon={<DeleteOutlined />}
                    onClick={() => removeItem(record._id)}
                >
                    Xóa
                </Button>
            )
        }
    ];

    const historyColumns = [
        {
            title: 'Mã đơn',
            dataIndex: 'orderId',
            key: 'orderId',
            render: (text) => <strong>{text}</strong>
        },
        {
            title: 'Ngày đặt',
            dataIndex: 'orderDate',
            key: 'orderDate'
        },
        {
            title: 'Khách hàng',
            dataIndex: 'customerName',
            key: 'customerName'
        },
        {
            title: 'SĐT',
            dataIndex: 'phone',
            key: 'phone'
        },
        {
            title: 'Tổng tiền',
            dataIndex: 'totalAmount',
            key: 'totalAmount',
            render: (amount) => <strong style={{ color: '#d48806' }}>{amount.toLocaleString()} VNĐ</strong>
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            key: 'status',
            render: (status) => {
                const statusConfig = {
                    pending: { color: 'orange', icon: <ClockCircleOutlined />, text: 'Đang xử lý' },
                    completed: { color: 'green', icon: <CheckCircleOutlined />, text: 'Hoàn thành' }
                };
                const config = statusConfig[status] || statusConfig.pending;
                return (
                    <Tag icon={config.icon} color={config.color}>
                        {config.text}
                    </Tag>
                );
            }
        }
    ];

    const tabItems = [
        {
            key: '1',
            label: <span><ShoppingCartOutlined /> Giỏ hàng ({cartItems.length})</span>,
            children: (
                <>
                    {cartItems.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '50px' }}>
                            <ShoppingCartOutlined style={{ fontSize: '64px', color: '#d9d9d9' }} />
                            <h3 style={{ marginTop: '20px' }}>Giỏ hàng trống!</h3>
                            <Button type="primary" href="/products">Tiếp tục mua sắm</Button>
                        </div>
                    ) : (
                        <>
                            <Table
                                dataSource={cartItems}
                                columns={cartColumns}
                                rowKey="_id"
                                pagination={false}
                            />
                            
                            <div style={{ 
                                marginTop: '20px', 
                                textAlign: 'right',
                                borderTop: '2px solid #f0f0f0',
                                paddingTop: '20px'
                            }}>
                                <h2 style={{ color: '#d48806' }}>
                                    Tổng cộng: {calculateTotal().toLocaleString()} VNĐ
                                </h2>
                                <Space>
                                    <Button size="large">
                                        Tiếp tục mua sắm
                                    </Button>
                                    <Button 
                                        type="primary" 
                                        size="large"
                                        onClick={() => setIsModalVisible(true)}
                                        style={{ background: '#fadb14', borderColor: '#fadb14', color: '#000' }}
                                    >
                                        Thanh toán ngay
                                    </Button>
                                </Space>
                            </div>
                        </>
                    )}
                </>
            )
        },
        {
            key: '2',
            label: <span><HistoryOutlined /> Lịch sử đơn hàng ({orderHistory.length})</span>,
            children: (
                <>
                    {orderHistory.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '50px' }}>
                            <HistoryOutlined style={{ fontSize: '64px', color: '#d9d9d9' }} />
                            <h3 style={{ marginTop: '20px' }}>Chưa có đơn hàng nào!</h3>
                        </div>
                    ) : (
                        <Table
                            dataSource={orderHistory}
                            columns={historyColumns}
                            rowKey="id"
                            expandable={{
                                expandedRowRender: (record) => (
                                    <div style={{ padding: '10px 20px', background: '#fafafa' }}>
                                        <h4>Chi tiết đơn hàng:</h4>
                                        <p><strong>Địa chỉ:</strong> {record.address}</p>
                                        <h4>Sản phẩm:</h4>
                                        <ul>
                                            {record.items.map((item, index) => (
                                                <li key={index}>
                                                    {item.name} - SL: {item.quantity} - Giá: {(item.price * item.quantity).toLocaleString()} VNĐ
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )
                            }}
                        />
                    )}
                </>
            )
        }
    ];

    return (
        <div style={{ padding: '30px', background: '#f0f2f5', minHeight: '100vh' }}>
            <Card 
                style={{ maxWidth: '1200px', margin: 'auto' }}
            >
                <Tabs 
                    activeKey={activeTab}
                    onChange={setActiveTab}
                    items={tabItems}
                />
            </Card>

            <Modal
                title="Thông tin giao hàng"
                open={isModalVisible}
                onCancel={() => setIsModalVisible(false)}
                footer={null}
            >
                <Form form={form} onFinish={handleCheckout} layout="vertical">
                    <Form.Item 
                        label="Họ và tên" 
                        name="customerName"
                        rules={[{ required: true, message: 'Vui lòng nhập họ tên!' }]}
                    >
                        <Input placeholder="Nguyễn Văn A" />
                    </Form.Item>
                    <Form.Item 
                        label="Số điện thoại" 
                        name="phone"
                        rules={[{ required: true, message: 'Vui lòng nhập số điện thoại!' }]}
                    >
                        <Input placeholder="0909123456" />
                    </Form.Item>
                    <Form.Item 
                        label="Địa chỉ giao hàng" 
                        name="address"
                        rules={[{ required: true, message: 'Vui lòng nhập địa chỉ!' }]}
                    >
                        <Input.TextArea rows={3} placeholder="123 Đường ABC, Quận XYZ, TP. Đà Nẵng" />
                    </Form.Item>
                    <Button type="primary" htmlType="submit" block size="large">
                        Xác nhận đặt hàng - {calculateTotal().toLocaleString()} VNĐ
                    </Button>
                </Form>
            </Modal>
        </div>
    );
};

export default Cart;