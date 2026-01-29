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

// Import Admin
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import ProtectedRoute from './components/ProtectedRoute';
import ProductManagement from './pages/admin/ProductManagement';
import OrderManagement from './pages/admin/OrderManagement';
import UserManagement from './pages/admin/UserManagement';
import BannerManagement from './pages/admin/BannerManagement';

function App() {
  return (
    <Router>
      <Routes>
        {/* TRANG CHO KHÁCH HÀNG (có Navbar) */}
        <Route path="/" element={<><AppNavbar /><Home /></>} />
        <Route path="/products" element={<><AppNavbar /><Products /></>} />
        <Route path="/cart" element={<><AppNavbar /><Cart /></>} />
        <Route path="/diagnose" element={<><AppNavbar /><Diagnose /></>} />
        <Route path="/login" element={<><AppNavbar /><Login /></>} />
        <Route path="/register" element={<><AppNavbar /><Register /></>} />
        <Route path="/product/:id" element={<><AppNavbar /><ProductDetail /></>} />

        {/* TRANG CHO ADMIN (Bảo vệ bởi ProtectedRoute) */}
        <Route path="/admin" element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }>
          {/* Trang dashboard chính */}
          <Route index element={<AdminDashboard />} />
          
          {/* Các trang con */}
          <Route path="products" element={<ProductManagement />} />
          <Route path="orders" element={<OrderManagement />} />
          <Route path="users" element={<UserManagement />} />
          <Route path="banners" element={<BannerManagement />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;