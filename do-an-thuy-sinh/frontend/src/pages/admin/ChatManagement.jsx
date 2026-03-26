import React, { useState, useEffect, useRef } from 'react';
import { List, Input, Button, Badge, Tag, Avatar, Tooltip, Popconfirm, message as antMsg } from 'antd';
import {
  RobotOutlined, UserOutlined, CustomerServiceOutlined,
  ReloadOutlined, DeleteOutlined, ClearOutlined, SendOutlined
} from '@ant-design/icons';
import axios from 'axios';
import { io } from 'socket.io-client';

const SOCKET_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
const API_URL = `${SOCKET_URL}/api`;

let socket = null;

const ChatManagement = () => {
  const [chats, setChats]             = useState([]);
  const [selectedChat, setSelected]   = useState(null);  // conversation đang xem
  const [messages, setMessages]       = useState([]);
  const [adminText, setAdminText]     = useState('');
  const [sending, setSending]         = useState(false);
  const [loadingChats, setLoadingChats] = useState(false);
  const messagesEndRef                = useRef(null);
  const fileInputRef                  = useRef(null);
  const [selectedFile, setFile]       = useState(null);

  // ===== INIT =====
  useEffect(() => {
    socket = io(SOCKET_URL);
    socket.emit('admin-join');

    // Có tin nhắn mới trong bất kỳ conversation nào
    socket.on('new-message', ({ conversationId, userEmail, lastMessage, isHandledByAdmin }) => {
      setChats(prev => {
        const idx = prev.findIndex(c => c._id === conversationId);
        let updated;
        if (idx !== -1) {
          updated = [...prev];
          updated[idx] = {
            ...updated[idx],
            lastMessage,
            isHandledByAdmin,
            lastUpdate: new Date(),
            _hasNew: true
          };
          // Đưa lên đầu danh sách
          const [item] = updated.splice(idx, 1);
          updated = [item, ...updated];
        } else {
          // Conversation mới chưa có trong list
          fetchAllChats();
          return prev;
        }
        return updated;
      });
    });

    // Tin nhắn user realtime (khi đang xem conversation đó)
    socket.on('user-message', (msg) => {
      setMessages(prev => [...prev, msg]);
    });

    fetchAllChats();
    return () => socket?.disconnect();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ===== FETCH =====
  const fetchAllChats = async () => {
    setLoadingChats(true);
    try {
      const res = await axios.get(`${API_URL}/conversations/admin/all`);
      setChats(res.data);
    } catch (err) {
      antMsg.error('Không tải được danh sách hội thoại');
    } finally {
      setLoadingChats(false);
    }
  };

  const fetchConversation = async (chat) => {
    // Rời socket room cũ
    if (selectedChat) {
      socket.emit('admin-leave-conversation', selectedChat._id);
    }

    try {
      const res = await axios.get(`${API_URL}/conversations/admin/${chat._id}`);
      setSelected(res.data);
      setMessages(res.data.messages || []);

      // Join socket room mới
      socket.emit('admin-join-conversation', chat._id);

      // Reset badge _hasNew
      setChats(prev => prev.map(c =>
        c._id === chat._id ? { ...c, _hasNew: false } : c
      ));
    } catch (err) {
      antMsg.error('Không tải được hội thoại');
    }
  };

  // ===== ADMIN ACTIONS =====
  const handleTakeover = async () => {
    if (!selectedChat) return;
    try {
      await axios.put(`${API_URL}/conversations/admin/${selectedChat._id}/takeover`);
      setSelected(prev => ({ ...prev, isHandledByAdmin: true }));
      setChats(prev => prev.map(c =>
        c._id === selectedChat._id ? { ...c, isHandledByAdmin: true } : c
      ));
      antMsg.success('Đã tiếp quản! Bot ngừng trả lời tự động.');
    } catch {
      antMsg.error('Lỗi khi tiếp quản');
    }
  };

  const handleHandback = async () => {
    if (!selectedChat) return;
    try {
      await axios.put(`${API_URL}/conversations/admin/${selectedChat._id}/handback`);
      setSelected(prev => ({ ...prev, isHandledByAdmin: false }));
      setChats(prev => prev.map(c =>
        c._id === selectedChat._id ? { ...c, isHandledByAdmin: false } : c
      ));
      antMsg.success('Bot AI đã tiếp tục hỗ trợ!');
    } catch {
      antMsg.error('Lỗi khi trả quyền về bot');
    }
  };

  const handleSend = async () => {
    if ((!adminText.trim() && !selectedFile) || !selectedChat || sending) return;
    setSending(true);

    try {
      const payload = {
        text: adminText,
        mediaUrl: selectedFile?.url || null,
        mediaType: selectedFile?.type || 'none'
      };

      const res = await axios.post(
        `${API_URL}/conversations/admin/${selectedChat._id}/send`,
        payload
      );

      setMessages(prev => [...prev, res.data.message]);
      setAdminText('');
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch {
      antMsg.error('Gửi tin nhắn thất bại');
    } finally {
      setSending(false);
    }
  };

  const handleClearMessages = async () => {
    if (!selectedChat) return;
    try {
      await axios.put(`${API_URL}/conversations/admin/${selectedChat._id}/clear`);
      setMessages([]);
      antMsg.success('Đã xoá lịch sử tin nhắn');
    } catch {
      antMsg.error('Lỗi khi xoá');
    }
  };

  const handleDeleteConversation = async (id) => {
    try {
      await axios.delete(`${API_URL}/conversations/admin/${id}`);
      setChats(prev => prev.filter(c => c._id !== id));
      if (selectedChat?._id === id) {
        setSelected(null);
        setMessages([]);
      }
      antMsg.success('Đã xoá cuộc hội thoại');
    } catch {
      antMsg.error('Lỗi khi xoá');
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setFile({
      file,
      url: ev.target.result,
      type: file.type.startsWith('image/') ? 'image' : 'video'
    });
    reader.readAsDataURL(file);
  };

  // ===== HELPERS =====
  const formatTime = (ts) =>
    new Date(ts).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

  const formatDate = (ts) => {
    const d = new Date(ts);
    return `${d.getDate()}/${d.getMonth() + 1} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  const senderMeta = {
    user:  { icon: <UserOutlined />,            label: 'Khách',    color: '#52c41a' },
    bot:   { icon: <RobotOutlined />,            label: 'Bot AI',   color: '#0057b8' },
    admin: { icon: <CustomerServiceOutlined />,  label: 'Admin',    color: '#ff6b35' },
  };

  // ===== RENDER =====
  return (
    <div style={{
      display: 'flex', height: '85vh',
      background: '#f5f7fa', borderRadius: 12,
      overflow: 'hidden', boxShadow: '0 2px 16px rgba(0,0,0,0.10)',
      fontFamily: 'sans-serif'
    }}>

      {/* ===== SIDEBAR ===== */}
      <div style={{
        width: 300, borderRight: '1px solid #e5e9f0',
        background: '#fff', display: 'flex', flexDirection: 'column'
      }}>
        {/* Sidebar header */}
        <div style={{
          padding: '14px 16px', borderBottom: '1px solid #f0f0f0',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}>
          <span style={{ fontWeight: 700, fontSize: 16 }}>💬 Hội thoại ({chats.length})</span>
          <Tooltip title="Làm mới">
            <Button icon={<ReloadOutlined />} onClick={fetchAllChats}
              loading={loadingChats} size="small" type="text" />
          </Tooltip>
        </div>

        {/* Conversation list */}
        <div style={{ overflowY: 'auto', flex: 1 }}>
          <List
            dataSource={chats}
            locale={{ emptyText: 'Chưa có hội thoại' }}
            renderItem={item => (
              <List.Item
                onClick={() => fetchConversation(item)}
                style={{
                  padding: '10px 14px', cursor: 'pointer',
                  background: selectedChat?._id === item._id ? '#e8f4ff' : 'transparent',
                  borderLeft: selectedChat?._id === item._id
                    ? '3px solid #0057b8' : '3px solid transparent',
                  transition: 'all 0.18s'
                }}
              >
                <div style={{ display: 'flex', width: '100%', gap: 10, alignItems: 'center' }}>
                  <Badge dot={item._hasNew} color="red">
                    <Avatar style={{ background: '#0057b8', flexShrink: 0 }}
                      icon={<UserOutlined />} size={36} />
                  </Badge>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{
                        fontWeight: 600, fontSize: 13,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        maxWidth: 140
                      }}>
                        {item.userEmail}
                      </span>
                      <Tag
                        color={item.isHandledByAdmin ? 'orange' : 'blue'}
                        style={{ fontSize: 10, padding: '0 5px', margin: 0 }}
                      >
                        {item.isHandledByAdmin ? '👨‍💼' : '🤖'}
                      </Tag>
                    </div>
                    <div style={{
                      fontSize: 12, color: '#888', marginTop: 2,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                    }}>
                      {item.lastMessage}
                    </div>
                    <div style={{ fontSize: 11, color: '#bbb', marginTop: 2 }}>
                      {item.lastUpdate ? formatDate(item.lastUpdate) : ''} · {item.totalMessages} tin
                    </div>
                  </div>

                  <Popconfirm
                    title="Xoá cuộc hội thoại?"
                    onConfirm={e => { e?.stopPropagation(); handleDeleteConversation(item._id); }}
                    onCancel={e => e?.stopPropagation()}
                    okText="Xoá" cancelText="Huỷ"
                  >
                    <Button
                      icon={<DeleteOutlined />}
                      size="small" type="text" danger
                      onClick={e => e.stopPropagation()}
                    />
                  </Popconfirm>
                </div>
              </List.Item>
            )}
          />
        </div>
      </div>

      {/* ===== MAIN PANEL ===== */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>

        {selectedChat ? (
          <>
            {/* Conversation header */}
            <div style={{
              padding: '12px 20px', background: '#fff',
              borderBottom: '1px solid #e5e9f0',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Avatar style={{ background: '#0057b8' }} icon={<UserOutlined />} size={38} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{selectedChat.userEmail}</div>
                  <div style={{ fontSize: 12, color: '#888' }}>
                    {selectedChat.isHandledByAdmin
                      ? '🟠 Admin đang tiếp quản'
                      : '🔵 Bot AI đang xử lý'}
                    {' · '}{messages.length} tin nhắn
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                {/* Nút tiếp quản / trả về bot */}
                {!selectedChat.isHandledByAdmin ? (
                  <Button type="primary" icon={<CustomerServiceOutlined />}
                    onClick={handleTakeover}
                    style={{ background: '#ff6b35', borderColor: '#ff6b35' }}>
                    Tiếp quản
                  </Button>
                ) : (
                  <Button icon={<RobotOutlined />} onClick={handleHandback}>
                    Trả về Bot
                  </Button>
                )}

                {/* Xoá lịch sử */}
                <Popconfirm title="Xoá toàn bộ tin nhắn?" onConfirm={handleClearMessages}
                  okText="Xoá" cancelText="Huỷ">
                  <Tooltip title="Xoá lịch sử tin nhắn">
                    <Button icon={<ClearOutlined />} danger />
                  </Tooltip>
                </Popconfirm>
              </div>
            </div>

            {/* Messages */}
            <div style={{
              flex: 1, overflowY: 'auto', padding: '16px 20px',
              background: '#f5f7fa',
              display: 'flex', flexDirection: 'column', gap: 12
            }}>
              {messages.map((msg, idx) => {
                const meta = senderMeta[msg.sender] || senderMeta.bot;
                const isUser = msg.sender === 'user';

                return (
                  <div key={idx} style={{
                    display: 'flex',
                    flexDirection: isUser ? 'row' : 'row-reverse',
                    alignItems: 'flex-end', gap: 8
                  }}>
                    <Avatar size={32} icon={meta.icon}
                      style={{ background: meta.color, flexShrink: 0 }} />

                    <div style={{ maxWidth: '65%' }}>
                      <div style={{
                        fontSize: 11, color: '#999', marginBottom: 3,
                        textAlign: isUser ? 'left' : 'right'
                      }}>
                        {meta.label} · {formatTime(msg.createdAt)}
                      </div>

                      <div style={{
                        background: isUser ? '#e8f4ff'
                          : msg.sender === 'admin' ? '#fff3e8' : '#fff',
                        padding: '10px 14px', borderRadius: 12,
                        boxShadow: '0 1px 3px rgba(0,0,0,0.07)',
                        fontSize: 14, lineHeight: 1.6, color: '#222'
                      }}>
                        {/* Media */}
                        {msg.mediaUrl && msg.mediaType === 'image' && (
                          <img src={msg.mediaUrl} alt="media"
                            style={{ maxWidth: '100%', borderRadius: 8, marginBottom: msg.text ? 6 : 0 }} />
                        )}
                        {msg.mediaUrl && msg.mediaType === 'video' && (
                          <video src={msg.mediaUrl} controls
                            style={{ maxWidth: '100%', borderRadius: 8, marginBottom: msg.text ? 6 : 0 }} />
                        )}
                        {/* Text */}
                        {msg.text && <div>{msg.text}</div>}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* File preview */}
            {selectedFile && (
              <div style={{
                padding: '6px 16px', background: '#fff',
                borderTop: '1px solid #eee',
                display: 'flex', alignItems: 'center', gap: 8
              }}>
                {selectedFile.type === 'image'
                  ? <img src={selectedFile.url} alt="preview" style={{ height: 56, borderRadius: 6 }} />
                  : <span>🎥 {selectedFile.file.name}</span>
                }
                <Button size="small" danger onClick={() => setFile(null)}>Xoá</Button>
              </div>
            )}

            {/* Input area */}
            <div style={{
              padding: '10px 16px', background: '#fff',
              borderTop: '1px solid #e5e9f0',
              display: 'flex', gap: 8, alignItems: 'center'
            }}>
              {selectedChat.isHandledByAdmin ? (
                <>
                  <input
                    ref={fileInputRef} type="file" accept="image/*,video/*"
                    style={{ display: 'none' }} onChange={handleFileChange}
                  />
                  <Tooltip title="Đính kèm ảnh/video">
                    <Button onClick={() => fileInputRef.current?.click()} icon="📎" />
                  </Tooltip>
                  <Input.TextArea
                    value={adminText}
                    onChange={e => setAdminText(e.target.value)}
                    onPressEnter={e => { if (!e.shiftKey) { e.preventDefault(); handleSend(); } }}
                    placeholder="Nhập tin nhắn hỗ trợ... (Enter để gửi)"
                    autoSize={{ minRows: 1, maxRows: 4 }}
                    style={{ flex: 1 }}
                  />
                  <Button
                    type="primary" icon={<SendOutlined />}
                    onClick={handleSend} loading={sending}
                    disabled={!adminText.trim() && !selectedFile}
                    style={{ height: 40 }}
                  >
                    Gửi
                  </Button>
                </>
              ) : (
                <div style={{
                  width: '100%', textAlign: 'center', padding: '9px',
                  background: '#f0f8ff', borderRadius: 8,
                  color: '#555', fontSize: 13
                }}>
                  🤖 Bot AI đang tự động trả lời ·{' '}
                  <span
                    onClick={handleTakeover}
                    style={{ color: '#ff6b35', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}
                  >
                    Nhấn để tiếp quản
                  </span>
                </div>
              )}
            </div>
          </>
        ) : (
          /* Empty state */
          <div style={{
            flex: 1, display: 'flex', alignItems: 'center',
            justifyContent: 'center', flexDirection: 'column',
            color: '#aaa', gap: 12
          }}>
            <div style={{ fontSize: 60 }}>💬</div>
            <div style={{ fontSize: 17, fontWeight: 500, color: '#888' }}>
              Chọn một cuộc hội thoại để xem
            </div>
            <div style={{ fontSize: 13 }}>
              Lịch sử chat giữa khách hàng ↔ AI Bot ↔ Admin được lưu tại đây
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatManagement;