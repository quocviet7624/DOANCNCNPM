import React, { useState, useEffect } from 'react';
import { Table, Tag, Button, Modal, message, Select, Card, Typography } from 'antd';
import { EyeOutlined, ReloadOutlined } from '@ant-design/icons';
import axios from 'axios';

const { Option } = Select;
const { Title } = Typography;

const OrderManagement = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [isModalVisible, setIsModalVisible] = useState(false);

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            // Đảm bảo URL này khớp với Backend của bạn
            const res = await axios.get('http://localhost:5000/api/orders');
            setOrders(res.data);
        } catch (error) {
            console.error(error);
            message.error('Không thể tải danh sách đơn hàng!');
        } finally {
            setLoading(false);
        }
    };

    const updateOrderStatus = async (orderId, newStatus) => {
        try {
            await axios.put(`http://localhost:5000/api/orders/${orderId}`, { status: newStatus });
            
            if (newStatus === 'Đã giao') {
                message.success('Đơn hàng hoàn tất! Khách đã có thể thấy trạng thái Đã giao.');
            } else if (newStatus === 'Đã hủy') {
                message.warning('Đã hủy đơn hàng.');
            } else {
                message.success('Cập nhật trạng thái thành công!');
            }
            
            fetchOrders(); // Load lại danh sách sau khi sửa
        } catch (error) {
            message.error('Lỗi khi cập nhật trạng thái!');
        }
    };

    const viewOrderDetail = (order) => {
        setSelectedOrder(order);
        setIsModalVisible(true);
    };

    const columns = [
        {
            title: 'Mã đơn',
            dataIndex: '_id',
            key: '_id',
            width: 120,
            render: (id) => <b style={{ color: '#1890ff' }}>#{id.slice(-8).toUpperCase()}</b>
        },
        {
            title: 'Khách hàng',
            dataIndex: 'customerName',
            key: 'customerName',
        },
        {
            title: 'SĐT',
            dataIndex: 'phone',
            key: 'phone',
        },
        {
            title: 'Tổng tiền',
            dataIndex: 'totalAmount',
            key: 'totalAmount',
            render: (amount) => <span style={{ fontWeight: 'bold' }}>{amount.toLocaleString()} đ</span>
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            key: 'status',
            render: (status, record) => (
                <Select
                    value={status}
                    onChange={(value) => updateOrderStatus(record._id, value)}
                    style={{ width: 160 }}
                >
                    <Option value="Chờ xác nhận"><Tag color="orange">Chờ xác nhận</Tag></Option>
                    <Option value="Đang xử lý"><Tag color="blue">Đang xử lý</Tag></Option>
                    <Option value="Đang giao hàng"><Tag color="cyan">Đang giao hàng</Tag></Option>
                    <Option value="Đã giao"><Tag color="green">Đã giao</Tag></Option>
                    <Option value="Đã hủy"><Tag color="red">Đã hủy</Tag></Option>
                </Select>
            )
        },
        {
            title: 'Ngày đặt',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (date) => new Date(date).toLocaleString('vi-VN')
        },
        {
            title: 'Hành động',
            key: 'action',
            render: (_, record) => (
                <Button 
                    type="primary"
                    ghost
                    icon={<EyeOutlined />}
                    onClick={() => viewOrderDetail(record)}
                >
                    Chi tiết
                </Button>
            )
        }
    ];

    return (
        <div style={{ padding: '20px' }}>
            <Card>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
                    <Title level={3}>📦 Quản lý đơn hàng hệ thống</Title>
                    <Button icon={<ReloadOutlined />} onClick={fetchOrders}>Làm mới</Button>
                </div>
                
                <Table
                    columns={columns}
                    dataSource={orders}
                    rowKey="_id"
                    loading={loading}
                    pagination={{ pageSize: 10 }}
                />
            </Card>

            <Modal
                title={`Chi tiết đơn hàng #${selectedOrder?._id.slice(-8).toUpperCase()}`}
                open={isModalVisible}
                onCancel={() => setIsModalVisible(false)}
                footer={[
                    <Button key="close" onClick={() => setIsModalVisible(false)}>Đóng</Button>
                ]}
                width={800}
            >
                {selectedOrder && (
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <div>
                                <h4>Thông tin khách hàng:</h4>
                                <p><strong>Họ tên:</strong> {selectedOrder.customerName}</p>
                                <p><strong>Điện thoại:</strong> {selectedOrder.phone}</p>
                                <p><strong>Địa chỉ:</strong> {selectedOrder.address}</p>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <h4>Trạng thái hiện tại:</h4>
                                <Tag color={
                                    selectedOrder.status === 'Đã giao' ? 'green' : 
                                    selectedOrder.status === 'Đã hủy' ? 'red' : 'orange'
                                }>
                                    {selectedOrder.status.toUpperCase()}
                                </Tag>
                            </div>
                        </div>
                        
                        <h4 style={{ marginTop: 20 }}>Sản phẩm đã đặt:</h4>
                        <Table
                            dataSource={selectedOrder.items}
                            columns={[
                                { title: 'Sản phẩm', dataIndex: 'name', key: 'name' },
                                { title: 'Số lượng', dataIndex: 'quantity', key: 'quantity', align: 'center' },
                                { 
                                    title: 'Đơn giá', 
                                    dataIndex: 'price', 
                                    key: 'price',
                                    render: (p) => `${p.toLocaleString()} đ`
                                },
                                { 
                                    title: 'Thành tiền', 
                                    key: 'subtotal',
                                    align: 'right',
                                    render: (_, item) => <b>{(item.price * item.quantity).toLocaleString()} đ</b>
                                }
                            ]}
                            pagination={false}
                            rowKey={(item) => item._id || Math.random()}
                        />
                        
                        <div style={{ marginTop: 20, textAlign: 'right' }}>
                            <Title level={4} style={{ color: '#d48806' }}>
                                TỔNG CỘNG: {selectedOrder.totalAmount.toLocaleString()} VNĐ
                            </Title>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default OrderManagement;