import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Spin, Empty, message, Rate } from 'antd';
import { HeartFilled, ShoppingCartOutlined, DeleteOutlined } from '@ant-design/icons';
import { fetchWishlist, removeWishlistItem } from '../api/wishlistAPI';

const RED = '#c8232c';

const WishlistPage = () => {
    const navigate = useNavigate();
    const [items, setItems]     = useState([]);
    const [loading, setLoading] = useState(true);

    const getUserId = () => {
        try {
            const u = JSON.parse(localStorage.getItem('user'));
            return u?._id || u?.id || null;
        } catch { return null; }
    };

    const userId = getUserId();

    const loadWishlist = useCallback(async () => {
        if (!userId) { setLoading(false); return; }
        try {
            const data = await fetchWishlist(userId);
            setItems(data);
        } catch {
            message.error('Không tải được danh sách yêu thích');
        } finally {
            setLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        window.scrollTo(0, 0);
        loadWishlist();
    }, [loadWishlist]);

    const handleRemove = async (productId, productName) => {
        try {
            await removeWishlistItem(userId, productId);
            setItems(prev => prev.filter(p => p._id !== productId));
            message.success(`Đã bỏ yêu thích "${productName}"`);
        } catch {
            message.error('Có lỗi xảy ra');
        }
    };

    const addToCart = (product) => {
        if (!userId) { navigate('/login'); return; }
        const cart = JSON.parse(localStorage.getItem('cart') || '[]');
        const existing = cart.find(i => i._id === product._id);
        if (existing) {
            existing.quantity += 1;
        } else {
            cart.push({ ...product, quantity: 1 });
        }
        localStorage.setItem('cart', JSON.stringify(cart));
        window.dispatchEvent(new Event('storage'));
        message.success(`Đã thêm "${product.name}" vào giỏ!`);
    };

    if (!userId) {
        return (
            <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
                <HeartFilled style={{ fontSize: 64, color: '#f5c6c8' }} />
                <h2 style={{ color: '#555' }}>Vui lòng đăng nhập để xem danh sách yêu thích</h2>
                <button
                    onClick={() => navigate('/login')}
                    style={{ background: RED, color: '#fff', border: 'none', padding: '10px 28px', borderRadius: 6, fontSize: 15, cursor: 'pointer', fontWeight: 600 }}
                >
                    Đăng nhập
                </button>
            </div>
        );
    }

    return (
        <div style={{ background: '#f5f5f5', minHeight: '100vh', padding: '24px 0' }}>
            <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 16px' }}>

                {/* Header */}
                <div style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    background: '#fff', borderRadius: 4, padding: '16px 20px',
                    marginBottom: 20, border: '1px solid #e8e8e8',
                    borderLeft: `4px solid ${RED}`,
                }}>
                    <HeartFilled style={{ fontSize: 22, color: RED }} />
                    <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#222' }}>
                        Sản phẩm yêu thích
                    </h1>
                    {!loading && (
                        <span style={{
                            marginLeft: 'auto', background: RED, color: '#fff',
                            borderRadius: 20, padding: '2px 12px', fontSize: 13, fontWeight: 600,
                        }}>
                            {items.length} sản phẩm
                        </span>
                    )}
                </div>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: 80 }}>
                        <Spin size="large" />
                    </div>
                ) : items.length === 0 ? (
                    <div style={{
                        background: '#fff', borderRadius: 4, padding: '60px 20px',
                        border: '1px solid #e8e8e8', textAlign: 'center',
                    }}>
                        <Empty
                            image={<HeartFilled style={{ fontSize: 72, color: '#f5c6c8' }} />}
                            imageStyle={{ height: 80 }}
                            description={
                                <div>
                                    <div style={{ fontSize: 16, color: '#555', fontWeight: 600, marginBottom: 8 }}>
                                        Chưa có sản phẩm yêu thích
                                    </div>
                                    <div style={{ color: '#999', fontSize: 13 }}>
                                        Nhấn ❤ trên sản phẩm để lưu vào đây
                                    </div>
                                </div>
                            }
                        >
                            <button
                                onClick={() => navigate('/products')}
                                style={{
                                    background: RED, color: '#fff', border: 'none',
                                    padding: '10px 28px', borderRadius: 6, fontSize: 14,
                                    cursor: 'pointer', fontWeight: 600, marginTop: 8,
                                }}
                            >
                                Khám phá sản phẩm
                            </button>
                        </Empty>
                    </div>
                ) : (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                        gap: 16,
                    }}>
                        {items.map(product => (
                            <WishlistCard
                                key={product._id}
                                product={product}
                                onRemove={handleRemove}
                                onAddCart={addToCart}
                                onNavigate={() => navigate(`/product/${product._id}`)}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

const WishlistCard = ({ product, onRemove, onAddCart, onNavigate }) => {
    const [hovered, setHovered] = useState(false);

    return (
        <div
            style={{
                background: '#fff',
                border: '1px solid #eee',
                borderRadius: 6,
                overflow: 'hidden',
                transition: 'box-shadow 0.2s, transform 0.2s',
                boxShadow: hovered ? '0 6px 20px rgba(0,0,0,0.12)' : '0 1px 4px rgba(0,0,0,0.06)',
                transform: hovered ? 'translateY(-3px)' : 'none',
                position: 'relative',
            }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            {/* Nút bỏ yêu thích */}
            <button
                onClick={(e) => { e.stopPropagation(); onRemove(product._id, product.name); }}
                title="Bỏ yêu thích"
                style={{
                    position: 'absolute', top: 10, right: 10, zIndex: 2,
                    background: '#fff', border: '1px solid #f5c6c8',
                    borderRadius: '50%', width: 32, height: 32,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', transition: 'all 0.2s',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = '#fff0f0'; e.currentTarget.style.borderColor = '#c8232c'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = '#f5c6c8'; }}
            >
                <DeleteOutlined style={{ color: '#c8232c', fontSize: 14 }} />
            </button>

            {/* Ảnh sản phẩm */}
            <div
                style={{ cursor: 'pointer', overflow: 'hidden' }}
                onClick={onNavigate}
            >
                <img
                    src={product.image || product.images?.[0]}
                    alt={product.name}
                    style={{
                        width: '100%', height: 180, objectFit: 'cover', display: 'block',
                        transition: 'transform 0.3s',
                        transform: hovered ? 'scale(1.05)' : 'scale(1)',
                    }}
                />
            </div>

            {/* Thông tin sản phẩm */}
            <div style={{ padding: '12px 12px 14px' }}>
                {/* Category tag */}
                <span style={{
                    fontSize: 11, background: '#fff5f5', color: '#c8232c',
                    border: '1px solid #ffd6d6', borderRadius: 3, padding: '1px 8px',
                    fontWeight: 600, display: 'inline-block', marginBottom: 6,
                }}>
                    {product.category}
                </span>

                {/* Tên */}
                <div
                    onClick={onNavigate}
                    style={{
                        fontSize: 14, fontWeight: 600, color: '#222',
                        marginBottom: 6, cursor: 'pointer', lineHeight: 1.4,
                        display: '-webkit-box', WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical', overflow: 'hidden',
                        minHeight: 40,
                    }}
                >
                    {product.name}
                </div>

                {/* Rating */}
                <div style={{ marginBottom: 8 }}>
                    <Rate disabled allowHalf value={product.avgRating || 0} style={{ fontSize: 12 }} />
                </div>

                {/* Giá */}
                <div style={{ fontSize: 16, fontWeight: 700, color: '#c8232c', marginBottom: 10 }}>
                    {product.price?.toLocaleString('vi-VN')}đ
                </div>

                {/* Nút thêm giỏ */}
                <button
                    onClick={(e) => { e.stopPropagation(); onAddCart(product); }}
                    disabled={product.stock <= 0}
                    style={{
                        width: '100%', background: product.stock > 0 ? '#ff6600' : '#ccc',
                        border: 'none', color: '#fff', borderRadius: 4,
                        padding: '8px 0', fontSize: 13, fontWeight: 700,
                        cursor: product.stock > 0 ? 'pointer' : 'not-allowed',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                        transition: 'background 0.2s',
                    }}
                    onMouseEnter={e => { if(product.stock > 0) e.currentTarget.style.background = '#e05500'; }}
                    onMouseLeave={e => { if(product.stock > 0) e.currentTarget.style.background = '#ff6600'; }}
                >
                    <ShoppingCartOutlined />
                    {product.stock > 0 ? 'Thêm vào giỏ' : 'Hết hàng'}
                </button>
            </div>
        </div>
    );
};

export default WishlistPage;