const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true
    },
    customerName: {
        type: String,
        required: true,
        trim: true
    },
    phone: {
        type: String,
        required: true
    },
    address: {
        type: String,
        required: true
    },
    items: [{
        _id: String,
        name: String,
        price: Number,
        quantity: Number,
        image: String,
        category: String
    }],
    totalAmount: {
        type: Number,
        required: true,
        min: 0
    },
    status: { 
        type: String, 
        default: 'Chờ xác nhận',
        enum: ['Chờ xác nhận', 'Đang xử lý', 'Đang giao hàng', 'Đã giao', 'Đã hủy']
    },
    createdAt: { 
        type: Date, 
        default: Date.now 
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

orderSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('Order', orderSchema);