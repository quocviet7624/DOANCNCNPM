const mongoose = require('mongoose');

// Schema lưu từng tin nhắn trong cuộc hội thoại
const messageSchema = new mongoose.Schema({
  // Người gửi tin nhắn: user, bot hoặc admin
  sender: {
    type: String,
    enum: ['user', 'bot', 'admin'],
    required: true
  },

  // Nội dung văn bản của tin nhắn
  text: {
    type: String,
    default: ''
  },

  // Đường dẫn file media nếu tin nhắn có ảnh/video
  mediaUrl: {
    type: String,
    default: null
  },

  // Loại media được gửi kèm
  mediaType: {
    type: String,
    default: 'none'
  },

  // Thời gian gửi tin nhắn
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Schema lưu toàn bộ cuộc hội thoại của một user
const conversationSchema = new mongoose.Schema({
  // Email dùng để xác định user sở hữu cuộc hội thoại
  userEmail: {
    type: String,
    required: true,
    unique: true
  },

  // Danh sách các tin nhắn trong cuộc hội thoại
  messages: [messageSchema],

  // Đánh dấu admin đang takeover cuộc hội thoại hay không
  isHandledByAdmin: {
    type: Boolean,
    default: false
  },

  // Thời gian cập nhật cuộc hội thoại gần nhất
  lastUpdate: {
    type: Date,
    default: Date.now
  }
});

// Export model Conversation để thao tác với collection trong MongoDB
module.exports = mongoose.model('Conversation', conversationSchema);