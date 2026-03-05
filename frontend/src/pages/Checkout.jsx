import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Row, Col, Card, Radio, Button, Input, Form,
    Divider, List, Typography, Space, message, Tag,
    Modal, Popconfirm, Tooltip
} from 'antd';
import {
    EnvironmentOutlined, CreditCardOutlined,
    UserOutlined, PhoneOutlined,
    PlusOutlined, EditOutlined, DeleteOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

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

    useEffect(() => {
        const cart = JSON.parse(localStorage.getItem('cart') || '[]');
        if (cart.length === 0) {
            message.warning('Giỏ hàng trống!');
            navigate('/products');
            return;
        }
        setCartItems(cart);

        const userStr = localStorage.getItem('user');
        if (!userStr) {
            navigate('/login');
            return;
        }

        const user = JSON.parse(userStr);
        setUserInfo(user);

        let addresses = user.addresses || [];
        if (addresses.length === 0 && user.address) {
            addresses = [{
                id: Date.now(),
                name: user.fullName || 'Tôi',
                phone: user.phone || '',
                address: user.address,
                isDefault: true
            }];
            const updatedUser = { ...user, addresses };
            localStorage.setItem('user', JSON.stringify(updatedUser));
        }

        setSavedAddresses(addresses);
        if (addresses.length > 0) {
            const defaultAddr = addresses.find(a => a.isDefault);
            setSelectedAddressId(defaultAddr ? defaultAddr.id : addresses[0].id);
        } else {
            setIsAddingNew(true);
        }
    }, [navigate]);

    const calculateTotal = () => {
        return cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    };

    const updateUserStorage = (newAddresses) => {
        const updatedUser = { ...userInfo, addresses: newAddresses };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUserInfo(updatedUser);
        setSavedAddresses(newAddresses);
    };

    const handleAddNewAddress = (values) => {
        const newAddress = {
            id: Date.now(),
            name: values.name,
            phone: values.phone,
            address: values.detail,
            isDefault: savedAddresses.length === 0
        };
        const newAddressList = [...savedAddresses, newAddress];
        updateUserStorage(newAddressList);
        setSelectedAddressId(newAddress.id);
        setIsAddingNew(false);
        addForm.resetFields();
        message.success('Đã thêm địa chỉ mới!');
    };

    const handleDeleteAddress = (e, id) => {
        e.stopPropagation();
        const newAddressList = savedAddresses.filter(addr => addr.id !== id);
        updateUserStorage(newAddressList);
        message.success('Đã xóa địa chỉ!');
        if (id === selectedAddressId) {
            if (newAddressList.length > 0) {
                setSelectedAddressId(newAddressList[0].id);
            } else {
                setSelectedAddressId(null);
                setIsAddingNew(true);
            }
        }
    };

    const openEditModal = (e, address) => {
        e.stopPropagation();
        setEditingAddress(address);
        editForm.setFieldsValue({ name: address.name, phone: address.phone, detail: address.address });
        setIsEditing(true);
    };

    const handleUpdateAddress = () => {
        editForm.validateFields().then(values => {
            const newAddressList = savedAddresses.map(addr =>
                addr.id === editingAddress.id
                    ? { ...addr, name: values.name, phone: values.phone, address: values.detail }
                    : addr
            );
            updateUserStorage(newAddressList);
            setIsEditing(false);
            setEditingAddress(null);
            message.success('Cập nhật địa chỉ thành công!');
        });
    };

    const handlePlaceOrder = async () => {
        if (!selectedAddressId && !isAddingNew) {
            message.error('Vui lòng chọn địa chỉ giao hàng!');
            return;
        }

        setIsProcessing(true);
        const selectedAddr = savedAddresses.find(a => a.id === selectedAddressId);

        const orderData = {
            userId: userInfo._id || userInfo.id,
            customerName: selectedAddr.name,
            phone: selectedAddr.phone,
            address: selectedAddr.address,
            items: cartItems,
            totalAmount: calculateTotal(),
            paymentMethod: paymentMethod === 'paypal' ? 'PayPal' : 'COD',
            status: 'Chờ xác nhận'
        };

        try {
            const res = await axios.post('http://localhost:5000/api/orders/checkout', orderData);
            const savedOrder = res.data.order;

            // Lưu local để hiển thị lịch sử
            const newOrderLocal = {
                id: savedOrder._id,
                orderId: savedOrder._id.slice(-8).toUpperCase(),
                items: cartItems,
                totalAmount: calculateTotal(),
                orderDate: new Date().toLocaleString('vi-VN'),
                status: 'pending',
                customerName: selectedAddr.name,
                phone: selectedAddr.phone,
                address: selectedAddr.address
            };
            const history = JSON.parse(localStorage.getItem('orderHistory') || '[]');
            history.unshift(newOrderLocal);
            localStorage.setItem('orderHistory', JSON.stringify(history));

            localStorage.removeItem('cart');
            window.dispatchEvent(new Event('cartChange'));
            window.dispatchEvent(new Event('orderChange')); // ← Báo Cart reload lịch sử
            message.success('Đặt hàng thành công!');
            navigate('/my-orders');

        } catch (err) {
            console.error(err);
            message.error('Đặt hàng thất bại! Vui lòng thử lại.');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div style={{ padding: '30px', background: '#f5f5f5', minHeight: '100vh' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                <Title level={2} style={{ textAlign: 'center', marginBottom: 30 }}>Thanh Toán</Title>

                <Row gutter={24}>
                    <Col xs={24} lg={14}>
                        <Card
                            title={<span><EnvironmentOutlined /> Địa chỉ nhận hàng</span>}
                            style={{ marginBottom: 20 }}
                            extra={
                                !isAddingNew && (
                                    <Button type="link" icon={<PlusOutlined />} onClick={() => setIsAddingNew(true)}>
                                        Thêm địa chỉ
                                    </Button>
                                )
                            }
                        >
                            {!isAddingNew ? (
                                <>
                                    {savedAddresses.length > 0 ? (
                                        <List
                                            dataSource={savedAddresses}
                                            renderItem={item => (
                                                <div
                                                    onClick={() => setSelectedAddressId(item.id)}
                                                    style={{
                                                        cursor: 'pointer',
                                                        border: selectedAddressId === item.id ? '2px solid #1890ff' : '1px solid #e8e8e8',
                                                        padding: '15px',
                                                        marginBottom: '10px',
                                                        borderRadius: '8px',
                                                        backgroundColor: selectedAddressId === item.id ? '#f0f9ff' : 'white',
                                                        transition: 'all 0.3s',
                                                        position: 'relative'
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
                                                                    {item.isDefault && <Tag color="blue">Mặc định</Tag>}
                                                                </Space>
                                                                <div style={{ marginTop: 4 }}>{item.address}</div>
                                                            </div>
                                                        </div>
                                                        <Space>
                                                            <Tooltip title="Sửa địa chỉ">
                                                                <Button
                                                                    type="text"
                                                                    icon={<EditOutlined style={{ color: '#1890ff' }} />}
                                                                    onClick={(e) => openEditModal(e, item)}
                                                                />
                                                            </Tooltip>
                                                            <Popconfirm
                                                                title="Bạn có chắc muốn xóa địa chỉ này?"
                                                                onConfirm={(e) => handleDeleteAddress(e, item.id)}
                                                                onCancel={(e) => e.stopPropagation()}
                                                                okText="Xóa"
                                                                cancelText="Hủy"
                                                            >
                                                                <Button
                                                                    type="text"
                                                                    danger
                                                                    icon={<DeleteOutlined />}
                                                                    onClick={(e) => e.stopPropagation()}
                                                                />
                                                            </Popconfirm>
                                                        </Space>
                                                    </div>
                                                </div>
                                            )}
                                        />
                                    ) : (
                                        <div style={{ textAlign: 'center', padding: 20 }}>
                                            <Text type="secondary">Chưa có địa chỉ nào.</Text>
                                            <br />
                                            <Button type="primary" style={{ marginTop: 10 }} onClick={() => setIsAddingNew(true)}>
                                                Thêm địa chỉ mới
                                            </Button>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div style={{ background: '#fafafa', padding: 20, borderRadius: 8, border: '1px dashed #d9d9d9' }}>
                                    <Title level={5}>Thêm địa chỉ giao hàng mới</Title>
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
                                                <Form.Item name="detail" label="Địa chỉ chi tiết" rules={[{ required: true, message: 'Nhập địa chỉ' }]}>
                                                    <Input.TextArea rows={2} />
                                                </Form.Item>
                                            </Col>
                                        </Row>
                                        <Space>
                                            <Button type="primary" htmlType="submit">Lưu</Button>
                                            <Button onClick={() => { setIsAddingNew(false); addForm.resetFields(); }}>Hủy</Button>
                                        </Space>
                                    </Form>
                                </div>
                            )}
                        </Card>

                        <Card title={<span><CreditCardOutlined /> Phương thức thanh toán</span>}>
                            <Radio.Group
                                onChange={e => setPaymentMethod(e.target.value)}
                                value={paymentMethod}
                                style={{ width: '100%' }}
                            >
                                <Space direction="vertical" style={{ width: '100%' }}>
                                    <Radio value="cod" style={{ width: '100%', padding: '15px', border: '1px solid #d9d9d9', borderRadius: '4px' }}>
                                        <Space>
                                            <img src="https://cdn-icons-png.flaticon.com/512/2331/2331941.png" alt="cod" width={24} />
                                            <div>
                                                <Text strong>Thanh toán khi nhận hàng (COD)</Text>
                                                <div style={{ fontSize: 12, color: '#888' }}>Thanh toán bằng tiền mặt khi nhận hàng</div>
                                            </div>
                                        </Space>
                                    </Radio>
                                    <Radio value="paypal" style={{ width: '100%', padding: '15px', border: '1px solid #d9d9d9', borderRadius: '4px' }}>
                                        <Space>
                                            <img src="https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg" alt="paypal" width={60} />
                                            <div>
                                                <Text strong>Thanh toán qua PayPal</Text>
                                                <div style={{ fontSize: 12, color: '#888' }}>Thẻ Visa, MasterCard, hoặc ví PayPal</div>
                                            </div>
                                        </Space>
                                    </Radio>
                                </Space>
                            </Radio.Group>
                        </Card>
                    </Col>

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
                                                    <Text strong>{(item.price * item.quantity).toLocaleString()} đ</Text>
                                                </div>
                                            }
                                        />
                                    </List.Item>
                                )}
                            />
                            <Divider />
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
                                <Title level={4}>Tổng cộng:</Title>
                                <Title level={3} type="warning" style={{ margin: 0 }}>
                                    {calculateTotal().toLocaleString()} đ
                                </Title>
                            </div>
                            <Button
                                type="primary"
                                block
                                size="large"
                                loading={isProcessing}
                                onClick={handlePlaceOrder}
                                disabled={isAddingNew || savedAddresses.length === 0}
                                style={{
                                    height: 50,
                                    background: paymentMethod === 'paypal' ? '#003087' : '#ff4d4f',
                                    borderColor: paymentMethod === 'paypal' ? '#003087' : '#ff4d4f',
                                    fontWeight: 'bold'
                                }}
                            >
                                {paymentMethod === 'paypal' ? 'Pay with PayPal' : 'ĐẶT HÀNG NGAY'}
                            </Button>
                        </Card>
                    </Col>
                </Row>
            </div>

            <Modal
                title="Cập nhật địa chỉ"
                open={isEditing}
                onOk={handleUpdateAddress}
                onCancel={() => { setIsEditing(false); setEditingAddress(null); }}
                okText="Lưu thay đổi"
                cancelText="Hủy"
            >
                <Form form={editForm} layout="vertical">
                    <Form.Item name="name" label="Người nhận" rules={[{ required: true, message: 'Nhập tên' }]}>
                        <Input prefix={<UserOutlined />} />
                    </Form.Item>
                    <Form.Item name="phone" label="Số điện thoại" rules={[{ required: true, message: 'Nhập SĐT' }]}>
                        <Input prefix={<PhoneOutlined />} />
                    </Form.Item>
                    <Form.Item name="detail" label="Địa chỉ chi tiết" rules={[{ required: true, message: 'Nhập địa chỉ' }]}>
                        <Input.TextArea rows={2} />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default Checkout;