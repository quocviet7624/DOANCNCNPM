// models/Conversation.js
const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    sender: { type: String, enum: ['user', 'bot', 'admin'], required: true },
    text: String,
    mediaUrl: String, // Lưu link ảnh/video
    mediaType: { type: String, enum: ['image', 'video', 'none'], default: 'none' },
    createdAt: { type: Date, default: Date.now }
});

const conversationSchema = new mongoose.Schema({
    userEmail: { type: String, required: true },
    messages: [messageSchema],
    isHandledByAdmin: { type: Boolean, default: false }, // Đánh dấu nếu Admin đã tiếp quản
    lastUpdate: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Conversation', conversationSchema);