// routes/reviewRoutes.js
const express    = require('express');
const router     = express.Router();
const jwt        = require('jsonwebtoken');
const Product    = require('../models/Product');

const JWT_SECRET = process.env.JWT_SECRET || 'fc-junior-aquarium-super-secret-key-2024';

// ── Auth helpers (theo pattern của project) ───────────────────────────────────
const verifyAdminOrStaff = (req) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) throw { status: 401, message: 'Chưa đăng nhập!' };
    const decoded = jwt.verify(token, JWT_SECRET);
    if (!['admin', 'staff'].includes(decoded.role)) {
        throw { status: 403, message: 'Không có quyền truy cập!' };
    }
    return decoded;
};

const handleErr = (res, err) => {
    if (err.status) return res.status(err.status).json({ message: err.message });
    console.error(err);
    res.status(500).json({ message: 'Lỗi server', error: err.message });
};

router.get('/', async (req, res) => {
    try {
        verifyAdminOrStaff(req);

        const { rating, productId, search } = req.query;

        const productFilter = productId ? { _id: productId } : {};
        const products = await Product.find(productFilter).select('name image reviews');

        let allReviews = [];
        products.forEach(product => {
            (product.reviews || []).forEach(review => {
                allReviews.push({
                    _id:         review._id,
                    userId:      review.userId,
                    username:    review.username,
                    rating:      review.rating,
                    comment:     review.comment,
                    createdAt:   review.createdAt,
                    updatedAt:   review.updatedAt,
                    productId:   product._id,
                    productName: product.name,
                    productImg:  product.image,
                });
            });
        });

        if (rating) allReviews = allReviews.filter(r => r.rating === Number(rating));
        if (search) {
            const q = search.toLowerCase();
            allReviews = allReviews.filter(r =>
                r.username?.toLowerCase().includes(q)    ||
                r.comment?.toLowerCase().includes(q)     ||
                r.productName?.toLowerCase().includes(q)
            );
        }

        allReviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        const total     = allReviews.length;
        const avgRating = total
            ? (allReviews.reduce((s, r) => s + r.rating, 0) / total).toFixed(1)
            : 0;
        const fiveStars = allReviews.filter(r => r.rating === 5).length;
        const oneStars  = allReviews.filter(r => r.rating === 1).length;

        res.json({
            reviews: allReviews,
            stats: { total, avgRating, fiveStars, oneStars },
        });
    } catch (err) { handleErr(res, err); }
});

router.get('/stats', async (req, res) => {
    try {
        verifyAdminOrStaff(req);

        const products   = await Product.find().select('reviews');
        const allReviews = [];
        products.forEach(p => (p.reviews || []).forEach(r => allReviews.push(r)));

        const total     = allReviews.length;
        const avgRating = total
            ? (allReviews.reduce((s, r) => s + r.rating, 0) / total).toFixed(1)
            : 0;
        const byRating  = [1, 2, 3, 4, 5].reduce((acc, n) => {
            acc[n] = allReviews.filter(r => r.rating === n).length;
            return acc;
        }, {});

        res.json({ total, avgRating, byRating });
    } catch (err) { handleErr(res, err); }
});

router.delete('/:productId/:reviewId', async (req, res) => {
    try {
        verifyAdminOrStaff(req);

        const { productId, reviewId } = req.params;

        const product = await Product.findById(productId);
        if (!product) return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });

        const idx = product.reviews.findIndex(r => r._id.toString() === reviewId);
        if (idx === -1) return res.status(404).json({ message: 'Không tìm thấy đánh giá' });

        product.reviews.splice(idx, 1);

        const count        = product.reviews.length;
        product.numReviews = count;
        product.avgRating  = count
            ? product.reviews.reduce((s, r) => s + r.rating, 0) / count
            : 0;

        await product.save();

        console.log(`✅ Đã xóa review ${reviewId} khỏi sản phẩm ${productId}`);
        res.json({ message: 'Đã xóa đánh giá thành công' });
    } catch (err) { handleErr(res, err); }
});

module.exports = router;