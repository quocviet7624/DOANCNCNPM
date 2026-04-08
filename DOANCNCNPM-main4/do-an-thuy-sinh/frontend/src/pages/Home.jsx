import React, { useEffect, useState, useRef } from 'react';
import { Row, Col, Carousel, Button, Badge, Tag, message, Tooltip } from 'antd';
import {
    ShoppingCartOutlined,
    FireOutlined,
    RightCircleOutlined,
    StarFilled,
    SafetyCertificateOutlined,
    RocketOutlined,
    SmileOutlined,
    GiftOutlined,
    CopyOutlined,
    ClockCircleOutlined,
    ThunderboltOutlined,
    LockOutlined,
    CheckCircleOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

/* ─── CSS ANIMATIONS injected once ─── */
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&family=Baloo+2:wght@700;800&display=swap');

  *, *::before, *::after { box-sizing: border-box; }

  body { font-family: 'Nunito', sans-serif !important; }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(32px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes fadeIn {
    from { opacity: 0; } to { opacity: 1; }
  }
  @keyframes scaleIn {
    from { opacity: 0; transform: scale(0.88); }
    to   { opacity: 1; transform: scale(1); }
  }
  @keyframes floatY {
    0%,100% { transform: translateY(0px); }
    50%      { transform: translateY(-10px); }
  }
  @keyframes shimmer {
    0%   { background-position: -400px 0; }
    100% { background-position: 400px 0; }
  }
  @keyframes pulse {
    0%,100% { opacity:1; transform:scale(1); }
    50%      { opacity:.7; transform:scale(1.05); }
  }
  @keyframes ripple {
    0%   { transform:scale(0); opacity:.6; }
    100% { transform:scale(2.5); opacity:0; }
  }
  @keyframes ticker {
    0%   { transform: translateX(0); }
    100% { transform: translateX(-50%); }
  }
  @keyframes gradShift {
    0%,100% { background-position: 0% 50%; }
    50%      { background-position: 100% 50%; }
  }
  @keyframes spinSlow {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }
  @keyframes countFlip {
    0%   { transform: translateY(-100%); opacity:0; }
    100% { transform: translateY(0);     opacity:1; }
  }

  .fadeUp   { animation: fadeUp   .6s ease both; }
  .fadeIn   { animation: fadeIn   .5s ease both; }
  .scaleIn  { animation: scaleIn  .5s ease both; }

  .d1 { animation-delay:.1s; }
  .d2 { animation-delay:.2s; }
  .d3 { animation-delay:.3s; }
  .d4 { animation-delay:.4s; }
  .d5 { animation-delay:.5s; }
  .d6 { animation-delay:.6s; }
  .d7 { animation-delay:.7s; }
  .d8 { animation-delay:.8s; }

  .float { animation: floatY 3s ease-in-out infinite; }

  .product-card {
    border-radius: 18px !important;
    overflow: hidden;
    box-shadow: 0 4px 20px rgba(0,0,0,.07) !important;
    transition: transform .3s ease, box-shadow .3s ease !important;
    border: 1.5px solid #f0f0f0 !important;
    background: #fff !important;
  }
  .product-card:hover {
    transform: translateY(-8px) !important;
    box-shadow: 0 16px 40px rgba(200,35,44,.15) !important;
    border-color: #c8232c !important;
  }
  .product-img {
    transition: transform .5s ease !important;
  }
  .product-card:hover .product-img {
    transform: scale(1.08) !important;
  }

  .add-btn {
    position: relative;
    overflow: hidden;
    transition: all .2s !important;
  }
  .add-btn:hover {
    transform: scale(1.07) !important;
    box-shadow: 0 4px 14px rgba(200,35,44,.35) !important;
  }
  .add-btn::after {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: 50%;
    background: rgba(255,255,255,.3);
    transform: scale(0);
  }
  .add-btn:active::after {
    animation: ripple .4s ease;
  }

  .voucher-card {
    border-radius: 18px;
    overflow: hidden;
    transition: transform .3s ease, box-shadow .3s ease;
    cursor: default;
  }
  .voucher-card:hover {
    transform: translateY(-6px);
    box-shadow: 0 20px 48px rgba(0,0,0,.18) !important;
  }

  .copy-box {
    transition: background .2s, transform .1s;
    cursor: pointer;
  }
  .copy-box:hover { background: #d9f7be !important; transform: scale(1.02); }
  .copy-box:active { transform: scale(.98); }

  .time-box {
    animation: countFlip .25s ease;
  }

  .trust-item {
    transition: transform .25s, box-shadow .25s;
    border-radius: 16px;
    padding: 18px 20px;
  }
  .trust-item:hover {
    transform: translateX(6px);
    box-shadow: 0 6px 20px rgba(0,0,0,.08);
  }

  .section-tag {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: linear-gradient(135deg,#c8232c,#ff6b6b);
    color: #fff;
    font-family: 'Baloo 2', cursive;
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 2px;
    text-transform: uppercase;
    padding: 5px 18px;
    border-radius: 30px;
    margin-bottom: 12px;
  }
  .section-title {
    font-family: 'Baloo 2', cursive !important;
    font-weight: 800 !important;
  }

  .ticker-wrap {
    overflow: hidden;
    background: linear-gradient(90deg,#c8232c,#a01a22);
    padding: 10px 0;
  }
  .ticker-inner {
    display: flex;
    white-space: nowrap;
    animation: ticker 22s linear infinite;
    gap: 0;
  }
  .ticker-item {
    padding: 0 40px;
    font-size: 13px;
    font-weight: 700;
    color: #fff;
    letter-spacing: 1px;
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .ticker-dot {
    width: 6px; height: 6px;
    border-radius: 50%;
    background: rgba(255,255,255,.5);
    flex-shrink: 0;
  }

  .shimmer-line {
    background: linear-gradient(90deg, #f0f0f0 25%, #fafafa 50%, #f0f0f0 75%);
    background-size: 400px 100%;
    animation: shimmer 1.4s infinite;
    border-radius: 8px;
  }

  .hero-btn-primary {
    position: relative;
    overflow: hidden;
    background: linear-gradient(135deg,#c8232c,#ff4d4f) !important;
    border: none !important;
    font-family: 'Baloo 2', cursive !important;
    font-weight: 700 !important;
    font-size: 16px !important;
    height: 52px !important;
    padding: 0 40px !important;
    border-radius: 50px !important;
    letter-spacing: 1px;
    box-shadow: 0 8px 24px rgba(200,35,44,.4) !important;
    transition: all .3s !important;
  }
  .hero-btn-primary:hover {
    transform: translateY(-2px) !important;
    box-shadow: 0 14px 32px rgba(200,35,44,.5) !important;
  }

  .explore-btn {
    height: 52px !important;
    padding: 0 48px !important;
    border-radius: 50px !important;
    font-family: 'Baloo 2', cursive !important;
    font-weight: 700 !important;
    font-size: 15px !important;
    letter-spacing: 1px;
    border: 2px solid #c8232c !important;
    color: #c8232c !important;
    background: transparent !important;
    transition: all .3s !important;
  }
  .explore-btn:hover {
    background: #c8232c !important;
    color: #fff !important;
    transform: translateY(-2px) !important;
    box-shadow: 0 8px 24px rgba(200,35,44,.3) !important;
  }
`;

/* ─── UTILS ─── */
const RED = '#c8232c';

/* ─── COUNTDOWN HOOK ─── */
const useCountdown = (targetDate) => {
    const [t, setT] = useState({});
    useEffect(() => {
        const calc = () => {
            const diff = new Date(targetDate) - new Date();
            if (diff <= 0) return setT({ expired: true });
            setT({
                days:    Math.floor(diff / 86400000),
                hours:   Math.floor((diff / 3600000) % 24),
                minutes: Math.floor((diff / 60000) % 60),
                seconds: Math.floor((diff / 1000) % 60),
            });
        };
        calc();
        const id = setInterval(calc, 1000);
        return () => clearInterval(id);
    }, [targetDate]);
    return t;
};

/* ─── TIME BOX ─── */
const TimeBox = ({ value, label }) => (
    <div style={{
        background: 'rgba(0,0,0,.32)',
        backdropFilter: 'blur(4px)',
        borderRadius: 8,
        padding: '5px 10px',
        minWidth: 44,
        textAlign: 'center',
    }} className="time-box">
        <div style={{ fontSize: 20, fontWeight: 900, color: '#fff', lineHeight: 1.1, fontFamily: "'Baloo 2',cursive" }}>
            {String(value ?? 0).padStart(2, '0')}
        </div>
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,.75)', letterSpacing: .5 }}>{label}</div>
    </div>
);

/* ─── VOUCHER CARD ─── */
const VoucherCard = ({ voucher, index }) => {
    const [copied, setCopied] = useState(false);
    const cd = useCountdown(voucher.isOpened ? voucher.endDate : voucher.startDate);
    const used = voucher.usageLimit ? Math.round((voucher.usedCount / voucher.usageLimit) * 100) : 0;

    const isGreen = voucher.isOpened;
    const headerGrad = isGreen
        ? 'linear-gradient(135deg,#2ecc71 0%,#27ae60 100%)'
        : 'linear-gradient(135deg,#f39c12 0%,#e67e22 100%)';
    const borderClr = isGreen ? '#2ecc71' : '#f39c12';

    const handleCopy = () => {
        if (!voucher.code) return;
        navigator.clipboard.writeText(voucher.code).then(() => {
            setCopied(true);
            message.success({ content: `Đã copy mã ${voucher.code}! 🎉`, icon: <CheckCircleOutlined style={{ color: '#2ecc71' }} /> });
            setTimeout(() => setCopied(false), 2500);
        });
    };

    return (
        <div className={`voucher-card scaleIn d${Math.min(index + 1, 8)}`}
            style={{ border: `2px solid ${borderClr}`, boxShadow: `0 8px 28px ${isGreen ? 'rgba(46,204,113,.18)' : 'rgba(243,156,18,.18)'}`, background: '#fff' }}>

            {/* Header */}
            <div style={{ background: headerGrad, padding: '18px 20px 14px', position: 'relative', overflow: 'hidden' }}>
                {/* decorative circles */}
                <div style={{ position: 'absolute', top: -20, right: -20, width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,.1)' }} />
                <div style={{ position: 'absolute', bottom: -30, right: 20, width: 60, height: 60, borderRadius: '50%', background: 'rgba(255,255,255,.08)' }} />

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative', zIndex: 1 }}>
                    <div>
                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,.9)', letterSpacing: 1.5, textTransform: 'uppercase', fontWeight: 700, marginBottom: 4 }}>
                            {isGreen ? '● Đang mở' : '◌ Sắp mở'}
                        </div>
                        <div style={{ fontFamily: "'Baloo 2',cursive", fontSize: 42, fontWeight: 900, color: '#fff', lineHeight: 1 }}>
                            -{voucher.discountPercent}%
                        </div>
                        {voucher.maxDiscount && (
                            <div style={{ fontSize: 11, color: 'rgba(255,255,255,.8)', marginTop: 3 }}>
                                Tối đa {voucher.maxDiscount.toLocaleString('vi-VN')}đ
                            </div>
                        )}
                    </div>
                    <GiftOutlined className="float" style={{ fontSize: 36, color: 'rgba(255,255,255,.3)', marginTop: 4 }} />
                </div>

                {/* countdown */}
                <div style={{ marginTop: 14, position: 'relative', zIndex: 1 }}>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,.85)', marginBottom: 7, display: 'flex', alignItems: 'center', gap: 5 }}>
                        <ClockCircleOutlined /> {isGreen ? 'Hết hạn sau:' : 'Mở sau:'}
                    </div>
                    {cd.expired ? (
                        <span style={{ color: '#fff', fontSize: 13 }}>Đã kết thúc</span>
                    ) : (
                        <div style={{ display: 'flex', gap: 6 }}>
                            {cd.days > 0 && <TimeBox value={cd.days} label="ngày" />}
                            <TimeBox value={cd.hours} label="giờ" />
                            <TimeBox value={cd.minutes} label="phút" />
                            <TimeBox value={cd.seconds} label="giây" />
                        </div>
                    )}
                </div>
            </div>

            {/* Wave divider */}
            <div style={{ lineHeight: 0, marginTop: -1 }}>
                <svg viewBox="0 0 400 20" style={{ width: '100%', display: 'block' }}>
                    <path d="M0,0 C100,20 300,0 400,16 L400,0 Z" fill={isGreen ? '#27ae60' : '#e67e22'} />
                </svg>
            </div>

            {/* Body */}
            <div style={{ padding: '10px 18px 18px' }}>
                {voucher.description && (
                    <p style={{ fontSize: 13, color: '#555', marginBottom: 10, lineHeight: 1.5, minHeight: 38 }}>{voucher.description}</p>
                )}

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 12 }}>
                    {voucher.minOrderValue > 0 && (
                        <Tag color="orange" style={{ fontSize: 11, borderRadius: 6 }}>
                            Đơn tối thiểu {voucher.minOrderValue.toLocaleString('vi-VN')}đ
                        </Tag>
                    )}
                    {voucher.applicableCategories?.length > 0
                        ? voucher.applicableCategories.map(c => <Tag key={c} color="geekblue" style={{ fontSize: 11, borderRadius: 6 }}>{c}</Tag>)
                        : <Tag color="purple" style={{ fontSize: 11, borderRadius: 6 }}>Tất cả sản phẩm</Tag>
                    }
                </div>

                {voucher.usageLimit && (
                    <div style={{ marginBottom: 14 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#999', marginBottom: 5 }}>
                            <span>{voucher.usedCount}/{voucher.usageLimit} lượt đã dùng</span>
                            <span style={{ color: used > 80 ? RED : '#2ecc71', fontWeight: 700 }}>
                                Còn {voucher.usageLimit - voucher.usedCount}
                            </span>
                        </div>
                        <div style={{ height: 7, background: '#f0f0f0', borderRadius: 10, overflow: 'hidden' }}>
                            <div style={{
                                height: '100%',
                                width: `${used}%`,
                                background: used > 80 ? `linear-gradient(90deg,${RED},#ff6b6b)` : 'linear-gradient(90deg,#2ecc71,#27ae60)',
                                borderRadius: 10,
                                transition: 'width .6s ease',
                            }} />
                        </div>
                    </div>
                )}

                {isGreen ? (
                    <Tooltip title={copied ? '✓ Đã copy!' : 'Click để copy mã'}>
                        <div className="copy-box" onClick={handleCopy} style={{
                            background: copied ? '#f6ffed' : '#fafff6',
                            border: `2px dashed ${copied ? '#2ecc71' : '#52c41a'}`,
                            borderRadius: 10,
                            padding: '10px 16px',
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        }}>
                            <span style={{ fontFamily: "'Baloo 2',cursive", fontWeight: 900, fontSize: 17, letterSpacing: 3, color: '#27ae60' }}>
                                {voucher.code}
                            </span>
                            {copied
                                ? <CheckCircleOutlined style={{ color: '#2ecc71', fontSize: 17 }} />
                                : <CopyOutlined style={{ color: '#52c41a', fontSize: 16 }} />
                            }
                        </div>
                    </Tooltip>
                ) : (
                    <div style={{
                        background: '#fffbf0',
                        border: '2px dashed #f39c12',
                        borderRadius: 10,
                        padding: '10px 16px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        gap: 8, color: '#e67e22', fontSize: 13, fontWeight: 700,
                    }}>
                        <LockOutlined /> Mã sẽ hiện khi đến giờ mở
                    </div>
                )}
            </div>
        </div>
    );
};

/* ─── PRODUCT SKELETON ─── */
const ProductSkeleton = () => (
    <Col xs={24} sm={12} md={8} lg={6}>
        <div style={{ borderRadius: 18, overflow: 'hidden', background: '#fff', boxShadow: '0 4px 16px rgba(0,0,0,.06)' }}>
            <div className="shimmer-line" style={{ height: 220 }} />
            <div style={{ padding: 15 }}>
                <div className="shimmer-line" style={{ height: 14, marginBottom: 10, width: '40%' }} />
                <div className="shimmer-line" style={{ height: 18, marginBottom: 14, width: '80%' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div className="shimmer-line" style={{ height: 22, width: '35%' }} />
                    <div className="shimmer-line" style={{ height: 34, width: '30%', borderRadius: 20 }} />
                </div>
            </div>
        </div>
    </Col>
);

/* ─── HOME ─── */
const Home = () => {
    const [products, setProducts] = useState([]);
    const [banners, setBanners] = useState([]);
    const [vouchers, setVouchers] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const heroRef = useRef(null);

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        try {
            const [p, b, v] = await Promise.all([
                axios.get('http://localhost:5000/api/products'),
                axios.get('http://localhost:5000/api/banners/active'),
                axios.get('http://localhost:5000/api/vouchers/public'),
            ]);
            setProducts(p.data);
            setBanners(b.data);
            setVouchers(v.data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const addToCart = (e, product) => {
        e.stopPropagation();
        const cart = JSON.parse(localStorage.getItem('cart') || '[]');
        const ex = cart.find(i => i._id === product._id);
        if (ex) ex.quantity += 1;
        else cart.push({ ...product, quantity: 1 });
        localStorage.setItem('cart', JSON.stringify(cart));
        window.dispatchEvent(new Event('cartChange'));
        message.success({
            content: <span>Đã thêm <b>{product.name}</b> vào giỏ hàng!</span>,
            icon: <ShoppingCartOutlined style={{ color: RED }} />,
        });
    };

    const tickerItems = ['🐠 Cá Koi nhập khẩu', '🌿 Rêu Java tươi', '⭐ Đánh giá 5 sao', '🚚 Giao hàng toàn quốc', '🎁 Săn Vouchers hàng ngày', '💧 Bể kính cao cấp'];

    return (
        <>
            <style>{STYLES}</style>

            <div style={{ background: '#f8f9fc', minHeight: '100vh', overflowX: 'hidden' }}>

                {/* ── HERO BANNER ── */}
                <div ref={heroRef} style={{ position: 'relative' }}>
                    {banners.length > 0 ? (
                        <Carousel autoplay autoplaySpeed={5000} effect="fade" dots={{ className: 'hero-dots' }}>
                            {banners.map(banner => (
                                <div key={banner._id}>
                                    <div style={{ height: 580, position: 'relative', overflow: 'hidden', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        {banner.mediaType === 'video' ? (
                                            <video autoPlay loop muted playsInline
                                                style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: .65 }}>
                                                <source src={banner.mediaUrl} type="video/mp4" />
                                            </video>
                                        ) : (
                                            <img src={banner.mediaUrl} alt={banner.title}
                                                style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: .65 }} />
                                        )}
                                        {/* dark gradient overlay */}
                                        <div style={{
                                            position: 'absolute', inset: 0,
                                            background: 'linear-gradient(to bottom, rgba(0,0,0,.2) 0%, rgba(0,0,0,.55) 100%)',
                                        }} />
                                        {/* content */}
                                        <div style={{
                                            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                                            display: 'flex', flexDirection: 'column',
                                            alignItems: 'center', justifyContent: 'center',
                                            textAlign: 'center', zIndex: 10,
                                            padding: '0 24px',
                                            animation: 'fadeUp .8s ease both',
                                        }}>
                                            <div style={{
                                                display: 'inline-block', background: 'rgba(200,35,44,.85)',
                                                color: '#fff', fontSize: 12, fontWeight: 700, letterSpacing: 3,
                                                textTransform: 'uppercase', padding: '5px 20px', borderRadius: 30, marginBottom: 16,
                                            }}>
                                                FC Junior Aquarium
                                            </div>
                                            <h1 style={{
                                                fontFamily: "'Baloo 2',cursive", color: '#fff', fontSize: 'clamp(28px, 5vw, 58px)',
                                                fontWeight: 900, lineHeight: 1.1, margin: '0 auto 14px',
                                                textShadow: '0 4px 20px rgba(0,0,0,.6)', letterSpacing: 1,
                                                maxWidth: 800,
                                            }}>
                                                {banner.title.toUpperCase()}
                                            </h1>
                                            <div style={{ width: 80, height: 4, background: `linear-gradient(90deg,${RED},#ff6b6b)`, margin: '0 auto 18px', borderRadius: 2 }} />
                                            <p style={{
                                                color: 'rgba(255,255,255,.88)', fontSize: 18, maxWidth: 600,
                                                margin: '0 auto 32px', lineHeight: 1.7,
                                                textShadow: '0 2px 8px rgba(0,0,0,.5)',
                                            }}>
                                                {banner.description}
                                            </p>
                                            {banner.link && banner.link !== '#' && (
                                                <Button className="hero-btn-primary" onClick={() => navigate(banner.link)}>
                                                    KHÁM PHÁ NGAY ✦
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </Carousel>
                    ) : (
                        <div style={{
                            height: 520,
                            background: 'linear-gradient(135deg,#0a0a0a 0%,#1a0a0b 50%,#0d1a0d 100%)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column',
                        }}>
                            <h1 style={{ fontFamily: "'Baloo 2',cursive", color: '#fff', fontSize: 52, margin: 0 }}>FC JUNIOR AQUARIUM</h1>
                            <div style={{ width: 80, height: 4, background: RED, marginTop: 16, borderRadius: 2 }} />
                        </div>
                    )}
                </div>

                {/* ── TICKER ── */}
                <div className="ticker-wrap">
                    <div className="ticker-inner">
                        {[...tickerItems, ...tickerItems].map((item, i) => (
                            <div key={i} className="ticker-item">
                                <span className="ticker-dot" />
                                {item}
                            </div>
                        ))}
                    </div>
                </div>

                <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>

                    {/* ── ABOUT / TRUST ── */}
                    <div className="fadeUp d2" style={{
                        marginTop: 64, marginBottom: 64,
                        background: '#fff',
                        borderRadius: 24,
                        overflow: 'hidden',
                        boxShadow: '0 8px 40px rgba(0,0,0,.07)',
                        border: '1.5px solid #f0f0f0',
                    }}>
                        <Row>
                            {/* Image side */}
                            <Col xs={24} md={11} style={{ position: 'relative' }}>
                                <img
                                    src="https://images.unsplash.com/photo-1522069169874-c58ec4b76be5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
                                    alt="About"
                                    style={{ width: '100%', height: '100%', minHeight: 320, objectFit: 'cover', display: 'block' }}
                                />
                                {/* overlay badge */}
                                <div style={{
                                    position: 'absolute', bottom: 24, left: 24,
                                    background: 'rgba(255,255,255,.95)',
                                    borderRadius: 16, padding: '14px 20px',
                                    boxShadow: '0 8px 24px rgba(0,0,0,.15)',
                                    backdropFilter: 'blur(8px)',
                                    display: 'flex', alignItems: 'center', gap: 12,
                                }}>
                                    <div style={{ fontSize: 30 }}>😊</div>
                                    <div>
                                        <div style={{ fontFamily: "'Baloo 2',cursive", fontSize: 28, fontWeight: 900, color: RED, lineHeight: 1 }}>1000+</div>
                                        <div style={{ fontSize: 12, color: '#888', fontWeight: 600 }}>Khách hàng hài lòng</div>
                                    </div>
                                </div>
                            </Col>

                            {/* Text side */}
                            <Col xs={24} md={13} style={{ padding: '40px 44px' }}>
                                <div className="section-tag"><SmileOutlined /> Về chúng tôi</div>
                                <h2 className="section-title" style={{ fontSize: 30, color: '#111', margin: '0 0 14px' }}>
                                    FC Junior Aquarium
                                </h2>
                                <p style={{ fontSize: 15, color: '#666', lineHeight: 1.8, marginBottom: 28 }}>
                                    Điểm đến lý tưởng cho những người đam mê thủy sinh. Chúng tôi không chỉ cung cấp sản phẩm —
                                    chúng tôi mang đến giải pháp kiến tạo không gian xanh ngay trong ngôi nhà của bạn.
                                </p>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                    {[
                                        {
                                            bg: 'linear-gradient(135deg,#e8f4fd,#d6eaf8)',
                                            iconBg: '#3498db', icon: <SafetyCertificateOutlined style={{ color: '#fff', fontSize: 20 }} />,
                                            title: 'Sản phẩm chính hãng', desc: 'Nguồn gốc rõ ràng, kiểm định nghiêm ngặt.',
                                        },
                                        {
                                            bg: 'linear-gradient(135deg,#fef9e7,#fdebd0)',
                                            iconBg: '#f39c12', icon: <StarFilled style={{ color: '#fff', fontSize: 18 }} />,
                                            title: 'Tư vấn chuyên sâu', desc: 'Đội ngũ am hiểu kỹ thuật setup bể.',
                                        },
                                        {
                                            bg: 'linear-gradient(135deg,#eafaf1,#d5f5e3)',
                                            iconBg: '#2ecc71', icon: <RocketOutlined style={{ color: '#fff', fontSize: 18 }} />,
                                            title: 'Giao hàng siêu tốc', desc: 'Vận chuyển an toàn, bảo hành rủi ro.',
                                        },
                                    ].map((item, i) => (
                                        <div key={i} className="trust-item fadeUp" style={{
                                            background: item.bg,
                                            animationDelay: `${i * .15 + .3}s`,
                                            display: 'flex', alignItems: 'center', gap: 16,
                                        }}>
                                            <div style={{
                                                background: item.iconBg, borderRadius: 12, width: 44, height: 44,
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                flexShrink: 0, boxShadow: `0 4px 12px ${item.iconBg}55`,
                                            }}>
                                                {item.icon}
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 700, fontSize: 14, color: '#222', marginBottom: 2 }}>{item.title}</div>
                                                <div style={{ fontSize: 13, color: '#777' }}>{item.desc}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </Col>
                        </Row>
                    </div>

                    {/* ── SĂN VOUCHER ── */}
                    {vouchers.length > 0 && (
                        <div className="fadeUp d3" style={{ marginBottom: 64 }}>
                            {/* Header */}
                            <div style={{
                                background: 'linear-gradient(135deg,#0d0d0d 0%,#1a0508 50%,#0d1a0d 100%)',
                                borderRadius: '24px 24px 0 0',
                                padding: '28px 36px',
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                flexWrap: 'wrap', gap: 16,
                                position: 'relative', overflow: 'hidden',
                            }}>
                                {/* animated bg orbs */}
                                <div style={{ position: 'absolute', top: -30, right: 80, width: 120, height: 120, borderRadius: '50%', background: 'rgba(200,35,44,.15)', animation: 'floatY 4s ease-in-out infinite' }} />
                                <div style={{ position: 'absolute', bottom: -20, right: 20, width: 80, height: 80, borderRadius: '50%', background: 'rgba(46,204,113,.1)', animation: 'floatY 5s ease-in-out infinite reverse' }} />

                                <div style={{ display: 'flex', alignItems: 'center', gap: 16, position: 'relative', zIndex: 1 }}>
                                    <div style={{ animation: 'pulse 2s ease-in-out infinite' }}>
                                        <ThunderboltOutlined style={{ fontSize: 36, color: '#f1c40f' }} />
                                    </div>
                                    <div>
                                        <div style={{ fontFamily: "'Baloo 2',cursive", fontSize: 24, fontWeight: 900, color: '#fff', letterSpacing: 1 }}>
                                            SĂN VOUCHER GIẢM GIÁ
                                        </div>
                                        <div style={{ fontSize: 13, color: 'rgba(255,255,255,.6)', marginTop: 2 }}>
                                            Copy mã và dùng ngay khi thanh toán!
                                        </div>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: 24, position: 'relative', zIndex: 1 }}>
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{ fontFamily: "'Baloo 2',cursive", fontSize: 28, fontWeight: 900, color: '#2ecc71', lineHeight: 1 }}>
                                            {vouchers.filter(v => v.isOpened).length}
                                        </div>
                                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,.55)', marginTop: 2 }}>Đang mở</div>
                                    </div>
                                    <div style={{ width: 1, background: 'rgba(255,255,255,.15)' }} />
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{ fontFamily: "'Baloo 2',cursive", fontSize: 28, fontWeight: 900, color: '#f39c12', lineHeight: 1 }}>
                                            {vouchers.filter(v => !v.isOpened).length}
                                        </div>
                                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,.55)', marginTop: 2 }}>Sắp mở</div>
                                    </div>
                                </div>
                            </div>

                            {/* Cards */}
                            <div style={{
                                background: 'linear-gradient(180deg,#1a1a1a 0%,#f8f9fc 80px)',
                                borderRadius: '0 0 24px 24px',
                                padding: '24px 28px 32px',
                            }}>
                                <Row gutter={[20, 20]}>
                                    {vouchers.map((v, i) => (
                                        <Col xs={24} sm={12} md={8} lg={6} key={v._id}>
                                            <VoucherCard voucher={v} index={i} />
                                        </Col>
                                    ))}
                                </Row>
                            </div>
                        </div>
                    )}

                    {/* ── SẢN PHẨM HOT ── */}
                    <div className="fadeUp d4" style={{ marginBottom: 24, textAlign: 'center' }}>
                        <div className="section-tag" style={{ justifyContent: 'center' }}>
                            <FireOutlined /> Nổi bật
                        </div>
                        <h2 className="section-title" style={{ fontSize: 34, color: '#111', margin: '4px 0 0' }}>
                            SẢN PHẨM HOT
                        </h2>
                        <div style={{ width: 60, height: 4, background: `linear-gradient(90deg,${RED},#ff6b6b)`, margin: '12px auto 0', borderRadius: 2 }} />
                    </div>

                    {loading ? (
                        <Row gutter={[24, 24]} style={{ marginTop: 32 }}>
                            {Array.from({ length: 8 }).map((_, i) => <ProductSkeleton key={i} />)}
                        </Row>
                    ) : (
                        <Row gutter={[24, 24]} style={{ marginTop: 32 }}>
                            {products.slice(0, 8).map((item, i) => (
                                <Col xs={24} sm={12} md={8} lg={6} key={item._id}>
                                    <Badge.Ribbon
                                        text="HOT"
                                        color={RED}
                                        style={{ fontFamily: "'Baloo 2',cursive", fontWeight: 700, fontSize: 12, letterSpacing: 1 }}
                                    >
                                        <div className={`product-card fadeUp d${Math.min(i + 1, 8)}`}
                                            style={{ background: '#fff', border: '1.5px solid #f0f0f0' }}
                                            onClick={() => navigate(`/product/${item._id}`)}>

                                            {/* Image */}
                                            <div style={{ height: 220, overflow: 'hidden', position: 'relative' }}>
                                                <img
                                                    alt={item.name}
                                                    src={item.image || 'https://via.placeholder.com/300?text=No+Image'}
                                                    className="product-img"
                                                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                                                />
                                                {/* category overlay */}
                                                <div style={{
                                                    position: 'absolute', top: 12, left: 12,
                                                    background: 'rgba(0,0,0,.55)',
                                                    backdropFilter: 'blur(4px)',
                                                    borderRadius: 20, padding: '3px 12px',
                                                    fontSize: 11, color: '#fff', fontWeight: 700, letterSpacing: .5,
                                                }}>
                                                    {item.category || 'Aquarium'}
                                                </div>
                                            </div>

                                            {/* Body */}
                                            <div style={{ padding: '14px 16px 16px' }}>
                                                <div style={{
                                                    fontWeight: 700, fontSize: 15, color: '#1a1a1a',
                                                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                                    marginBottom: 14,
                                                }}>
                                                    {item.name}
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <div>
                                                        <span style={{ fontFamily: "'Baloo 2',cursive", fontSize: 22, fontWeight: 900, color: RED }}>
                                                            {item.price.toLocaleString('vi-VN')}
                                                        </span>
                                                        <span style={{ fontSize: 13, color: '#999', marginLeft: 3 }}>đ</span>
                                                    </div>
                                                    <button
                                                        className="add-btn"
                                                        onClick={e => addToCart(e, item)}
                                                        style={{
                                                            background: `linear-gradient(135deg,${RED},#ff6b6b)`,
                                                            border: 'none', borderRadius: 50,
                                                            width: 40, height: 40,
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                            cursor: 'pointer',
                                                            boxShadow: `0 4px 12px rgba(200,35,44,.3)`,
                                                        }}
                                                    >
                                                        <ShoppingCartOutlined style={{ color: '#fff', fontSize: 17 }} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </Badge.Ribbon>
                                </Col>
                            ))}
                        </Row>
                    )}

                    {/* CTA */}
                    <div className="fadeUp d5" style={{ textAlign: 'center', margin: '56px 0 72px' }}>
                        <p style={{ color: '#999', marginBottom: 16, fontSize: 14 }}>Khám phá hàng trăm sản phẩm thủy sinh cao cấp</p>
                        <Button className="explore-btn" onClick={() => navigate('/products')}>
                            KHÁM PHÁ CỬA HÀNG &nbsp; <RightCircleOutlined />
                        </Button>
                    </div>

                </div>
            </div>
        </>
    );
};

export default Home;