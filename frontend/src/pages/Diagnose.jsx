import React, { useState } from 'react';
import { Checkbox, Button, Card, Typography, List, message, Spin } from 'antd';
import { MedicineBoxOutlined } from '@ant-design/icons';
import axios from 'axios';

const { Title, Text } = Typography;
const symptomOptions = ["Đốm trắng", "Bơi lờ đờ", "Vây bị rách", "Bỏ ăn", "Mắt lồi"];

const DiagnosePage = () => {
    const [selected, setSelected] = useState([]);
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleDiagnose = async () => {
        if (selected.length === 0) {
            return message.warning("Vui lòng chọn ít nhất một triệu chứng!");
        }

        setLoading(true);
        try {
            const res = await axios.post('http://localhost:5000/api/diagnose', { userSymptoms: selected });
            setResult(res.data);
            message.success("Đã hoàn tất chẩn đoán!");
        } catch (error) {
            message.error("Lỗi kết nối server!");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: '50px', maxWidth: '800px', margin: 'auto' }}>
            <Title level={2} style={{ color: '#004d40' }}>
                <MedicineBoxOutlined /> Hệ thống tư vấn sức khỏe Thủy sinh
            </Title>
            
            <Card title="Bước 1: Chọn triệu chứng quan sát được" bordered={false} style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                <Checkbox.Group 
                    options={symptomOptions} 
                    onChange={setSelected} 
                    style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}
                />
                <br />
                <Button 
                    type="primary" 
                    danger 
                    size="large" 
                    onClick={handleDiagnose}
                    loading={loading}
                >
                    Bắt đầu chẩn đoán ngay
                </Button>
            </Card>

            {result && result.name ? (
                <Card 
                    style={{ marginTop: '30px', border: '2px solid #fadb14', borderRadius: '8px' }} 
                    title={<span style={{ color: '#d48806' }}>Kết quả chẩn đoán: {result.name}</span>}
                >
                    <div style={{ marginBottom: '15px' }}>
                        <Text strong>Cách điều trị:</Text>
                        <p>{result.treatment}</p>
                    </div>

                    <Title level={4} style={{ marginTop: '20px', borderTop: '1px solid #eee', paddingTop: '15px' }}>
                        Sản phẩm gợi ý nên dùng:
                    </Title>
                    <List
                        dataSource={result.recommendProducts}
                        renderItem={item => (
                            <List.Item extra={<Button type="link">Xem chi tiết</Button>}>
                                <List.Item.Meta
                                    title={item.name}
                                    description={<Text type="danger">{item.price.toLocaleString()} VNĐ</Text>}
                                />
                            </List.Item>
                        )}
                    />
                </Card>
            ) : result && (
                <Card style={{ marginTop: '20px' }}>
                    <Text type="secondary">Không tìm thấy bệnh phù hợp. Vui lòng liên hệ hotline để được hỗ trợ trực tiếp.</Text>
                </Card>
            )}
        </div>
    );
};

// DÒNG QUAN TRỌNG NHẤT ĐỂ SỬA LỖI CỦA BẠN:
export default DiagnosePage;