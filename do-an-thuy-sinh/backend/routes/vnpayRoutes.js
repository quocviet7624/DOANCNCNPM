const express    = require('express');
const router     = express.Router();
const crypto     = require('crypto');
const moment     = require('moment');
const querystring = require('qs');

const {
    VNPAY_TMN_CODE,
    VNPAY_HASH_SECRET,
    VNPAY_URL,
    VNPAY_RETURN_URL,
} = process.env;

// ── Tạo URL thanh toán VNPay ────────────────────────────────────
router.post('/create-payment', (req, res) => {
    try {
        const { amount, orderInfo, orderId } = req.body;

        const date     = moment().format('YYYYMMDDHHmmss');
        const expireDate = moment().add(15, 'minutes').format('YYYYMMDDHHmmss');

        let vnp_Params = {
            vnp_Version:     '2.1.0',
            vnp_Command:     'pay',
            vnp_TmnCode:     VNPAY_TMN_CODE,
            vnp_Amount:      amount * 100,          // VNPay tính theo đơn vị VNĐ * 100
            vnp_CreateDate:  date,
            vnp_CurrCode:    'VND',
            vnp_IpAddr:      req.ip || '127.0.0.1',
            vnp_Locale:      'vn',
            vnp_OrderInfo:   orderInfo || `Thanh toan don hang ${orderId}`,
            vnp_OrderType:   'other',
            vnp_ReturnUrl:   VNPAY_RETURN_URL,
            vnp_TxnRef:      orderId,               // Mã đơn hàng
            vnp_ExpireDate:  expireDate,
        };

        // Sắp xếp params theo alphabet
        vnp_Params = sortObject(vnp_Params);

        // Tạo chữ ký
        const signData  = querystring.stringify(vnp_Params, { encode: false });
        const hmac      = crypto.createHmac('sha512', VNPAY_HASH_SECRET);
        const signed    = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');
        vnp_Params['vnp_SecureHash'] = signed;

        const paymentUrl = VNPAY_URL + '?' + querystring.stringify(vnp_Params, { encode: false });

        res.json({ paymentUrl });
    } catch (err) {
        console.error('VNPay create payment error:', err);
        res.status(500).json({ message: 'Lỗi tạo thanh toán VNPay' });
    }
});

// ── Nhận kết quả từ VNPay (return URL) ─────────────────────────
router.get('/return', (req, res) => {
    try {
        let vnp_Params = { ...req.query };
        const secureHash = vnp_Params['vnp_SecureHash'];

        delete vnp_Params['vnp_SecureHash'];
        delete vnp_Params['vnp_SecureHashType'];

        vnp_Params = sortObject(vnp_Params);

        const signData = querystring.stringify(vnp_Params, { encode: false });
        const hmac     = crypto.createHmac('sha512', VNPAY_HASH_SECRET);
        const signed   = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

        const isValid      = secureHash === signed;
        const isSuccess    = vnp_Params['vnp_ResponseCode'] === '00';
        const orderId      = vnp_Params['vnp_TxnRef'];
        const amount       = parseInt(vnp_Params['vnp_Amount']) / 100;
        const transactionNo = vnp_Params['vnp_TransactionNo'];

        // Redirect về frontend kèm kết quả
        const frontendUrl = isValid && isSuccess
            ? `http://localhost:3000/vnpay-return?status=success&orderId=${orderId}&amount=${amount}&transactionNo=${transactionNo}`
            : `http://localhost:3000/vnpay-return?status=fail&orderId=${orderId}&code=${vnp_Params['vnp_ResponseCode']}`;

        res.redirect(frontendUrl);
    } catch (err) {
        console.error('VNPay return error:', err);
        res.redirect('http://localhost:3000/vnpay-return?status=fail');
    }
});

// ── Helper: sắp xếp object theo alphabet ───────────────────────
function sortObject(obj) {
    const sorted   = {};
    const keys     = Object.keys(obj).sort();
    keys.forEach(key => { sorted[key] = obj[key]; });
    return sorted;
}

module.exports = router;