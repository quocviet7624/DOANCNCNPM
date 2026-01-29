const mongoose = require('mongoose');

const diseaseSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    symptoms: [{
        type: String,
        required: true
    }],
    treatment: {
        type: String,
        required: true
    },
    recommendProducts: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product'
    }],
    description: {
        type: String,
        default: ''
    },
    severity: {
        type: String,
        enum: ['Nhẹ', 'Trung bình', 'Nghiêm trọng'],
        default: 'Trung bình'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Disease', diseaseSchema);