import React, { useState, useEffect } from 'react';
import { Table, Tag, Button, Modal, message, Select } from 'antd';
import { EyeOutlined } from '@ant-design/icons';
import axios from 'axios';

const { Option } = Select;

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
            const res = await axios.get('http://localhost:5000/api/orders');
            setOrders(res.data);
        } catch (error) {
            message.error('Không thể tải đơn hàng!');
        }
        setLoading(false);
    };
    

const updateOrderStatus = async (orderId, newStatus) => {
    try {
        await axios.put(`http://localhost:5000/api/orders/${orderId}`, { status: newStatus });
        if (newStatus === 'Đã giao') {
            message.success('Đơn hàng hoàn tất! Khách đã có thể đánh giá sản phẩm.');
        } else {
            message.success('Cập nhật thành công!');
        }
        fetchOrders();
    } catch (error) {
        message.error('Lỗi cập nhật!');
    }
};

    const viewOrderDetail = (order) => {
        setSelectedOrder(order);
        setIsModalVisible(true);
    };

    const getStatusColor = (status) => {
        const colors = {
            'Chờ xác nhận': 'orange',
            'Đang xử lý': 'blue',
            'Đang giao hàng': 'cyan',
            'Đã giao': 'green',
            'Đã hủy': 'red'
        };
        return colors[status] || 'default';
    };

    const columns = [
        {
            title: 'Mã đơn',
            dataIndex: '_id',
            key: '_id',
            render: (id) => `#${id.slice(-6).toUpperCase()}`
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
            render: (amount) => `${amount.toLocaleString()} VNĐ`
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            key: 'status',
            render: (status, record) => (
                <Select
                    value={status}
                    onChange={(value) => updateOrderStatus(record._id, value)}
                    style={{ width: 150 }}
                >
                    <Option value="Chờ xác nhận">
                        <Tag color="orange">Chờ xác nhận</Tag>
                    </Option>
                    <Option value="Đang xử lý">
                        <Tag color="blue">Đang xử lý</Tag>
                    </Option>
                    <Option value="Đang giao hàng">
                        <Tag color="cyan">Đang giao hàng</Tag>
                    </Option>
                    <Option value="Đã giao">
                        <Tag color="green">Đã giao</Tag>
                    </Option>
                    <Option value="Đã hủy">
                        <Tag color="red">Đã hủy</Tag>
                    </Option>
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
            title: 'Chi tiết',
            key: 'action',
            render: (_, record) => (
                <Button 
                    icon={<EyeOutlined />}
                    onClick={() => viewOrderDetail(record)}
                >
                    Xem
                </Button>
            )
        }
    ];

    return (
        <div>
            <h2>Quản lý đơn hàng</h2>
            <Table
                columns={columns}
                dataSource={orders}
                rowKey="_id"
                loading={loading}
            />

            <Modal
                title={`Chi tiết đơn hàng #${selectedOrder?._id.slice(-6).toUpperCase()}`}
                open={isModalVisible}
                onCancel={() => setIsModalVisible(false)}
                footer={null}
                width={700}
            >
                {selectedOrder && (
                    <div>
                        <h3>Thông tin khách hàng:</h3>
                        <p><strong>Tên:</strong> {selectedOrder.customerName}</p>
                        <p><strong>SĐT:</strong> {selectedOrder.phone}</p>
                        <p><strong>Địa chỉ:</strong> {selectedOrder.address}</p>
                        
                        <h3 style={{ marginTop: 20 }}>Sản phẩm đã đặt:</h3>
                        <Table
                            dataSource={selectedOrder.items}
                            columns={[
                                { title: 'Sản phẩm', dataIndex: 'name', key: 'name' },
                                { title: 'Số lượng', dataIndex: 'quantity', key: 'quantity' },
                                { 
                                    title: 'Đơn giá', 
                                    dataIndex: 'price', 
                                    key: 'price',
                                    render: (price) => `${price.toLocaleString()} VNĐ`
                                },
                                { 
                                    title: 'Thành tiền', 
                                    key: 'total',
                                    render: (_, record) => `${(record.price * record.quantity).toLocaleString()} VNĐ`
                                }
                            ]}
                            pagination={false}
                            rowKey="_id"
                        />
                        
                        <h3 style={{ marginTop: 20, textAlign: 'right', color: '#d48806' }}>
                            Tổng cộng: {selectedOrder.totalAmount.toLocaleString()} VNĐ
                        </h3>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default OrderManagement;