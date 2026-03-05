import React, { useEffect } from 'react';
import { Layout, Menu, Button, message } from 'antd';
import { 
    ShoppingOutlined, 
    UserOutlined, 
    FileTextOutlined, 
    DashboardOutlined, 
    LogoutOutlined,
    VideoCameraOutlined,
    AppstoreOutlined // <--- 1. Import icon cho danh mục
} from '@ant-design/icons';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';

const { Sider, Content, Header } = Layout;

const AdminLayout = () => {
    const navigate = useNavigate();
    const location = useLocation();
    
    useEffect(() => {
        // Kiểm tra đăng nhập
        const token = localStorage.getItem('token');
        const userStr = localStorage.getItem('user');
        
        if (!token || !userStr) {
            message.error('Vui lòng đăng nhập!');
            navigate('/login');
            return;
        }

        try {
            const user = JSON.parse(userStr);
            if (user.role !== 'admin') {
                message.error('Bạn không có quyền truy cập!');
                navigate('/');
            }
        } catch (err) {
            console.error('❌ Lỗi parse user:', err);
            localStorage.clear();
            navigate('/login');
        }
    }, [navigate]);
    
    const handleLogout = () => {
        localStorage.clear();
        message.success('Đã đăng xuất!');
        navigate('/login');
        window.location.reload();
    };

    const getUserInfo = () => {
        try {
            const userStr = localStorage.getItem('user');
            return userStr ? JSON.parse(userStr) : null;
        } catch {
            return null;
        }
    };

    const user = getUserInfo();

    // Xác định menu đang chọn để sáng đèn
    const getSelectedKey = () => {
        const path = location.pathname;
        if (path === '/admin' || path === '/admin/') return '1';
        if (path.includes('/admin/banners')) return '5';
        if (path.includes('/admin/products')) return '2';
        if (path.includes('/admin/categories')) return '6'; // <--- 2. Thêm logic sáng đèn cho Danh mục
        if (path.includes('/admin/orders')) return '3';
        if (path.includes('/admin/users')) return '4';
        return '1';
    };

    return (
        <Layout style={{ minHeight: '100vh' }}>
            <Sider collapsible theme="dark">
                <div style={{ 
                    height: 64, 
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderBottom: '1px solid #002140'
                }}>
                    <div style={{
                        color: '#fff', 
                        textAlign: 'center', 
                        fontWeight: 'bold',
                        fontSize: '18px'
                    }}>
                        🐠 FC JUNIOR
                    </div>
                </div>
                
                <Menu 
                    theme="dark" 
                    mode="inline" 
                    selectedKeys={[getSelectedKey()]}
                >
                    <Menu.Item key="1" icon={<DashboardOutlined />}>
                        <Link to="/admin">Tổng quan</Link>
                    </Menu.Item>
                    
                    <Menu.Item key="5" icon={<VideoCameraOutlined />}>
                        <Link to="/admin/banners">Banner/Video</Link>
                    </Menu.Item>
                    
                    <Menu.Item key="2" icon={<ShoppingOutlined />}>
                        <Link to="/admin/products">Sản phẩm</Link>
                    </Menu.Item>

                    {/* --- 3. PHẦN BẠN ĐANG THIẾU NÈ --- */}
                    <Menu.Item key="6" icon={<AppstoreOutlined />}>
                        <Link to="/admin/categories">Danh mục</Link>
                    </Menu.Item>
                    {/* --------------------------------- */}
                    
                    <Menu.Item key="3" icon={<FileTextOutlined />}>
                        <Link to="/admin/orders">Đơn hàng</Link>
                    </Menu.Item>
                    
                    <Menu.Item key="4" icon={<UserOutlined />}>
                        <Link to="/admin/users">Người dùng</Link>
                    </Menu.Item>
                </Menu>
            </Sider>
            
            <Layout>
                <Header style={{ 
                    background: '#fff', 
                    padding: '0 24px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}>
                    <div>
                        <h2 style={{ margin: 0, color: '#004d40' }}>
                            FC Junior - Quản trị
                        </h2>
                        {user && (
                            <span style={{ color: '#666', fontSize: '12px' }}>
                                Xin chào, {user.fullName || user.username} (👑 Admin)
                            </span>
                        )}
                    </div>
                    <Button 
                        type="primary" 
                        danger
                        icon={<LogoutOutlined />}
                        onClick={handleLogout}
                    >
                        Đăng xuất
                    </Button>
                </Header>
                
                <Content style={{ 
                    margin: '24px 16px', 
                    padding: 24, 
                    background: '#fff',
                    borderRadius: '8px'
                }}>
                    <Outlet />
                </Content>
            </Layout>
        </Layout>
    );
};

export default AdminLayout;