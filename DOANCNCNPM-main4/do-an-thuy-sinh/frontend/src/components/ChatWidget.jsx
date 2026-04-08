import React, { useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import axios from 'axios';

const SOCKET_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
const API_URL = `${SOCKET_URL}/api`;
const CLOUDINARY_CLOUD  = process.env.REACT_APP_CLOUDINARY_CLOUD_NAME   || 'dyb740ren';
const CLOUDINARY_PRESET = process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET || 'ml_default';

let socket = null;

const ChatWidget = ({ userEmail = 'guest@example.com' }) => {
  const [isOpen, setIsOpen]                 = useState(false);
  const [messages, setMessages]             = useState([]);
  const [inputText, setInputText]           = useState('');
  const [loading, setLoading]               = useState(false);
  const [isAdminHandling, setIsAdmin]       = useState(false);
  const [previewFile, setPreviewFile]       = useState(null);
  const [streamingText, setStreamingText]   = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [conversationId, setConversationId] = useState(null);
  const [showSettings, setShowSettings]     = useState(false); // 👈 menu setting
  const [clearing, setClearing]             = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef   = useRef(null);
  const settingsRef    = useRef(null);

  const pushSystemMsg = (text) =>
    setMessages(prev => [...prev, { sender: 'system', text, createdAt: new Date() }]);

  const loadHistory = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/conversations/user/${encodeURIComponent(userEmail)}`);
      if (res.data.messages?.length > 0) {
        setMessages(res.data.messages);
        setIsAdmin(res.data.isHandledByAdmin);
        setConversationId(res.data.conversationId);
      } else {
        setMessages([{
          sender: 'bot',
          text: 'Xin chào! 🐠 Tôi là trợ lý AI của FC Junior. Tôi có thể giúp gì cho bạn về cá cảnh và thuỷ sinh?',
          createdAt: new Date()
        }]);
      }
    } catch (err) {
      console.error('Load history error:', err);
    }
  }, [userEmail]);

  useEffect(() => {
    socket = io(SOCKET_URL);
    socket.emit('user-join', userEmail);
    socket.on('admin-takeover', ({ message }) => { setIsAdmin(true);  pushSystemMsg(`🟢 ${message}`); });
    socket.on('bot-restored',   ({ message }) => { setIsAdmin(false); pushSystemMsg(`🤖 ${message}`); });
    socket.on('admin-message',  (msg) => setMessages(prev => [...prev, msg]));
    loadHistory();
    return () => socket?.disconnect();
  }, [userEmail, loadHistory]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingText]);

  // Đóng settings khi click ra ngoài
  useEffect(() => {
    const handler = (e) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target)) {
        setShowSettings(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ===== XOÁ TIN NHẮN =====
  const handleClearMessages = async () => {
    if (!conversationId) {
      // Chưa có conversation trên server → chỉ clear local
      setMessages([{
        sender: 'bot',
        text: 'Xin chào! 🐠 Tôi là trợ lý AI của FC Junior. Tôi có thể giúp gì cho bạn về cá cảnh và thuỷ sinh?',
        createdAt: new Date()
      }]);
      setShowSettings(false);
      return;
    }

    setClearing(true);
    try {
      await axios.put(`${API_URL}/conversations/admin/${conversationId}/clear`);
      setMessages([{
        sender: 'bot',
        text: 'Lịch sử chat đã được xoá. Tôi có thể giúp gì cho bạn? 🐠',
        createdAt: new Date()
      }]);
      setShowSettings(false);
    } catch (err) {
      console.error('Clear error:', err);
      // Dù lỗi server vẫn clear local
      setMessages([{
        sender: 'bot',
        text: 'Xin chào! 🐠 Tôi là trợ lý AI của FC Junior. Tôi có thể giúp gì cho bạn?',
        createdAt: new Date()
      }]);
      setShowSettings(false);
    } finally {
      setClearing(false);
    }
  };

  // ===== UPLOAD CLOUDINARY =====
  const uploadToCloudinary = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_PRESET);
    setUploadProgress(10);
    const res = await axios.post(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/auto/upload`,
      formData,
      { onUploadProgress: (e) => setUploadProgress(10 + Math.round((e.loaded * 80) / e.total)) }
    );
    setUploadProgress(100);
    setTimeout(() => setUploadProgress(0), 500);
    return res.data.secure_url;
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setPreviewFile({
      file, previewUrl: ev.target.result,
      type: file.type.startsWith('image/') ? 'image' : 'video'
    });
    reader.readAsDataURL(file);
  };

  // ===== GỬI TIN NHẮN =====
  const sendMessage = async () => {
    if ((!inputText.trim() && !previewFile) || loading) return;
    setLoading(true);

    const optimisticMsg = {
      sender: 'user', text: inputText,
      mediaUrl: previewFile?.previewUrl || null,
      mediaType: previewFile?.type || 'none', createdAt: new Date()
    };
    setMessages(prev => [...prev, optimisticMsg]);

    const sentText = inputText;
    const sentFile = previewFile;
    setInputText('');
    setPreviewFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';

    try {
      let uploadedUrl  = null;
      let uploadedType = 'none';

      if (sentFile) {
        try {
          uploadedUrl  = await uploadToCloudinary(sentFile.file);
          uploadedType = sentFile.type;
          setMessages(prev => prev.map((msg, idx) =>
            idx === prev.length - 1 ? { ...msg, mediaUrl: uploadedUrl } : msg
          ));
        } catch (uploadErr) {
          console.error('Upload error:', uploadErr);
        }
      }

      // Admin tiếp quản hoặc có ảnh → /send thường
      if (isAdminHandling || (uploadedUrl && uploadedType === 'image')) {
        const res = await axios.post(`${API_URL}/conversations/send`, {
          userEmail, text: sentText, mediaUrl: uploadedUrl, mediaType: uploadedType
        });
        if (res.data.conversationId) setConversationId(res.data.conversationId);
        if (res.data.botReply) setMessages(prev => [...prev, res.data.botReply]);
        setLoading(false);
        return;
      }

      // Chỉ text → streaming
      setStreamingText('');
      const response = await fetch(`${API_URL}/conversations/send-stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userEmail, text: sentText, mediaUrl: uploadedUrl, mediaType: uploadedType })
      });

      if (!response.ok) throw new Error('Stream failed');

      const reader  = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';

      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { done, value } = await reader.read(); // eslint-disable-line no-await-in-loop
        if (done) break;
        const lines = decoder.decode(value, { stream: true }).split('\n');
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          if (!line.startsWith('data: ')) continue;
          try {
            const data = JSON.parse(line.slice(6));
            if (data.type === 'init') {
              setConversationId(data.conversationId);
            } else if (data.type === 'chunk') {
              accumulated += data.text;
              const snap = accumulated; // snapshot tránh closure stale
              setStreamingText(snap);
            } else if (data.type === 'done') {
              const final = accumulated;
              setMessages(prev => [...prev, {
                sender: 'bot', text: final,
                mediaUrl: null, mediaType: 'none', createdAt: new Date()
              }]);
              setStreamingText('');
            }
          } catch (_) {} // eslint-disable-line no-empty
        }
      }

    } catch (err) {
      console.error('sendMessage error:', err);
      setStreamingText('');
      setMessages(prev => [...prev, {
        sender: 'bot', text: 'Xin lỗi, có lỗi xảy ra. Vui lòng thử lại!', createdAt: new Date()
      }]);
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const formatTime = (ts) =>
    new Date(ts).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

  // ===== RENDER =====
  return (
    <div style={{ position: 'fixed', bottom: 20, right: 20, zIndex: 9999, fontFamily: 'sans-serif' }}>

      {/* Nút mở */}
      {!isOpen && (
        <button onClick={() => setIsOpen(true)} style={styles.openBtn}>💬</button>
      )}

      {isOpen && (
        <div style={styles.chatBox}>

          {/* Header */}
          <div style={styles.header}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 26 }}>🐠</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15 }}>FC Junior Support</div>
                <div style={{ fontSize: 12, opacity: 0.85 }}>
                  {isAdminHandling ? '🟢 Nhân viên đang hỗ trợ' : '🤖 AI đang hỗ trợ'}
                </div>
              </div>
            </div>

            {/* Nút bên phải header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, position: 'relative' }} ref={settingsRef}>
              {/* Nút setting ⚙️ */}
              <button
                onClick={() => setShowSettings(v => !v)}
                style={{ ...styles.headerBtn, fontSize: 18 }}
                title="Cài đặt"
              >
                ⚙️
              </button>

              {/* Nút đóng */}
              <button onClick={() => setIsOpen(false)} style={{ ...styles.headerBtn, fontSize: 20 }}>✕</button>

              {/* Dropdown settings */}
              {showSettings && (
                <div style={styles.settingsDropdown}>
                  <div style={styles.settingsTitle}>⚙️ Cài đặt</div>

                  {/* Xoá lịch sử */}
                  <button
                    onClick={handleClearMessages}
                    disabled={clearing}
                    style={styles.settingsItem}
                    onMouseEnter={e => e.currentTarget.style.background = '#fff3f3'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <span style={{ fontSize: 16 }}>🗑️</span>
                    <span>{clearing ? 'Đang xoá...' : 'Xoá lịch sử chat'}</span>
                  </button>

                  {/* Thông tin */}
                  <div style={styles.settingsDivider} />
                  <div style={{ padding: '6px 14px', fontSize: 11, color: '#aaa' }}>
                    {conversationId
                      ? `ID: ${conversationId.slice(-8)}`
                      : 'Chưa có cuộc hội thoại'}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Upload progress bar */}
          {uploadProgress > 0 && (
            <div style={{ height: 3, background: '#e5e9f0' }}>
              <div style={{
                height: '100%', width: `${uploadProgress}%`,
                background: 'linear-gradient(90deg, #0057b8, #00c6ff)',
                transition: 'width 0.2s'
              }} />
            </div>
          )}

          {/* Messages */}
          <div style={styles.messageArea}>
            {messages.map((msg, idx) => {
              if (msg.sender === 'system') {
                return <div key={idx} style={styles.systemMsg}>{msg.text}</div>;
              }
              const isUser = msg.sender === 'user';
              return (
                <div key={idx} style={{
                  display: 'flex', flexDirection: isUser ? 'row-reverse' : 'row',
                  alignItems: 'flex-end', gap: 6
                }}>
                  <div style={{ ...styles.avatar, background: msg.sender === 'admin' ? '#ff6b35' : '#0057b8' }}>
                    {msg.sender === 'admin' ? '👨‍💼' : isUser ? '👤' : '🤖'}
                  </div>
                  <div style={{
                    ...styles.bubble,
                    background: isUser ? '#0057b8' : '#fff',
                    color: isUser ? '#fff' : '#222',
                    borderBottomRightRadius: isUser ? 4 : 14,
                    borderBottomLeftRadius:  isUser ? 14 : 4,
                  }}>
                    {msg.mediaUrl && msg.mediaType === 'image' && (
                      <img src={msg.mediaUrl} alt="media"
                        style={{ maxWidth: '100%', borderRadius: 8, marginBottom: msg.text ? 6 : 0 }} />
                    )}
                    {msg.mediaUrl && msg.mediaType === 'video' && (
                      <video src={msg.mediaUrl} controls
                        style={{ maxWidth: '100%', borderRadius: 8, marginBottom: msg.text ? 6 : 0 }} />
                    )}
                    {msg.text && (
                      <div style={{ fontSize: 14, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{msg.text}</div>
                    )}
                    <div style={{ fontSize: 10, opacity: 0.6, marginTop: 3, textAlign: isUser ? 'left' : 'right' }}>
                      {formatTime(msg.createdAt)}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Streaming bubble */}
            {streamingText && (
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6 }}>
                <div style={{ ...styles.avatar, background: '#0057b8' }}>🤖</div>
                <div style={{ ...styles.bubble, background: '#fff', color: '#222', borderBottomLeftRadius: 4 }}>
                  <div style={{ fontSize: 14, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                    {streamingText}<span style={{ color: '#0057b8' }}>|</span>
                  </div>
                </div>
              </div>
            )}

            {loading && !streamingText && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ ...styles.avatar, background: '#0057b8' }}>🤖</div>
                <div style={{ ...styles.bubble, background: '#fff', color: '#888' }}>
                  <TypingDots />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Preview file */}
          {previewFile && (
            <div style={styles.filePreview}>
              {previewFile.type === 'image'
                ? <img src={previewFile.previewUrl} alt="preview" style={{ height: 60, borderRadius: 6 }} />
                : <span>🎥 {previewFile.file.name}</span>
              }
              <button onClick={() => setPreviewFile(null)} style={styles.removeFileBtn}>✕</button>
            </div>
          )}

          {/* Input */}
          <div style={styles.inputArea}>
            <input ref={fileInputRef} type="file" accept="image/*,video/*"
              style={{ display: 'none' }} onChange={handleFileChange} />
            <button onClick={() => fileInputRef.current?.click()} style={styles.mediaBtn} title="Gửi ảnh/video">
              📎
            </button>
            <input
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Nhập tin nhắn..."
              style={styles.textInput}
              disabled={loading}
            />
            <button
              onClick={sendMessage}
              disabled={loading || (!inputText.trim() && !previewFile)}
              style={{
                ...styles.sendBtn,
                background: (loading || (!inputText.trim() && !previewFile))
                  ? '#ccc' : 'linear-gradient(135deg, #0057b8, #00c6ff)'
              }}
            >➤</button>
          </div>

        </div>
      )}
    </div>
  );
};

const TypingDots = () => {
  const [dots, setDots] = useState('.');
  useEffect(() => {
    const i = setInterval(() => setDots(d => d.length >= 3 ? '.' : d + '.'), 400);
    return () => clearInterval(i);
  }, []);
  return <span style={{ fontSize: 18, letterSpacing: 2 }}>{dots}</span>;
};

const styles = {
  openBtn: {
    width: 60, height: 60, borderRadius: '50%',
    background: 'linear-gradient(135deg, #0057b8, #00c6ff)',
    border: 'none', cursor: 'pointer',
    boxShadow: '0 4px 15px rgba(0,87,184,0.45)',
    fontSize: 28, color: 'white',
    display: 'flex', alignItems: 'center', justifyContent: 'center'
  },
  chatBox: {
    width: 360, height: 540, background: '#fff', borderRadius: 16,
    boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
    display: 'flex', flexDirection: 'column', overflow: 'hidden'
  },
  header: {
    background: 'linear-gradient(135deg, #0057b8, #00c6ff)',
    padding: '14px 16px', color: 'white',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    position: 'relative'
  },
  headerBtn: {
    background: 'none', border: 'none', color: 'white',
    cursor: 'pointer', padding: '2px 4px', lineHeight: 1
  },
  settingsDropdown: {
    position: 'absolute', top: 36, right: 0,
    background: '#fff', borderRadius: 10,
    boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
    minWidth: 200, zIndex: 100,
    overflow: 'hidden', border: '1px solid #eee'
  },
  settingsTitle: {
    padding: '10px 14px', fontWeight: 700, fontSize: 13,
    color: '#333', borderBottom: '1px solid #f0f0f0', background: '#fafafa'
  },
  settingsItem: {
    width: '100%', padding: '10px 14px',
    background: 'transparent', border: 'none', cursor: 'pointer',
    display: 'flex', alignItems: 'center', gap: 10,
    fontSize: 13, color: '#e53935', textAlign: 'left',
    transition: 'background 0.15s'
  },
  settingsDivider: { height: 1, background: '#f0f0f0', margin: '0' },
  messageArea: {
    flex: 1, overflowY: 'auto', padding: '12px', background: '#f0f4ff',
    display: 'flex', flexDirection: 'column', gap: 8
  },
  systemMsg: {
    textAlign: 'center', fontSize: 12, color: '#666',
    background: '#e8f4e8', padding: '5px 12px', borderRadius: 12, fontStyle: 'italic'
  },
  avatar: {
    width: 30, height: 30, borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 16, flexShrink: 0
  },
  bubble: {
    maxWidth: '75%', padding: '9px 13px', borderRadius: 14,
    boxShadow: '0 1px 4px rgba(0,0,0,0.08)'
  },
  filePreview: {
    padding: '6px 12px', background: '#f5f7fa', borderTop: '1px solid #e5e9f0',
    display: 'flex', alignItems: 'center', gap: 8
  },
  removeFileBtn: {
    background: '#ff4d4f', border: 'none', color: 'white',
    borderRadius: '50%', width: 20, height: 20, cursor: 'pointer', fontSize: 12,
    display: 'flex', alignItems: 'center', justifyContent: 'center'
  },
  inputArea: {
    padding: '10px 12px', background: '#fff', borderTop: '1px solid #e5e9f0',
    display: 'flex', gap: 6, alignItems: 'center'
  },
  mediaBtn: { background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', padding: '0 4px' },
  textInput: {
    flex: 1, border: '1.5px solid #d1dce8', borderRadius: 20,
    padding: '8px 14px', fontSize: 14, outline: 'none'
  },
  sendBtn: {
    border: 'none', borderRadius: '50%', width: 38, height: 38, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 18, color: 'white', flexShrink: 0
  }
};

export default ChatWidget;