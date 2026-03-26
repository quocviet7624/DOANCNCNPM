// pages/admin/AdminReviews.jsx
import React, { useState, useEffect, useCallback } from 'react';
import {
    Table, Button, Tag, Rate, Avatar, Input, Select, Space,
    Popconfirm, message, Modal, Card, Row, Col, Statistic,
    Tooltip, Empty, Typography, Divider, Progress
} from 'antd';
import {
    DeleteOutlined, EyeOutlined, SearchOutlined,
    StarFilled, UserOutlined, MessageOutlined,
    CheckCircleOutlined, ReloadOutlined, ExclamationCircleOutlined,
    FilterOutlined, BarChartOutlined
} from '@ant-design/icons';
import axios from 'axios';

const { Search } = Input;
const { Option } = Select;
const { Text } = Typography;

const RED     = '#c8232c';
const API     = 'http://localhost:5000/api';
const getToken = () => localStorage.getItem('token');

// ─── Màu theo số sao ────────────────────────────────────────────────────────
const STAR_COLOR = { 5: '#52c41a', 4: '#73d13d', 3: '#faad14', 2: '#ff7a45', 1: '#f5222d' };
const STAR_LABEL = { 5: 'Xuất sắc', 4: 'Tốt', 3: 'Trung bình', 2: 'Tệ', 1: 'Rất tệ' };

const RatingTag = ({ rating }) => (
    <Tag
        color={STAR_COLOR[rating] || '#999'}
        style={{ fontWeight: 700, fontSize: 12, borderRadius: 4 }}
    >
        {rating} <StarFilled style={{ fontSize: 10 }} /> {STAR_LABEL[rating] || ''}
    </Tag>
);

// ─── AdminReviews ────────────────────────────────────────────────────────────
const AdminReviews = () => {
    const [reviews,        setReviews]        = useState([]);
    const [filtered,       setFiltered]       = useState([]);
    const [products,       setProducts]       = useState([]);
    const [stats,          setStats]          = useState({ total: 0, avgRating: 0, fiveStars: 0, oneStars: 0 });
    const [loading,        setLoading]        = useState(true);
    const [deleting,       setDeleting]       = useState(null);
    const [detailModal,    setDetailModal]    = useState(null);
    const [searchText,     setSearchText]     = useState('');
    const [filterRating,   setFilterRating]   = useState('all');
    const [filterProduct,  setFilterProduct]  = useState('all');
    const [statsVisible,   setStatsVisible]   = useState(false);
    const [byRating,       setByRating]       = useState({});

    // ── Fetch ─────────────────────────────────────────────────────────────────
    const fetchAll = useCallback(async () => {
        setLoading(true);
        try {
            const headers = { Authorization: `Bearer ${getToken()}` };

            // Gọi API review tổng hợp
            const [reviewsRes, productsRes] = await Promise.all([
                axios.get(`${API}/reviews`, { headers }),
                axios.get(`${API}/products`),
            ]);

            const { reviews: data, stats: s } = reviewsRes.data;
            setReviews(data);
            setFiltered(data);
            setStats(s);

            // byRating để vẽ progress bar
            const br = [1, 2, 3, 4, 5].reduce((acc, n) => {
                acc[n] = data.filter(r => r.rating === n).length;
                return acc;
            }, {});
            setByRating(br);

            // Lọc sản phẩm có review
            setProducts(productsRes.data.filter(p => (p.reviews || []).length > 0));
        } catch (err) {
            // Fallback: fetch trực tiếp từ products nếu /api/reviews chưa có
            try {
                const res = await axios.get(`${API}/products`);
                const allProducts = res.data;
                setProducts(allProducts.filter(p => (p.reviews || []).length > 0));

                const allReviews = [];
                allProducts.forEach(product => {
                    (product.reviews || []).forEach(review => {
                        allReviews.push({
                            ...review,
                            key:         `${product._id}_${review._id}`,
                            productId:   product._id,
                            productName: product.name,
                            productImg:  product.image,
                        });
                    });
                });
                allReviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                setReviews(allReviews);
                setFiltered(allReviews);

                const total      = allReviews.length;
                const avgRating  = total
                    ? (allReviews.reduce((s, r) => s + r.rating, 0) / total).toFixed(1)
                    : 0;
                const fiveStars  = allReviews.filter(r => r.rating === 5).length;
                const oneStars   = allReviews.filter(r => r.rating === 1).length;
                setStats({ total, avgRating, fiveStars, oneStars });

                const br = [1, 2, 3, 4, 5].reduce((acc, n) => {
                    acc[n] = allReviews.filter(r => r.rating === n).length;
                    return acc;
                }, {});
                setByRating(br);
            } catch (e2) {
                message.error('Lỗi tải dữ liệu đánh giá!');
            }
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    // ── Filter ────────────────────────────────────────────────────────────────
    useEffect(() => {
        let data = [...reviews];
        if (searchText) {
            const q = searchText.toLowerCase();
            data = data.filter(r =>
                r.username?.toLowerCase().includes(q)    ||
                r.comment?.toLowerCase().includes(q)     ||
                r.productName?.toLowerCase().includes(q)
            );
        }
        if (filterRating  !== 'all') data = data.filter(r => r.rating    === Number(filterRating));
        if (filterProduct !== 'all') data = data.filter(r => r.productId === filterProduct);
        setFiltered(data);
    }, [searchText, filterRating, filterProduct, reviews]);

    // ── Xóa ───────────────────────────────────────────────────────────────────
    const handleDelete = async (review) => {
        const key = review.key || `${review.productId}_${review._id}`;
        setDeleting(key);
        try {
            await axios.delete(
                `${API}/reviews/${review.productId}/${review._id}`,
                { headers: { Authorization: `Bearer ${getToken()}` } }
            );
            message.success('Đã xóa đánh giá!');
            setDetailModal(null);
            fetchAll();
        } catch (err) {
            // Fallback: thử endpoint cũ trong productRoutes
            try {
                await axios.delete(
                    `${API}/products/${review.productId}/reviews/${review._id}`,
                    { headers: { Authorization: `Bearer ${getToken()}` } }
                );
                message.success('Đã xóa đánh giá!');
                setDetailModal(null);
                fetchAll();
            } catch (e2) {
                message.error(e2.response?.data?.message || 'Lỗi xóa đánh giá!');
            }
        } finally {
            setDeleting(null);
        }
    };

    // ── Columns ───────────────────────────────────────────────────────────────
    const columns = [
        {
            title: '#',
            width: 48,
            render: (_, __, i) => <Text type="secondary" style={{ fontSize: 12 }}>{i + 1}</Text>,
        },
        {
            title: 'Khách hàng',
            dataIndex: 'username',
            width: 160,
            render: (name) => (
                <Space>
                    <Avatar size={32} icon={<UserOutlined />} style={{ background: RED, flexShrink: 0 }} />
                    <Text strong style={{ fontSize: 13 }}>{name || 'Ẩn danh'}</Text>
                </Space>
            ),
        },
        {
            title: 'Sản phẩm',
            dataIndex: 'productName',
            ellipsis: true,
            render: (name, row) => (
                <Space>
                    {row.productImg && (
                        <img
                            src={row.productImg} alt=""
                            style={{ width: 34, height: 34, objectFit: 'cover', borderRadius: 4, border: '1px solid #eee', flexShrink: 0 }}
                        />
                    )}
                    <Tooltip title={name}>
                        <Text style={{ fontSize: 13 }}>{name}</Text>
                    </Tooltip>
                </Space>
            ),
        },
        {
            title: 'Sao',
            dataIndex: 'rating',
            width: 130,
            align: 'center',
            sorter: (a, b) => a.rating - b.rating,
            render: (r) => <RatingTag rating={r} />,
        },
        {
            title: 'Nội dung',
            dataIndex: 'comment',
            ellipsis: true,
            render: (text) => (
                <Tooltip title={text}>
                    <Text style={{ fontSize: 13, color: '#555' }}>{text}</Text>
                </Tooltip>
            ),
        },
        {
            title: 'Ngày đăng',
            dataIndex: 'createdAt',
            width: 110,
            sorter: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
            defaultSortOrder: 'descend',
            render: (d) => d
                ? <Text type="secondary" style={{ fontSize: 12 }}>
                    {new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                  </Text>
                : '—',
        },
        {
            title: 'Thao tác',
            width: 90,
            align: 'center',
            render: (_, row) => {
                const key = row.key || `${row.productId}_${row._id}`;
                return (
                    <Space>
                        <Tooltip title="Xem chi tiết">
                            <Button
                                size="small"
                                icon={<EyeOutlined />}
                                onClick={() => setDetailModal(row)}
                                style={{ borderColor: '#1890ff', color: '#1890ff' }}
                            />
                        </Tooltip>
                        <Tooltip title="Xóa">
                            <Popconfirm
                                title="Xóa đánh giá này?"
                                description="Hành động này không thể hoàn tác."
                                icon={<ExclamationCircleOutlined style={{ color: RED }} />}
                                okText="Xóa" cancelText="Hủy"
                                okButtonProps={{ danger: true }}
                                onConfirm={() => handleDelete(row)}
                            >
                                <Button
                                    size="small" danger
                                    icon={<DeleteOutlined />}
                                    loading={deleting === key}
                                />
                            </Popconfirm>
                        </Tooltip>
                    </Space>
                );
            },
        },
    ];

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <div>
            {/* Tiêu đề */}
            <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#1a1a1a' }}>
                        💬 Quản lý đánh giá
                    </h2>
                    <Text type="secondary" style={{ fontSize: 13 }}>
                        Xem và kiểm duyệt tất cả đánh giá sản phẩm
                    </Text>
                </div>
                <Space>
                    <Button
                        icon={<BarChartOutlined />}
                        onClick={() => setStatsVisible(true)}
                    >
                        Thống kê chi tiết
                    </Button>
                    <Button icon={<ReloadOutlined />} onClick={fetchAll} loading={loading}>
                        Làm mới
                    </Button>
                </Space>
            </div>

            {/* Stats cards */}
            <Row gutter={[14, 14]} style={{ marginBottom: 20 }}>
                {[
                    {
                        title: 'Tổng đánh giá',
                        value: stats.total,
                        prefix: <MessageOutlined />,
                        color: '#1890ff',
                    },
                    {
                        title: 'Điểm trung bình',
                        value: stats.avgRating,
                        prefix: <StarFilled />,
                        color: '#faad14',
                        suffix: ' ★',
                    },
                    {
                        title: '5 Sao ⭐⭐⭐⭐⭐',
                        value: stats.fiveStars,
                        prefix: <CheckCircleOutlined />,
                        color: '#52c41a',
                    },
                    {
                        title: '1 Sao ⭐',
                        value: stats.oneStars,
                        prefix: <ExclamationCircleOutlined />,
                        color: RED,
                    },
                ].map((s, i) => (
                    <Col xs={12} sm={6} key={i}>
                        <Card
                            size="small"
                            loading={loading}
                            style={{ borderRadius: 8, border: '1px solid #f0f0f0', textAlign: 'center' }}
                            bodyStyle={{ padding: '16px 12px' }}
                        >
                            <Statistic
                                title={<span style={{ fontSize: 12, color: '#888' }}>{s.title}</span>}
                                value={s.value}
                                prefix={React.cloneElement(s.prefix, { style: { color: s.color } })}
                                suffix={s.suffix}
                                valueStyle={{ color: s.color, fontSize: 24, fontWeight: 700 }}
                            />
                        </Card>
                    </Col>
                ))}
            </Row>

            {/* Bộ lọc */}
            <Card
                size="small"
                style={{ marginBottom: 16, borderRadius: 8, border: '1px solid #e8e8e8' }}
                bodyStyle={{ padding: '12px 16px' }}
            >
                <Row gutter={[12, 10]} align="middle">
                    <Col xs={24} sm={9}>
                        <Search
                            placeholder="Tìm tên khách hàng, sản phẩm, nội dung..."
                            allowClear
                            value={searchText}
                            onChange={e => setSearchText(e.target.value)}
                            prefix={<SearchOutlined style={{ color: '#aaa' }} />}
                        />
                    </Col>
                    <Col xs={12} sm={5}>
                        <Select
                            style={{ width: '100%' }}
                            value={filterRating}
                            onChange={setFilterRating}
                            suffixIcon={<FilterOutlined />}
                        >
                            <Option value="all">⭐ Tất cả sao</Option>
                            {[5, 4, 3, 2, 1].map(n => (
                                <Option key={n} value={String(n)}>
                                    {n} sao — {byRating[n] || 0} đánh giá
                                </Option>
                            ))}
                        </Select>
                    </Col>
                    <Col xs={12} sm={8}>
                        <Select
                            style={{ width: '100%' }}
                            value={filterProduct}
                            onChange={setFilterProduct}
                            showSearch
                            optionFilterProp="children"
                            placeholder="📦 Lọc theo sản phẩm"
                        >
                            <Option value="all">📦 Tất cả sản phẩm</Option>
                            {products.map(p => (
                                <Option key={p._id} value={p._id}>
                                    {p.name} ({(p.reviews || []).length})
                                </Option>
                            ))}
                        </Select>
                    </Col>
                    <Col xs={24} sm={2}>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                            {filtered.length} kết quả
                        </Text>
                    </Col>
                </Row>
            </Card>

            {/* Bảng */}
            <Card
                style={{ borderRadius: 8, border: '1px solid #e8e8e8' }}
                bodyStyle={{ padding: 0 }}
            >
                <Table
                    columns={columns}
                    dataSource={filtered.map((r, i) => ({ ...r, key: r.key || `${r.productId}_${r._id}_${i}` }))}
                    loading={loading}
                    rowKey="key"
                    size="middle"
                    scroll={{ x: 800 }}
                    pagination={{
                        pageSize: 15,
                        showSizeChanger: true,
                        pageSizeOptions: ['10', '15', '25', '50'],
                        showTotal: (total, range) =>
                            `${range[0]}-${range[1]} / ${total} đánh giá`,
                    }}
                    locale={{
                        emptyText: (
                            <Empty
                                image={Empty.PRESENTED_IMAGE_SIMPLE}
                                description={<Text type="secondary">Chưa có đánh giá nào</Text>}
                            />
                        ),
                    }}
                />
            </Card>

            {/* ── Modal chi tiết ──────────────────────────────────────── */}
            <Modal
                open={!!detailModal}
                onCancel={() => setDetailModal(null)}
                title={<span style={{ color: RED }}>📋 Chi tiết đánh giá</span>}
                width={520}
                footer={[
                    <Button key="close" onClick={() => setDetailModal(null)}>
                        Đóng
                    </Button>,
                    <Popconfirm
                        key="del"
                        title="Xóa đánh giá này?"
                        okText="Xóa" cancelText="Hủy"
                        okButtonProps={{ danger: true }}
                        onConfirm={() => handleDelete(detailModal)}
                    >
                        <Button danger icon={<DeleteOutlined />}>
                            Xóa đánh giá
                        </Button>
                    </Popconfirm>,
                ]}
            >
                {detailModal && (
                    <div>
                        {/* Sản phẩm */}
                        <div style={{
                            display: 'flex', gap: 12, alignItems: 'center',
                            background: '#fafafa', padding: 12, borderRadius: 8, marginBottom: 16
                        }}>
                            {detailModal.productImg && (
                                <img
                                    src={detailModal.productImg} alt=""
                                    style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 6, border: '1px solid #eee' }}
                                />
                            )}
                            <div>
                                <div style={{ fontSize: 11, color: '#aaa', marginBottom: 2 }}>SẢN PHẨM</div>
                                <Text strong style={{ fontSize: 14 }}>{detailModal.productName}</Text>
                            </div>
                        </div>

                        <Divider style={{ margin: '10px 0' }} />

                        <Row gutter={16} style={{ marginBottom: 14 }}>
                            <Col span={12}>
                                <div style={{ fontSize: 11, color: '#aaa', marginBottom: 4 }}>KHÁCH HÀNG</div>
                                <Space>
                                    <Avatar size={28} icon={<UserOutlined />} style={{ background: RED }} />
                                    <Text strong>{detailModal.username || 'Ẩn danh'}</Text>
                                </Space>
                            </Col>
                            <Col span={12}>
                                <div style={{ fontSize: 11, color: '#aaa', marginBottom: 4 }}>THỜI GIAN</div>
                                <Text style={{ fontSize: 13 }}>
                                    {detailModal.createdAt
                                        ? new Date(detailModal.createdAt).toLocaleString('vi-VN')
                                        : '—'}
                                </Text>
                            </Col>
                        </Row>

                        <div style={{ marginBottom: 14 }}>
                            <div style={{ fontSize: 11, color: '#aaa', marginBottom: 6 }}>ĐÁNH GIÁ</div>
                            <Space align="center">
                                <Rate disabled value={detailModal.rating} style={{ fontSize: 20 }} />
                                <RatingTag rating={detailModal.rating} />
                            </Space>
                        </div>

                        <div>
                            <div style={{ fontSize: 11, color: '#aaa', marginBottom: 6 }}>NỘI DUNG NHẬN XÉT</div>
                            <div style={{
                                background: '#f8f8f8', border: '1px solid #eee',
                                borderRadius: 6, padding: '10px 14px',
                                lineHeight: 1.7, color: '#333', fontSize: 14,
                                minHeight: 60,
                            }}>
                                {detailModal.comment || (
                                    <Text type="secondary" italic>Không có nội dung</Text>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </Modal>

            {/* ── Modal thống kê chi tiết ─────────────────────────────── */}
            <Modal
                open={statsVisible}
                onCancel={() => setStatsVisible(false)}
                title={<span>📊 Thống kê đánh giá chi tiết</span>}
                footer={<Button onClick={() => setStatsVisible(false)}>Đóng</Button>}
                width={460}
            >
                <div style={{ padding: '8px 0' }}>
                    {/* Điểm trung bình lớn */}
                    <div style={{ textAlign: 'center', marginBottom: 20 }}>
                        <div style={{ fontSize: 52, fontWeight: 700, color: '#faad14', lineHeight: 1 }}>
                            {stats.avgRating}
                        </div>
                        <Rate disabled allowHalf value={Number(stats.avgRating)} style={{ fontSize: 22 }} />
                        <div style={{ color: '#888', fontSize: 13, marginTop: 4 }}>
                            trên {stats.total} đánh giá
                        </div>
                    </div>

                    <Divider style={{ margin: '12px 0' }} />

                    {/* Phân bổ sao */}
                    {[5, 4, 3, 2, 1].map(n => {
                        const count   = byRating[n] || 0;
                        const percent = stats.total ? Math.round((count / stats.total) * 100) : 0;
                        return (
                            <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                                <div style={{ width: 44, textAlign: 'right', fontSize: 13, fontWeight: 600, color: '#555', flexShrink: 0 }}>
                                    {n} ★
                                </div>
                                <Progress
                                    percent={percent}
                                    strokeColor={STAR_COLOR[n]}
                                    trailColor="#f0f0f0"
                                    showInfo={false}
                                    style={{ flex: 1, margin: 0 }}
                                />
                                <div style={{ width: 70, fontSize: 12, color: '#888', flexShrink: 0 }}>
                                    {count} ({percent}%)
                                </div>
                            </div>
                        );
                    })}
                </div>
            </Modal>
        </div>
    );
};

export default AdminReviews;