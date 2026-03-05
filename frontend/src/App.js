import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Import components
import AppNavbar from './components/Navbar';
import Home from './pages/Home';
import Products from './pages/Products';
import Cart from './pages/Cart';
import Diagnose from './pages/Diagnose';
import Login from './pages/Login';
import Register from './pages/Register';
import ProductDetail from './pages/ProductDetail';
import Checkout from './pages/Checkout';

// --- IMPORT CÁC TRANG USER ---
import UserProfile from './pages/UserProfile';
import MyOrders from './pages/MyOrders';
import AccountSettings from './pages/AccountSettings';

// Import Admin
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import ProtectedRoute from './components/ProtectedRoute';
import ProductManagement from './pages/admin/ProductManagement';
import OrderManagement from './pages/admin/OrderManagement';
import UserManagement from './pages/admin/UserManagement';
import BannerManagement from './pages/admin/BannerManagement';
import CategoryManagement from './pages/admin/CategoryManagement'; // <--- 1. MỚI THÊM

function App() {
  return (
    <Router>
      <Routes>
        {/* TRANG CHO KHÁCH HÀNG */}
        <Route path="/" element={<><AppNavbar /><Home /></>} />
        <Route path="/products" element={<><AppNavbar /><Products /></>} />
        <Route path="/cart" element={<><AppNavbar /><Cart /></>} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/diagnose" element={<><AppNavbar /><Diagnose /></>} />
        <Route path="/login" element={<><AppNavbar /><Login /></>} />
        <Route path="/register" element={<><AppNavbar /><Register /></>} />
        <Route path="/product/:id" element={<><AppNavbar /><ProductDetail /></>} />

        {/* --- CÁC ROUTE USER --- */}
        <Route path="/profile" element={<><AppNavbar /><UserProfile /></>} />
        <Route path="/my-orders" element={<><AppNavbar /><MyOrders /></>} />
        <Route path="/settings" element={<><AppNavbar /><AccountSettings /></>} />

        {/* TRANG CHO ADMIN */}
        <Route path="/admin" element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }>
          <Route index element={<AdminDashboard />} />
          
          <Route path="products" element={<ProductManagement />} />
          <Route path="categories" element={<CategoryManagement />} /> {/* <--- 2. MỚI THÊM */}
          <Route path="orders" element={<OrderManagement />} />
          <Route path="users" element={<UserManagement />} />
          <Route path="banners" element={<BannerManagement />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;