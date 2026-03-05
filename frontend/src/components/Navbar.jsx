import { Layout, Menu, Input, Badge, Button, Dropdown, Avatar, message } from 'antd';
import { 
  ShoppingCartOutlined, 
  MedicineBoxOutlined, 
  UserOutlined, 
  LogoutOutlined,
  DashboardOutlined,
  SettingOutlined,
  ShoppingOutlined,
  UserAddOutlined,
  LoginOutlined
} from '@ant-design/icons';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';

const { Header } = Layout;
const { Search } = Input;

const AppNavbar = () => {
  const [cartCount, setCartCount] = useState(0);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // 1. Load dữ liệu ban đầu
    updateCartCount();
    loadUserInfo();
    
    // 2. Xử lý sự kiện
    const handleStorageChange = () => {
      updateCartCount();
      loadUserInfo();
    };

    // A. Lắng nghe thay đổi từ TAB KHÁC (cơ chế mặc định của browser)
    window.addEventListener('storage', handleStorageChange);
    
    // B. Lắng nghe thay đổi từ TAB HIỆN TẠI (do mình tự bắn sự kiện từ Home.jsx/Cart.jsx)
    // --- DÒNG QUAN TRỌNG VỪA THÊM ---
    window.addEventListener('cartChange', updateCartCount);
    
    // C. Lắng nghe đăng nhập/đăng xuất
    window.addEventListener('userChanged', loadUserInfo);

    // 3. Cleanup khi component unmount
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('cartChange', updateCartCount); // Nhớ remove listener này
      window.removeEventListener('userChanged', loadUserInfo);
    };
  }, []);

  const updateCartCount = () => {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    // Tính tổng số lượng (quantity) của tất cả sản phẩm
    const total = cart.reduce((sum, item) => sum + (item.quantity || 0), 0);
    setCartCount(total);
  };

  const loadUserInfo = () => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    
    if (token && userStr) {
      try {
        setUser(JSON.parse(userStr));
      } catch (error) {
        console.error('Lỗi parse user data:', error);
        setUser(null);
      }
    } else {
      setUser(null);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    message.success('Đã đăng xuất thành công!');
    
    // Dispatch custom event để báo cho các component khác nếu cần
    window.dispatchEvent(new Event('userChanged'));
    
    navigate('/');
  };

  const handleSearch = (value) => {
    if (value.trim()) {
      navigate(`/products?search=${value}`);
    }
  };

// Menu items cho dropdown user
  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Thông tin cá nhân',
      onClick: () => navigate('/profile') // ✅ Đã sửa link
    },
    ...(user?.role === 'admin' ? [{
      key: 'admin',
      icon: <DashboardOutlined />,
      label: 'Trang quản trị',
      onClick: () => navigate('/admin')
    }] : []),
    {
      key: 'orders',
      icon: <ShoppingOutlined />,
      label: 'Đơn hàng của tôi',
      onClick: () => navigate('/my-orders') // ✅ Đã sửa link
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: 'Cài đặt tài khoản',
      onClick: () => navigate('/settings') // ✅ Đã sửa link
    },
    {
      type: 'divider'
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Đăng xuất',
      danger: true,
      onClick: handleLogout
    }
  ];

  // Menu items chính
  const menuItems = [
    {
      key: '/',
      label: <Link to="/">TRANG CHỦ</Link>
    },
    {
      key: '/products',
      label: <Link to="/products">SẢN PHẨM</Link>
    },
  ];

  // Xác định menu item được chọn dựa vào pathname
  const selectedKeys = [location.pathname];

  return (
    <Header style={{ 
      display: 'flex', 
      alignItems: 'center', 
      background: '#fff', 
      borderBottom: '2px solid #fadb14',
      padding: '0 50px',
      height: '64px',
      position: 'sticky', // Giúp navbar dính lên trên cùng khi scroll
      top: 0,
      zIndex: 1000,
      boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
    }}>
      {/* Logo */}
      <div 
        className="logo" 
        style={{ 
          fontWeight: 'bold', 
          fontSize: '24px', 
          color: '#004d40', 
          marginRight: '30px',
          display: 'flex',
          alignItems: 'center',
          cursor: 'pointer'
        }}
        onClick={() => navigate('/')}
      >
        🐠 FC JUNIOR
      </div>

      {/* Menu chính */}
      <Menu 
        mode="horizontal" 
        selectedKeys={selectedKeys}
        items={menuItems}
        style={{ 
          flex: 1, 
          borderBottom: 'none',
          lineHeight: '64px'
        }} 
      />

      {/* Thanh tìm kiếm */}
      <Search 
        placeholder="Tìm sản phẩm..." 
        onSearch={handleSearch}
        style={{ width: 250, marginRight: '20px' }} 
        allowClear
      />

      {/* Icon chẩn đoán bệnh */}
      <Link to="/diagnose" style={{ marginRight: '20px' }}>
        <MedicineBoxOutlined 
          style={{ fontSize: '24px', color: 'red' }} 
          title="Chẩn đoán bệnh" 
        />
      </Link>

      {/* Giỏ hàng */}
      <Link to="/cart" style={{ marginRight: '20px' }}>
        <Badge count={cartCount} offset={[5, 0]} showZero>
          <ShoppingCartOutlined style={{ fontSize: '24px', color: '#000' }} />
        </Badge>
      </Link>

      {/* Phần Auth */}
      {user ? (
        <Dropdown
          menu={{ items: userMenuItems }}
          trigger={['click']}
          placement="bottomRight"
        >
          <div style={{ 
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '4px 12px',
            borderRadius: '4px',
            transition: 'background 0.3s',
            ':hover': {
              background: '#f0f0f0'
            }
          }}>
            <Avatar 
              icon={<UserOutlined />} 
              style={{ 
                backgroundColor: user.role === 'admin' ? '#f5222d' : '#1890ff',
                cursor: 'pointer'
              }}
              size="default"
            />
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column',
              alignItems: 'flex-start'
            }}>
              <span style={{ 
                fontWeight: 'bold', 
                fontSize: '14px',
                color: '#000'
              }}>
                {user.fullName || user.username}
              </span>
              <span style={{ 
                fontSize: '12px', 
                color: user.role === 'admin' ? '#f5222d' : '#1890ff'
              }}>
                {user.role === 'admin' ? '👑 Admin' : '👤 Khách hàng'}
              </span>
            </div>
          </div>
        </Dropdown>
      ) : (
        <div style={{ display: 'flex', gap: '10px' }}>
          <Link to="/login">
            <Button 
              icon={<LoginOutlined />} 
              type="default"
              style={{
                borderColor: '#004d40',
                color: '#004d40'
              }}
            >
              Đăng nhập
            </Button>
          </Link>
          <Link to="/register">
            <Button 
              icon={<UserAddOutlined />} 
              type="primary"
              style={{
                background: '#004d40',
                borderColor: '#004d40'
              }}
            >
              Đăng ký
            </Button>
          </Link>
        </div>
      )}
    </Header>
  );
};

export default AppNavbar;