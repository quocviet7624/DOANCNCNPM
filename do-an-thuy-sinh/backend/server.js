const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// ========== TẠO HTTP SERVER ==========
const server = http.createServer(app);

// ========== KHỞI TẠO SOCKET.IO ==========
const io = new Server(server, {
    cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        methods: ['GET', 'POST']
    }
});

app.set('io', io);

// ========== SOCKET EVENT HANDLERS ==========
io.on('connection', (socket) => {
    console.log('🔌 Client connected:', socket.id);

    socket.on('admin-join', () => {
        socket.join('admin-room');
        console.log('👨‍💼 Admin joined admin-room');
    });

    socket.on('admin-join-conversation', (conversationId) => {
        socket.join(`admin-conv-${conversationId}`);
    });

    socket.on('admin-leave-conversation', (conversationId) => {
        socket.leave(`admin-conv-${conversationId}`);
    });

    socket.on('user-join', (userEmail) => {
        socket.join(`user-${userEmail}`);
        console.log(`👤 User joined: user-${userEmail}`);
    });

    socket.on('disconnect', () => {
        console.log('❌ Client disconnected:', socket.id);
    });
});

// ========== MIDDLEWARE ==========
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// ========== KẾT NỐI MONGODB ==========
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ Đã kết nối thành công tới MongoDB Atlas'))
    .catch(err => console.error('❌ Lỗi kết nối Database:', err));

// ========== IMPORT ROUTES ==========
const bannerRoutes       = require('./routes/bannerRoutes');
const productRoutes      = require('./routes/productRoutes');
const categoryRoutes     = require('./routes/categoryRoutes');
const orderRoutes        = require('./routes/orderRoutes');
const authRoutes         = require('./routes/authRoutes');
const conversationRoutes = require('./routes/conversationRoutes');
const voucherRoutes      = require('./routes/voucherRoutes');
const wishlistRoutes     = require('./routes/wishlist.route');
const reviewRoutes       = require('./routes/reviewRoutes'); // 👈 THÊM MỚI

// ========== SỬ DỤNG ROUTES ==========
app.use('/api/products',      productRoutes);
app.use('/api/categories',    categoryRoutes);
app.use('/api/orders',        orderRoutes);
app.use('/api/auth',          authRoutes);
app.use('/api/banners',       bannerRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/vouchers',      voucherRoutes);
app.use('/api/wishlist',      wishlistRoutes);
app.use('/api/reviews',       reviewRoutes); // 👈 THÊM MỚI

// ========== ROUTE CHẠY THỬ ==========
app.get('/', (req, res) => {
    res.json({ 
        message: '🐠 Server FC Junior đang chạy!',
        endpoints: {
            products:      '/api/products',
            categories:    '/api/categories',
            orders:        '/api/orders',
            auth:          '/api/auth',
            banners:       '/api/banners',
            conversations: '/api/conversations',
            vouchers:      '/api/vouchers',
            wishlist:      '/api/wishlist',
            reviews:       '/api/reviews', // 👈 THÊM MỚI
        }
    });
});

// ========== KHỞI ĐỘNG SERVER ==========
server.listen(PORT, () => {
    console.log(`🚀 Server đang chạy tại: http://localhost:${PORT}`);
    console.log(`📊 Database: MongoDB Atlas`);
    console.log(`🔗 API Endpoints sẵn sàng!`);
    console.log(`🔌 Socket.io đã kích hoạt!`);
    console.log(`🏷️  Voucher API: /api/vouchers`);
    console.log(`❤️  Wishlist API: /api/wishlist`);
    console.log(`💬 Reviews API: /api/reviews`); // 👈 THÊM MỚI
});