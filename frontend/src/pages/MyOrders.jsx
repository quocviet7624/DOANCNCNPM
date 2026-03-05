import React, { useEffect, useState } from 'react';
import { Table, Tag, Card, Button, Empty, Modal, Spin, message } from 'antd';
import { EyeOutlined, ShoppingOutlined, ReloadOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const statusMap = {
    'Chờ xác nhận':   { color: 'orange', text: 'CHỜ XÁC NHẬN' },
    'Đang xử lý':     { color: 'blue',   text: 'ĐANG XỬ LÝ' },
    'Đang giao hàng': { color: 'cyan',   text: 'ĐANG GIAO HÀNG' },
    'Đã giao':        { color: 'green',  text: 'ĐÃ GIAO' },
    'Đã hủy':         { color: 'red',    text: 'ĐÃ HỦY' },
    'completed':      { color: 'green',  text: 'HOÀN THÀNH' },
    'pending':        { color: 'orange', text: 'ĐANG XỬ LÝ' },
    'cancelled':      { color: 'red',    text: 'ĐÃ HỦY' },
};

const MyOrders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const fetchOrders = async () => {
        const userStr = localStorage.getItem('user');
        if (!userStr) {
            navigate('/login');
            return;
        }

        const user = JSON.parse(userStr);
        const userId = user._id || user.id;

        if (!userId) {
            message.error('Không tìm thấy thông tin người dùng!');
            return;
        }

        setLoading(true);
        try {
            const res = await axios.get(`http://localhost:5000/api/orders/user/${userId}`);
            setOrders(res.data);
        } catch (err) {
            console.error(err);
            message.error('Không thể tải lịch sử đơn hàng!');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    const columns = [
        {
            title: 'Mã đơn hàng',
            dataIndex: '_id',
            key: '_id',
            render: id => <b style={{ color: '#1890ff' }}>#{id.slice(-8).toUpperCase()}</b>,
        },
        {
            title: 'Ngày đặt',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: date => new Date(date).toLocaleString('vi-VN'),
        },
        {
            title: 'Tổng tiền',
            dataIndex: 'totalAmount',
            key: 'totalAmount',
            render: amount => (
                <span style={{ color: '#d48806', fontWeight: 'bold' }}>
                    {amount?.toLocaleString()} đ
                </span>
            ),
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            key: 'status',
            render: status => {
                const s = statusMap[status] || { color: 'default', text: status };
                return <Tag color={s.color}>{s.text}</Tag>;
            }
        },
        {
            title: 'Chi tiết',
            key: 'action',
            render: (_, record) => (
                <Button
                    icon={<EyeOutlined />}
                    onClick={() => {
                        Modal.info({
                            title: `Chi tiết đơn hàng #${record._id.slice(-8).toUpperCase()}`,
                            width: 600,
                            content: (
                                <div>
                                    <p><b>Khách hàng:</b> {record.customerName}</p>
                                    <p><b>Địa chỉ:</b> {record.address}</p>
                                    <p><b>SĐT:</b> {record.phone}</p>
                                    <p><b>Thanh toán:</b> {record.paymentMethod || 'COD'}</p>
                                    <hr />
                                    {record.items?.map((item, idx) => (
                                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                                            <span>{item.name} (x{item.quantity})</span>
                                            <span>{(item.price * item.quantity).toLocaleString()} đ</span>
                                        </div>
                                    ))}
                                    <hr />
                                    <h3 style={{ textAlign: 'right', color: '#d48806' }}>
                                        Tổng: {record.totalAmount?.toLocaleString()} đ
                                    </h3>
                                </div>
                            )
                        });
                    }}
                >
                    Xem
                </Button>
            )
        }
    ];

    return (
        <div style={{ padding: '30px', background: '#f0f2f5', minHeight: '100vh' }}>
            <Card
                title={<span><ShoppingOutlined /> Lịch sử đơn hàng</span>}
                style={{ maxWidth: 1000, margin: '0 auto' }}
                extra={
                    <Button icon={<ReloadOutlined />} onClick={fetchOrders}>
                        Làm mới
                    </Button>
                }
            >
                <Spin spinning={loading}>
                    {!loading && orders.length === 0 ? (
                        <Empty
                            description="Bạn chưa có đơn hàng nào"
                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                        >
                            <Button type="primary" onClick={() => navigate('/products')}>
                                Mua sắm ngay
                            </Button>
                        </Empty>
                    ) : (
                        <Table
                            dataSource={orders}
                            columns={columns}
                            rowKey="_id"
                            pagination={{ pageSize: 5 }}
                        />
                    )}
                </Spin>
            </Card>
        </div>
    );
};

export default MyOrders;