const router = require('express').Router();
const Product = require('../models/Product');

// GET - Lấy TẤT CẢ sản phẩm (QUAN TRỌNG - Route này bị thiếu!)
router.get('/', async (req, res) => {
    try {
        const products = await Product.find();
        res.json(products);
    } catch (err) {
        res.status(500).json({ message: 'Lỗi server', error: err.message });
    }
});

// GET - Lấy 1 sản phẩm theo ID
router.get('/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
        }
        res.json(product);
    } catch (err) {
        res.status(500).json({ message: 'Lỗi server', error: err.message });
    }
});

// POST - Thêm sản phẩm mới (Admin)
router.post('/', async (req, res) => {
    try {
        const newProduct = new Product(req.body);
        const saved = await newProduct.save();
        res.status(201).json(saved);
    } catch (err) {
        res.status(500).json({ message: 'Lỗi thêm sản phẩm', error: err.message });
    }
});

// PUT - Cập nhật sản phẩm (Admin)
router.put('/:id', async (req, res) => {
    try {
        const updated = await Product.findByIdAndUpdate(
            req.params.id,
            { $set: req.body },
            { new: true }
        );
        if (!updated) {
            return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
        }
        res.json(updated);
    } catch (err) {
        res.status(500).json({ message: 'Lỗi cập nhật', error: err.message });
    }
});

// DELETE - Xóa sản phẩm (Admin)
router.delete('/:id', async (req, res) => {
    try {
        const deleted = await Product.findByIdAndDelete(req.params.id);
        if (!deleted) {
            return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
        }
        res.json({ message: 'Đã xóa sản phẩm thành công' });
    } catch (err) {
        res.status(500).json({ message: 'Lỗi xóa sản phẩm', error: err.message });
    }
});

module.exports = router;