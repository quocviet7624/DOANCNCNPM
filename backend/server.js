const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// ========== MIDDLEWARE ==========
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Cho phép upload file tối đa 50MB
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// ========== KẾT NỐI MONGODB ==========
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ Đã kết nối thành công tới MongoDB Atlas'))
    .catch(err => console.error('❌ Lỗi kết nối Database:', err));

// ========== IMPORT ROUTES ==========
const bannerRoutes = require('./routes/bannerRoutes');
const productRoutes = require('./routes/productRoutes');
// --- ĐÃ SỬA DÒNG DƯỚI ĐÂY ---
const categoryRoutes = require('./routes/categoryRoutes'); // Import Route, không phải Model
const orderRoutes = require('./routes/orderRoutes');
const authRoutes = require('./routes/authRoutes');

// ========== SỬ DỤNG ROUTES ==========
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes); // --- ĐÃ SỬA: Dùng biến categoryRoutes
app.use('/api/orders', orderRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/banners', bannerRoutes);

// ========== ROUTE CHẠY THỬ ==========
app.get('/', (req, res) => {
    res.json({ 
        message: '🐠 Server Ylang Aquarium đang chạy!',
        endpoints: {
            products: '/api/products',
            categories: '/api/categories',
            orders: '/api/orders',
            auth: '/api/auth'
        }
    });
});

// ========== KHỞI ĐỘNG SERVER ==========
app.listen(PORT, () => {
    console.log(`🚀 Server đang chạy tại: http://localhost:${PORT}`);
    console.log(`📊 Database: MongoDB Atlas`);
    console.log(`🔗 API Endpoints sẵn sàng!`);
});