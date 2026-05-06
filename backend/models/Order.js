const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    userId:       { type: String, required: true },
    customerName: { type: String, required: true, trim: true },
    phone:        { type: String, required: true },
    address:      { type: String, required: true },
    province:     { type: String, default: '' },

    items: [{
        _id: String, name: String, price: Number,
        quantity: Number, image: String, category: String,
    }],

    subtotalAmount: { type: Number, default: 0 },
    discountAmount: { type: Number, default: 0 },
    shippingFee:    { type: Number, default: 0 },
    totalAmount:    { type: Number, required: true, min: 0 },

    voucherCode:   { type: String, default: null },
    paymentMethod: { type: String, default: 'COD' },

    // true nếu đã thanh toán (PayPal → true ngay khi đặt, COD → false cho đến khi giao xong)
    isPaid: { type: Boolean, default: false },

    status: {
        type: String,
        default: 'Chờ xác nhận',
        enum: ['Chờ xác nhận', 'Đang xử lý', 'Đang giao hàng', 'Đã giao', 'Đã hủy'],
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

orderSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('Order', orderSchema);