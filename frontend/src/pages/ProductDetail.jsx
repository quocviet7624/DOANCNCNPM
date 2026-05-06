import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
    Row, Col, Button, InputNumber,
    Rate, message, Spin, Avatar, Input, Form, List, Empty, Modal
} from 'antd';
import { 
    ShoppingCartOutlined, LeftOutlined, UserOutlined, StarFilled,
    CarOutlined, CreditCardOutlined, SafetyOutlined, CheckCircleOutlined,
    QuestionCircleOutlined, FacebookOutlined, PhoneOutlined
} from '@ant-design/icons';
import axios from 'axios';
import WishlistButton from '../components/WishlistButton'; // ← MỚI

const { TextArea } = Input;

const RED = '#c8232c';
const DARK_RED = '#a01a22';
const BLUE_FB = '#1877f2';
const PRICE_COLOR = '#c8232c';
const DESC_COLLAPSED_HEIGHT = 110;

const styles = {
    page: { background: '#f5f5f5', minHeight: '100vh', fontFamily: "'Segoe UI', Arial, sans-serif" },
    breadcrumb: { background: '#fff', padding: '10px 0', borderBottom: '1px solid #eee' },
    breadcrumbInner: { maxWidth: 1200, margin: '0 auto', padding: '0 16px', fontSize: 13, color: '#666' },
    container: { maxWidth: 1200, margin: '0 auto', padding: '16px' },
    productName: { fontSize: 22, fontWeight: 700, color: '#222', marginBottom: 10, lineHeight: 1.4 },
    metaRow: { display: 'flex', alignItems: 'center', marginBottom: 6, fontSize: 14, color: '#444' },
    metaLabel: { fontWeight: 600, color: '#333', minWidth: 80 },
    price: { fontSize: 28, fontWeight: 700, color: PRICE_COLOR, margin: '12px 0' },
    btnFacebook: {
        background: BLUE_FB, border: 'none', color: '#fff', height: 46, fontSize: 15,
        fontWeight: 700, borderRadius: 4, width: '100%', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: 8, letterSpacing: 0.5, marginBottom: 10, transition: 'background 0.2s',
    },
    btnHotline: {
        background: RED, border: 'none', color: '#fff', height: 46, fontSize: 15,
        fontWeight: 700, borderRadius: 4, width: '100%', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: 8, letterSpacing: 0.5, marginBottom: 10, transition: 'background 0.2s',
    },
    btnAddCart: {
        background: '#ff6600', border: 'none', color: '#fff', height: 46, fontSize: 15,
        fontWeight: 700, borderRadius: 4, width: '100%', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: 8, letterSpacing: 0.5, marginBottom: 10, transition: 'background 0.2s',
    },
    sidebar: { background: '#fff', border: '1px solid #e8e8e8', borderRadius: 4 },
    policyItem: { display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 14px', borderBottom: '1px solid #f0f0f0' },
    policyIcon: {
        width: 40, height: 40, background: '#fff5f5', borderRadius: '50%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0, border: '1px solid #ffd6d6',
    },
    policyTitle: { fontWeight: 700, fontSize: 13, color: '#222', textTransform: 'uppercase', marginBottom: 2 },
    policyDesc: { fontSize: 12, color: '#666', lineHeight: 1.5 },
    sectionHeader: {
        background: '#f7f7f7', borderLeft: `4px solid ${RED}`, padding: '10px 16px',
        fontWeight: 700, fontSize: 15, color: '#222', marginBottom: 0, display: 'flex', alignItems: 'center', gap: 8,
    },
    sectionCard: { background: '#fff', border: '1px solid #e8e8e8', borderRadius: 4, marginBottom: 16, overflow: 'hidden' },
    sectionBody: { padding: '16px' },
    relatedCard: {
        border: '1px solid #eee', borderRadius: 4, overflow: 'hidden', cursor: 'pointer',
        transition: 'box-shadow 0.2s, transform 0.2s', background: '#fff',
    },
    relatedName: {
        fontSize: 13, fontWeight: 600, color: '#222', marginBottom: 4, lineHeight: 1.4,
        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
    },
    relatedPrice: { color: PRICE_COLOR, fontWeight: 700, fontSize: 14 },
};

const POLICIES = [
    { icon: <CarOutlined style={{ color: RED, fontSize: 20 }} />, title: 'GIAO HÀNG TẬN NƠI', desc: 'Liên kết với những hãng giao hàng uy tín, nhanh chóng, đảm bảo' },
    { icon: <CreditCardOutlined style={{ color: RED, fontSize: 20 }} />, title: 'THANH TOÁN KHI NHẬN HÀNG', desc: 'Bạn thoải mái nhận và kiểm tra hàng trước khi trả tiền.' },
    { icon: <SafetyOutlined style={{ color: RED, fontSize: 20 }} />, title: 'ĐỔI TRẢ NẾU SẢN PHẨM BỊ LỖI', desc: 'Dễ dàng đổi sản phẩm khác nếu sản phẩm bị lỗi do nhà sản xuất hoặc đơn vị vận chuyển' },
    { icon: <CheckCircleOutlined style={{ color: RED, fontSize: 20 }} />, title: 'BẢO HÀNH CHÍNH HÃNG', desc: 'Sản phẩm chính hãng đến từ các thương hiệu uy tín.' },
    { icon: <QuestionCircleOutlined style={{ color: RED, fontSize: 20 }} />, title: 'TƯ VẤN MUA HÀNG', desc: 'Đội ngũ tư vấn chuyên nghiệp, tận tâm hỗ trợ bạn 24/7' },
];

// ===== DESCRIPTION RENDERER ===== (giữ nguyên)
const DescriptionContent = ({ description }) => {
    const [showFull, setShowFull] = useState(false);
    const contentRef = React.useRef(null);
    const [isOverflow, setIsOverflow] = useState(false);

    useEffect(() => {
        if (contentRef.current) setIsOverflow(contentRef.current.scrollHeight > DESC_COLLAPSED_HEIGHT + 10);
    }, [description]);

    if (!description) return (
        <div style={{ textAlign: 'center', padding: '40px 0', color: '#bbb', fontSize: 14 }}>
            📋 Nội dung đang được cập nhật...
        </div>
    );

    const renderContent = () => description.split(/(?=\d+\.\s)/).filter(b => b.trim()).map((block, blockIdx) => {
        const headingMatch = block.match(/^(\d+\.\s)(.+?)(?:\n|:)([\s\S]*)/);
        if (headingMatch) {
            const num = headingMatch[1].trim();
            const title = headingMatch[2].trim().replace(/:$/, '');
            const body = (headingMatch[3] || '').trim();
            return (
                <div key={blockIdx} style={{ marginBottom: 16, background: blockIdx % 2 === 0 ? '#fff' : '#fafafa', borderRadius: 6, padding: '10px 14px', borderLeft: `3px solid ${RED}` }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: RED, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ background: RED, color: '#fff', borderRadius: '50%', width: 20, height: 20, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, flexShrink: 0 }}>{num.replace('.', '')}</span>
                        {title}
                    </div>
                    <div style={{ paddingLeft: 4 }}>
                        {body.split(/\n|(?=\s[-–]\s)/).map((line, li) => {
                            const t = line.trim();
                            if (!t) return null;
                            const isBullet = /^[-–•]/.test(t);
                            const isSub = /^[A-ZÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠƯẠ].*:$/.test(t) || /^\*\*.+\*\*$/.test(t);
                            if (isSub) return <div key={li} style={{ fontWeight: 600, color: '#444', marginTop: 8, marginBottom: 3, fontSize: 13 }}>{t.replace(/\*\*/g, '')}</div>;
                            return (
                                <div key={li} style={{ display: 'flex', alignItems: 'flex-start', gap: 7, marginBottom: 3, color: '#555', fontSize: 13 }}>
                                    {isBullet ? <><span style={{ color: RED, flexShrink: 0, marginTop: 2 }}>▸</span><span>{t.replace(/^[-–•]\s*/, '')}</span></> : <span>{t}</span>}
                                </div>
                            );
                        })}
                    </div>
                </div>
            );
        }
        return (
            <div key={blockIdx} style={{ marginBottom: 8, color: '#555', fontSize: 13 }}>
                {block.split('\n').map((line, li) => {
                    const t = line.trim();
                    if (!t) return <br key={li} />;
                    const isBullet = /^[-–•]/.test(t);
                    return (
                        <div key={li} style={{ display: 'flex', alignItems: 'flex-start', gap: 7, marginBottom: 3 }}>
                            {isBullet && <span style={{ color: RED, flexShrink: 0, marginTop: 2 }}>▸</span>}
                            <span>{isBullet ? t.replace(/^[-–•]\s*/, '') : t}</span>
                        </div>
                    );
                })}
            </div>
        );
    });

    return (
        <div style={{ fontSize: 14, lineHeight: 1.8, color: '#333' }}>
            <div style={{ position: 'relative' }}>
                <div ref={contentRef} style={{ maxHeight: showFull ? 'none' : DESC_COLLAPSED_HEIGHT, overflow: 'hidden', transition: 'max-height 0.3s ease' }}>
                    {renderContent()}
                </div>
                {!showFull && isOverflow && (
                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 50, background: 'linear-gradient(to bottom, transparent, #fff)', pointerEvents: 'none' }} />
                )}
            </div>
            {isOverflow && (
                <div style={{ textAlign: 'center', marginTop: 10 }}>
                    <button onClick={() => setShowFull(v => !v)} style={{ background: '#fff', border: `1.5px solid ${RED}`, color: RED, padding: '6px 24px', borderRadius: 4, cursor: 'pointer', fontSize: 13, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6, transition: 'all 0.2s' }}
                        onMouseEnter={e => { e.currentTarget.style.background = RED; e.currentTarget.style.color = '#fff'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = RED; }}>
                        {showFull ? '▲ Thu gọn' : '▼ Xem thêm'}
                    </button>
                </div>
            )}
        </div>
    );
};

const ProductDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [form] = Form.useForm();

    const [product, setProduct]               = useState(null);
    const [relatedProducts, setRelatedProducts] = useState([]);
    const [loading, setLoading]               = useState(true);
    const [quantity, setQuantity]             = useState(1);
    const [activeTab, setActiveTab]           = useState('description');
    const [activeImage, setActiveImage]       = useState(0);
    const [currentUserId, setCurrentUserId]   = useState(null);
    const [hasOrdered, setHasOrdered]         = useState(false);
    const [hasReviewed, setHasReviewed]       = useState(false);
    const [submitting, setSubmitting]         = useState(false);
    const [lightboxOpen, setLightboxOpen]     = useState(false); // ← THÊM MỚI

    const getUserIdFromStorage = () => {
        const storedUserId = localStorage.getItem('userId');
        if (storedUserId) return storedUserId;
        try {
            const userObj = JSON.parse(localStorage.getItem('user'));
            return userObj?._id || userObj?.id || null;
        } catch { return null; }
    };

    const fetchRelatedProducts = async (category, currentId) => {
        try {
            const res = await axios.get('http://localhost:5000/api/products');
            const related = res.data.filter(p => p.category === category && p._id !== currentId).slice(0, 4);
            setRelatedProducts(related);
        } catch {}
    };

    const fetchProductDetail = useCallback(async () => {
        try {
            setLoading(true);
            const res = await axios.get(`http://localhost:5000/api/products/${id}`);
            const data = res.data;
            setProduct(data);
            fetchRelatedProducts(data.category, data._id);
            const userId = getUserIdFromStorage();
            if (userId && data.reviews) {
                setHasReviewed(data.reviews.some(r => String(r.userId) === String(userId)));
            }
        } catch { message.error('Lỗi tải sản phẩm!'); }
        finally { setLoading(false); }
    }, [id]);

    const checkUserOrderStatus = useCallback(async (userId) => {
        try {
            const res = await axios.get(`http://localhost:5000/api/orders/user/${userId}`);
            const isPurchased = res.data.some(order =>
                order.status === 'Đã giao' &&
                order.items.some(item => String(item.product || item._id) === String(id))
            );
            setHasOrdered(isPurchased);
        } catch {}
    }, [id]);

    useEffect(() => {
        window.scrollTo(0, 0);
        setActiveImage(0);
        const userId = getUserIdFromStorage();
        setCurrentUserId(userId);
        fetchProductDetail();
        if (userId) checkUserOrderStatus(userId);
    }, [id, fetchProductDetail, checkUserOrderStatus]);

    const addToCart = (prod = product, qty = quantity) => {
        if (!currentUserId) { message.warning('Vui lòng đăng nhập để mua hàng!'); navigate('/login'); return; }
        const cart = JSON.parse(localStorage.getItem('cart') || '[]');
        const existingItem = cart.find(item => item._id === prod._id);
        if (existingItem) { existingItem.quantity += qty; } else { cart.push({ ...prod, quantity: qty }); }
        localStorage.setItem('cart', JSON.stringify(cart));
        window.dispatchEvent(new Event('storage'));
        message.success(`Đã thêm ${prod.name} vào giỏ!`);
    };

    const handleSubmitReview = async (values) => {
        if (!currentUserId) return message.error('Vui lòng đăng nhập!');
        setSubmitting(true);
        try {
            let username = 'Người dùng';
            try { const u = JSON.parse(localStorage.getItem('user')); username = u.username || u.name || u.email; } catch {}
            await axios.post(`http://localhost:5000/api/products/${id}/reviews`, { userId: currentUserId, username, rating: values.rating, comment: values.comment });
            message.success('Cảm ơn đánh giá của bạn!');
            form.resetFields();
            fetchProductDetail();
        } catch (error) { message.error(error.response?.data?.message || 'Lỗi gửi đánh giá'); }
        finally { setSubmitting(false); }
    };

    if (loading) return <div style={{ textAlign: 'center', padding: 80 }}><Spin size="large" /></div>;
    if (!product) return <div style={{ textAlign: 'center', padding: 80, color: '#888' }}>Không tìm thấy sản phẩm</div>;

    return (
        <div style={styles.page}>
            {/* Breadcrumb */}
            <div style={styles.breadcrumb}>
                <div style={styles.breadcrumbInner}>
                    <span style={{ cursor: 'pointer', color: '#1890ff' }} onClick={() => navigate('/')}>Trang chủ</span>
                    {' > '}
                    <span style={{ cursor: 'pointer', color: '#1890ff' }} onClick={() => navigate('/products')}>{product.category}</span>
                    {' > '}
                    <span style={{ color: '#333' }}>{product.name}</span>
                </div>
            </div>

            <div style={styles.container}>
                {/* MAIN PRODUCT */}
                <div style={{ background: '#fff', border: '1px solid #e8e8e8', borderRadius: 4, padding: 20, marginBottom: 16 }}>
                    <Row gutter={[20, 20]}>
                        {/* LEFT: Image Gallery */}
                        <Col xs={24} md={8}>
                            {(() => {
                                const imgs = (product.images && product.images.length > 0) ? product.images : (product.image ? [product.image] : []);
                                const current = imgs[activeImage] || imgs[0];
                                return (
                                    <div>
                                        {/* ── Ảnh chính: click để mở Modal ── */}
                                        <div
                                            onClick={() => setLightboxOpen(true)}
                                            style={{
                                                border: '1px solid #eee', borderRadius: 4,
                                                overflow: 'hidden', textAlign: 'center',
                                                background: '#fff', position: 'relative',
                                                marginBottom: 8, cursor: 'zoom-in',
                                            }}
                                        >
                                            <img
                                                alt={product.name}
                                                src={current}
                                                style={{ width: '100%', height: 340, objectFit: 'contain', padding: 8, display: 'block' }}
                                            />

                                            {/* Badge gợi ý phóng to */}
                                            <div style={{
                                                position: 'absolute', top: 10, right: 10,
                                                background: 'rgba(0,0,0,0.5)', color: '#fff',
                                                fontSize: 11, padding: '3px 10px', borderRadius: 10,
                                            }}>
                                                🔍 Click để phóng to
                                            </div>

                                            {imgs.length > 1 && (
                                                <>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); setActiveImage(i => (i - 1 + imgs.length) % imgs.length); }}
                                                        style={{ position: 'absolute', left: 6, top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.35)', border: 'none', color: '#fff', width: 30, height: 30, borderRadius: '50%', cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2 }}>‹</button>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); setActiveImage(i => (i + 1) % imgs.length); }}
                                                        style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.35)', border: 'none', color: '#fff', width: 30, height: 30, borderRadius: '50%', cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2 }}>›</button>
                                                    <div style={{ position: 'absolute', bottom: 10, right: 12, background: 'rgba(0,0,0,0.45)', color: '#fff', fontSize: 11, padding: '2px 8px', borderRadius: 10 }}>{activeImage + 1} / {imgs.length}</div>
                                                </>
                                            )}
                                        </div>

                                        {/* Thumbnail */}
                                        {imgs.length > 1 && (
                                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                                {imgs.map((src, i) => (
                                                    <div key={i} onClick={() => setActiveImage(i)}
                                                        style={{ width: 60, height: 60, borderRadius: 4, overflow: 'hidden', border: `2px solid ${i === activeImage ? RED : '#ddd'}`, cursor: 'pointer', flexShrink: 0, transition: 'border-color 0.2s', opacity: i === activeImage ? 1 : 0.75 }}>
                                                        <img src={src} alt={`thumb-${i}`} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* ── Modal xem ảnh to ── */}
                                        <Modal
                                            open={lightboxOpen}
                                            onCancel={() => setLightboxOpen(false)}
                                            footer={null}
                                            centered
                                            // Tăng chiều rộng Modal lên 80% chiều rộng màn hình (viewport width)
                                            width="80vw" 
                                            // Giới hạn tối đa để trên màn hình máy tính lớn không bị quá thô
                                            style={{ maxWidth: '1000px', top: 20 }} 
                                            styles={{ 
                                                body: { 
                                                    padding: '12px', 
                                                    background: '#fff', 
                                                    borderRadius: 8, 
                                                    overflow: 'hidden',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    alignItems: 'center',
                                                    justifyContent: 'center'
                                                } 
                                            }}
                                            closeIcon={
                                                <span style={{
                                                    position: 'absolute', top: 10, right: 10, zIndex: 10,
                                                    background: 'rgba(255,255,255,0.9)', borderRadius: '50%', width: 32, height: 32,
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    boxShadow: '0 2px 8px rgba(0,0,0,0.2)', fontSize: 16,
                                                    cursor: 'pointer', fontWeight: 'bold', color: '#333',
                                                }}>✕</span>
                                            }
                                        >
                                            <div style={{ position: 'relative', width: '100%', textAlign: 'center', lineHeight: 0 }}>
                                                <img
                                                    src={current}
                                                    alt={product.name}
                                                    style={{
                                                        width: '100%',         // Ép ảnh rộng hết cỡ Modal
                                                        maxHeight: '80vh',    // Không cho phép ảnh cao quá 80% màn hình để tránh cuộn trang
                                                        objectFit: 'contain', // Giữ nguyên tỉ lệ ảnh cá, không bị móp méo
                                                        display: 'inline-block', 
                                                        borderRadius: 4,
                                                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                                                    }}
                                                />

                                                {/* Nút prev/next trong Modal - Chỉnh lại vị trí để dễ bấm hơn */}
                                                {imgs.length > 1 && (
                                                    <>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); setActiveImage(i => (i - 1 + imgs.length) % imgs.length); }}
                                                            style={{
                                                                position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)',
                                                                background: 'rgba(0,0,0,0.3)', border: 'none', color: '#fff',
                                                                width: 45, height: 45, borderRadius: '0 4px 4px 0', cursor: 'pointer',
                                                                fontSize: 24, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                transition: 'background 0.3s'
                                                            }}
                                                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.6)'}
                                                            onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,0,0,0.3)'}
                                                        >‹</button>
                                                        
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); setActiveImage(i => (i + 1) % imgs.length); }}
                                                            style={{
                                                                position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)',
                                                                background: 'rgba(0,0,0,0.3)', border: 'none', color: '#fff',
                                                                width: 45, height: 45, borderRadius: '4px 0 0 4px', cursor: 'pointer',
                                                                fontSize: 24, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                transition: 'background 0.3s'
                                                            }}
                                                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.6)'}
                                                            onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,0,0,0.3)'}
                                                        >›</button>

                                                        <div style={{
                                                            position: 'absolute', bottom: 15, left: '50%', transform: 'translateX(-50%)',
                                                            background: 'rgba(0,0,0,0.6)', color: '#fff',
                                                            fontSize: 13, padding: '4px 15px', borderRadius: '20px',
                                                            backdropFilter: 'blur(4px)'
                                                        }}>
                                                            {activeImage + 1} / {imgs.length}
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        </Modal>
                                        {/* ───────────────────── */}
                                    </div>
                                );
                            })()}
                        </Col>

                        {/* MIDDLE: Product Info */}
                        <Col xs={24} md={10}>
                            {/* ← MỚI: tên + nút tim nằm cùng hàng */}
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
                                <h1 style={{ ...styles.productName, marginBottom: 0, flex: 1 }}>{product.name}</h1>
                                {currentUserId && (
                                    <WishlistButton productId={product._id} size="md" style={{ marginTop: 4, flexShrink: 0 }} />
                                )}
                            </div>

                            <div style={styles.metaRow}>
                                <span style={styles.metaLabel}>Loại:</span>
                                <span style={{ color: '#1890ff', cursor: 'pointer' }}>{product.category}</span>
                            </div>

                            <div style={styles.price}>{product.price.toLocaleString('vi-VN')}đ</div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                                <Rate disabled allowHalf value={product.avgRating || 0} style={{ fontSize: 14 }} />
                                <span style={{ color: '#888', fontSize: 13 }}>({product.numReviews || 0} đánh giá) | Đã bán: {product.sold || 0}</span>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                                <span style={{ fontWeight: 600, fontSize: 14 }}>Số lượng:</span>
                                <InputNumber min={1} max={product.stock} value={quantity} onChange={setQuantity} size="middle" style={{ width: 80 }} />
                                <span style={{ color: product.stock > 0 ? '#52c41a' : 'red', fontSize: 13 }}>
                                    {product.stock > 0 ? `Còn ${product.stock} sản phẩm` : 'Hết hàng'}
                                </span>
                            </div>

                            <a href="https://www.facebook.com/share/186GxkDwdy/?mibextid=wwXIfr" target="_blank" rel="noopener noreferrer"
                                style={{ ...styles.btnFacebook, textDecoration: 'none' }}
                                onMouseEnter={e => e.currentTarget.style.background = '#1565c0'}
                                onMouseLeave={e => e.currentTarget.style.background = BLUE_FB}>
                                <FacebookOutlined /> TƯ VẤN QUA FACEBOOK
                            </a>

                            <a href="tel:0852192629" style={{ ...styles.btnHotline, textDecoration: 'none' }}
                                onMouseEnter={e => e.currentTarget.style.background = DARK_RED}
                                onMouseLeave={e => e.currentTarget.style.background = RED}>
                                <PhoneOutlined /> LIÊN HỆ HOTLINE 0852192629
                            </a>

                            <button style={{ ...styles.btnAddCart, opacity: product.stock <= 0 ? 0.5 : 1, cursor: product.stock <= 0 ? 'not-allowed' : 'pointer' }}
                                onClick={() => product.stock > 0 && addToCart(product, quantity)}
                                onMouseEnter={e => { if(product.stock > 0) e.currentTarget.style.background = '#e05500'; }}
                                onMouseLeave={e => e.currentTarget.style.background = '#ff6600'}>
                                <ShoppingCartOutlined />
                                {product.stock > 0 ? 'THÊM VÀO GIỎ HÀNG' : 'TẠM HẾT HÀNG'}
                            </button>
                        </Col>

                        {/* RIGHT: Policy Sidebar */}
                        <Col xs={24} md={6}>
                            <div style={styles.sidebar}>
                                <div style={{ padding: '8px 14px', fontWeight: 700, fontSize: 13, color: '#c8232c', borderBottom: '2px solid #c8232c', letterSpacing: 0.5 }}>CHÍNH SÁCH</div>
                                {POLICIES.map((policy, idx) => (
                                    <div key={idx} style={styles.policyItem}>
                                        <div style={styles.policyIcon}>{policy.icon}</div>
                                        <div>
                                            <div style={styles.policyTitle}>{policy.title}</div>
                                            <div style={styles.policyDesc}>{policy.desc}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Col>
                    </Row>
                </div>

                {/* TABS */}
                <div style={styles.sectionCard}>
                    <div style={{ display: 'flex', borderBottom: '2px solid #e8e8e8', background: '#fafafa' }}>
                        {[
                            { key: 'description', label: '🔔 MÔ TẢ' },
                            { key: 'policy', label: '🛡 CHÍNH SÁCH' },
                            { key: 'guide', label: '📋 HƯỚNG DẪN MUA HÀNG' },
                            { key: 'reviews', label: `⭐ ĐÁNH GIÁ (${product.numReviews || 0})` },
                        ].map(tab => (
                            <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{ padding: '10px 18px', border: 'none', borderBottom: activeTab === tab.key ? `3px solid ${RED}` : '3px solid transparent', background: 'transparent', color: activeTab === tab.key ? RED : '#444', fontWeight: activeTab === tab.key ? 700 : 400, fontSize: 13, cursor: 'pointer', transition: 'all 0.2s' }}>
                                {tab.label}
                            </button>
                        ))}
                    </div>
                    <div style={styles.sectionBody}>
                        {activeTab === 'description' && <DescriptionContent description={product.description} />}
                        {activeTab === 'policy' && (
                            <div style={{ color: '#444', lineHeight: 1.8 }}>
                                <p>✅ Đổi trả trong 7 ngày nếu sản phẩm bị lỗi do nhà sản xuất.</p>
                                <p>✅ Giao hàng toàn quốc, liên kết với các đơn vị vận chuyển uy tín.</p>
                                <p>✅ Thanh toán khi nhận hàng, kiểm tra trước khi trả tiền.</p>
                                <p>✅ Bảo hành chính hãng theo quy định của nhà sản xuất.</p>
                            </div>
                        )}
                        {activeTab === 'guide' && (
                            <div style={{ color: '#444', lineHeight: 1.8 }}>
                                <p><strong>Bước 1:</strong> Chọn sản phẩm và số lượng mong muốn.</p>
                                <p><strong>Bước 2:</strong> Nhấn "THÊM VÀO GIỎ HÀNG" hoặc liên hệ tư vấn qua Facebook/Hotline.</p>
                                <p><strong>Bước 3:</strong> Tiến hành thanh toán và điền thông tin giao hàng.</p>
                                <p><strong>Bước 4:</strong> Nhận hàng và kiểm tra sản phẩm trước khi thanh toán.</p>
                            </div>
                        )}
                        {activeTab === 'reviews' && (
                            <div>
                                <div style={{ background: '#fafafa', border: '1px solid #eee', borderRadius: 4, padding: 16, marginBottom: 20 }}>
                                    {!currentUserId ? (
                                        <div style={{ textAlign: 'center', padding: 12 }}>🔒 <Link to="/login">Đăng nhập</Link> để viết đánh giá.</div>
                                    ) : hasReviewed ? (
                                        <div style={{ textAlign: 'center', color: 'green', fontSize: 15, padding: 12 }}>✓ Bạn đã đánh giá sản phẩm này.</div>
                                    ) : !hasOrdered ? (
                                        <div style={{ textAlign: 'center', color: '#faad14', padding: 12 }}>ℹ️ Bạn cần mua sản phẩm này và đơn hàng được giao thành công để viết đánh giá.</div>
                                    ) : (
                                        <Form form={form} onFinish={handleSubmitReview} layout="vertical">
                                            <Form.Item name="rating" label="Chất lượng sản phẩm" rules={[{ required: true, message: 'Vui lòng chọn sao!' }]}><Rate /></Form.Item>
                                            <Form.Item name="comment" label="Nhận xét" rules={[{ required: true, min: 5, message: 'Nhập ít nhất 5 ký tự!' }]}><TextArea rows={3} placeholder="Chia sẻ cảm nhận của bạn về sản phẩm..." /></Form.Item>
                                            <Button type="primary" htmlType="submit" loading={submitting} style={{ background: RED, borderColor: RED }}>Gửi đánh giá</Button>
                                        </Form>
                                    )}
                                </div>
                                <List
                                    itemLayout="horizontal"
                                    dataSource={[...product.reviews].reverse()}
                                    renderItem={item => (
                                        <List.Item style={{ padding: '12px 0', borderBottom: '1px solid #f0f0f0' }}>
                                            <List.Item.Meta
                                                avatar={<Avatar icon={<UserOutlined />} style={{ backgroundColor: RED }} />}
                                                title={<div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ fontWeight: 700 }}>{item.username}</span><span style={{ fontSize: 12, color: '#999' }}>{new Date(item.createdAt).toLocaleDateString('vi-VN')}</span></div>}
                                                description={<div><Rate disabled value={item.rating} style={{ fontSize: 13 }} /><div style={{ marginTop: 6, color: '#333' }}>{item.comment}</div></div>}
                                            />
                                        </List.Item>
                                    )}
                                    locale={{ emptyText: <Empty description="Chưa có đánh giá nào." /> }}
                                />
                            </div>
                        )}
                    </div>
                </div>

                {/* SẢN PHẨM LIÊN QUAN */}
                {relatedProducts.length > 0 && (
                    <div style={styles.sectionCard}>
                        <div style={styles.sectionHeader}>Sản phẩm liên quan</div>
                        <div style={styles.sectionBody}>
                            <Row gutter={[12, 12]}>
                                {relatedProducts.map(rel => (
                                    <Col xs={12} sm={12} md={6} key={rel._id}>
                                        <div style={{ ...styles.relatedCard, position: 'relative' }}
                                            onClick={() => navigate(`/product/${rel._id}`)}
                                            onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                                            onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(0)'; }}>
                                            {/* ← MỚI: nút tim trên card sản phẩm liên quan */}
                                            {currentUserId && (
                                                <div style={{ position: 'absolute', top: 8, right: 8, zIndex: 2 }} onClick={e => e.stopPropagation()}>
                                                    <WishlistButton productId={rel._id} size="sm" />
                                                </div>
                                            )}
                                            <img alt={rel.name} src={rel.image} style={{ width: '100%', height: 160, objectFit: 'cover', display: 'block' }} />
                                            <div style={{ padding: '10px 10px 12px' }}>
                                                <div style={styles.relatedName}>{rel.name}</div>
                                                <div style={styles.relatedPrice}>{rel.price.toLocaleString('vi-VN')}đ</div>
                                                <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>
                                                    <StarFilled style={{ color: '#fadb14' }} /> {rel.avgRating?.toFixed(1) || 0}
                                                </div>
                                            </div>
                                        </div>
                                    </Col>
                                ))}
                            </Row>
                        </div>
                    </div>
                )}

                <div style={{ marginTop: 8 }}>
                    <Button icon={<LeftOutlined />} onClick={() => navigate('/products')}>Quay lại danh sách sản phẩm</Button>
                </div>
            </div>
        </div>
    );
};

export default ProductDetail;
