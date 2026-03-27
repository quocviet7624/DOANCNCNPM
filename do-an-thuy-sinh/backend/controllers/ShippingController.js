// controllers/shippingController.js
const ShippingConfig = require('../models/ShippingConfig');

// ── Dữ liệu mặc định khi DB chưa có config ───────────────────────────────────
const DEFAULT_ZONES = [
    { zoneId: 1, label: 'Nội thành Đà Nẵng', fee: 15000 },
    { zoneId: 2, label: 'Miền Trung lân cận', fee: 25000 },
    { zoneId: 3, label: 'Miền Nam / Miền Bắc', fee: 35000 },
];

const DEFAULT_PROVINCES = [
    { name: 'Đà Nẵng', zoneId: 1 },
    { name: 'Thừa Thiên Huế', zoneId: 2 }, { name: 'Quảng Nam', zoneId: 2 },
    { name: 'Quảng Ngãi', zoneId: 2 }, { name: 'Bình Định', zoneId: 2 },
    { name: 'Phú Yên', zoneId: 2 }, { name: 'Khánh Hòa', zoneId: 2 },
    { name: 'Quảng Trị', zoneId: 2 }, { name: 'Quảng Bình', zoneId: 2 },
    { name: 'Hà Tĩnh', zoneId: 2 }, { name: 'Nghệ An', zoneId: 2 },
    { name: 'Thanh Hóa', zoneId: 2 }, { name: 'Ninh Thuận', zoneId: 2 },
    { name: 'Bình Thuận', zoneId: 2 }, { name: 'Kon Tum', zoneId: 2 },
    { name: 'Gia Lai', zoneId: 2 }, { name: 'Đắk Lắk', zoneId: 2 },
    { name: 'Đắk Nông', zoneId: 2 }, { name: 'Lâm Đồng', zoneId: 2 },
    { name: 'Hà Nội', zoneId: 3 }, { name: 'Hải Phòng', zoneId: 3 },
    { name: 'Hải Dương', zoneId: 3 }, { name: 'Hưng Yên', zoneId: 3 },
    { name: 'Hà Nam', zoneId: 3 }, { name: 'Nam Định', zoneId: 3 },
    { name: 'Thái Bình', zoneId: 3 }, { name: 'Ninh Bình', zoneId: 3 },
    { name: 'Vĩnh Phúc', zoneId: 3 }, { name: 'Bắc Ninh', zoneId: 3 },
    { name: 'Bắc Giang', zoneId: 3 }, { name: 'Thái Nguyên', zoneId: 3 },
    { name: 'Phú Thọ', zoneId: 3 }, { name: 'Tuyên Quang', zoneId: 3 },
    { name: 'Yên Bái', zoneId: 3 }, { name: 'Lào Cai', zoneId: 3 },
    { name: 'Lai Châu', zoneId: 3 }, { name: 'Điện Biên', zoneId: 3 },
    { name: 'Sơn La', zoneId: 3 }, { name: 'Hòa Bình', zoneId: 3 },
    { name: 'Hà Giang', zoneId: 3 }, { name: 'Cao Bằng', zoneId: 3 },
    { name: 'Bắc Kạn', zoneId: 3 }, { name: 'Lạng Sơn', zoneId: 3 },
    { name: 'Quảng Ninh', zoneId: 3 },
    { name: 'Hồ Chí Minh', zoneId: 3 }, { name: 'Bình Dương', zoneId: 3 },
    { name: 'Đồng Nai', zoneId: 3 }, { name: 'Bà Rịa - Vũng Tàu', zoneId: 3 },
    { name: 'Long An', zoneId: 3 }, { name: 'Tiền Giang', zoneId: 3 },
    { name: 'Bến Tre', zoneId: 3 }, { name: 'Trà Vinh', zoneId: 3 },
    { name: 'Vĩnh Long', zoneId: 3 }, { name: 'Đồng Tháp', zoneId: 3 },
    { name: 'An Giang', zoneId: 3 }, { name: 'Kiên Giang', zoneId: 3 },
    { name: 'Cần Thơ', zoneId: 3 }, { name: 'Hậu Giang', zoneId: 3 },
    { name: 'Sóc Trăng', zoneId: 3 }, { name: 'Bạc Liêu', zoneId: 3 },
    { name: 'Cà Mau', zoneId: 3 }, { name: 'Tây Ninh', zoneId: 3 },
    { name: 'Bình Phước', zoneId: 3 },
];

// ── Helper: chuyển DB doc → format trả về frontend ───────────────────────────
const toClientFormat = (doc) => {
    // Chuyển zones array → object { 1: {...}, 2: {...} }
    const zones = {};
    doc.zones.forEach(z => {
        zones[z.zoneId] = { label: z.label, fee: z.fee };
    });

    // Chuyển provinces array → map object { "Hà Nội": 3, ... }
    const provinceZoneMap = {};
    doc.provinces.forEach(p => {
        provinceZoneMap[p.name] = p.zoneId;
    });

    return {
        freeShipThreshold: doc.freeShipThreshold,
        zones,
        provinceZoneMap,
        updatedAt: doc.updatedAt,
    };
};

// ── GET /api/shipping/config ──────────────────────────────────────────────────
// Trả về config hiện tại. Nếu DB chưa có thì tạo mặc định rồi trả về.
const getConfig = async (req, res) => {
    try {
        let config = await ShippingConfig.findOne({ configKey: 'default' });

        if (!config) {
            // Lần đầu chạy: seed dữ liệu mặc định vào DB
            config = await ShippingConfig.create({
                configKey: 'default',
                freeShipThreshold: 300000,
                zones: DEFAULT_ZONES,
                provinces: DEFAULT_PROVINCES,
            });
        }

        return res.json({ success: true, data: toClientFormat(config) });
    } catch (err) {
        console.error('[ShippingConfig] getConfig error:', err);
        return res.status(500).json({ success: false, message: 'Lỗi server khi lấy cấu hình phí ship.' });
    }
};

// ── PUT /api/shipping/config ──────────────────────────────────────────────────
// Admin lưu toàn bộ config mới (upsert).
// Body: { freeShipThreshold, zones: { 1: {label, fee}, ... }, provinceZoneMap: { "Hà Nội": 3, ... } }
const saveConfig = async (req, res) => {
    try {
        const { freeShipThreshold, zones, provinceZoneMap } = req.body;

        // Validate cơ bản
        if (typeof freeShipThreshold !== 'number' || freeShipThreshold < 0) {
            return res.status(400).json({ success: false, message: 'freeShipThreshold phải là số không âm.' });
        }
        if (!zones || typeof zones !== 'object' || Object.keys(zones).length === 0) {
            return res.status(400).json({ success: false, message: 'Phải có ít nhất 1 vùng giao hàng.' });
        }
        if (!provinceZoneMap || typeof provinceZoneMap !== 'object') {
            return res.status(400).json({ success: false, message: 'provinceZoneMap không hợp lệ.' });
        }

        // Chuyển zones object → array
        const zonesArr = Object.entries(zones).map(([id, z]) => ({
            zoneId: Number(id),
            label: z.label,
            fee: Number(z.fee),
        }));

        // Chuyển provinceZoneMap object → array
        const provincesArr = Object.entries(provinceZoneMap).map(([name, zoneId]) => ({
            name,
            zoneId: Number(zoneId),
        }));

        // Validate: tất cả zoneId trong provinces phải tồn tại trong zones
        const validZoneIds = new Set(zonesArr.map(z => z.zoneId));
        const invalidProvince = provincesArr.find(p => !validZoneIds.has(p.zoneId));
        if (invalidProvince) {
            return res.status(400).json({
                success: false,
                message: `Tỉnh "${invalidProvince.name}" thuộc vùng ${invalidProvince.zoneId} không tồn tại trong danh sách vùng.`,
            });
        }

        // Upsert (tạo nếu chưa có, cập nhật nếu có)
        const updated = await ShippingConfig.findOneAndUpdate(
            { configKey: 'default' },
            {
                $set: {
                    freeShipThreshold,
                    zones: zonesArr,
                    provinces: provincesArr,
                },
            },
            { new: true, upsert: true, runValidators: true }
        );

        return res.json({
            success: true,
            message: 'Đã lưu cấu hình phí giao hàng!',
            data: toClientFormat(updated),
        });
    } catch (err) {
        console.error('[ShippingConfig] saveConfig error:', err);
        return res.status(500).json({ success: false, message: 'Lỗi server khi lưu cấu hình phí ship.' });
    }
};

// ── POST /api/shipping/reset ──────────────────────────────────────────────────
// Khôi phục về cấu hình mặc định.
const resetConfig = async (req, res) => {
    try {
        const updated = await ShippingConfig.findOneAndUpdate(
            { configKey: 'default' },
            {
                $set: {
                    freeShipThreshold: 300000,
                    zones: DEFAULT_ZONES,
                    provinces: DEFAULT_PROVINCES,
                },
            },
            { new: true, upsert: true }
        );

        return res.json({
            success: true,
            message: 'Đã khôi phục cấu hình mặc định!',
            data: toClientFormat(updated),
        });
    } catch (err) {
        console.error('[ShippingConfig] resetConfig error:', err);
        return res.status(500).json({ success: false, message: 'Lỗi server khi reset cấu hình.' });
    }
};
module.exports = { getConfig, saveConfig, resetConfig };