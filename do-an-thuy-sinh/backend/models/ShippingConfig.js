// models/ShippingConfig.js
const mongoose = require('mongoose');

// ── Schema cho mức giá theo km ────────────────────────────────────────────────
// Admin có thể cấu hình nhiều bậc:
// Ví dụ: 0–50km = 2000đ/km, 50–200km = 1500đ/km, >200km = 1000đ/km
const KmTierSchema = new mongoose.Schema(
    {
        minKm: { type: Number, required: true, min: 0 },   // từ km (inclusive)
        maxKm: { type: Number, default: null },             // đến km (null = không giới hạn)
        pricePerKm: { type: Number, required: true, min: 0 },   // đ/km
        label: { type: String, required: true },            // "0 – 50 km"
    },
    { _id: false }
);

// ── Schema khoảng cách từ kho → tỉnh/thành ───────────────────────────────────
const ProvinceDistanceSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },  // "Hà Nội"
        distanceKm: { type: Number, required: true, min: 0 }, // 764
    },
    { _id: false }
);

// ── Schema chính (singleton) ──────────────────────────────────────────────────
const ShippingConfigSchema = new mongoose.Schema(
    {
        configKey: {
            type: String,
            default: 'default',
            unique: true,
        },
        // Địa chỉ kho xuất phát (để hiển thị, không dùng tính toán)
        warehouseAddress: {
            type: String,
            default: 'Đà Nẵng',
        },
        // Phí cơ bản tối thiểu (áp dụng kể cả khi tính ra ít hơn)
        baseFee: {
            type: Number,
            default: 15000,
            min: 0,
        },
        // Ngưỡng miễn phí ship (đơn hàng >= giá trị này → ship miễn phí)
        freeShipThreshold: {
            type: Number,
            default: 500000,
            min: 0,
        },
        // Bậc giá theo km (sắp xếp theo minKm tăng dần)
        kmTiers: { type: [KmTierSchema], default: [] },
        // Khoảng cách từ kho đến từng tỉnh/thành (km)
        provinces: { type: [ProvinceDistanceSchema], default: [] },
    },
    { timestamps: true }
);

ShippingConfigSchema.set('toJSON', { virtuals: true });
ShippingConfigSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('ShippingConfig', ShippingConfigSchema);