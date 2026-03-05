const router = require('express').Router();
const Order = require('../models/Order');

// POST - Tạo đơn hàng mới
router.post('/checkout', async (req, res) => {
    try {
        const newOrder = new Order(req.body);
        const savedOrder = await newOrder.save();
        
        // TODO: Ở đây nên thêm logic trừ tồn kho (stock) của sản phẩm
        
        res.status(200).json({ 
            message: "Đặt hàng thành công!", 
            order: savedOrder 
        });
    } catch (err) {
        res.status(500).json({ message: 'Lỗi đặt hàng', error: err.message });
    }
});

// GET - Lấy tất cả đơn hàng (Admin)
router.get('/', async (req, res) => {
    try {
        const orders = await Order.find().sort({ createdAt: -1 });
        res.json(orders);
    } catch (err) {
        res.status(500).json({ message: 'Lỗi lấy đơn hàng', error: err.message });
    }
});

// GET - Lấy lịch sử đơn hàng của User (MỚI THÊM - QUAN TRỌNG)
// Route này giúp Frontend kiểm tra user đã mua hàng chưa để cho phép đánh giá
router.get('/user/:userId', async (req, res) => {
    try {
        const orders = await Order.find({ userId: req.params.userId }).sort({ createdAt: -1 });
        res.json(orders);
    } catch (err) {
        res.status(500).json({ message: 'Lỗi lấy lịch sử đơn hàng', error: err.message });
    }
});

// GET - Lấy 1 đơn hàng theo ID
router.get('/:id', async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
        }
        res.json(order);
    } catch (err) {
        res.status(500).json({ message: 'Lỗi server', error: err.message });
    }
});

// PUT - Cập nhật trạng thái đơn hàng (Admin)
router.put('/:id', async (req, res) => {
    try {
        const updated = await Order.findByIdAndUpdate(
            req.params.id,
            { status: req.body.status },
            { new: true }
        );
        if (!updated) return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
        res.json(updated);
    } catch (err) {
        res.status(500).json({ message: 'Lỗi cập nhật', error: err.message });
    }
});

// DELETE - Xóa đơn hàng (Admin)
router.delete('/:id', async (req, res) => {
    try {
        await Order.findByIdAndDelete(req.params.id);
        res.json({ message: 'Đã xóa đơn hàng' });
    } catch (err) {
        res.status(500).json({ message: 'Lỗi xóa đơn hàng', error: err.message });
    }
});

module.exports = router;