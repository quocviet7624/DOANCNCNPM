import React from 'react';
import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom';

// --- IMPORT COMPONENTS ---
import AppNavbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';

// --- IMPORT PAGES KHÁCH HÀNG ---
import Home from './pages/Home';
import Products from './pages/Products';
import Cart from './pages/Cart';
import Login from './pages/Login';
import Register from './pages/Register';
import ProductDetail from './pages/ProductDetail';
import Checkout from './pages/Checkout';

// --- IMPORT CÁC TRANG USER ---
import UserProfile from './pages/UserProfile';
import MyOrders from './pages/MyOrders';
import AccountSettings from './pages/AccountSettings';

// --- IMPORT ADMIN ---
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import ProductManagement from './pages/admin/ProductManagement';
import OrderManagement from './pages/admin/OrderManagement';
import UserManagement from './pages/admin/UserManagement';
import BannerManagement from './pages/admin/BannerManagement';
import CategoryManagement from './pages/admin/CategoryManagement';

// --- TẠO LAYOUT CHO USER (Gồm Navbar và Footer) ---
// Layout này giúp bao bọc các trang khách hàng để luôn hiển thị Header/Footer
const MainLayout = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <AppNavbar />
      <main className="flex-grow">
        <Outlet /> {/* Nơi nội dung các trang con sẽ hiển thị */}
      </main>
      <Footer />
    </div>
  );
};

function App() {
  return (
    <Router>
      <Routes>
        
        {/* NHÓM ROUTE KHÁCH HÀNG (Sử dụng MainLayout) */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/products" element={<Products />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          
          {/* CÁC ROUTE USER */}
          <Route path="/profile" element={<UserProfile />} />
          <Route path="/my-orders" element={<MyOrders />} />
          <Route path="/settings" element={<AccountSettings />} />
        </Route>

        {/* TRANG RIÊNG BIỆT (Ví dụ Checkout thường tối giản, không cần Navbar/Footer chung) */}
        <Route path="/checkout" element={<Checkout />} />

        {/* TRANG CHO ADMIN (Sử dụng AdminLayout riêng) */}
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="products" element={<ProductManagement />} />
          <Route path="categories" element={<CategoryManagement />} />
          <Route path="orders" element={<OrderManagement />} />
          <Route path="users" element={<UserManagement />} />
          <Route path="banners" element={<BannerManagement />} />
        </Route>

      </Routes>
    </Router>
  );
}

export default App;