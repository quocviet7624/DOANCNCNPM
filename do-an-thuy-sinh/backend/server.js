require('dotenv').config();
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const http = require('http');
const { Server } = require('socket.io');


const app = express();
const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        methods: ['GET', 'POST']
    }
});

app.set('io', io);

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

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

mongoose.connect(process.env.MONGO_URI)
    .then(async () => {
        console.log('✅ Đã kết nối thành công tới MongoDB Atlas');
        // Tự động seed cấu hình phí ship nếu chưa có
        try {
            const ShippingConfig = require('./models/ShippingConfig');
            const { getConfig } = require('./controllers/ShippingController');
            const count = await ShippingConfig.countDocuments({ configKey: 'default' });
            if (count === 0) {
                const fakeRes = {
                    json: (data) => {
                        if (data.success) console.log('🚚 Đã seed cấu hình phí ship mặc định (63 tỉnh/thành)!');
                    },
                    status: () => ({ json: () => { } }),
                };
                await getConfig({ body: {} }, fakeRes);
            } else {
                console.log('🚚 Cấu hình phí ship đã có sẵn!');
            }
        } catch (e) {
            console.error('⚠️ Không thể tự seed phí ship:', e.message);
        }
    })
    .catch(err => console.error('❌ Lỗi kết nối Database:', err));

const bannerRoutes = require('./routes/bannerRoutes');
const productRoutes = require('./routes/productRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const orderRoutes = require('./routes/orderRoutes');
const authRoutes = require('./routes/authRoutes');
const conversationRoutes = require('./routes/conversationRoutes');
const voucherRoutes = require('./routes/voucherRoutes');
const wishlistRoutes = require('./routes/wishlist.route');
const reviewRoutes = require('./routes/reviewRoutes');
const shippingRoutes = require('./routes/ShippingRoutes');
const vnpayRoutes = require('./routes/vnpayRoutes');

app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/banners', bannerRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/vouchers', voucherRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/shipping', shippingRoutes);
app.use('/api/vnpay', vnpayRoutes);

app.get('/', (req, res) => {
    res.json({
        message: '🐠 Server FC Junior đang chạy!',
        endpoints: {
            products: '/api/products',
            categories: '/api/categories',
            orders: '/api/orders',
            auth: '/api/auth',
            banners: '/api/banners',
            conversations: '/api/conversations',
            vouchers: '/api/vouchers',
            wishlist: '/api/wishlist',
            reviews: '/api/reviews',
            shipping: '/api/shipping',
            vnpay: '/api/vnpay',
        }
    });
});

server.listen(PORT, () => {
    console.log(`🚀 Server đang chạy tại: http://localhost:${PORT}`);
    console.log(`📊 Database: MongoDB Atlas`);
    console.log(`🔗 API Endpoints sẵn sàng!`);
    console.log(`🔌 Socket.io đã kích hoạt!`);
    console.log(`🏷️  Voucher API: /api/vouchers`);
    console.log(`❤️  Wishlist API: /api/wishlist`);
    console.log(`💬 Reviews API: /api/reviews`);
    console.log(`🚚 Shipping API: /api/shipping`);
});