const mongoose = require('mongoose');

// Schema lưu danh sách sản phẩm yêu thích của người dùng
const wishlistSchema = new mongoose.Schema(
    {
        // ID của người dùng sở hữu wishlist
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },

        // ID của sản phẩm được thêm vào wishlist
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true,
        },
    },
    {
        // Tự động tạo createdAt và updatedAt
        timestamps: true
    }
);

// Tạo unique index để một user không thể thêm trùng cùng một sản phẩm
wishlistSchema.index({ userId: 1, productId: 1 }, { unique: true });

module.exports = mongoose.model('Wishlist', wishlistSchema);
// update wishlist model