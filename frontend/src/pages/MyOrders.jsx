import React, { useEffect, useState } from 'react';
import { Table, Tag, Card, Button, Empty, Modal } from 'antd'; // Đã xóa Typography
import { EyeOutlined, ShoppingOutlined } from '@ant-design/icons'; // Đã sửa icon ở đây
import { useNavigate } from 'react-router-dom';

const MyOrders = () => {
    const [orders, setOrders] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        const history = JSON.parse(localStorage.getItem('orderHistory') || '[]');
        setOrders(history);
    }, []);

    const columns = [
        {
            title: 'Mã đơn hàng',
            dataIndex: 'orderId',
            key: 'orderId',
            render: text => <b style={{ color: '#1890ff' }}>{text}</b>,
        },
        {
            title: 'Ngày đặt',
            dataIndex: 'orderDate',
            key: 'orderDate',
        },
        {
            title: 'Tổng tiền',
            dataIndex: 'totalAmount',
            key: 'totalAmount',
            render: amount => <span style={{ color: '#d48806', fontWeight: 'bold' }}>{amount?.toLocaleString()} đ</span>,
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            key: 'status',
            render: status => {
                let color = status === 'completed' ? 'green' : status === 'pending' ? 'orange' : 'red';
                let text = status === 'completed' ? 'Hoàn thành' : status === 'pending' ? 'Đang xử lý' : 'Đã hủy';
                return <Tag color={color}>{text.toUpperCase()}</Tag>;
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
                            title: `Chi tiết đơn hàng ${record.orderId}`,
                            width: 600,
                            content: (
                                <div>
                                    <p><b>Địa chỉ:</b> {record.address}</p>
                                    <p><b>SĐT:</b> {record.phone}</p>
                                    <hr />
                                    {record.items?.map((item, idx) => (
                                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                                            <span>{item.name} (x{item.quantity})</span>
                                            <span>{(item.price * item.quantity).toLocaleString()} đ</span>
                                        </div>
                                    ))}
                                    <hr />
                                    <h3 style={{ textAlign: 'right', color: '#d48806' }}>Tổng: {record.totalAmount?.toLocaleString()} đ</h3>
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
                // Đã sửa icon ở đây thành ShoppingOutlined
                title={<span><ShoppingOutlined /> Lịch sử đơn hàng</span>} 
                style={{ maxWidth: 1000, margin: '0 auto' }}
            >
                {orders.length > 0 ? (
                    <Table 
                        dataSource={orders} 
                        columns={columns} 
                        rowKey="orderId" 
                        pagination={{ pageSize: 5 }} 
                    />
                ) : (
                    <Empty 
                        description="Bạn chưa có đơn hàng nào" 
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                    >
                        <Button type="primary" onClick={() => navigate('/products')}>Mua sắm ngay</Button>
                    </Empty>
                )}
            </Card>
        </div>
    );
};

export default MyOrders;