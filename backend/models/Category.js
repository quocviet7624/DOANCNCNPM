/**
 * Category.js
 * Schema cho Danh mục sản phẩm
 * Fields: name, description, createdAt
 */

const mongoose = require('mongoose');

/**
 * Schema danh mục
 * - name: Tên danh mục (bắt buộc, duy nhất)
 * - description: Mô tả danh mục
 * - createdAt: Ngày tạo
 */
const categorySchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        description: {
            type: String,
            default: '',
        },
        createdAt: {
            type: Date,
            default: Date.now,
        },
    }
);

module.exports = mongoose.model('Category', categorySchema);