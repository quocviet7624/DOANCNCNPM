import React from 'react';
import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom';

import AppNavbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import ChatWidget from './components/ChatWidget';

import Home from './pages/Home';
import Products from './pages/Products';
import Cart from './pages/Cart';
import Login from './pages/Login';
import Register from './pages/Register';
import ProductDetail from './pages/ProductDetail';
import Checkout from './pages/Checkout';
import AboutPage from './pages/AboutPage';
import UserProfile from './pages/UserProfile';
import MyOrders from './pages/MyOrders';
import AccountSettings from './pages/AccountSettings';
import WishlistPage from './pages/WishlistPage';   // ← MỚI

import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import ProductManagement from './pages/admin/ProductManagement';
import OrderManagement from './pages/admin/OrderManagement';
import UserManagement from './pages/admin/UserManagement';
import BannerManagement from './pages/admin/BannerManagement';
import CategoryManagement from './pages/admin/CategoryManagement';
import ChatManagement from './pages/admin/ChatManagement';
import AdminVouchers from './pages/admin/AdminVouchers';

// ── Layout khách hàng ──
const MainLayout = () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userEmail = user?.email || `guest_${Date.now()}@fcjunior.com`;
    return (
        <div className="flex flex-col min-h-screen">
            <AppNavbar />
            <main className="flex-grow"><Outlet /></main>
            <Footer />
            <ChatWidget userEmail={userEmail} />
        </div>
    );
};

// ── Guard: chỉ cho phép role nhất định vào ──
const RoleRoute = ({ allowedRoles, children }) => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (!allowedRoles.includes(user.role)) {
        return (
            <div style={{ textAlign: 'center', padding: '80px 20px' }}>
                <h1 style={{ fontSize: 72, color: '#ff4d4f', margin: 0 }}>403</h1>
                <h2 style={{ color: '#333' }}>Không có quyền truy cập</h2>
                <p style={{ color: '#888' }}>Trang này chỉ dành cho Admin.</p>
                <button
                    onClick={() => window.history.back()}
                    style={{
                        marginTop: 16, padding: '8px 24px',
                        background: '#1890ff', color: '#fff',
                        border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 14,
                    }}
                >
                    Quay lại
                </button>
            </div>
        );
    }
    return children;
};

function App() {
    return (
        <Router>
            <Routes>

                {/* ── NHÓM ROUTE KHÁCH HÀNG ── */}
                <Route element={<MainLayout />}>
                    <Route path="/"            element={<Home />} />
                    <Route path="/about"       element={<AboutPage />} />
                    <Route path="/products"    element={<Products />} />
                    <Route path="/cart"        element={<Cart />} />
                    <Route path="/login"       element={<Login />} />
                    <Route path="/register"    element={<Register />} />
                    <Route path="/product/:id" element={<ProductDetail />} />
                    <Route path="/profile"     element={<UserProfile />} />
                    <Route path="/my-orders"   element={<MyOrders />} />
                    <Route path="/settings"    element={<AccountSettings />} />
                    <Route path="/wishlist"    element={<WishlistPage />} />  {/* ← MỚI */}
                </Route>

                {/* ── TRANG RIÊNG BIỆT ── */}
                <Route path="/checkout" element={<Checkout />} />

                {/* ── TRANG ADMIN ── */}
                <Route
                    path="/admin"
                    element={
                        <ProtectedRoute>
                            <AdminLayout />
                        </ProtectedRoute>
                    }
                >
                    <Route index                element={<AdminDashboard />} />
                    <Route path="products"      element={<ProductManagement />} />
                    <Route path="categories"    element={<CategoryManagement />} />
                    <Route path="orders"        element={<OrderManagement />} />
                    <Route path="banners"       element={<BannerManagement />} />
                    <Route path="chat"          element={<ChatManagement />} />
                    <Route path="vouchers"      element={<AdminVouchers />} />
                    <Route
                        path="users"
                        element={
                            <RoleRoute allowedRoles={['admin']}>
                                <UserManagement />
                            </RoleRoute>
                        }
                    />
                </Route>

            </Routes>
        </Router>
    );
}

export default App;