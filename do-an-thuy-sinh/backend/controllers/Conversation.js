const Conversation = require('../models/Conversation');
const Groq = require('groq-sdk');

let Product;
try {
  Product = require('../models/Product');
} catch (e) {
  console.warn('⚠️  Không tìm thấy models/Product.js');
}

const groq = process.env.GROQ_API_KEY
  ? new Groq({ apiKey: process.env.GROQ_API_KEY })
  : null;

// URL gốc của frontend – đổi thành domain thật khi deploy
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// Model text-only (nhanh)
const TEXT_MODEL   = 'llama-3.1-8b-instant';
// Model vision (nhận diện ảnh)
const VISION_MODEL = 'meta-llama/llama-4-scout-17b-16e-instruct';

// ===================== USER SIDE =====================

const sendMessage = async (req, res) => {
  try {
    const { userEmail, text, mediaUrl, mediaType } = req.body;

    if (!userEmail || (!text && !mediaUrl)) {
      return res.status(400).json({ message: 'Thiếu thông tin tin nhắn' });
    }

    let conversation = await Conversation.findOne({ userEmail });
    if (!conversation) {
      conversation = new Conversation({ userEmail, messages: [], isHandledByAdmin: false });
    }

    const userMessage = {
      sender: 'user',
      text: text || '',
      mediaUrl: mediaUrl || null,
      mediaType: mediaType || 'none',
      createdAt: new Date()
    };
    conversation.messages.push(userMessage);
    conversation.lastUpdate = new Date();

    if (!conversation.isHandledByAdmin) {
      const botReplyText = await getAIResponse(text, mediaUrl, mediaType, conversation.messages);

      const botMessage = {
        sender: 'bot',
        text: botReplyText,
        mediaUrl: null,
        mediaType: 'none',
        createdAt: new Date()
      };
      conversation.messages.push(botMessage);
      await conversation.save();

      const io = req.app.get('io');
      if (io) {
        io.to('admin-room').emit('new-message', {
          conversationId: conversation._id,
          userEmail,
          lastMessage: text || `[${mediaType || 'media'}]`,
          isHandledByAdmin: false
        });
      }

      return res.status(200).json({
        success: true,
        botReply: botMessage,
        conversationId: conversation._id
      });

    } else {
      await conversation.save();

      const io = req.app.get('io');
      if (io) {
        io.to(`admin-conv-${conversation._id}`).emit('user-message', userMessage);
        io.to('admin-room').emit('new-message', {
          conversationId: conversation._id,
          userEmail,
          lastMessage: text || `[${mediaType || 'media'}]`,
          isHandledByAdmin: true
        });
      }

      return res.status(200).json({
        success: true,
        botReply: null,
        waitingForAdmin: true,
        conversationId: conversation._id
      });
    }
  } catch (error) {
    console.error('sendMessage error:', error);
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

// ===================== STREAMING ENDPOINT =====================

const sendMessageStream = async (req, res) => {
  try {
    const { userEmail, text, mediaUrl, mediaType } = req.body;

    if (!userEmail || (!text && !mediaUrl)) {
      return res.status(400).json({ message: 'Thiếu thông tin tin nhắn' });
    }

    let conversation = await Conversation.findOne({ userEmail });
    if (!conversation) {
      conversation = new Conversation({ userEmail, messages: [], isHandledByAdmin: false });
    }

    const userMessage = {
      sender: 'user',
      text: text || '',
      mediaUrl: mediaUrl || null,
      mediaType: mediaType || 'none',
      createdAt: new Date()
    };
    conversation.messages.push(userMessage);
    conversation.lastUpdate = new Date();

    // Admin đang tiếp quản → không stream
    if (conversation.isHandledByAdmin) {
      await conversation.save();
      const io = req.app.get('io');
      if (io) {
        io.to(`admin-conv-${conversation._id}`).emit('user-message', userMessage);
        io.to('admin-room').emit('new-message', {
          conversationId: conversation._id,
          userEmail,
          lastMessage: text || `[${mediaType || 'media'}]`,
          isHandledByAdmin: true
        });
      }
      return res.status(200).json({
        success: true, botReply: null,
        waitingForAdmin: true, conversationId: conversation._id
      });
    }

    // Có ảnh nhưng không có text → dùng vision, không stream
    if (mediaUrl && mediaType === 'image') {
      const botReplyText = await getAIResponse(text, mediaUrl, mediaType, conversation.messages);
      const botMessage = {
        sender: 'bot', text: botReplyText,
        mediaUrl: null, mediaType: 'none', createdAt: new Date()
      };
      conversation.messages.push(botMessage);
      await conversation.save();

      const io = req.app.get('io');
      if (io) {
        io.to('admin-room').emit('new-message', {
          conversationId: conversation._id, userEmail,
          lastMessage: text || '[hình ảnh]', isHandledByAdmin: false
        });
      }
      return res.status(200).json({
        success: true, botReply: botMessage, conversationId: conversation._id
      });
    }

    // ===== STREAMING (chỉ text) =====
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.flushHeaders();

    res.write(`data: ${JSON.stringify({ type: 'init', conversationId: conversation._id.toString() })}\n\n`);

    let fullText = '';

    if (!groq) {
      const fallback = 'Hệ thống AI chưa được cấu hình. Vui lòng liên hệ nhân viên hỗ trợ!';
      res.write(`data: ${JSON.stringify({ type: 'chunk', text: fallback })}\n\n`);
      fullText = fallback;
    } else {
      try {
        const systemPrompt = await buildSystemPrompt();
        const recentHistory = conversation.messages.slice(-12, -1);
        const chatHistory = recentHistory
          .filter(msg => msg.text && msg.text.trim())
          .map(msg => ({
            role: msg.sender === 'user' ? 'user' : 'assistant',
            content: msg.text
          }));

        const stream = await groq.chat.completions.create({
          model: TEXT_MODEL,
          messages: [
            { role: 'system', content: systemPrompt },
            ...chatHistory,
            { role: 'user', content: text || '' }
          ],
          max_tokens: 500,
          temperature: 0.5,
          stream: true
        });

        for await (const chunk of stream) {
          const delta = chunk.choices[0]?.delta?.content || '';
          if (delta) {
            fullText += delta;
            res.write(`data: ${JSON.stringify({ type: 'chunk', text: delta })}\n\n`);
          }
        }
      } catch (aiErr) {
        console.error('AI Stream Error:', aiErr.message);
        const errMsg = 'Xin lỗi, tôi đang gặp sự cố. Vui lòng thử lại!';
        res.write(`data: ${JSON.stringify({ type: 'chunk', text: errMsg })}\n\n`);
        fullText = errMsg;
      }
    }

    const botMessage = {
      sender: 'bot', text: fullText,
      mediaUrl: null, mediaType: 'none', createdAt: new Date()
    };
    conversation.messages.push(botMessage);
    await conversation.save();

    const io = req.app.get('io');
    if (io) {
      io.to('admin-room').emit('new-message', {
        conversationId: conversation._id, userEmail,
        lastMessage: text, isHandledByAdmin: false
      });
    }

    res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
    res.end();

  } catch (error) {
    console.error('sendMessageStream error:', error);
    if (!res.headersSent) {
      res.status(500).json({ message: 'Lỗi server', error: error.message });
    } else {
      res.write(`data: ${JSON.stringify({ type: 'error', message: error.message })}\n\n`);
      res.end();
    }
  }
};

// ===================== ADMIN SIDE =====================

const getUserConversation = async (req, res) => {
  try {
    const { userEmail } = req.params;
    const conversation = await Conversation.findOne({ userEmail });
    if (!conversation) {
      return res.status(200).json({ messages: [], conversationId: null, isHandledByAdmin: false });
    }
    res.status(200).json({
      messages: conversation.messages,
      conversationId: conversation._id,
      isHandledByAdmin: conversation.isHandledByAdmin
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

const getAllConversations = async (req, res) => {
  try {
    const conversations = await Conversation.find()
      .select('userEmail isHandledByAdmin lastUpdate messages')
      .sort({ lastUpdate: -1 });

    const formatted = conversations.map(conv => {
      const lastMsg = conv.messages[conv.messages.length - 1];
      let lastMessagePreview = 'Chưa có tin nhắn';
      if (lastMsg) {
        if (lastMsg.text) lastMessagePreview = lastMsg.text;
        else if (lastMsg.mediaType !== 'none') {
          lastMessagePreview = lastMsg.mediaType === 'image' ? '📷 Hình ảnh' : '🎥 Video';
        }
      }
      return {
        _id: conv._id, userEmail: conv.userEmail,
        isHandledByAdmin: conv.isHandledByAdmin, lastUpdate: conv.lastUpdate,
        lastMessage: lastMessagePreview, lastSender: lastMsg?.sender || null,
        totalMessages: conv.messages.length
      };
    });

    res.status(200).json(formatted);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

const getConversationById = async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id);
    if (!conversation) return res.status(404).json({ message: 'Không tìm thấy' });
    res.status(200).json(conversation);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

const adminTakeover = async (req, res) => {
  try {
    const conversation = await Conversation.findByIdAndUpdate(
      req.params.id,
      { isHandledByAdmin: true, lastUpdate: new Date() },
      { new: true }
    );
    if (!conversation) return res.status(404).json({ message: 'Không tìm thấy' });

    const io = req.app.get('io');
    if (io) {
      io.to(`user-${conversation.userEmail}`).emit('admin-takeover', {
        message: 'Nhân viên hỗ trợ đã tham gia cuộc trò chuyện!'
      });
    }
    res.status(200).json({ success: true, message: 'Admin đã tiếp quản' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

const adminHandback = async (req, res) => {
  try {
    const conversation = await Conversation.findByIdAndUpdate(
      req.params.id,
      { isHandledByAdmin: false, lastUpdate: new Date() },
      { new: true }
    );
    if (!conversation) return res.status(404).json({ message: 'Không tìm thấy' });

    const io = req.app.get('io');
    if (io) {
      io.to(`user-${conversation.userEmail}`).emit('bot-restored', {
        message: 'Chatbot AI đã tiếp tục hỗ trợ bạn!'
      });
    }
    res.status(200).json({ success: true, message: 'Đã trả quyền về bot' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

const adminSendMessage = async (req, res) => {
  try {
    const { text, mediaUrl, mediaType } = req.body;
    if (!text && !mediaUrl) return res.status(400).json({ message: 'Tin nhắn trống' });

    const conversation = await Conversation.findById(req.params.id);
    if (!conversation) return res.status(404).json({ message: 'Không tìm thấy' });

    const adminMessage = {
      sender: 'admin', text: text || '',
      mediaUrl: mediaUrl || null, mediaType: mediaType || 'none', createdAt: new Date()
    };
    conversation.messages.push(adminMessage);
    conversation.isHandledByAdmin = true;
    conversation.lastUpdate = new Date();
    await conversation.save();

    const io = req.app.get('io');
    if (io) io.to(`user-${conversation.userEmail}`).emit('admin-message', adminMessage);

    res.status(200).json({ success: true, message: adminMessage });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

const clearMessages = async (req, res) => {
  try {
    await Conversation.findByIdAndUpdate(req.params.id, {
      messages: [], isHandledByAdmin: false, lastUpdate: new Date()
    });
    res.status(200).json({ success: true, message: 'Đã xoá lịch sử' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

const deleteConversation = async (req, res) => {
  try {
    await Conversation.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

// ===================== AI HELPERS =====================

/**
 * Lấy danh sách sản phẩm thật từ DB, trả về:
 *  - productList: chuỗi mô tả cho system prompt
 *  - categories: danh mục duy nhất
 */
const fetchProductData = async () => {
  if (!Product) return { productList: 'Chưa có dữ liệu sản phẩm.', categories: [] };

  try {
    const products = await Product.find()
      .select('_id name price description category stock')
      .limit(100)
      .lean();

    if (!products.length) return { productList: 'Chưa có dữ liệu sản phẩm.', categories: [] };

    // Nhóm theo danh mục
    const byCategory = {};
    for (const p of products) {
      const cat = p.category || 'Khác';
      if (!byCategory[cat]) byCategory[cat] = [];
      byCategory[cat].push(p);
    }

    const lines = [];
    for (const [cat, items] of Object.entries(byCategory)) {
      lines.push(`\n[DANH MỤC: ${cat}]`);
      for (const p of items) {
        const price = p.price ? p.price.toLocaleString('vi-VN') + 'đ' : 'Liên hệ';
        const stock = p.stock !== undefined ? (p.stock > 0 ? 'còn hàng' : 'hết hàng') : 'còn hàng';
        const link = `${FRONTEND_URL}/product/${p._id}`;
        lines.push(`• ${p.name} | ${price} | ${stock} | Link: ${link}`);
      }
    }

    const categories = Object.keys(byCategory);
    return { productList: lines.join('\n'), categories };
  } catch (e) {
    console.warn('⚠️  Không lấy được sản phẩm:', e.message);
    return { productList: 'Chưa có dữ liệu sản phẩm.', categories: [] };
  }
};

const buildSystemPrompt = async () => {
  const { productList, categories } = await fetchProductData();

  const catList = categories.length ? categories.join(', ') : 'chưa có';

  return `Bạn là trợ lý AI của FC Junior - cửa hàng cá cảnh và thuỷ sinh.
Trả lời bằng tiếng Việt, thân thiện, ngắn gọn (tối đa 120 từ mỗi tin).
KHÔNG dùng markdown đậm/nghiêng. Viết văn xuôi tự nhiên.

=== QUY TẮC BẮT BUỘC ===
1. CHỈ được nhắc đến sản phẩm có trong danh sách SPDANH MỤC bên dưới. TUYỆT ĐỐI không bịa tên sản phẩm, giá, hay thông tin không có trong danh sách.
2. Khi liệt kê hoặc giới thiệu bất kỳ sản phẩm nào, PHẢI kèm đường link của sản phẩm đó (trường "Link:" trong danh sách).
3. Nếu khách hỏi về loài cá hoặc sản phẩm không có trong danh sách → trả lời thành thật "Hiện cửa hàng chưa có sản phẩm này" và gợi ý liên hệ nhân viên.
4. Nếu khách hỏi danh mục → chỉ liệt kê các danh mục: ${catList}.
5. Câu hỏi ngoài chủ đề (không liên quan cá/thuỷ sinh/cửa hàng) → gợi ý liên hệ nhân viên hỗ trợ.

=== SẢN PHẨM CỬA HÀNG ===
${productList}

Chuyên môn: cá cảnh, bể cá, thức ăn, lọc nước, cây thuỷ sinh, bệnh cá.
Khi nhận ảnh: mô tả loài cá/sinh vật trong ảnh và tư vấn chăm sóc nếu có thể. Nếu ảnh trùng khớp với sản phẩm trong cửa hàng, gợi ý kèm link sản phẩm.`;
};

// Hàm AI chính – hỗ trợ cả text lẫn ảnh
const getAIResponse = async (text, mediaUrl, mediaType, messageHistory) => {
  if (!groq) {
    console.error('❌ GROQ_API_KEY chưa cấu hình');
    return 'Hệ thống AI chưa được cấu hình. Vui lòng liên hệ nhân viên hỗ trợ!';
  }

  try {
    const systemPrompt = await buildSystemPrompt();
    const recentHistory = messageHistory.slice(-12, -1);
    const chatHistory = recentHistory
      .filter(msg => msg.text && msg.text.trim())
      .map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.text
      }));

    // ===== CÓ ẢNH → dùng Vision model =====
    if (mediaUrl && mediaType === 'image') {
      console.log('🖼️ Using vision model for image analysis');

      const imageContent = { type: 'image_url', image_url: { url: mediaUrl } };

      const userContent = [
        imageContent,
        {
          type: 'text',
          text: text
            ? `${text}`
            : 'Đây là con cá/sinh vật gì? Hãy nhận diện và tư vấn cách chăm sóc. Nếu cửa hàng có bán loài này, hãy gợi ý kèm link sản phẩm.'
        }
      ];

      const completion = await groq.chat.completions.create({
        model: VISION_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          ...chatHistory,
          { role: 'user', content: userContent }
        ],
        max_tokens: 500,
        temperature: 0.5
      });

      return completion.choices[0]?.message?.content
        || 'Xin lỗi, tôi không nhận diện được hình ảnh này. Bạn có thể mô tả thêm không?';
    }

    // ===== CHỈ TEXT → dùng text model nhanh hơn =====
    const completion = await groq.chat.completions.create({
      model: TEXT_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        ...chatHistory,
        { role: 'user', content: text || '' }
      ],
      max_tokens: 500,
      temperature: 0.5
    });

    return completion.choices[0]?.message?.content
      || 'Xin lỗi, tôi không hiểu. Bạn hỏi lại được không?';

  } catch (error) {
    console.error('AI Error:', error.message);
    if (error.error) console.error('API Error detail:', error.error);
    return 'Xin lỗi, tôi đang gặp sự cố. Vui lòng thử lại!';
  }
};

module.exports = {
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
};