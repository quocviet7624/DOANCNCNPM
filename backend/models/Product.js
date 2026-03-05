// file: server/models/Product.js (hoặc backend/models/Product.js)
const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    description: { type: String, default: '' },
    image: { type: String, default: 'https://via.placeholder.com/300' },
    stock: { type: Number, default: 100 },
    sold: { type: Number, default: 0 },
    
    // --- SỬA ĐOẠN NÀY ---
    category: { 
        type: String,     
        required: true, 
        default: 'Khác' 
    },
    // --------------------

    reviews: [{
        userId: { type: String, required: true },
        username: { type: String, required: true },
        rating: { type: Number, required: true },
        comment: { type: String, required: true },
        createdAt: { type: Date, default: Date.now }
    }],
    
    numReviews: { type: Number, default: 0 },
    avgRating: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Product', productSchema);