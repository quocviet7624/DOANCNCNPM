const mongoose = require('mongoose');

const voucherSchema = new mongoose.Schema({
    code: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
        trim: true,
    },
    description: {
        type: String,
        default: '',
    },
    discountPercent: {
        type: Number,
        required: true,
        min: 1,
        max: 100,
    },

    applicableCategories: {
        type: [String],
        default: [], 
    },
    minOrderValue: {
        type: Number,
        default: 0, 
    },
    maxDiscount: {
        type: Number,
        default: null, 
    },
    usageLimit: {
        type: Number,
        default: null, 
    },
    usedCount: {
        type: Number,
        default: 0,
    },
    startDate: {
        type: Date,
        default: Date.now,
    },
    endDate: {
        type: Date,
        required: true,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
}, { timestamps: true });

// Virtual: kiểm tra voucher còn hiệu lực không
voucherSchema.virtual('isValid').get(function () {
    const now = new Date();
    const withinDate = now >= this.startDate && now <= this.endDate;
    const withinUsage = this.usageLimit === null || this.usedCount < this.usageLimit;
    return this.isActive && withinDate && withinUsage;
});

module.exports = mongoose.model('Voucher', voucherSchema);