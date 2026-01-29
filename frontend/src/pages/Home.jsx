import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Typography, Carousel, Button, Divider, Spin } from 'antd';
import { ShoppingCartOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const { Title, Text } = Typography;

const Home = () => {
    const [products, setProducts] = useState([]);
    const [banners, setBanners] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            // Lấy sản phẩm
            const productsRes = await axios.get('http://localhost:5000/api/products');
            setProducts(productsRes.data);

            // Lấy banner đang active
            const bannersRes = await axios.get('http://localhost:5000/api/banners/active');
            setBanners(bannersRes.data);
        } catch (error) {
            console.error('Lỗi tải dữ liệu:', error);
        } finally {
            setLoading(false);
        }
    };

    const addToCart = (product) => {
        const cart = JSON.parse(localStorage.getItem('cart') || '[]');
        const existingItem = cart.find(item => item._id === product._id);
        
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            cart.push({ ...product, quantity: 1 });
        }
        
        localStorage.setItem('cart', JSON.stringify(cart));
        alert(`Đã thêm ${product.name} vào giỏ hàng!`);
    };

    return (
        <div>
            {/* 1. HERO BANNER ĐỘNG - Lấy từ Admin */}
            {banners.length > 0 ? (
                <Carousel autoplay autoplaySpeed={5000} effect="fade">
                    {banners.map(banner => (
                        <div key={banner._id}>
                            <div style={{ 
                                height: '500px', 
                                position: 'relative', 
                                overflow: 'hidden',
                                background: '#001529'
                            }}>
                                {/* Hiển thị Video hoặc Ảnh */}
                                {banner.mediaType === 'video' ? (
                                    <video 
                                        autoPlay 
                                        loop 
                                        muted 
                                        style={{ 
                                            width: '100%', 
                                            height: '100%', 
                                            objectFit: 'cover',
                                            opacity: 0.7
                                        }}
                                    >
                                        <source src={banner.mediaUrl} type="video/mp4" />
                                    </video>
                                ) : (
                                    <img
                                        src={banner.mediaUrl}
                                        alt={banner.title}
                                        style={{ 
                                            width: '100%', 
                                            height: '100%', 
                                            objectFit: 'cover',
                                            opacity: 0.7
                                        }}
                                    />
                                )}

                                {/* Overlay Text */}
                                <div style={{ 
                                    position: 'absolute', 
                                    top: '50%', 
                                    left: '50%', 
                                    transform: 'translate(-50%, -50%)', 
                                    textAlign: 'center', 
                                    color: '#fff',
                                    zIndex: 1
                                }}>
                                    <Title 
                                        style={{ 
                                            color: '#fff', 
                                            fontSize: '48px',
                                            textShadow: '2px 2px 8px rgba(0,0,0,0.8)',
                                            margin: 0
                                        }}
                                    >
                                        {banner.title}
                                    </Title>
                                    <Text 
                                        style={{ 
                                            color: '#fadb14', 
                                            fontSize: '20px',
                                            textShadow: '1px 1px 4px rgba(0,0,0,0.8)',
                                            display: 'block',
                                            marginTop: '10px'
                                        }}
                                    >
                                        {banner.description}
                                    </Text>
                                    <br />
                                    {banner.link && banner.link !== '#' && (
                                        <Button 
                                            type="primary" 
                                            size="large" 
                                            danger
                                            onClick={() => navigate(banner.link)}
                                            style={{ marginTop: '20px' }}
                                        >
                                            MUA SẮM NGAY
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </Carousel>
            ) : (
                // Banner mặc định nếu chưa có banner nào
                <div style={{ 
                    height: '500px', 
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    textAlign: 'center'
                }}>
                    <div>
                        <Title style={{ color: '#fff', fontSize: '48px' }}>FC JUNIOR AQUARIUM</Title>
                        <Text style={{ color: '#fadb14', fontSize: '20px' }}>
                            Mang thiên nhiên xanh vào không gian sống của bạn
                        </Text>
                        <br /><br />
                        <Button 
                            type="primary" 
                            size="large" 
                            danger
                            onClick={() => navigate('/products')}
                        >
                            MUA SẮM NGAY
                        </Button>
                    </div>
                </div>
            )}

            <div style={{ padding: '50px' }}>
                {/* 2. DANH MỤC NHANH */}
                <Divider orientation="left">
                    <Title level={3}>DANH MỤC NỔI BẬT</Title>
                </Divider>
                <Row gutter={[16, 16]} justify="center">
                    {[
                        { name: 'Cá Cảnh', icon: '🐟', color: '#e6f7ff' },
                        { name: 'Cây Thủy Sinh', icon: '🌿', color: '#f6ffed' },
                        { name: 'Phụ Kiện', icon: '🔧', color: '#fff7e6' },
                        { name: 'Thuốc - Vi Sinh', icon: '💊', color: '#fff0f6' }
                    ].map(cat => (
                        <Col xs={12} sm={6} key={cat.name}>
                            <Card 
                                hoverable 
                                onClick={() => navigate('/products')}
                                style={{ 
                                    textAlign: 'center',
                                    cursor: 'pointer'
                                }}
                            >
                                <div style={{ 
                                    height: 100, 
                                    background: cat.color, 
                                    display: 'flex', 
                                    flexDirection: 'column',
                                    alignItems: 'center', 
                                    justifyContent: 'center',
                                    borderRadius: '8px'
                                }}>
                                    <div style={{ fontSize: '40px', marginBottom: '10px' }}>
                                        {cat.icon}
                                    </div>
                                    <Text strong>{cat.name}</Text>
                                </div>
                            </Card>
                        </Col>
                    ))}
                </Row>

                {/* 3. SẢN PHẨM NỔI BẬT */}
                <Divider orientation="left">
                    <Title level={3}>SẢN PHẨM NỔI BẬT</Title>
                </Divider>
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '50px' }}>
                        <Spin size="large" tip="Đang tải sản phẩm..." />
                    </div>
                ) : (
                    <Row gutter={[24, 24]}>
                        {products.slice(0, 8).map(item => (
                            <Col xs={24} sm={12} md={8} lg={6} key={item._id}>
                                <Card
                                    hoverable
                                    cover={
                                        <img 
                                            alt={item.name} 
                                            src={item.image || 'https://via.placeholder.com/200'} 
                                            style={{ 
                                                height: 200, 
                                                objectFit: 'cover',
                                                cursor: 'pointer'
                                            }}
                                            onClick={() => navigate(`/products`)}
                                        />
                                    }
                                    actions={[
                                        <Button 
                                            type="primary"
                                            icon={<ShoppingCartOutlined />}
                                            onClick={() => addToCart(item)}
                                            style={{ 
                                                background: '#fadb14', 
                                                borderColor: '#fadb14',
                                                color: '#000'
                                            }}
                                        >
                                            Thêm vào giỏ
                                        </Button>
                                    ]}
                                >
                                    <Card.Meta 
                                        title={item.name} 
                                        description={
                                            <div>
                                                <Text 
                                                    type="danger" 
                                                    strong 
                                                    style={{ fontSize: '18px' }}
                                                >
                                                    {item.price.toLocaleString()}đ
                                                </Text>
                                            </div>
                                        } 
                                    />
                                </Card>
                            </Col>
                        ))}
                    </Row>
                )}

                {/* Nút xem tất cả */}
                <div style={{ textAlign: 'center', marginTop: '40px' }}>
                    <Button 
                        type="primary" 
                        size="large"
                        onClick={() => navigate('/products')}
                    >
                        Xem tất cả sản phẩm →
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default Home;