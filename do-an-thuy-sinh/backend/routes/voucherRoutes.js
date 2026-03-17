const express = require('express');
const router = express.Router();
const Voucher = require('../models/Voucher');

const requireAdmin = (req, res, next) => {
    // Thay bang middleware admin thuc te cua ban
    // VD: if (!req.user?.isAdmin) return res.status(403).json({ message: 'Forbidden' });
    next();
};

// =============================================================
// ADMIN ROUTES
// =============================================================

// GET /api/vouchers/admin - Lay tat ca voucher (admin)
router.get('/admin', requireAdmin, async (req, res) => {
    try {
        const vouchers = await Voucher.find().sort({ createdAt: -1 });
        res.json(vouchers);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST /api/vouchers/admin - Tao voucher moi
router.post('/admin', requireAdmin, async (req, res) => {
    try {
        const {
            code, description, discountPercent,
            applicableCategories, minOrderValue,
            maxDiscount, usageLimit, startDate, endDate,
        } = req.body;

        const existing = await Voucher.findOne({ code: code.toUpperCase() });
        if (existing) return res.status(400).json({ message: 'Ma voucher da ton tai!' });

        const voucher = new Voucher({
            code, description, discountPercent,
            applicableCategories: applicableCategories || [],
            minOrderValue: minOrderValue || 0,
            maxDiscount: maxDiscount || null,
            usageLimit: usageLimit || null,
            startDate: startDate || Date.now(),
            endDate,
        });

        const saved = await voucher.save();
        res.status(201).json(saved);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// PUT /api/vouchers/admin/:id - Cap nhat voucher
router.put('/admin/:id', requireAdmin, async (req, res) => {
    try {
        const updated = await Voucher.findByIdAndUpdate(
            req.params.id,
            { ...req.body },
            { new: true, runValidators: true }
        );
        if (!updated) return res.status(404).json({ message: 'Khong tim thay voucher' });
        res.json(updated);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// DELETE /api/vouchers/admin/:id - Xoa voucher
router.delete('/admin/:id', requireAdmin, async (req, res) => {
    try {
        await Voucher.findByIdAndDelete(req.params.id);
        res.json({ message: 'Da xoa voucher' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// =============================================================
// PUBLIC ROUTES (danh cho khach hang)
// =============================================================

// GET /api/vouchers/public - Hien thi voucher cho khach xem (an code neu chua den gio mo)
router.get('/public', async (req, res) => {
    try {
        const now = new Date();
        const vouchers = await Voucher.find({
            isActive: true,
            endDate: { $gt: now },
        }).sort({ startDate: 1 });

        const result = vouchers.map(v => ({
            _id: v._id,
            code: now >= new Date(v.startDate) ? v.code : null, // An code neu chua mo
            description: v.description,
            discountPercent: v.discountPercent,
            applicableCategories: v.applicableCategories,
            minOrderValue: v.minOrderValue,
            maxDiscount: v.maxDiscount,
            usageLimit: v.usageLimit,
            usedCount: v.usedCount,
            startDate: v.startDate,
            endDate: v.endDate,
            isOpened: now >= new Date(v.startDate), // true = dang mo, false = chua mo (dem nguoc)
        }));

        res.json(result);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// =============================================================
// USER ROUTES
// =============================================================

// POST /api/vouchers/apply - Kiem tra & ap dung voucher
router.post('/apply', async (req, res) => {
    try {
        const { code, cartItems = [], orderTotal } = req.body;

        if (!code) return res.status(400).json({ message: 'Vui long nhap ma voucher!' });

        const voucher = await Voucher.findOne({ code: code.toUpperCase() });
        if (!voucher) return res.status(404).json({ message: 'Ma voucher khong ton tai!' });
        if (!voucher.isActive) return res.status(400).json({ message: 'Voucher da bi vo hieu hoa!' });

        const now = new Date();
        if (now < voucher.startDate) return res.status(400).json({ message: 'Voucher chua co hieu luc!' });
        if (now > voucher.endDate)   return res.status(400).json({ message: 'Voucher da het han!' });
        if (voucher.usageLimit !== null && voucher.usedCount >= voucher.usageLimit) {
            return res.status(400).json({ message: 'Voucher da het luot su dung!' });
        }

        let applicableTotal = orderTotal;
        if (voucher.applicableCategories.length > 0) {
            applicableTotal = cartItems
                .filter(item => voucher.applicableCategories.includes(item.category))
                .reduce((sum, item) => sum + item.price * item.quantity, 0);

            if (applicableTotal === 0) {
                return res.status(400).json({
                    message: `Voucher chi ap dung cho danh muc: ${voucher.applicableCategories.join(', ')}`,
                });
            }
        }

        if (orderTotal < voucher.minOrderValue) {
            return res.status(400).json({
                message: `Don hang toi thieu ${voucher.minOrderValue.toLocaleString('vi-VN')}d de dung voucher nay!`,
            });
        }

        let discountAmount = Math.round((applicableTotal * voucher.discountPercent) / 100);
        if (voucher.maxDiscount !== null && discountAmount > voucher.maxDiscount) {
            discountAmount = voucher.maxDiscount;
        }

        res.json({
            valid: true,
            voucher: {
                code: voucher.code,
                description: voucher.description,
                discountPercent: voucher.discountPercent,
                applicableCategories: voucher.applicableCategories,
                maxDiscount: voucher.maxDiscount,
            },
            discountAmount,
            finalTotal: orderTotal - discountAmount,
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST /api/vouchers/confirm-use/:code - Tang usedCount sau khi dat hang thanh cong
router.post('/confirm-use/:code', async (req, res) => {
    try {
        await Voucher.findOneAndUpdate(
            { code: req.params.code.toUpperCase() },
            { $inc: { usedCount: 1 } }
        );
        res.json({ message: 'OK' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;