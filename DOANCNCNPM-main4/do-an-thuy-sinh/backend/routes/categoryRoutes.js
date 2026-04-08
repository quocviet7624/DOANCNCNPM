const router = require('express').Router();
const Category = require('../models/Category');

// GET - Lấy danh sách danh mục
router.get('/', async (req, res) => {
    try {
        const categories = await Category.find().sort({ createdAt: -1 });
        res.json(categories);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST - Thêm danh mục mới
router.post('/', async (req, res) => {
    try {
        const newCategory = new Category(req.body);
        const saved = await newCategory.save();
        res.status(201).json(saved);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// PUT - Cập nhật danh mục
router.put('/:id', async (req, res) => {
    try {
        const updated = await Category.findByIdAndUpdate(
            req.params.id, 
            req.body, 
            { new: true }
        );
        res.json(updated);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// DELETE - Xóa danh mục
router.delete('/:id', async (req, res) => {
    try {
        await Category.findByIdAndDelete(req.params.id);
        res.json({ message: 'Đã xóa danh mục' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;