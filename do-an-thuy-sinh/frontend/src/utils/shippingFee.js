// ================================================================
// SHIPPING FEE CALCULATOR - Tính phí ship theo tỉnh/thành phố
// Shop đặt tại: Đà Nẵng
// Miễn ship khi đơn hàng >= 300.000đ
// ================================================================

export const FREE_SHIP_THRESHOLD = 300000;

// Phân vùng tỉnh/thành phố
// Zone 1: Nội thành Đà Nẵng
// Zone 2: Các tỉnh lân cận miền Trung
// Zone 3: Miền Nam & Miền Bắc
export const SHIPPING_ZONES = {
    1: { label: 'Nội thành Đà Nẵng', fee: 15000 },
    2: { label: 'Miền Trung lân cận', fee: 25000 },
    3: { label: 'Miền Nam / Miền Bắc', fee: 35000 },
};

// Map tỉnh/thành → zone
export const PROVINCE_ZONE_MAP = {
    // ── Zone 1: Đà Nẵng ──
    'Đà Nẵng': 1,

    // ── Zone 2: Miền Trung ──
    'Thừa Thiên Huế': 2,
    'Quảng Nam': 2,
    'Quảng Ngãi': 2,
    'Bình Định': 2,
    'Phú Yên': 2,
    'Khánh Hòa': 2,
    'Quảng Trị': 2,
    'Quảng Bình': 2,
    'Hà Tĩnh': 2,
    'Nghệ An': 2,
    'Thanh Hóa': 2,
    'Ninh Thuận': 2,
    'Bình Thuận': 2,
    'Kon Tum': 2,
    'Gia Lai': 2,
    'Đắk Lắk': 2,
    'Đắk Nông': 2,
    'Lâm Đồng': 2,

    // ── Zone 3: Miền Bắc ──
    'Hà Nội': 3,
    'Hải Phòng': 3,
    'Hải Dương': 3,
    'Hưng Yên': 3,
    'Hà Nam': 3,
    'Nam Định': 3,
    'Thái Bình': 3,
    'Ninh Bình': 3,
    'Vĩnh Phúc': 3,
    'Bắc Ninh': 3,
    'Bắc Giang': 3,
    'Thái Nguyên': 3,
    'Phú Thọ': 3,
    'Tuyên Quang': 3,
    'Yên Bái': 3,
    'Lào Cai': 3,
    'Lai Châu': 3,
    'Điện Biên': 3,
    'Sơn La': 3,
    'Hòa Bình': 3,
    'Hà Giang': 3,
    'Cao Bằng': 3,
    'Bắc Kạn': 3,
    'Lạng Sơn': 3,
    'Quảng Ninh': 3,

    // ── Zone 3: Miền Nam ──
    'Hồ Chí Minh': 3,
    'Bình Dương': 3,
    'Đồng Nai': 3,
    'Bà Rịa - Vũng Tàu': 3,
    'Long An': 3,
    'Tiền Giang': 3,
    'Bến Tre': 3,
    'Trà Vinh': 3,
    'Vĩnh Long': 3,
    'Đồng Tháp': 3,
    'An Giang': 3,
    'Kiên Giang': 3,
    'Cần Thơ': 3,
    'Hậu Giang': 3,
    'Sóc Trăng': 3,
    'Bạc Liêu': 3,
    'Cà Mau': 3,
    'Tây Ninh': 3,
    'Bình Phước': 3,
};

/**
 * Lấy danh sách tỉnh/thành phố để render dropdown
 */
export const PROVINCE_LIST = Object.keys(PROVINCE_ZONE_MAP).sort();

/**
 * Tính phí ship
 * @param {string} province - Tỉnh/thành phố được chọn
 * @param {number} subtotal - Tổng tiền hàng (trước giảm giá)
 * @returns {{ fee: number, isFree: boolean, zone: number, zoneLabel: string }}
 */
export const calcShippingFee = (province, subtotal) => {
    if (!province) return { fee: 0, isFree: false, zone: 0, zoneLabel: '' };

    const isFree = subtotal >= FREE_SHIP_THRESHOLD;
    const zone = PROVINCE_ZONE_MAP[province] || 3;
    const zoneInfo = SHIPPING_ZONES[zone];

    return {
        fee: isFree ? 0 : zoneInfo.fee,
        originalFee: zoneInfo.fee,
        isFree,
        zone,
        zoneLabel: zoneInfo.label,
    };
};