const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    description: { type: String, default: '' },
    image: { type: String, default: 'https://via.placeholder.com/300' },
    category: { type: String, enum: ['Cá', 'Cây', 'Phụ kiện', 'Thuốc'], required: true },
    stock: { type: Number, default: 100 },
    // Phần thêm mới cho Review
    reviews: [{
        userId: String,
        username: String,
        rating: Number,
        comment: String,
        createdAt: { type: Date, default: Date.now }
    }],
    avgRating: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Product', productSchema);