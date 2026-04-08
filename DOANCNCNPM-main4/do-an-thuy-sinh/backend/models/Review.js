// models/Review.js
// Lưu ý: Review được nhúng trực tiếp vào Product model (subdocument).
// File này export reviewSchema để dùng lại nếu cần, và helper methods.

const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
    {
        userId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        username: { type: String, required: true },
        rating:   { type: Number, required: true, min: 1, max: 5 },
        comment:  { type: String, required: true, minlength: 5 },
    },
    { timestamps: true }
);

module.exports = reviewSchema;