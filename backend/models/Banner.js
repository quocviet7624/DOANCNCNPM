const mongoose = require('mongoose');

const BannerSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        default: ''
    },
    mediaUrl: {
        type: String,
        required: true
    },
    mediaType: {
        type: String,
        enum: ['image', 'video'],
        default: 'image'
    },
    cloudinaryPublicId: {
        type: String, // Lưu public_id để xóa file sau này
        default: ''
    },
    link: {
        type: String,
        default: '#'
    },
    order: {
        type: Number,
        default: 0
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, { 
    timestamps: true 
});

module.exports = mongoose.model('Banner', BannerSchema);