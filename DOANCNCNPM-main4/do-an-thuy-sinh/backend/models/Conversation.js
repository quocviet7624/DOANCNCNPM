const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: { type: String, enum: ['user', 'bot', 'admin'], required: true },
  text: { type: String, default: '' },
  mediaUrl: { type: String, default: null },
  mediaType: { type: String, default: 'none' },
  createdAt: { type: Date, default: Date.now }
});

const conversationSchema = new mongoose.Schema({
  userEmail: { type: String, required: true, unique: true },
  messages: [messageSchema],
  isHandledByAdmin: { type: Boolean, default: false },
  lastUpdate: { type: Date, default: Date.now }
});

// ✅ ĐÚNG - export thẳng model, không bọc trong object
module.exports = mongoose.model('Conversation', conversationSchema);