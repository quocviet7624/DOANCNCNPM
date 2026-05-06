// routes/ShippingRoutes.js
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { getConfig, saveConfig, resetConfig, calculateFee } = require('../controllers/ShippingController');

const JWT_SECRET = process.env.JWT_SECRET || 'fc-junior-aquarium-super-secret-key-2024';

const verifyAdmin = (req) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) throw { status: 401, message: 'Chưa đăng nhập!' };
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== 'admin') throw { status: 403, message: 'Không có quyền truy cập!' };
    return decoded;
};

const handleErr = (res, err) => {
    if (err.status) return res.status(err.status).json({ message: err.message });
    console.error(err);
    res.status(500).json({ message: 'Lỗi server', error: err.message });
};

const adminOnly = (req, res, next) => {
    try { verifyAdmin(req); next(); }
    catch (err) { handleErr(res, err); }
};

// ── Public ────────────────────────────────────────────────────────────────────
router.get('/config', getConfig);
router.post('/calculate', calculateFee);   // tính phí theo tỉnh + subtotal

// ── Admin only ────────────────────────────────────────────────────────────────
router.put('/config', adminOnly, saveConfig);
router.post('/reset', adminOnly, resetConfig);

module.exports = router;