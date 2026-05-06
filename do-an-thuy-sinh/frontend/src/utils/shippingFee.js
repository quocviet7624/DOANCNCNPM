// utils/shippingFee.js
// ================================================================
// SHIPPING FEE CALCULATOR — Tính phí ship theo km
// Phí = tổng (km trong từng bậc × giá/km), tối thiểu = baseFee
// Config quản lý qua Admin Panel, cache vào localStorage.
// ================================================================

const API_URL = 'http://localhost:5000/api/shipping/config';
const CACHE_KEY = 'ShippingConfig_v2';

// ── Cấu hình mặc định (fallback) ─────────────────────────────────────────────
export const DEFAULT_CONFIG = {
    warehouseAddress: 'Đà Nẵng',
    baseFee: 15000,
    freeShipThreshold: 500000,
    kmTiers: [
        { minKm: 0, maxKm: 50, pricePerKm: 2000, label: '0 – 50 km' },
        { minKm: 50, maxKm: 200, pricePerKm: 1500, label: '50 – 200 km' },
        { minKm: 200, maxKm: 500, pricePerKm: 1000, label: '200 – 500 km' },
        { minKm: 500, maxKm: null, pricePerKm: 700, label: '> 500 km' },
    ],
    provinceDistanceMap: {
        'Đà Nẵng': 5, 'Quảng Nam': 60, 'Thừa Thiên Huế': 100,
        'Quảng Ngãi': 130, 'Quảng Trị': 170, 'Quảng Bình': 230,
        'Bình Định': 200, 'Phú Yên': 280, 'Khánh Hòa': 370,
        'Hà Tĩnh': 320, 'Nghệ An': 400, 'Thanh Hóa': 510,
        'Kon Tum': 230, 'Gia Lai': 260, 'Đắk Lắk': 350,
        'Đắk Nông': 420, 'Lâm Đồng': 500, 'Ninh Thuận': 560,
        'Bình Thuận': 640, 'Hồ Chí Minh': 970, 'Bình Dương': 950,
        'Đồng Nai': 980, 'Bà Rịa - Vũng Tàu': 1020, 'Tây Ninh': 1010,
        'Bình Phước': 1000, 'Long An': 990, 'Tiền Giang': 1030,
        'Bến Tre': 1060, 'Trà Vinh': 1080, 'Vĩnh Long': 1050,
        'Đồng Tháp': 1060, 'An Giang': 1110, 'Kiên Giang': 1170,
        'Cần Thơ': 1080, 'Hậu Giang': 1100, 'Sóc Trăng': 1120,
        'Bạc Liêu': 1160, 'Cà Mau': 1220, 'Hà Nội': 764,
        'Hải Phòng': 830, 'Hải Dương': 790, 'Hưng Yên': 770,
        'Hà Nam': 730, 'Nam Định': 750, 'Thái Bình': 780,
        'Ninh Bình': 700, 'Vĩnh Phúc': 780, 'Bắc Ninh': 800,
        'Bắc Giang': 820, 'Thái Nguyên': 840, 'Phú Thọ': 800,
        'Tuyên Quang': 860, 'Yên Bái': 900, 'Lào Cai': 960,
        'Lai Châu': 1050, 'Điện Biên': 1030, 'Sơn La': 940,
        'Hòa Bình': 760, 'Hà Giang': 950, 'Cao Bằng': 900,
        'Bắc Kạn': 860, 'Lạng Sơn': 870, 'Quảng Ninh': 870,
    },
};

// ── Cache helpers ─────────────────────────────────────────────────────────────
const readCache = () => {
    try {
        const saved = localStorage.getItem(CACHE_KEY);
        return saved ? JSON.parse(saved) : null;
    } catch { return null; }
};

const writeCache = (cfg) => {
    try { localStorage.setItem(CACHE_KEY, JSON.stringify(cfg)); } catch { }
};

const getConfig = () => readCache() || DEFAULT_CONFIG;

// ── Fetch config từ server ────────────────────────────────────────────────────
export const fetchShippingConfig = async () => {
    try {
        const res = await fetch(API_URL);
        const json = await res.json();
        if (json.success && json.data) {
            writeCache(json.data);
            window.dispatchEvent(new Event('shippingConfigChange'));
            return json.data;
        }
    } catch (err) {
        console.warn('[shippingFee] Không thể fetch config, dùng cache/default:', err.message);
    }
    return null;
};

// ── Tính phí ship theo km (phía client, offline) ──────────────────────────────
// Logic giống backend: bậc thang lũy tiến
export const calcFeeFromKm = (distanceKm, tiers, baseFee = 15000) => {
    if (!tiers || tiers.length === 0) return baseFee;
    const sorted = [...tiers].sort((a, b) => a.minKm - b.minKm);
    let remaining = distanceKm;
    let total = 0;

    for (const tier of sorted) {
        if (remaining <= 0) break;
        const tierEnd = tier.maxKm !== null ? tier.maxKm : Infinity;
        const tierLen = tierEnd - tier.minKm;
        const kmInTier = Math.min(remaining, tierLen);
        if (kmInTier > 0) {
            total += kmInTier * tier.pricePerKm;
            remaining -= kmInTier;
        }
    }
    return Math.max(Math.round(total / 1000) * 1000, baseFee);
};

// ── Hàm tính phí ship chính ───────────────────────────────────────────────────
// Trả về: { fee, originalFee, isFree, distanceKm, breakdown }
export const calcShippingFee = (province, subtotal = 0) => {
    if (!province) {
        return { fee: 0, originalFee: 0, isFree: false, distanceKm: 0, breakdown: [] };
    }

    const cfg = getConfig();
    const distanceKm = cfg.provinceDistanceMap?.[province] ?? 0;
    const isFree = subtotal >= cfg.freeShipThreshold;
    const originalFee = calcFeeFromKm(distanceKm, cfg.kmTiers, cfg.baseFee);

    // Breakdown chi tiết
    const sorted = [...(cfg.kmTiers || [])].sort((a, b) => a.minKm - b.minKm);
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

    return {
        fee: isFree ? 0 : originalFee,
        originalFee,
        isFree,
        distanceKm,
        breakdown,
        freeShipThreshold: cfg.freeShipThreshold,
    };
};

// ── Exports tiện ích ──────────────────────────────────────────────────────────
export const getFreeShipThreshold = () => getConfig().freeShipThreshold;
export const getProvinceList = () => Object.keys(getConfig().provinceDistanceMap || {}).sort((a, b) => a.localeCompare(b, 'vi'));
export const getProvinceDistanceMap = () => getConfig().provinceDistanceMap || {};
export const getKmTiers = () => getConfig().kmTiers || [];
export const getBaseFee = () => getConfig().baseFee || 15000;