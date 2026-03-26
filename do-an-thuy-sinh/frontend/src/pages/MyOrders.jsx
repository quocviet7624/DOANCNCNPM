import React, { useState, useEffect, useCallback } from 'react';
import { Table, Tag, Card, Button, Empty, Modal, Spin, message } from 'antd';
import {
    EyeOutlined, ShoppingOutlined, ReloadOutlined,
    TagOutlined, CarOutlined, CheckCircleOutlined, ClockCircleOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const RED   = '#c8232c';
const GREEN = '#52c41a';

const statusMap = {
    'Chờ xác nhận':   { color: 'orange', text: 'CHỜ XÁC NHẬN' },
    'Đang xử lý':     { color: 'blue',   text: 'ĐANG XỬ LÝ' },
    'Đang giao hàng': { color: 'cyan',   text: 'ĐANG GIAO HÀNG' },
    'Đã giao':        { color: 'green',  text: 'ĐÃ GIAO' },
    'Đã hủy':        { color: 'red',    text: 'ĐÃ HỦY' },
    'completed':      { color: 'green',  text: 'HOÀN THÀNH' },
    'pending':        { color: 'orange', text: 'ĐANG XỬ LÝ' },
    'cancelled':      { color: 'red',    text: 'ĐÃ HỦY' },
};

const MyOrders = () => {
    const [orders, setOrders]   = useState([]);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const fetchOrders = useCallback(async () => {
        const userStr = localStorage.getItem('user');
        if (!userStr) { navigate('/login'); return; }
        const user   = JSON.parse(userStr);
        const userId = user._id || user.id;
        if (!userId) { message.error('Không tìm thấy thông tin người dùng!'); return; }

        setLoading(true);
        try {
            const res = await axios.get(`http://localhost:5000/api/orders/user/${userId}`);
            setOrders(res.data);
        } catch {
            message.error('Không thể tải lịch sử đơn hàng!');
        } finally {
            setLoading(false);
        }
    }, [navigate]);

    useEffect(() => { fetchOrders(); }, [fetchOrders]);

    const showOrderDetail = (record) => {
        const subtotal = record.subtotalAmount || record.items?.reduce((s, i) => s + i.price * i.quantity, 0) || 0;
        const discount = record.discountAmount || 0;
        const shipping = record.shippingFee    || 0;
        const total    = record.totalAmount    || subtotal - discount + shipping;

        Modal.info({
            title: (
                <span style={{ fontWeight: 700, fontSize: 16 }}>
                    Chi tiết đơn hàng #{record._id.slice(-8).toUpperCase()}
                </span>
            ),
            width: 620,
            icon: null,
            content: (
                <div style={{ paddingTop: 8 }}>
                    {/* Thông tin khách */}
                    <div style={{ background: '#fafafa', borderRadius: 6, padding: '10px 14px', marginBottom: 14, border: '1px solid #f0f0f0' }}>
                        <div style={{ marginBottom: 4 }}><b>Khách hàng:</b> {record.customerName}</div>
                        <div style={{ marginBottom: 4 }}><b>Địa chỉ:</b> {record.address}</div>
                        {record.province && <div style={{ marginBottom: 4 }}><b>Tỉnh/TP:</b> {record.province}</div>}
                        <div style={{ marginBottom: 4 }}><b>SĐT:</b> {record.phone}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                            <b>Thanh toán:</b>
                            <span>{record.paymentMethod || 'COD'}</span>
                            <Tag
                                color={record.isPaid ? 'success' : 'warning'}
                                icon={record.isPaid ? <CheckCircleOutlined /> : <ClockCircleOutlined />}
                                style={{ fontSize: 12 }}
                            >
                                {record.isPaid ? 'Đã thanh toán' : 'Chưa thanh toán'}
                            </Tag>
                        </div>
                    </div>

                    {/* Danh sách sản phẩm */}
                    <div style={{ marginBottom: 10 }}>
                        {record.items?.map((item, idx) => (
                            <div key={idx} style={{
                                display: 'flex', justifyContent: 'space-between',
                                padding: '6px 0', borderBottom: '1px solid #f5f5f5', fontSize: 14,
                            }}>
                                <span style={{ color: '#333' }}>
                                    {item.name}
                                    <span style={{ color: '#888', marginLeft: 6 }}>x{item.quantity}</span>
                                </span>
                                <span style={{ fontWeight: 600 }}>{(item.price * item.quantity).toLocaleString('vi-VN')}đ</span>
                            </div>
                        ))}
                    </div>

                    {/* Tổng tiền */}
                    <div style={{ background: '#fafafa', borderRadius: 6, padding: '10px 14px', border: '1px solid #f0f0f0' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 14, color: '#555' }}>
                            <span>Tạm tính:</span>
                            <span>{subtotal.toLocaleString('vi-VN')}đ</span>
                        </div>

                        {discount > 0 && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 14, color: GREEN }}>
                                <span>
                                    <TagOutlined style={{ marginRight: 5 }} />
                                    Giảm giá {record.voucherCode ? `(${record.voucherCode})` : ''}:
                                </span>
                                <span style={{ fontWeight: 700 }}>-{discount.toLocaleString('vi-VN')}đ</span>
                            </div>
                        )}

                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 14, color: '#555' }}>
                            <span><CarOutlined style={{ marginRight: 5 }} />Phí giao hàng:</span>
                            {shipping === 0
                                ? <Tag color="success" style={{ fontSize: 11 }}>Miễn phí</Tag>
                                : <span style={{ fontWeight: 600 }}>{shipping.toLocaleString('vi-VN')}đ</span>
                            }
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 8, borderTop: '1px dashed #ddd', marginTop: 4 }}>
                            <span style={{ fontWeight: 700, fontSize: 15 }}>Tổng cộng:</span>
                            <span style={{ fontWeight: 700, fontSize: 18, color: RED }}>{total.toLocaleString('vi-VN')}đ</span>
                        </div>

                        {discount > 0 && (
                            <div style={{ textAlign: 'right', fontSize: 12, color: GREEN, marginTop: 4 }}>
                                🎉 Tiết kiệm {discount.toLocaleString('vi-VN')}đ
                            </div>
                        )}
                    </div>
                </div>
            ),
            okText: 'Đóng',
            okButtonProps: { style: { background: RED, borderColor: RED } },
        });
    };

    const columns = [
        {
            title: 'Mã đơn hàng', dataIndex: '_id', key: '_id',
            render: id => <b style={{ color: '#1890ff' }}>#{id.slice(-8).toUpperCase()}</b>,
        },
        {
            title: 'Ngày đặt', dataIndex: 'createdAt', key: 'createdAt',
            render: date => new Date(date).toLocaleString('vi-VN'),
        },
        {
            title: 'Tạm tính', key: 'subtotal',
            render: (_, r) => {
                const sub = r.subtotalAmount || r.items?.reduce((s, i) => s + i.price * i.quantity, 0) || 0;
                return <span style={{ color: '#888' }}>{sub.toLocaleString('vi-VN')}đ</span>;
            },
        },
        {
            title: 'Giảm giá', key: 'discount',
            render: (_, r) => r.discountAmount > 0
                ? <Tag color="green" icon={<TagOutlined />}>-{r.discountAmount.toLocaleString('vi-VN')}đ</Tag>
                : <span style={{ color: '#ccc' }}>—</span>,
        },
        {
            title: 'Phí ship', key: 'shipping',
            render: (_, r) => r.shippingFee > 0
                ? <span style={{ color: '#555' }}>{r.shippingFee.toLocaleString('vi-VN')}đ</span>
                : <Tag color="success" icon={<CarOutlined />}>Miễn phí</Tag>,
        },
        {
            title: 'Tổng tiền', dataIndex: 'totalAmount', key: 'totalAmount',
            render: amount => <span style={{ color: RED, fontWeight: 700, fontSize: 15 }}>{amount?.toLocaleString('vi-VN')}đ</span>,
        },
        {
            title: 'Thanh toán', key: 'isPaid',
            render: (_, r) => (
                <Tag
                    color={r.isPaid ? 'success' : 'warning'}
                    icon={r.isPaid ? <CheckCircleOutlined /> : <ClockCircleOutlined />}
                    style={{ fontSize: 12 }}
                >
                    {r.isPaid ? 'Đã thanh toán' : 'Chưa thanh toán'}
                </Tag>
            ),
        },
        {
            title: 'Trạng thái', dataIndex: 'status', key: 'status',
            render: status => {
                const s = statusMap[status] || { color: 'default', text: status };
                return <Tag color={s.color}>{s.text}</Tag>;
            },
        },
        {
            title: 'Chi tiết', key: 'action',
            render: (_, record) => (
                <Button icon={<EyeOutlined />} onClick={() => showOrderDetail(record)}>Xem</Button>
            ),
        },
    ];

    return (
        <div style={{ padding: '30px', background: '#f0f2f5', minHeight: '100vh' }}>
            <Card
                title={<span><ShoppingOutlined /> Lịch sử đơn hàng</span>}
                style={{ maxWidth: 1200, margin: '0 auto' }}
                extra={<Button icon={<ReloadOutlined />} onClick={fetchOrders}>Làm mới</Button>}
            >
                <Spin spinning={loading}>
                    {!loading && orders.length === 0 ? (
                        <Empty description="Bạn chưa có đơn hàng nào" image={Empty.PRESENTED_IMAGE_SIMPLE}>
                            <Button type="primary" onClick={() => navigate('/products')}>Mua sắm ngay</Button>
                        </Empty>
                    ) : (
                        <Table
                            dataSource={orders}
                            columns={columns}
                            rowKey="_id"
                            pagination={{ pageSize: 5 }}
                            scroll={{ x: 1000 }}
                            rowClassName={r => r.status === 'Đã hủy' ? 'row-cancelled' : ''}
                        />
                    )}
                </Spin>
            </Card>
            <style>{`.row-cancelled td { opacity: 0.5; }`}</style>
        </div>
    );
};

export default MyOrders;