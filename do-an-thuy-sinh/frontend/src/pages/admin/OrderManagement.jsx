import React, { useState, useEffect, useMemo } from 'react';
import {
    Table, Tag, Button, Modal, message, Select,
    Card, Typography, Divider, Input, Space, Statistic, Row, Col, Tooltip, Switch
} from 'antd';
import {
    EyeOutlined, ReloadOutlined, TagOutlined,
    SearchOutlined, CarOutlined,
    ShoppingOutlined, DollarOutlined, GiftOutlined,
    CheckCircleOutlined, ClockCircleOutlined, EyeInvisibleOutlined,
} from '@ant-design/icons';
import axios from 'axios';

const { Option } = Select;
const { Title, Text } = Typography;

const RED   = '#c8232c';
const GREEN = '#52c41a';

const STATUS_COLORS = {
    'Chờ xác nhận':   'orange',
    'Đang xử lý':     'blue',
    'Đang giao hàng': 'cyan',
    'Đã giao':        'green',
    'Đã hủy':         'red',
};

const OrderManagement = () => {
    const [orders, setOrders]                 = useState([]);
    const [loading, setLoading]               = useState(false);
    const [selectedOrder, setSelectedOrder]   = useState(null);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [searchText, setSearchText]         = useState('');
    // Ẩn đơn đã giao & đã hủy để bớt rối — dữ liệu vẫn còn trong DB
    const [hideCompleted, setHideCompleted]   = useState(true);

    useEffect(() => { fetchOrders(); }, []);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const res = await axios.get('http://localhost:5000/api/orders');
            setOrders(res.data);
        } catch {
            message.error('Không thể tải danh sách đơn hàng!');
        } finally {
            setLoading(false);
        }
    };

    const updateOrderStatus = async (orderId, newStatus) => {
        try {
            await axios.put(`http://localhost:5000/api/orders/${orderId}`, { status: newStatus });
            const msgs = {
                'Đã giao': { type: 'success', text: 'Đơn hàng hoàn tất! ✅' },
                'Đã hủy':  { type: 'warning', text: 'Đã hủy đơn hàng.' },
            };
            const m = msgs[newStatus] || { type: 'success', text: 'Cập nhật trạng thái thành công!' };
            message[m.type](m.text);
            fetchOrders();
        } catch {
            message.error('Lỗi khi cập nhật trạng thái!');
        }
    };

    // Chỉ cho phép đánh dấu ĐÃ thanh toán, không cho bỏ
    const markAsPaid = async (orderId) => {
        try {
            await axios.put(`http://localhost:5000/api/orders/${orderId}`, { isPaid: true });
            message.success('Đã đánh dấu thanh toán!');
            fetchOrders();
            if (selectedOrder?._id === orderId) {
                setSelectedOrder(prev => ({ ...prev, isPaid: true }));
            }
        } catch {
            message.error('Lỗi cập nhật trạng thái thanh toán!');
        }
    };

    // Tìm kiếm + ẩn/hiện đơn đã giao & đã hủy
    const filtered = useMemo(() => {
        let result = orders;
        // Ẩn đơn đã giao và đã hủy nếu bật hideCompleted
        if (hideCompleted) {
            result = result.filter(o => o.status !== 'Đã giao' && o.status !== 'Đã hủy');
        }
        const q = searchText.trim().toLowerCase();
        if (!q) return result;
        return result.filter(o =>
            o._id.slice(-8).toLowerCase().includes(q) ||
            o.customerName?.toLowerCase().includes(q) ||
            o.phone?.includes(q) ||
            (o.voucherCode && o.voucherCode.toLowerCase().includes(q))
        );
    }, [orders, searchText, hideCompleted]);

    // Thống kê nhanh
    const stats = useMemo(() => ({
        total:     orders.length,
        revenue:   orders.filter(o => o.status === 'Đã giao').reduce((s, o) => s + (o.totalAmount || 0), 0),
        pending:   orders.filter(o => o.status === 'Chờ xác nhận').length,
        vouchers:  orders.filter(o => o.voucherCode).length,
        completed: orders.filter(o => o.status === 'Đã giao' || o.status === 'Đã hủy').length,
    }), [orders]);

    const getSubtotal = (order) =>
        order.subtotalAmount || order.items?.reduce((s, i) => s + i.price * i.quantity, 0) || 0;

    // Component hiển thị badge thanh toán
    // Chỉ hiện nút khi CHƯA thanh toán → cho phép đánh dấu đã thanh toán
    // Khi đã thanh toán → chỉ hiện tag, không cho bỏ
    const PaidBadge = ({ isPaid, paymentMethod, orderId, size = 'normal' }) => (
        <div>
            <Tag
                color={isPaid ? 'success' : 'warning'}
                icon={isPaid ? <CheckCircleOutlined /> : <ClockCircleOutlined />}
                style={{ fontSize: size === 'small' ? 11 : 12, marginBottom: 4 }}
            >
                {isPaid ? 'Đã thanh toán' : 'Chưa thanh toán'}
            </Tag>
            {size !== 'small' && (
                <div style={{ fontSize: 11, color: '#aaa', marginTop: 2 }}>
                    {paymentMethod || 'COD'}
                </div>
            )}
            {orderId && !isPaid && (
                <Tooltip title="Xác nhận đã thu tiền">
                    <Button
                        size="small"
                        type="primary"
                        ghost
                        icon={<CheckCircleOutlined />}
                        onClick={() => markAsPaid(orderId)}
                        style={{ marginTop: 4, fontSize: 11, height: 22, padding: '0 8px' }}
                    >
                        Xác nhận
                    </Button>
                </Tooltip>
            )}
        </div>
    );

    const columns = [
        {
            title: 'Mã đơn', dataIndex: '_id', width: 130,
            render: id => <b style={{ color: '#1890ff' }}>#{id.slice(-8).toUpperCase()}</b>,
        },
        {
            title: 'Khách hàng', dataIndex: 'customerName',
        },
        {
            title: 'SĐT', dataIndex: 'phone', width: 120,
        },
        {
            title: 'Địa điểm', dataIndex: 'province', width: 140,
            render: p => p
                ? <span style={{ fontSize: 13 }}>📍 {p}</span>
                : <span style={{ color: '#ccc' }}>—</span>,
        },
        {
            title: 'Voucher', dataIndex: 'voucherCode', width: 140,
            render: (code, record) => !code ? <span style={{ color: '#ccc' }}>—</span> : (
                <div>
                    <Tag color="success" icon={<TagOutlined />} style={{ fontWeight: 700 }}>{code}</Tag>
                    {record.discountAmount > 0 && (
                        <div style={{ fontSize: 11, color: GREEN, marginTop: 2 }}>
                            -{record.discountAmount.toLocaleString('vi-VN')}đ
                        </div>
                    )}
                </div>
            ),
        },
        {
            title: 'Phí ship', dataIndex: 'shippingFee', width: 110,
            render: fee => fee > 0
                ? <span style={{ color: '#555', fontWeight: 600 }}>{fee.toLocaleString('vi-VN')}đ</span>
                : <Tag color="success" style={{ fontSize: 11 }}>Miễn phí</Tag>,
        },
        {
            title: 'Tổng tiền', dataIndex: 'totalAmount', width: 150,
            render: (amount, record) => (
                <div>
                    {record.discountAmount > 0 && (
                        <div style={{ fontSize: 11, color: '#aaa', textDecoration: 'line-through' }}>
                            {getSubtotal(record).toLocaleString('vi-VN')}đ
                        </div>
                    )}
                    <span style={{ fontWeight: 700, color: RED, fontSize: 15 }}>
                        {amount.toLocaleString('vi-VN')}đ
                    </span>
                </div>
            ),
        },
        {
            title: 'Thanh toán', dataIndex: 'isPaid', width: 150,
            render: (isPaid, record) => (
                <PaidBadge
                    isPaid={isPaid}
                    paymentMethod={record.paymentMethod}
                    orderId={record._id}
                />
            ),
        },
        {
            title: 'Trạng thái', dataIndex: 'status', width: 175,
            render: (status, record) => (
                <Select value={status} onChange={val => updateOrderStatus(record._id, val)} style={{ width: 165 }}>
                    {Object.entries(STATUS_COLORS).map(([s, color]) => (
                        <Option key={s} value={s}><Tag color={color}>{s}</Tag></Option>
                    ))}
                </Select>
            ),
        },
        {
            title: 'Ngày đặt', dataIndex: 'createdAt', width: 155,
            render: date => new Date(date).toLocaleString('vi-VN'),
        },
        {
            title: 'Hành động', width: 70, fixed: 'right',
            render: (_, record) => (
                <Button
                    type="primary" ghost size="small"
                    icon={<EyeOutlined />}
                    onClick={() => { setSelectedOrder(record); setIsModalVisible(true); }}
                />
            ),
        },
    ];

    return (
        <div style={{ padding: 20 }}>

            {/* Thống kê nhanh */}
            <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
                {[
                    { title: 'Tổng đơn hàng',      value: stats.total,    icon: <ShoppingOutlined />, color: '#1890ff' },
                    { title: 'Chờ xác nhận',        value: stats.pending,  icon: <ShoppingOutlined />, color: '#fa8c16' },
                    { title: 'Doanh thu (Đã giao)', value: stats.revenue,  icon: <DollarOutlined />,   color: RED,
                      formatter: v => v.toLocaleString('vi-VN'), suffix: 'đ' },
                    { title: 'Đơn dùng voucher',    value: stats.vouchers, icon: <GiftOutlined />,     color: GREEN },
                ].map((s, i) => (
                    <Col xs={12} md={6} key={i}>
                        <Card style={{ borderRadius: 12, borderTop: `3px solid ${s.color}` }}>
                            <Statistic
                                title={<span style={{ fontSize: 13 }}>{s.icon} {s.title}</span>}
                                value={s.value}
                                formatter={s.formatter}
                                suffix={s.suffix}
                                valueStyle={{ color: s.color, fontSize: 22, fontWeight: 700 }}
                            />
                        </Card>
                    </Col>
                ))}
            </Row>

            <Card>
                {/* Toolbar */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
                    <Title level={3} style={{ margin: 0 }}>📦 Quản lý đơn hàng</Title>
                    <Space wrap>
                        <Input
                            allowClear
                            placeholder="Tìm mã đơn, tên KH, SĐT, voucher..."
                            prefix={<SearchOutlined style={{ color: '#bbb' }} />}
                            value={searchText}
                            onChange={e => setSearchText(e.target.value)}
                            style={{ width: 280 }}
                        />
                        {/* Toggle ẩn đơn đã giao / đã hủy */}
                        <Tooltip title={hideCompleted
                            ? `Đang ẩn ${stats.completed} đơn đã giao & đã hủy — bấm để hiện`
                            : 'Đang hiển thị tất cả — bấm để ẩn đơn hoàn tất'
                        }>
                            <div style={{
                                display: 'flex', alignItems: 'center', gap: 6,
                                background: hideCompleted ? '#fff7e6' : '#f6ffed',
                                border: `1px solid ${hideCompleted ? '#ffd591' : '#b7eb8f'}`,
                                borderRadius: 6, padding: '4px 10px', cursor: 'pointer',
                                fontSize: 13, color: hideCompleted ? '#d48806' : '#52c41a',
                            }} onClick={() => setHideCompleted(v => !v)}>
                                <EyeInvisibleOutlined />
                                <span>
                                    {hideCompleted
                                        ? `Ẩn hoàn tất (${stats.completed})`
                                        : 'Hiện tất cả'
                                    }
                                </span>
                                <span onClick={e => e.stopPropagation()}>
                                    <Switch
                                        size="small"
                                        checked={hideCompleted}
                                        onChange={setHideCompleted}
                                    />
                                </span>
                            </div>
                        </Tooltip>
                        <Button icon={<ReloadOutlined />} onClick={fetchOrders}>Làm mới</Button>
                    </Space>
                </div>

                {searchText && (
                    <div style={{ marginBottom: 10, fontSize: 13, color: '#888' }}>
                        Tìm thấy <b style={{ color: '#333' }}>{filtered.length}</b> đơn cho "<b>{searchText}</b>"
                    </div>
                )}
                {hideCompleted && stats.completed > 0 && !searchText && (
                    <div style={{
                        marginBottom: 10, fontSize: 13,
                        color: '#d48806', background: '#fffbe6',
                        border: '1px solid #ffe58f', borderRadius: 6,
                        padding: '6px 12px', display: 'inline-block',
                    }}>
                        <EyeInvisibleOutlined style={{ marginRight: 5 }} />
                        Đang ẩn <b>{stats.completed}</b> đơn đã giao/đã hủy. Dữ liệu vẫn còn trong hệ thống.
                    </div>
                )}

                <Table
                    columns={columns}
                    dataSource={filtered}
                    rowKey="_id"
                    loading={loading}
                    pagination={{ pageSize: 10, showSizeChanger: true }}
                    scroll={{ x: 1450 }}
                    rowClassName={r => r.status === 'Đã hủy' ? 'row-cancelled' : ''}
                />
            </Card>

            {/* MODAL CHI TIẾT */}
            <Modal
                title={<span style={{ fontWeight: 700 }}>📋 Chi tiết đơn #{selectedOrder?._id.slice(-8).toUpperCase()}</span>}
                open={isModalVisible}
                onCancel={() => setIsModalVisible(false)}
                footer={<Button onClick={() => setIsModalVisible(false)}>Đóng</Button>}
                width={740}
            >
                {selectedOrder && (() => {
                    const subtotal = getSubtotal(selectedOrder);
                    const discount = selectedOrder.discountAmount || 0;
                    const shipping = selectedOrder.shippingFee    || 0;
                    const total    = selectedOrder.totalAmount;

                    return (
                        <div>
                            {/* Thông tin khách */}
                            <div style={{
                                background: '#fafafa', borderRadius: 8, padding: '12px 16px',
                                marginBottom: 16, border: '1px solid #f0f0f0',
                                display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12,
                            }}>
                                <div style={{ lineHeight: 1.9 }}>
                                    <div><Text strong>Họ tên: </Text>{selectedOrder.customerName}</div>
                                    <div><Text strong>Điện thoại: </Text>{selectedOrder.phone}</div>
                                    <div><Text strong>Địa chỉ: </Text>{selectedOrder.address}</div>
                                    {selectedOrder.province && (
                                        <div><Text strong>Tỉnh/TP: </Text>📍 {selectedOrder.province}</div>
                                    )}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <Text strong>Thanh toán: </Text>
                                        <span>{selectedOrder.paymentMethod || 'COD'}</span>
                                        <Tag
                                            color={selectedOrder.isPaid ? 'success' : 'warning'}
                                            icon={selectedOrder.isPaid ? <CheckCircleOutlined /> : <ClockCircleOutlined />}
                                            style={{ fontSize: 12, marginLeft: 4 }}
                                        >
                                            {selectedOrder.isPaid ? 'Đã thanh toán' : 'Chưa thanh toán'}
                                        </Tag>
                                        {!selectedOrder.isPaid && (
                                            <Tooltip title="Xác nhận đã thu tiền">
                                                <Button
                                                    size="small"
                                                    type="primary"
                                                    ghost
                                                    icon={<CheckCircleOutlined />}
                                                    onClick={() => markAsPaid(selectedOrder._id)}
                                                    style={{ fontSize: 11, height: 22, padding: '0 8px' }}
                                                >
                                                    Xác nhận
                                                </Button>
                                            </Tooltip>
                                        )}
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ marginBottom: 6 }}><Text strong>Trạng thái:</Text></div>
                                    <Tag
                                        color={STATUS_COLORS[selectedOrder.status] || 'default'}
                                        style={{ fontSize: 13, padding: '3px 10px' }}
                                    >
                                        {selectedOrder.status?.toUpperCase()}
                                    </Tag>
                                    <div style={{ marginTop: 10, fontSize: 12, color: '#aaa' }}>
                                        🕐 {new Date(selectedOrder.createdAt).toLocaleString('vi-VN')}
                                    </div>
                                </div>
                            </div>

                            {/* Danh sách sản phẩm */}
                            <Table
                                dataSource={selectedOrder.items}
                                columns={[
                                    { title: 'Sản phẩm', dataIndex: 'name' },
                                    { title: 'SL', dataIndex: 'quantity', align: 'center', width: 60 },
                                    { title: 'Đơn giá', dataIndex: 'price', width: 110, render: p => `${p.toLocaleString('vi-VN')}đ` },
                                    {
                                        title: 'Thành tiền', align: 'right', width: 120,
                                        render: (_, item) => <b>{(item.price * item.quantity).toLocaleString('vi-VN')}đ</b>,
                                    },
                                ]}
                                pagination={false}
                                rowKey={item => item._id || Math.random()}
                                size="small"
                            />

                            <Divider style={{ margin: '14px 0' }} />

                            {/* Tóm tắt tiền */}
                            <div style={{ maxWidth: 340, marginLeft: 'auto' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 7, color: '#555', fontSize: 14 }}>
                                    <span>Tạm tính:</span>
                                    <span>{subtotal.toLocaleString('vi-VN')}đ</span>
                                </div>

                                {discount > 0 && (
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 7, color: GREEN, fontSize: 14 }}>
                                        <span>
                                            <TagOutlined style={{ marginRight: 5 }} />
                                            Voucher {selectedOrder.voucherCode ? `(${selectedOrder.voucherCode})` : ''}:
                                        </span>
                                        <span style={{ fontWeight: 700 }}>-{discount.toLocaleString('vi-VN')}đ</span>
                                    </div>
                                )}

                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 7, color: '#555', fontSize: 14, alignItems: 'center' }}>
                                    <span><CarOutlined style={{ marginRight: 5 }} />Phí giao hàng:</span>
                                    {shipping === 0
                                        ? <Tag color="success" style={{ fontSize: 12 }}>Miễn phí 🎉</Tag>
                                        : <span style={{ fontWeight: 600 }}>{shipping.toLocaleString('vi-VN')}đ</span>
                                    }
                                </div>

                                <Divider style={{ margin: '8px 0' }} />

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Title level={4} style={{ margin: 0 }}>Tổng cộng:</Title>
                                    <Title level={3} style={{ margin: 0, color: RED }}>
                                        {total.toLocaleString('vi-VN')}đ
                                    </Title>
                                </div>
                            </div>
                        </div>
                    );
                })()}
            </Modal>

            <style>{`.row-cancelled td { opacity: 0.5; }`}</style>
        </div>
    );
};

export default OrderManagement;