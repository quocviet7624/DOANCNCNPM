const mongoose = require('mongoose');

// ── Schema cho từng vùng giao hàng ───────────────────────────────────────────
const ZoneSchema = new mongoose.Schema(
    {
        zoneId: { type: Number, required: true },   // 1, 2, 3, ...
        label: { type: String, required: true },   // "Nội thành Đà Nẵng"
        fee: { type: Number, required: true, min: 0 }, // 15000
    },
    { _id: false }
);

// ── Schema cho từng tỉnh/thành → zone ────────────────────────────────────────
const ProvinceSchema = new mongoose.Schema(
    {
        name: { type: String, required: true }, // "Hà Nội"
        zoneId: { type: Number, required: true }, // 3
    },
    { _id: false }
);

// ── Schema chính ─────────────────────────────────────────────────────────────
// Chỉ có DUY NHẤT 1 document (singleton pattern).
// Dùng field "configKey" cố định để findOne / upsert.
const ShippingConfigSchema = new mongoose.Schema(
    {
        configKey: {
            type: String,
            default: 'default',
            unique: true,
        },
        freeShipThreshold: {
            type: Number,
            default: 300000,
            min: 0,
        },
        zones: { type: [ZoneSchema], default: [] },
        provinces: { type: [ProvinceSchema], default: [] },
    },
    {
        timestamps: true, // createdAt, updatedAt tự động
    }
);

// ── Virtual: chuyển provinces array → map object (tiện dùng ở frontend) ──────
ShippingConfigSchema.virtual('provinceZoneMap').get(function () {
    const map = {};
    this.provinces.forEach(p => { map[p.name] = p.zoneId; });
    return map;
});

// ── toJSON bao gồm virtuals ───────────────────────────────────────────────────
ShippingConfigSchema.set('toJSON', { virtuals: true });
ShippingConfigSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('ShippingConfig', ShippingConfigSchema);