import { List, Input, Button, Badge } from 'antd';

const ChatManagement = () => {
    const [chats, setChats] = useState([]); // Danh sách cuộc hội thoại
    const [selectedChat, setSelectedChat] = useState(null);
    const [adminMsg, setAdminMsg] = useState("");

    // Hàm Admin gửi tin nhắn
    const sendAdminMessage = async () => {
        // Gọi API lưu tin nhắn với sender: 'admin'
        // Set isHandledByAdmin: true để Bot ngừng trả lời tự động
    };

    return (
        <div style={{ display: 'flex', height: '80vh' }}>
            <div style={{ width: '30%', borderRight: '1px solid #eee' }}>
                <List
                    dataSource={chats}
                    renderItem={item => (
                        <List.Item onClick={() => setSelectedChat(item)}>
                            {item.userEmail} <Badge dot={!item.isHandledByAdmin} />
                        </List.Item>
                    )}
                />
            </div>
            <div style={{ flex: 1, padding: '20px' }}>
                {selectedChat && (
                    <>
                        <div className="chat-box" style={{ height: '400px', overflowY: 'scroll' }}>
                            {selectedChat.messages.map(m => (
                                <div className={`msg-${m.sender}`}>
                                    <b>{m.sender}:</b> {m.text}
                                    {m.mediaUrl && <img src={m.mediaUrl} width="100" />}
                                </div>
                            ))}
                        </div>
                        <Input.Search 
                            value={adminMsg}
                            onChange={e => setAdminMsg(e.target.value)}
                            enterButton="Gửi với tư cách Admin"
                            onSearch={sendAdminMessage}
                        />
                    </>
                )}
            </div>
        </div>
    );
};