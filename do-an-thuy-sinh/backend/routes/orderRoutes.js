const router = require('express').Router();
const Order   = require('../models/Order');
const Product = require('../models/Product');

// Helper: lấy product ID từ item (tương thích cả productId lẫn _id)
const getProductId = (item) => item.productId || item._id;

// ─────────────────────────────────────────────────────────────
// POST - Tạo đơn hàng mới
// ─────────────────────────────────────────────────────────────
router.post('/checkout', async (req, res) => {
    try {
        const {
            userId, customerName, phone, address, province,
            items, subtotalAmount, discountAmount, shippingFee,
            totalAmount, voucherCode, paymentMethod, status,
        } = req.body;

        // ✅ 1. Kiểm tra tồn kho trước khi đặt
        for (const item of items) {
            const pid     = getProductId(item);
            const product = await Product.findById(pid);

            if (!product) {
                return res.status(404).json({
                    message: `Sản phẩm "${item.name}" không tồn tại!`,
                });
            }
            if (product.stock < item.quantity) {
                return res.status(400).json({
                    message: `Sản phẩm "${product.name}" chỉ còn ${product.stock} trong kho!`,
                });
            }
        }

        // ✅ 2. Tạo đơn hàng
        const isPaid   = paymentMethod === 'PayPal';
        const newOrder = new Order({
            userId,
            customerName,
            phone,
            address,
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

        // ✅ 3. Giảm stock & tăng sold sau khi lưu đơn thành công
        for (const item of items) {
            const pid    = getProductId(item);
            const result = await Product.findByIdAndUpdate(pid, {
                $inc: { stock: -item.quantity, sold: +item.quantity },
            });
            console.log(
                `📦 Stock update — ID: ${pid} | qty: -${item.quantity} | ${result ? '✅ OK' : '❌ Không tìm thấy sản phẩm'}`
            );
        }

        res.status(200).json({ message: 'Đặt hàng thành công!', order: savedOrder });
    } catch (err) {
        console.error('❌ Lỗi checkout:', err.message);
        res.status(500).json({ message: 'Lỗi đặt hàng', error: err.message });
    }
});

// ─────────────────────────────────────────────────────────────
// GET - Tất cả đơn hàng (Admin)
// ─────────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
    try {
        const orders = await Order.find().sort({ createdAt: -1 });
        res.json(orders);
    } catch (err) {
        res.status(500).json({ message: 'Lỗi lấy đơn hàng', error: err.message });
    }
});

// ─────────────────────────────────────────────────────────────
// GET - Lịch sử đơn hàng của User
// ─────────────────────────────────────────────────────────────
router.get('/user/:userId', async (req, res) => {
    try {
        const orders = await Order.find({ userId: req.params.userId }).sort({ createdAt: -1 });
        res.json(orders);
    } catch (err) {
        res.status(500).json({ message: 'Lỗi lấy lịch sử đơn hàng', error: err.message });
    }
});

// ─────────────────────────────────────────────────────────────
// GET - 1 đơn hàng theo ID
// ─────────────────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
        res.json(order);
    } catch (err) {
        res.status(500).json({ message: 'Lỗi server', error: err.message });
    }
});

// ─────────────────────────────────────────────────────────────
// PUT - Cập nhật trạng thái (Admin)
// Nếu chuyển sang 'Đã giao'  → isPaid = true  (COD đã thu tiền)
// Nếu chuyển sang 'Đã hủy'   → hoàn kho
// ─────────────────────────────────────────────────────────────
router.put('/:id', async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });

        const updateData = { updatedAt: Date.now() };
        if (req.body.status)                        updateData.status  = req.body.status;
        if (req.body.status === 'Đã giao')          updateData.isPaid  = true;
        if (typeof req.body.isPaid === 'boolean')   updateData.isPaid  = req.body.isPaid;

        // ✅ Hoàn kho khi hủy đơn (chỉ hoàn 1 lần)
        const isNewlyCancelled =
            req.body.status === 'Đã hủy' && order.status !== 'Đã hủy';

        if (isNewlyCancelled) {
            for (const item of order.items) {
                const pid = getProductId(item);
                await Product.findByIdAndUpdate(pid, {
                    $inc: { stock: +item.quantity, sold: -item.quantity },
                });
                console.log(`♻️  Hoàn kho — ID: ${pid} | qty: +${item.quantity}`);
            }
        }

        const updated = await Order.findByIdAndUpdate(req.params.id, updateData, { new: true });
        res.json(updated);
    } catch (err) {
        console.error('❌ Lỗi cập nhật đơn hàng:', err.message);
        res.status(500).json({ message: 'Lỗi cập nhật', error: err.message });
    }
});

// ─────────────────────────────────────────────────────────────
// DELETE - Xóa đơn hàng (Admin)
// ─────────────────────────────────────────────────────────────
router.delete('/:id', async (req, res) => {
    try {
        await Order.findByIdAndDelete(req.params.id);
        res.json({ message: 'Đã xóa đơn hàng' });
    } catch (err) {
        res.status(500).json({ message: 'Lỗi xóa đơn hàng', error: err.message });
    }
});

module.exports = router;