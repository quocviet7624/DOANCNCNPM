/**
 * categoryRoutes.js
 * API Route cho danh mục sản phẩm
 * Endpoints: GET, POST, PUT, DELETE
 */

const router = require('express').Router();
const Category = require('../models/Category');

/**
 * GET /api/categories
 * Lấy danh sách tất cả danh mục (sắp xếp theo thời gian tẻ nhất)
 */
router.get(
    '/',
    async (req, res) => {
        try {
            const categories = await Category.find()
                .sort({ createdAt: -1 });
            res.json(categories);
        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    }
);

/**
 * POST /api/categories
 * Thêm danh mục mới
 */
router.post(
    '/',
    async (req, res) => {
        try {
            const newCategory = new Category(req.body);
            const saved = await newCategory.save();
            res.status(201).json(saved);
        } catch (err) {
            res.status(400).json({ message: err.message });
        }
    }
);

/**
 * PUT /api/categories/:id
 * Cập nhật danh mục theo ID
 */
router.put(
    '/:id',
    async (req, res) => {
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
    }
);

/**
 * DELETE /api/categories/:id
 * Xóa danh mục theo ID
 */
router.delete(
    '/:id',
    async (req, res) => {
        try {
            await Category.findByIdAndDelete(req.params.id);
            res.json({ message: 'Đã xóa danh mục' });
        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    }
);

module.exports = router;