// controllers/ShippingController.js
const ShippingConfig = require('../models/ShippingConfig');

// ── Khoảng cách thực tế từ kho Đà Nẵng đến trung tâm các tỉnh/thành (km) ────
// Nguồn: ước tính theo đường bộ Việt Nam
const DEFAULT_PROVINCES = [
    // Đà Nẵng & lân cận
    { name: 'Đà Nẵng', distanceKm: 5 },
    { name: 'Quảng Nam', distanceKm: 60 },
    { name: 'Thừa Thiên Huế', distanceKm: 100 },
    { name: 'Quảng Ngãi', distanceKm: 130 },
    { name: 'Quảng Trị', distanceKm: 170 },
    { name: 'Quảng Bình', distanceKm: 230 },
    { name: 'Bình Định', distanceKm: 200 },
    { name: 'Phú Yên', distanceKm: 280 },
    { name: 'Khánh Hòa', distanceKm: 370 },
    { name: 'Hà Tĩnh', distanceKm: 320 },
    { name: 'Nghệ An', distanceKm: 400 },
    { name: 'Thanh Hóa', distanceKm: 510 },
    // Tây Nguyên
    { name: 'Kon Tum', distanceKm: 230 },
    { name: 'Gia Lai', distanceKm: 260 },
    { name: 'Đắk Lắk', distanceKm: 350 },
    { name: 'Đắk Nông', distanceKm: 420 },
    { name: 'Lâm Đồng', distanceKm: 500 },
    // Miền Nam
    { name: 'Ninh Thuận', distanceKm: 560 },
    { name: 'Bình Thuận', distanceKm: 640 },
    { name: 'Hồ Chí Minh', distanceKm: 970 },
    { name: 'Bình Dương', distanceKm: 950 },
    { name: 'Đồng Nai', distanceKm: 980 },
    { name: 'Bà Rịa - Vũng Tàu', distanceKm: 1020 },
    { name: 'Tây Ninh', distanceKm: 1010 },
    { name: 'Bình Phước', distanceKm: 1000 },
    { name: 'Long An', distanceKm: 990 },
    { name: 'Tiền Giang', distanceKm: 1030 },
    { name: 'Bến Tre', distanceKm: 1060 },
    { name: 'Trà Vinh', distanceKm: 1080 },
    { name: 'Vĩnh Long', distanceKm: 1050 },
    { name: 'Đồng Tháp', distanceKm: 1060 },
    { name: 'An Giang', distanceKm: 1110 },
    { name: 'Kiên Giang', distanceKm: 1170 },
    { name: 'Cần Thơ', distanceKm: 1080 },
    { name: 'Hậu Giang', distanceKm: 1100 },
    { name: 'Sóc Trăng', distanceKm: 1120 },
    { name: 'Bạc Liêu', distanceKm: 1160 },
    { name: 'Cà Mau', distanceKm: 1220 },
    // Miền Bắc
    { name: 'Hà Nội', distanceKm: 764 },
    { name: 'Hải Phòng', distanceKm: 830 },
    { name: 'Hải Dương', distanceKm: 790 },
    { name: 'Hưng Yên', distanceKm: 770 },
    { name: 'Hà Nam', distanceKm: 730 },
    { name: 'Nam Định', distanceKm: 750 },
    { name: 'Thái Bình', distanceKm: 780 },
    { name: 'Ninh Bình', distanceKm: 700 },
    { name: 'Vĩnh Phúc', distanceKm: 780 },
    { name: 'Bắc Ninh', distanceKm: 800 },
    { name: 'Bắc Giang', distanceKm: 820 },
    { name: 'Thái Nguyên', distanceKm: 840 },
    { name: 'Phú Thọ', distanceKm: 800 },
    { name: 'Tuyên Quang', distanceKm: 860 },
    { name: 'Yên Bái', distanceKm: 900 },
    { name: 'Lào Cai', distanceKm: 960 },
    { name: 'Lai Châu', distanceKm: 1050 },
    { name: 'Điện Biên', distanceKm: 1030 },
    { name: 'Sơn La', distanceKm: 940 },
    { name: 'Hòa Bình', distanceKm: 760 },
    { name: 'Hà Giang', distanceKm: 950 },
    { name: 'Cao Bằng', distanceKm: 900 },
    { name: 'Bắc Kạn', distanceKm: 860 },
    { name: 'Lạng Sơn', distanceKm: 870 },
    { name: 'Quảng Ninh', distanceKm: 870 },
];

// ── Bậc giá mặc định theo km ─────────────────────────────────────────────────
// Mô hình: phí cố định theo khoảng cách (không lũy tiến)
// Tương đương các sàn TMĐT Việt Nam (Shopee, Lazada)
const DEFAULT_KM_TIERS = [
    { minKm: 0, maxKm: 50, pricePerKm: 400, label: '0 – 50 km (Nội tỉnh)' },
    { minKm: 50, maxKm: 200, pricePerKm: 200, label: '50 – 200 km (Cận tỉnh)' },
    { minKm: 200, maxKm: 500, pricePerKm: 100, label: '200 – 500 km (Liên vùng)' },
    { minKm: 500, maxKm: null, pricePerKm: 60, label: '> 500 km (Toàn quốc)' },
];

// ── Tính phí ship từ khoảng cách km ──────────────────────────────────────────
// Áp dụng "bậc thang lũy tiến": mỗi đoạn km tính giá riêng, cộng lại
const calcFeeFromKm = (distanceKm, tiers, baseFee) => {
    if (!tiers || tiers.length === 0) return baseFee;

    const sorted = [...tiers].sort((a, b) => a.minKm - b.minKm);
    let remaining = distanceKm;
    let total = 0;

    for (const tier of sorted) {
        if (remaining <= 0) break;
        const tierStart = tier.minKm;
        const tierEnd = tier.maxKm !== null ? tier.maxKm : Infinity;
        const tierLen = tierEnd - tierStart;

        // Phần km rơi vào bậc này
        const kmInTier = Math.min(remaining, tierLen);
        if (kmInTier > 0) {
            total += kmInTier * tier.pricePerKm;
            remaining -= kmInTier;
        }
    }

    return Math.max(Math.round(total / 1000) * 1000, baseFee); // làm tròn 1000đ
};

// ── Helper: format trả về client ─────────────────────────────────────────────
const toClientFormat = (doc) => {
    const provinceDistanceMap = {};
    doc.provinces.forEach(p => { provinceDistanceMap[p.name] = p.distanceKm; });

    return {
        warehouseAddress: doc.warehouseAddress,
        baseFee: doc.baseFee,
        freeShipThreshold: doc.freeShipThreshold,
        kmTiers: doc.kmTiers,
        provinceDistanceMap,
        updatedAt: doc.updatedAt,
    };
};

// ── GET /api/shipping/config ──────────────────────────────────────────────────
const getConfig = async (req, res) => {
    try {
        let config = await ShippingConfig.findOne({ configKey: 'default' });

        // Chưa có record → tạo mới với data mặc định
        if (!config) {
            config = await ShippingConfig.create({
                configKey: 'default',
                warehouseAddress: 'Đà Nẵng',
                baseFee: 15000,
                freeShipThreshold: 500000,
                kmTiers: DEFAULT_KM_TIERS,
                provinces: DEFAULT_PROVINCES,
            });
        }

        // Có record nhưng provinces hoặc kmTiers rỗng → seed lại data mặc định
        const needsSeed = !config.provinces || config.provinces.length === 0
            || !config.kmTiers || config.kmTiers.length === 0;
        if (needsSeed) {
            config = await ShippingConfig.findOneAndUpdate(
                { configKey: 'default' },
                {
                    $set: {
                        kmTiers: DEFAULT_KM_TIERS,
                        provinces: DEFAULT_PROVINCES,
                        baseFee: config.baseFee || 15000,
                        freeShipThreshold: config.freeShipThreshold || 500000,
                        warehouseAddress: config.warehouseAddress || 'Đà Nẵng',
                    },
                },
                { new: true }
            );
        }

        return res.json({ success: true, data: toClientFormat(config) });
    } catch (err) {
        console.error('[ShippingConfig] getConfig error:', err);
        return res.status(500).json({ success: false, message: 'Lỗi server khi lấy cấu hình phí ship.' });
    }
};

// ── PUT /api/shipping/config ──────────────────────────────────────────────────
// Body: { warehouseAddress, baseFee, freeShipThreshold, kmTiers: [...], provinceDistanceMap: { "Hà Nội": 764 } }
const saveConfig = async (req, res) => {
    try {
        const { warehouseAddress, baseFee, freeShipThreshold, kmTiers, provinceDistanceMap } = req.body;

        if (typeof freeShipThreshold !== 'number' || freeShipThreshold < 0)
            return res.status(400).json({ success: false, message: 'freeShipThreshold phải là số không âm.' });
        if (typeof baseFee !== 'number' || baseFee < 0)
            return res.status(400).json({ success: false, message: 'baseFee phải là số không âm.' });
        if (!Array.isArray(kmTiers) || kmTiers.length === 0)
            return res.status(400).json({ success: false, message: 'Phải có ít nhất 1 bậc giá km.' });
        if (!provinceDistanceMap || typeof provinceDistanceMap !== 'object')
            return res.status(400).json({ success: false, message: 'provinceDistanceMap không hợp lệ.' });

        // Validate kmTiers
        for (const tier of kmTiers) {
            if (typeof tier.minKm !== 'number' || typeof tier.pricePerKm !== 'number')
                return res.status(400).json({ success: false, message: 'Bậc giá km không hợp lệ.' });
        }

        const provincesArr = Object.entries(provinceDistanceMap).map(([name, distanceKm]) => ({
            name,
            distanceKm: Number(distanceKm),
        }));

        const updated = await ShippingConfig.findOneAndUpdate(
            { configKey: 'default' },
            {
                $set: {
                    warehouseAddress,
                    baseFee,
                    freeShipThreshold,
                    kmTiers,
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
const resetConfig = async (req, res) => {
    try {
        const updated = await ShippingConfig.findOneAndUpdate(
            { configKey: 'default' },
            {
                $set: {
                    warehouseAddress: 'Đà Nẵng',
                    baseFee: 15000,
                    freeShipThreshold: 500000,
                    kmTiers: DEFAULT_KM_TIERS,
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

// ── POST /api/shipping/calculate ─────────────────────────────────────────────
// Body: { province, subtotal }  → trả về { fee, originalFee, isFree, distanceKm, breakdown }
const calculateFee = async (req, res) => {
    try {
        const { province, subtotal = 0 } = req.body;
        if (!province)
            return res.status(400).json({ success: false, message: 'Thiếu tên tỉnh/thành.' });

        let config = await ShippingConfig.findOne({ configKey: 'default' });
        if (!config) {
            config = { baseFee: 15000, freeShipThreshold: 500000, kmTiers: DEFAULT_KM_TIERS, provinces: DEFAULT_PROVINCES };
        }

        const provInfo = config.provinces.find(p => p.name === province);
        if (!provInfo)
            return res.status(404).json({ success: false, message: `Không tìm thấy tỉnh/thành "${province}".` });

        const distanceKm = provInfo.distanceKm;
        const isFree = subtotal >= config.freeShipThreshold;
        const originalFee = calcFeeFromKm(distanceKm, config.kmTiers, config.baseFee);

        // Tính breakdown để hiển thị chi tiết
        const sorted = [...config.kmTiers].sort((a, b) => a.minKm - b.minKm);
        const breakdown = [];
        let remaining = distanceKm;
        for (const tier of sorted) {
            if (remaining <= 0) break;
            const tierEnd = tier.maxKm !== null ? tier.maxKm : Infinity;
            const tierLen = tierEnd - tier.minKm;
            const kmInTier = Math.min(remaining, tierLen);
            if (kmInTier > 0) {
                breakdown.push({
                    label: tier.label,
                    km: Math.round(kmInTier),
                    pricePerKm: tier.pricePerKm,
                    subtotal: Math.round(kmInTier * tier.pricePerKm),
                });
                remaining -= kmInTier;
            }
        }

        return res.json({
            success: true,
            data: {
                province,
                distanceKm,
                isFree,
                fee: isFree ? 0 : originalFee,
                originalFee,
                breakdown,
            },
        });
    } catch (err) {
        console.error('[ShippingConfig] calculateFee error:', err);
        return res.status(500).json({ success: false, message: 'Lỗi server khi tính phí ship.' });
    }
};

module.exports = { getConfig, saveConfig, resetConfig, calculateFee };