import { Layout, Menu, Input, Badge, Button, Dropdown, Avatar, message } from 'antd';
import { 
  ShoppingCartOutlined, 
  UserOutlined, 
  LogoutOutlined,
  DashboardOutlined,
  SettingOutlined,
  ShoppingOutlined,
  UserAddOutlined,
  LoginOutlined,
  DownOutlined,
  HeartOutlined,
} from '@ant-design/icons';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import logo from '../assets/logo.png'; 

const { Header } = Layout;
const { Search } = Input;

const PRIMARY = '#004d40';
const ACCENT  = '#fadb14';
const RED     = '#f5222d';
const BLUE    = '#1890ff';
const PURPLE  = '#722ed1';

const ROLE_CONFIG = {
  admin: { label: '👑 Admin',     color: RED,    bg: '#fff5f5', border: '#ffd6d6' },
  staff: { label: '🧑‍💼 Nhân viên', color: PURPLE, bg: '#f9f0ff', border: '#d3adf7' },
};

const AppNavbar = () => {
  const [cartCount,     setCartCount]     = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [user,          setUser]          = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    updateCartCount();
    loadUserInfo();
    const handleStorageChange = () => { updateCartCount(); loadUserInfo(); };
    window.addEventListener('storage',        handleStorageChange);
    window.addEventListener('cartChange',     updateCartCount);
    window.addEventListener('userChanged',    loadUserInfo);
    window.addEventListener('wishlistChange', updateWishlistCount);
    return () => {
      window.removeEventListener('storage',        handleStorageChange);
      window.removeEventListener('cartChange',     updateCartCount);
      window.removeEventListener('userChanged',    loadUserInfo);
      window.removeEventListener('wishlistChange', updateWishlistCount);
    };
  }, []);

  useEffect(() => { updateWishlistCount(); }, [user]);

  const updateCartCount = () => {
    const cart  = JSON.parse(localStorage.getItem('cart') || '[]');
    const total = cart.reduce((sum, item) => sum + (item.quantity || 0), 0);
    setCartCount(total);
  };

  const updateWishlistCount = async () => {
    try {
      const u      = JSON.parse(localStorage.getItem('user') || '{}');
      const userId = u?._id || u?.id;
      if (!userId) { setWishlistCount(0); return; }
      const res  = await fetch(`http://localhost:5000/api/wishlist/${userId}`);
      const data = await res.json();
      setWishlistCount(Array.isArray(data) ? data.length : 0);
    } catch {
      setWishlistCount(0);
    }
  };

  const loadUserInfo = () => {
    const token   = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    if (token && userStr) {
      try { setUser(JSON.parse(userStr)); } catch { setUser(null); }
    } else {
      setUser(null);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setWishlistCount(0);
    message.success('Đã đăng xuất thành công!');
    window.dispatchEvent(new Event('userChanged'));
    navigate('/');
  };

  // ── Navigate đến /products?search=... ─────────────────────────────────────
  const handleSearch = (value) => {
    const keyword = value.trim();
    if (keyword) {
      navigate(`/products?search=${encodeURIComponent(keyword)}`);
    } else {
      navigate('/products');
    }
  };

  const isStaff = ['admin', 'staff'].includes(user?.role);
  const roleCfg = ROLE_CONFIG[user?.role] || null;

  const userMenuItems = [
    { key: 'profile',  icon: <UserOutlined />,    label: 'Thông tin cá nhân',   onClick: () => navigate('/profile') },
    ...(isStaff ? [{ key: 'admin', icon: <DashboardOutlined />, label: 'Trang quản trị', onClick: () => navigate('/admin') }] : []),
    { key: 'orders',   icon: <ShoppingOutlined />, label: 'Đơn hàng của tôi',    onClick: () => navigate('/my-orders') },
    { key: 'wishlist', icon: <HeartOutlined />,    label: 'Sản phẩm yêu thích',  onClick: () => navigate('/wishlist') },
    { key: 'settings', icon: <SettingOutlined />,  label: 'Cài đặt tài khoản',   onClick: () => navigate('/settings') },
    { type: 'divider' },
    { key: 'logout', icon: <LogoutOutlined />, label: 'Đăng xuất', danger: true, onClick: handleLogout },
  ];

  const menuItems = [
    { key: '/',         label: <Link to="/">TRANG CHỦ</Link> },
    { key: '/products', label: <Link to="/products">SẢN PHẨM</Link> },
    { key: '/about',    label: <Link to="/about">GIỚI THIỆU</Link> },
  ];

  return (
    <>
      <style>{`
        .fc-navbar .ant-menu-horizontal { border-bottom: none !important; background: transparent !important; }
        .fc-navbar .ant-menu-horizontal .ant-menu-item {
          color: #004d40 !important; font-weight: 600; font-size: 14px;
          padding: 0 16px !important; border-bottom: 3px solid transparent !important;
          line-height: 61px !important; top: 0 !important; margin: 0 !important;
        }
        .fc-navbar .ant-menu-horizontal .ant-menu-item-selected { border-bottom: 3px solid #fadb14 !important; }
        .fc-navbar .ant-input-search .ant-input { border-radius: 20px 0 0 20px !important; }
        .fc-navbar .ant-input-search .ant-btn { border-radius: 0 20px 20px 0 !important; background: #004d40 !important; }
        .fc-icon-btn { display: flex; align-items: center; justify-content: center; width: 38px; height: 38px; border-radius: 50%; transition: background 0.2s; cursor: pointer; }
        .fc-icon-btn:hover { background: #f0f7f6; }
        .fc-logo-container:hover img { transform: scale(1.1); }
        .fc-logo-container img { transition: transform 0.3s ease; }
      `}</style>

      <Header
        className="fc-navbar"
        style={{
          display: 'flex', alignItems: 'center', background: '#fff',
          borderBottom: `3px solid ${ACCENT}`, padding: '0 40px', height: 64,
          position: 'sticky', top: 0, zIndex: 1000, boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
        }}
      >
        <div
          className="fc-logo-container"
          onClick={() => navigate('/')}
          style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', marginRight: 30, flexShrink: 0 }}
        >
          <img src={logo} alt="FC JUNIOR Logo" style={{ height: 45, width: 'auto', objectFit: 'contain' }} />
          <span style={{ fontWeight: 800, fontSize: 19, color: PRIMARY, letterSpacing: 0.5, lineHeight: 1, display: 'inline-block', marginTop: 2 }}>
            FC JUNIOR
          </span>
        </div>

        <Menu
          mode="horizontal"
          selectedKeys={[location.pathname]}
          items={menuItems}
          style={{ flex: 1, minWidth: 0 }}
        />

        {/* ── Search: không dùng controlled value để tránh conflict với Products ── */}
        <Search
          placeholder="Tìm sản phẩm..."
          onSearch={handleSearch}
          allowClear
          style={{ width: 220, marginRight: 12, flexShrink: 0 }}
        />

        {user && (
          <Link to="/wishlist" className="fc-icon-btn" style={{ marginRight: 8 }}>
            <Badge count={wishlistCount} size="small" offset={[4, -2]}>
              <HeartOutlined style={{ fontSize: 22, color: '#c8232c' }} />
            </Badge>
          </Link>
        )}

        <Link to="/cart" className="fc-icon-btn" style={{ marginRight: 12 }}>
          <Badge count={cartCount} size="small" offset={[4, -2]}>
            <ShoppingCartOutlined style={{ fontSize: 22, color: '#333' }} />
          </Badge>
        </Link>

        {user ? (
          <Dropdown menu={{ items: userMenuItems }} trigger={['click']} placement="bottomRight">
            <div className="fc-user-btn" style={{
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
              padding: '5px 10px 5px 5px', borderRadius: 24,
              border: `1.5px solid ${roleCfg ? roleCfg.border : '#d6eaf5'}`,
              background: roleCfg ? roleCfg.bg : '#f0f7ff',
              flexShrink: 0,
            }}>
              <Avatar
                icon={<UserOutlined />}
                style={{ backgroundColor: roleCfg ? roleCfg.color : BLUE }}
                size={32}
              />
              <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.3 }}>
                <span style={{ fontWeight: 700, fontSize: 13, color: '#222' }}>
                  {user.fullName || user.username}
                </span>
                <span style={{ fontSize: 11, color: roleCfg ? roleCfg.color : BLUE, fontWeight: 500 }}>
                  {roleCfg ? roleCfg.label : '👤 Khách hàng'}
                </span>
              </div>
              <DownOutlined style={{ fontSize: 10, color: '#999' }} />
            </div>
          </Dropdown>
        ) : (
          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
            <Link to="/login">
              <Button icon={<LoginOutlined />} style={{ borderColor: PRIMARY, color: PRIMARY, borderRadius: 20, fontWeight: 600 }}>
                Đăng nhập
              </Button>
            </Link>
            <Link to="/register">
              <Button icon={<UserAddOutlined />} type="primary" style={{ background: PRIMARY, borderColor: PRIMARY, borderRadius: 20, fontWeight: 600 }}>
                Đăng ký
              </Button>
            </Link>
          </div>
        )}
      </Header>
    </>
  );
};

export default AppNavbar;