const router = require('express').Router();
const Order  = require('../models/Order');

// POST - Tạo đơn hàng mới
router.post('/checkout', async (req, res) => {
    try {
        const {
            userId, customerName, phone, address, province,
            items, subtotalAmount, discountAmount, shippingFee,
            totalAmount, voucherCode, paymentMethod, status,
        } = req.body;

        // PayPal → đã thanh toán ngay; COD → chưa thanh toán
        const isPaid = paymentMethod === 'PayPal';

        const newOrder = new Order({
            userId, customerName, phone, address,
            province:       province       || '',
            items,
            subtotalAmount: subtotalAmount || totalAmount,
            discountAmount: discountAmount || 0,
            shippingFee:    shippingFee    || 0,
            totalAmount,
            voucherCode:    voucherCode    || null,
            paymentMethod:  paymentMethod  || 'COD',
            isPaid,
            status:         status         || 'Chờ xác nhận',
        });

        const savedOrder = await newOrder.save();
        res.status(200).json({ message: 'Đặt hàng thành công!', order: savedOrder });
    } catch (err) {
        res.status(500).json({ message: 'Lỗi đặt hàng', error: err.message });
    }
});

// GET - Tất cả đơn hàng (Admin)
router.get('/', async (req, res) => {
    try {
        const orders = await Order.find().sort({ createdAt: -1 });
        res.json(orders);
    } catch (err) {
        res.status(500).json({ message: 'Lỗi lấy đơn hàng', error: err.message });
    }
});

// GET - Lịch sử đơn hàng của User
router.get('/user/:userId', async (req, res) => {
    try {
        const orders = await Order.find({ userId: req.params.userId }).sort({ createdAt: -1 });
        res.json(orders);
    } catch (err) {
        res.status(500).json({ message: 'Lỗi lấy lịch sử đơn hàng', error: err.message });
    }
});

// GET - 1 đơn hàng theo ID
router.get('/:id', async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
        res.json(order);
    } catch (err) {
        res.status(500).json({ message: 'Lỗi server', error: err.message });
    }
});

// PUT - Cập nhật trạng thái (Admin)
// Nếu chuyển sang 'Đã giao' → tự động đánh dấu isPaid = true (COD đã thu tiền)
router.put('/:id', async (req, res) => {
    try {
        const updateData = { updatedAt: Date.now() };
        if (req.body.status) updateData.status = req.body.status;
        if (req.body.status === 'Đã giao') updateData.isPaid = true;
        if (typeof req.body.isPaid === 'boolean') updateData.isPaid = req.body.isPaid;

        const updated = await Order.findByIdAndUpdate(req.params.id, updateData, { new: true });
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