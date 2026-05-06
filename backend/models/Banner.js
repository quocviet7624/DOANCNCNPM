const mongoose = require('mongoose');

// Schema dùng để lưu banner hiển thị ở trang chủ
const BannerSchema = new mongoose.Schema({
    // Tiêu đề banner
    title: {
        type: String,
        required: true
    },

    // Mô tả ngắn của banner
    description: {
        type: String,
        default: ''
    },

    // Đường dẫn ảnh hoặc video sau khi upload lên Cloudinary
    mediaUrl: {
        type: String,
        required: true
    },

    // Xác định banner là ảnh hay video
    mediaType: {
        type: String,
        enum: ['image', 'video'],
        default: 'image'
    },

    // Lưu public_id của Cloudinary để hỗ trợ xóa file sau này
    cloudinaryPublicId: {
        type: String,
        default: ''
    },

    // Link chuyển hướng khi người dùng click vào banner
    link: {
        type: String,
        default: '#'
    },

    // Thứ tự hiển thị banner trên trang chủ
    order: {
        type: Number,
        default: 0
    },

    // Trạng thái bật/tắt banner
    isActive: {
        type: Boolean,
        default: true
    }
}, { 
    // Tự động tạo createdAt và updatedAt
    timestamps: true 
});

module.exports = mongoose.model('Banner', BannerSchema);
// update banner model