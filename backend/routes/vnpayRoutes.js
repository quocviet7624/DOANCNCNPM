const express     = require('express');
const router      = express.Router();
const crypto      = require('crypto');
const moment      = require('moment');
const qs          = require('qs');

router.post('/create-payment', (req, res) => {
    try {
        const VNP_TMN_CODE    = process.env.VNP_TMN_CODE?.trim();
        const VNP_HASH_SECRET = process.env.VNP_HASH_SECRET?.trim();
        const VNP_URL         = process.env.VNP_URL?.trim();
        const VNP_RETURN_URL  = process.env.VNP_RETURN_URL?.trim();

        if (!VNP_TMN_CODE || !VNP_HASH_SECRET || !VNP_URL || !VNP_RETURN_URL) {
            return res.status(500).json({ message: 'Thiếu cấu hình VNPay!' });
        }

        const { amount, orderId } = req.body;

        const date       = moment().format('YYYYMMDDHHmmss');
        const expireDate = moment().add(15, 'minutes').format('YYYYMMDDHHmmss');

        let vnp_Params = {
            vnp_Version:    '2.1.0',
            vnp_Command:    'pay',
            vnp_TmnCode:    VNP_TMN_CODE,
            vnp_Amount:     amount * 100,
            vnp_CreateDate: date,
            vnp_CurrCode:   'VND',
            vnp_IpAddr:     '127.0.0.1',
            vnp_Locale:     'vn',
            vnp_OrderInfo:  `Thanh toan don hang ${orderId}`,
            vnp_OrderType:  'other',
            vnp_ReturnUrl:  VNP_RETURN_URL,
            vnp_TxnRef:     String(orderId),
            vnp_ExpireDate: expireDate,
        };

        // Sắp xếp alphabet
        vnp_Params = sortObject(vnp_Params);

        // ✅ Tạo signData KHÔNG encode (encode: false)
        const signData = qs.stringify(vnp_Params, { encode: false });

        const signed = crypto
            .createHmac('sha512', VNP_HASH_SECRET)
            .update(Buffer.from(signData, 'utf-8'))
            .digest('hex');

        console.log('signData  :', signData);
        console.log('signed len:', signed.length); // phải là 128
        console.log('signed    :', signed);

        vnp_Params['vnp_SecureHash'] = signed;

        // ✅ URL cuối encode bình thường
        const paymentUrl = VNP_URL + '?' + qs.stringify(vnp_Params, { encode: false });

        res.json({ paymentUrl });

    } catch (err) {
        console.error('VNPay create payment error:', err);
        res.status(500).json({ message: 'Lỗi tạo thanh toán VNPay' });
    }
});

router.get('/return', (req, res) => {
    try {
        const VNP_HASH_SECRET = process.env.VNP_HASH_SECRET?.trim();

        let vnp_Params   = { ...req.query };
        const secureHash = vnp_Params['vnp_SecureHash'];

        delete vnp_Params['vnp_SecureHash'];
        delete vnp_Params['vnp_SecureHashType'];

        vnp_Params = sortObject(vnp_Params);

        // ✅ Verify cũng dùng encode: false
        const signData = qs.stringify(vnp_Params, { encode: false });

        const signed = crypto
            .createHmac('sha512', VNP_HASH_SECRET)
            .update(Buffer.from(signData, 'utf-8'))
            .digest('hex');

        console.log('=== VNPay Return ===');
        console.log('received :', secureHash);
        console.log('computed :', signed);
        console.log('match    :', secureHash === signed);
        console.log('respCode :', vnp_Params['vnp_ResponseCode']);

        const isValid       = secureHash === signed;
        const isSuccess     = vnp_Params['vnp_ResponseCode'] === '00';
        const orderId       = vnp_Params['vnp_TxnRef'];
        const amount        = parseInt(vnp_Params['vnp_Amount']) / 100;
        const transactionNo = vnp_Params['vnp_TransactionNo'];

        const base        = 'http://localhost:3000/order/vnpay-return';
        const frontendUrl = isValid && isSuccess
            ? `${base}?status=success&orderId=${orderId}&amount=${amount}&transactionNo=${transactionNo}`
            : `${base}?status=fail&orderId=${orderId}&code=${vnp_Params['vnp_ResponseCode']}`;

        res.redirect(frontendUrl);

    } catch (err) {
        console.error('VNPay return error:', err);
        res.redirect('http://localhost:3000/order/vnpay-return?status=fail');
    }
});

function sortObject(obj) {
    const sorted = {};
    Object.keys(obj).sort().forEach(key => { sorted[key] = obj[key]; });
    return sorted;
}

module.exports = router;