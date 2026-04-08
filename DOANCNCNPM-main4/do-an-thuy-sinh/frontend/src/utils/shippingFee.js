// utils/shippingFee.js
// ================================================================
// SHIPPING FEE CALCULATOR
// Config được quản lý qua Admin → Phí giao hàng (lưu vào MongoDB).
// Frontend cache vào localStorage để dùng offline / tránh delay.
// ================================================================

const API_URL = 'http://localhost:5000/api/shipping/config';
const CACHE_KEY = 'ShippingConfig';

// ── Cấu hình mặc định (fallback khi API chưa trả về) ─────────────────────────
const DEFAULT_CONFIG = {
    freeShipThreshold: 300000,
    zones: {
        1: { label: 'Nội thành Đà Nẵng', fee: 15000 },
        2: { label: 'Miền Trung lân cận', fee: 25000 },
        3: { label: 'Miền Nam / Miền Bắc', fee: 35000 },
    },
    provinceZoneMap: {
        'Đà Nẵng': 1,
        'Thừa Thiên Huế': 2, 'Quảng Nam': 2, 'Quảng Ngãi': 2,
        'Bình Định': 2, 'Phú Yên': 2, 'Khánh Hòa': 2,
        'Quảng Trị': 2, 'Quảng Bình': 2, 'Hà Tĩnh': 2,
        'Nghệ An': 2, 'Thanh Hóa': 2, 'Ninh Thuận': 2,
        'Bình Thuận': 2, 'Kon Tum': 2, 'Gia Lai': 2,
        'Đắk Lắk': 2, 'Đắk Nông': 2, 'Lâm Đồng': 2,
        'Hà Nội': 3, 'Hải Phòng': 3, 'Hải Dương': 3,
        'Hưng Yên': 3, 'Hà Nam': 3, 'Nam Định': 3,
        'Thái Bình': 3, 'Ninh Bình': 3, 'Vĩnh Phúc': 3,
        'Bắc Ninh': 3, 'Bắc Giang': 3, 'Thái Nguyên': 3,
        'Phú Thọ': 3, 'Tuyên Quang': 3, 'Yên Bái': 3,
        'Lào Cai': 3, 'Lai Châu': 3, 'Điện Biên': 3,
        'Sơn La': 3, 'Hòa Bình': 3, 'Hà Giang': 3,
        'Cao Bằng': 3, 'Bắc Kạn': 3, 'Lạng Sơn': 3,
        'Quảng Ninh': 3,
        'Hồ Chí Minh': 3, 'Bình Dương': 3, 'Đồng Nai': 3,
        'Bà Rịa - Vũng Tàu': 3, 'Long An': 3, 'Tiền Giang': 3,
        'Bến Tre': 3, 'Trà Vinh': 3, 'Vĩnh Long': 3,
        'Đồng Tháp': 3, 'An Giang': 3, 'Kiên Giang': 3,
        'Cần Thơ': 3, 'Hậu Giang': 3, 'Sóc Trăng': 3,
        'Bạc Liêu': 3, 'Cà Mau': 3, 'Tây Ninh': 3,
        'Bình Phước': 3,
    },
};

// ── Cache helpers ─────────────────────────────────────────────────────────────
const readCache = () => {
    try {
        const saved = localStorage.getItem(CACHE_KEY);
        if (!saved) return null;
        const parsed = JSON.parse(saved);
        const zones = {};
        Object.entries(parsed.zones || {}).forEach(([k, v]) => { zones[Number(k)] = v; });
        const provinceZoneMap = {};
        Object.entries(parsed.provinceZoneMap || {}).forEach(([p, z]) => {
            provinceZoneMap[p] = Number(z);
        });
        return { ...parsed, zones, provinceZoneMap };
    } catch {
        return null;
    }
};

const writeCache = (cfg) => {
    try { localStorage.setItem(CACHE_KEY, JSON.stringify(cfg)); } catch { }
};

const getConfig = () => readCache() || DEFAULT_CONFIG;

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

export const getFreeShipThreshold = () => getConfig().freeShipThreshold;
export const FREE_SHIP_THRESHOLD = DEFAULT_CONFIG.freeShipThreshold;

export const getShippingZones = () => getConfig().zones;
export const SHIPPING_ZONES = DEFAULT_CONFIG.zones;

export const getProvinceZoneMap = () => getConfig().provinceZoneMap;
export const PROVINCE_ZONE_MAP = DEFAULT_CONFIG.provinceZoneMap;

export const getProvinceList = () => Object.keys(getConfig().provinceZoneMap).sort();
export const PROVINCE_LIST = Object.keys(DEFAULT_CONFIG.provinceZoneMap).sort();

export const calcShippingFee = (province, subtotal) => {
    if (!province) {
        return { fee: 0, originalFee: 0, isFree: false, zone: 0, zoneLabel: '' };
    }
    const cfg = getConfig();
    const isFree = subtotal >= cfg.freeShipThreshold;
    const zone = cfg.provinceZoneMap[province] ?? 3;
    const zoneInfo = cfg.zones[zone] ?? cfg.zones[3] ?? { label: 'Không xác định', fee: 35000 };

    return {
        fee: isFree ? 0 : zoneInfo.fee,
        originalFee: zoneInfo.fee,
        isFree,
        zone,
        zoneLabel: zoneInfo.label,
    };
};