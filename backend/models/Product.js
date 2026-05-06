/**
 * Product.js
 * Schema cho Sản phẩm
 * Fields: name, price, category, images, stock, reviews, ratings, etc.
 * Middleware: Tự đồng đồng bộ image và images
 */

const mongoose = require('mongoose');

/**
 * Schema sản phẩm
 * - name: Tên sản phẩm (bắt buộc)
 * - price: Giá sản phẩm (bắt buộc, >= 0)
 * - category: Danh mục sản phẩm
 * - image: Ảnh đại diện (string)
 * - images: Mảng ảnh sản phẩm
 * - stock: Số lượng tồn kho
 * - reviews: Mảng đánh giá
 * - numReviews: Số lượng đánh giá
 * - avgRating: Điểm đánh giá trung bình
 */
const productSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        price: {
            type: Number,
            required: true,
            min: 0,
        },
        description: {
            type: String,
            default: '',
        },
        image: {
            type: String,
            default: 'https://via.placeholder.com/300',
        },
        images: {
            type: [String],
            default: [],
        },
        stock: {
            type: Number,
            default: 100,
        },
        sold: {
            type: Number,
            default: 0,
        },
        category: {
            type: String,
            required: true,
            default: 'Khác',
        },
        reviews: [
            {
                userId: {
                    type: String,
                    required: true,
                },
                username: {
                    type: String,
                    required: true,
                },
                rating: {
                    type: Number,
                    required: true,
                },
                comment: {
                    type: String,
                    required: true,
                },
                createdAt: {
                    type: Date,
                    default: Date.now,
                },
            },
        ],
        numReviews: {
            type: Number,
            default: 0,
        },
        avgRating: {
            type: Number,
            default: 0,
        },
        createdAt: {
            type: Date,
            default: Date.now,
        },
    }
);

/**
 * Middleware: Tự động đống bộ giữa image và images
 * Nếu có images, lấy ảnh đầu làm image
 */
productSchema.pre('save', function (next) {
    if (this.images && this.images.length > 0) {
        this.image = this.images[0];
    } else if (this.image) {
        this.images = [this.image];
    }
    next();
});

module.exports = mongoose.model('Product', productSchema);