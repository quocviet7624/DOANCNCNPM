import React from 'react';
import { FaFacebookF, FaYoutube, FaInstagram, FaTiktok, FaPhoneAlt, FaEnvelope, FaMapMarkerAlt } from 'react-icons/fa';

const Footer = () => {
  const policies = ['Chính sách bảo hành', 'Chính sách đổi trả', 'Phương thức thanh toán', 'Hướng dẫn mua hàng', 'Hệ thống cửa hàng'];

  return (
    <footer
      style={{
        background: 'linear-gradient(135deg, #0a1628 0%, #0d2137 40%, #0a2a2a 100%)',
        fontFamily: "'Be Vietnam Pro', 'Segoe UI', sans-serif",
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Decorative background elements */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse 60% 40% at 10% 50%, rgba(6,182,212,0.07) 0%, transparent 70%), radial-gradient(ellipse 50% 60% at 90% 20%, rgba(20,184,166,0.06) 0%, transparent 70%)',
      }} />

      {/* Top accent line */}
      <div style={{
        height: '3px',
        background: 'linear-gradient(90deg, transparent, #06b6d4, #fbbf24, #06b6d4, transparent)',
      }} />

      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '56px 40px 0', position: 'relative' }}>

        {/* ===== MAIN CONTENT ROW ===== */}
        <div style={{ display: 'flex', gap: '0', alignItems: 'flex-start', flexWrap: 'wrap' }}>

          {/* --- COL 1: BRAND --- */}
          <div style={{ flex: '0 0 280px', paddingRight: '48px', borderRight: '1px solid rgba(6,182,212,0.15)' }}>
            {/* Logo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <div style={{
                width: '44px', height: '44px', borderRadius: '10px',
                background: 'linear-gradient(135deg, #0891b2, #0d9488)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 0 20px rgba(8,145,178,0.4)',
              }}>
                <span style={{ fontSize: '22px' }}>🐠</span>
              </div>
              <div>
                <div style={{
                  fontSize: '22px', fontWeight: '900', letterSpacing: '-0.5px',
                  background: 'linear-gradient(90deg, #fcd34d, #f59e0b)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                  lineHeight: 1,
                }}>FC JUNIOR</div>
                <div style={{ fontSize: '10px', color: '#67e8f9', letterSpacing: '3px', textTransform: 'uppercase', marginTop: '3px' }}>
                  AQUATIC WORLD
                </div>
              </div>
            </div>

            <p style={{ fontSize: '13px', lineHeight: '1.75', color: '#94a3b8', marginBottom: '24px' }}>
              Chuyên cung cấp phụ kiện & sinh vật cảnh thủy sinh chất lượng cao. Tỉ mỉ trong từng sản phẩm, bền vững trong mọi giải pháp.
            </p>

            {/* Social icons */}
            <div style={{ display: 'flex', gap: '10px' }}>
              {[
                { icon: <FaFacebookF size={14}/>, hoverBg: '#1877F2', label: 'Facebook' },
                { icon: <FaInstagram size={14}/>, hoverBg: 'linear-gradient(135deg,#f09433,#dc2743,#bc1888)', label: 'Instagram' },
                { icon: <FaYoutube size={14}/>, hoverBg: '#FF0000', label: 'YouTube' },
                { icon: <FaTiktok size={14}/>, hoverBg: '#010101', label: 'TikTok' },
              ].map(({ icon, hoverBg, label }, i) => (
                <a key={i} href="#" aria-label={label}
                  title={label}
                  style={{
                    width: '36px', height: '36px', borderRadius: '8px',
                    background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#94a3b8', transition: 'all 0.2s', cursor: 'pointer',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = typeof hoverBg === 'string' && hoverBg.startsWith('linear') ? hoverBg : hoverBg;
                    e.currentTarget.style.color = '#fff';
                    e.currentTarget.style.transform = 'translateY(-3px)';
                    e.currentTarget.style.borderColor = 'transparent';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.07)';
                    e.currentTarget.style.color = '#94a3b8';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                  }}
                >
                  {icon}
                </a>
              ))}
            </div>
          </div>

          {/* --- COL 2: POLICIES --- */}
          <div style={{ flex: '0 0 220px', padding: '0 48px', borderRight: '1px solid rgba(6,182,212,0.15)' }}>
            <div style={{ fontSize: '11px', fontWeight: '700', letterSpacing: '3px', color: '#06b6d4', textTransform: 'uppercase', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ display: 'inline-block', width: '18px', height: '2px', background: '#fbbf24', borderRadius: '2px' }} />
              Chính sách
            </div>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {policies.map((item, i) => (
                <li key={i}>
                  <a href="#" style={{
                    fontSize: '13px', color: '#94a3b8', textDecoration: 'none',
                    padding: '7px 0', display: 'flex', alignItems: 'center', gap: '8px',
                    transition: 'color 0.2s',
                    borderBottom: '1px solid rgba(255,255,255,0.04)',
                  }}
                    onMouseEnter={e => { e.currentTarget.style.color = '#fcd34d'; e.currentTarget.querySelector('span').style.opacity = '1'; }}
                    onMouseLeave={e => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.querySelector('span').style.opacity = '0'; }}
                  >
                    <span style={{ color: '#fcd34d', fontSize: '10px', opacity: 0, transition: 'opacity 0.2s' }}>▸</span>
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* --- COL 3: CONTACT --- */}
          <div style={{ flex: '0 0 260px', padding: '0 48px', borderRight: '1px solid rgba(6,182,212,0.15)' }}>
            <div style={{ fontSize: '11px', fontWeight: '700', letterSpacing: '3px', color: '#06b6d4', textTransform: 'uppercase', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ display: 'inline-block', width: '18px', height: '2px', background: '#fbbf24', borderRadius: '2px' }} />
              Liên hệ
            </div>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {[
                { icon: <FaMapMarkerAlt size={13}/>, text: 'Hải Châu, TP Đà Nẵng' },
                { icon: <FaPhoneAlt size={13}/>, text: 'Hotline: 0852 192 629' },
                { icon: <FaEnvelope size={13}/>, text: 'lequocviet76st@gmail.com '},
              ].map(({ icon, text }, i) => (
                <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '32px', height: '32px', borderRadius: '8px', flexShrink: 0,
                    background: 'rgba(6,182,212,0.12)', border: '1px solid rgba(6,182,212,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#06b6d4',
                  }}>
                    {icon}
                  </div>
                  <span style={{ fontSize: '13px', color: '#cbd5e1' }}>{text}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* --- COL 4: QR + ZALO --- */}
          <div style={{ flex: '1', paddingLeft: '48px' }}>
            <div style={{ fontSize: '11px', fontWeight: '700', letterSpacing: '3px', color: '#06b6d4', textTransform: 'uppercase', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ display: 'inline-block', width: '18px', height: '2px', background: '#fbbf24', borderRadius: '2px' }} />
              Kết nối
            </div>

            {/* QR card */}
            <div style={{
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(6,182,212,0.2)',
              borderRadius: '14px', padding: '16px', display: 'flex', alignItems: 'center', gap: '16px',
              cursor: 'pointer', transition: 'border-color 0.2s', maxWidth: '260px',
            }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(251,191,36,0.5)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(6,182,212,0.2)'}
            >
              <div style={{ background: '#fff', borderRadius: '8px', padding: '4px', flexShrink: 0 }}>
                <img
                  src="/zalo.jpg"
                  alt="QR Code Zalo"
                  style={{ width: '60px', height: '60px', display: 'block' }}
                />
              </div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#e2e8f0', marginBottom: '4px' }}>Quét để kết nối</div>
                <div style={{ fontSize: '11px', color: '#67e8f9' }}>Zalo FC Junior</div>
                <div style={{ marginTop: '8px', display: 'inline-flex', alignItems: 'center', gap: '5px', background: 'rgba(6,182,212,0.15)', borderRadius: '20px', padding: '3px 10px' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#4ade80', display: 'inline-block' }} />
                  <span style={{ fontSize: '10px', color: '#86efac' }}>Đang hoạt động</span>
                </div>
              </div>
            </div>

            {/* Working hours */}
            <div style={{ marginTop: '20px', maxWidth: '260px' }}>
              <div style={{ fontSize: '11px', color: '#475569', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>Giờ hoạt động</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {[
                  { day: 'Thứ 2 – Thứ 6', time: '8:00 – 21:00' },
                  { day: 'Thứ 7 – Chủ nhật', time: '9:00 – 22:00' },
                ].map(({ day, time }, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                    <span style={{ color: '#64748b' }}>{day}</span>
                    <span style={{ color: '#fcd34d', fontWeight: '600' }}>{time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ===== BOTTOM BAR ===== */}
        <div style={{
          marginTop: '48px', padding: '20px 0',
          borderTop: '1px solid rgba(6,182,212,0.12)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: '12px',
        }}>
          <p style={{ fontSize: '12px', color: '#475569', margin: 0, letterSpacing: '1px' }}>
            © 2026 <span style={{ color: '#67e8f9', fontWeight: '600' }}>FC JUNIOR</span> – All rights reserved
          </p>
          <div style={{ display: 'flex', gap: '24px' }}>
            {['Privacy Policy', 'Terms of Service', 'Sitemap'].map((link, i) => (
              <a key={i} href="#" style={{ fontSize: '12px', color: '#475569', textDecoration: 'none', letterSpacing: '0.5px', transition: 'color 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.color = '#fcd34d'}
                onMouseLeave={e => e.currentTarget.style.color = '#475569'}
              >
                {link}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;