const express = require('express');
const router = express.Router();
const {
  sendMessage,
  sendMessageStream,
  getUserConversation,
  getAllConversations,
  getConversationById,
  adminTakeover,
  adminHandback,
  adminSendMessage,
  clearMessages,
  deleteConversation
} = require('../controllers/Conversation');

// ===== USER ROUTES =====
router.post('/send', sendMessage);                        
router.post('/send-stream', sendMessageStream);         
router.get('/user/:userEmail', getUserConversation);      

// ===== ADMIN ROUTES =====
router.get('/admin/all', getAllConversations);
router.get('/admin/:id', getConversationById);
router.put('/admin/:id/takeover', adminTakeover);
router.put('/admin/:id/handback', adminHandback);
router.post('/admin/:id/send', adminSendMessage);
router.put('/admin/:id/clear', clearMessages);
router.delete('/admin/:id', deleteConversation);

module.exports = router;