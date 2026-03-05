import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Typography, Carousel, Button, Divider, Spin, Badge, Tag, Statistic, message } from 'antd'; // Thêm message vào import
import { 
    ShoppingCartOutlined, 
    FireOutlined, 
    RightCircleOutlined, 
    StarFilled,
    SafetyCertificateOutlined,
    RocketOutlined,
    SmileOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const { Title, Text, Paragraph } = Typography;

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
            const productsRes = await axios.get('http://localhost:5000/api/products');
            setProducts(productsRes.data);

            const bannersRes = await axios.get('http://localhost:5000/api/banners/active');
            setBanners(bannersRes.data);
        } catch (error) {
            console.error('Lỗi tải dữ liệu:', error);
        } finally {
            setLoading(false);
        }
    };

    // --- ĐÂY LÀ PHẦN SỬA ĐỔI QUAN TRỌNG ---
    const addToCart = (e, product) => {
        e.stopPropagation(); // Ngăn sự kiện click lan ra ngoài (tránh nhảy vào trang detail)
        
        const cart = JSON.parse(localStorage.getItem('cart') || '[]');
        const existingItem = cart.find(item => item._id === product._id);
        
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            cart.push({ ...product, quantity: 1 });
        }
        
        // 1. Lưu xuống LocalStorage
        localStorage.setItem('cart', JSON.stringify(cart));
        
        // 2. BẮN TÍN HIỆU CẬP NHẬT (Quan trọng)
        // Các component khác (như Navbar) đang lắng nghe sự kiện này sẽ tự cập nhật lại số lượng
        window.dispatchEvent(new Event('cartChange'));
        
        // 3. Thông báo đẹp hơn thay vì alert
        message.success(`Đã thêm ${product.name} vào giỏ hàng!`);
    };

    const goToDetail = (id) => {
        navigate(`/product/${id}`);
    };

    return (
        <div style={{ backgroundColor: '#f0f5ff', minHeight: '100vh', paddingBottom: '60px' }}>
            {/* 1. HERO BANNER */}
            <div style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                {banners.length > 0 ? (
                    <Carousel autoplay autoplaySpeed={4000} effect="fade">
                        {banners.map(banner => (
                            <div key={banner._id}>
                                <div style={{ 
                                    height: '550px', 
                                    position: 'relative', 
                                    overflow: 'hidden',
                                    background: '#001529'
                                }}>
                                    {banner.mediaType === 'video' ? (
                                        <video autoPlay loop muted style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.8 }}>
                                            <source src={banner.mediaUrl} type="video/mp4" />
                                        </video>
                                    ) : (
                                        <img src={banner.mediaUrl} alt={banner.title} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.8 }} />
                                    )}

                                    <div style={{ 
                                        position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', 
                                        textAlign: 'center', width: '80%', zIndex: 10
                                    }}>
                                        <Title style={{ 
                                            color: '#fff', fontSize: '56px', fontWeight: 'bold', 
                                            textShadow: '0 4px 15px rgba(0,0,0,0.5)', marginBottom: '10px',
                                            letterSpacing: '2px'
                                        }}>
                                            {banner.title.toUpperCase()}
                                        </Title>
                                        <div style={{ width: '100px', height: '4px', background: '#fadb14', margin: '0 auto 20px' }}></div>
                                        <Text style={{ 
                                            color: '#e6f7ff', fontSize: '22px', display: 'block', 
                                            textShadow: '0 2px 4px rgba(0,0,0,0.8)', maxWidth: '700px', margin: '0 auto'
                                        }}>
                                            {banner.description}
                                        </Text>
                                        
                                        {banner.link && banner.link !== '#' && (
                                            <Button 
                                                type="primary" shape="round" size="large"
                                                onClick={() => navigate(banner.link)}
                                                style={{ 
                                                    marginTop: '30px', padding: '0 40px', height: '50px', fontSize: '18px',
                                                    background: 'linear-gradient(to right, #faad14, #fadb14)', border: 'none',
                                                    boxShadow: '0 5px 15px rgba(250, 173, 20, 0.4)'
                                                }}
                                            >
                                                KHÁM PHÁ NGAY
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </Carousel>
                ) : (
                    <div style={{ 
                        height: '500px', 
                        background: 'linear-gradient(135deg, #003a8c 0%, #1890ff 100%)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column'
                    }}>
                        <Title style={{ color: '#fff', fontSize: '50px', margin: 0 }}>FC JUNIOR AQUARIUM</Title>
                    </div>
                )}
            </div>

            <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
                
                {/* 2. SECTION GIỚI THIỆU & CAM KẾT */}
                <div style={{ 
                    marginTop: '60px', 
                    marginBottom: '60px', 
                    background: '#fff', 
                    borderRadius: '20px', 
                    padding: '40px',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.05)'
                }}>
                    <Row gutter={[40, 40]} align="middle">
                        <Col xs={24} md={12}>
                            <div style={{ position: 'relative' }}>
                                <img 
                                    src="https://images.unsplash.com/photo-1522069169874-c58ec4b76be5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" 
                                    alt="About Us"
                                    style={{ width: '100%', borderRadius: '20px', boxShadow: '0 8px 20px rgba(0,0,0,0.1)' }}
                                />
                                <div style={{ 
                                    position: 'absolute', bottom: '-20px', right: '-20px', 
                                    background: '#fff', padding: '20px', borderRadius: '15px',
                                    boxShadow: '0 5px 15px rgba(0,0,0,0.1)'
                                }}>
                                    <Statistic title="Khách hàng hài lòng" value={1000} prefix={<SmileOutlined style={{color: '#faad14'}} />} suffix="+" />
                                </div>
                            </div>
                        </Col>
                        <Col xs={24} md={12}>
                            <Title level={2} style={{ color: '#003a8c' }}>Về FC Junior Aquarium</Title>
                            <Paragraph style={{ fontSize: '16px', color: '#595959', lineHeight: '1.8' }}>
                                Chào mừng bạn đến với <strong>FC Junior Aquarium</strong> - Điểm đến lý tưởng cho những người đam mê thủy sinh. 
                                Chúng tôi không chỉ cung cấp sản phẩm, chúng tôi mang đến giải pháp kiến tạo không gian xanh ngay trong ngôi nhà của bạn.
                            </Paragraph>
                            
                            <Divider />

                            <Row gutter={[16, 16]}>
                                <Col span={24}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                        <div style={{ background: '#e6f7ff', padding: '10px', borderRadius: '50%' }}>
                                            <SafetyCertificateOutlined style={{ fontSize: '24px', color: '#1890ff' }} />
                                        </div>
                                        <div>
                                            <Title level={5} style={{ margin: 0 }}>Sản phẩm chính hãng</Title>
                                            <Text type="secondary">Nguồn gốc rõ ràng, kiểm định nghiêm ngặt.</Text>
                                        </div>
                                    </div>
                                </Col>
                                <Col span={24}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                        <div style={{ background: '#fff7e6', padding: '10px', borderRadius: '50%' }}>
                                            <StarFilled style={{ fontSize: '24px', color: '#faad14' }} />
                                        </div>
                                        <div>
                                            <Title level={5} style={{ margin: 0 }}>Tư vấn chuyên sâu</Title>
                                            <Text type="secondary">Đội ngũ am hiểu kỹ thuật setup bể.</Text>
                                        </div>
                                    </div>
                                </Col>
                                <Col span={24}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                        <div style={{ background: '#f6ffed', padding: '10px', borderRadius: '50%' }}>
                                            <RocketOutlined style={{ fontSize: '24px', color: '#52c41a' }} />
                                        </div>
                                        <div>
                                            <Title level={5} style={{ margin: 0 }}>Giao hàng siêu tốc</Title>
                                            <Text type="secondary">Vận chuyển an toàn, bảo hành rủi ro.</Text>
                                        </div>
                                    </div>
                                </Col>
                            </Row>
                        </Col>
                    </Row>
                </div>

                {/* 3. SẢN PHẨM NỔI BẬT */}
                <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                    <Title level={2} style={{ display: 'inline-block', borderBottom: '3px solid #ff4d4f', paddingBottom: '5px' }}>
                        <FireOutlined style={{ color: '#ff4d4f', marginRight: '10px' }} />
                        SẢN PHẨM HOT
                    </Title>
                </div>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '100px' }}>
                        <Spin size="large" tip="Đang tải sản phẩm..." />
                    </div>
                ) : (
                    <Row gutter={[24, 24]}>
                        {products.slice(0, 8).map(item => (
                            <Col xs={24} sm={12} md={8} lg={6} key={item._id}>
                                <Badge.Ribbon text="Best Seller" color="#faad14">
                                    <Card
                                        hoverable
                                        bordered={false}
                                        style={{ 
                                            borderRadius: '16px', overflow: 'hidden', height: '100%',
                                            boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                                        }}
                                        bodyStyle={{ padding: '15px' }}
                                        cover={
                                            <div 
                                                style={{ overflow: 'hidden', height: '220px', position: 'relative' }}
                                                onClick={() => goToDetail(item._id)}
                                            >
                                                <img 
                                                    alt={item.name} 
                                                    src={item.image || 'https://via.placeholder.com/300?text=No+Image'} 
                                                    style={{ 
                                                        width: '100%', height: '100%', objectFit: 'cover', 
                                                        transition: 'transform 0.5s ease', cursor: 'pointer'
                                                    }}
                                                    onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                                                    onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                                />
                                            </div>
                                        }
                                    >
                                        <div onClick={() => goToDetail(item._id)} style={{ cursor: 'pointer' }}>
                                            <div style={{ marginBottom: '8px' }}>
                                                <Tag color="cyan">{item.category || 'Aquarium'}</Tag>
                                            </div>
                                            
                                            <Title level={5} style={{ 
                                                marginBottom: '8px', 
                                                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                                fontSize: '16px'
                                            }}>
                                                {item.name}
                                            </Title>
                                            
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '15px' }}>
                                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                    <Text strong style={{ color: '#ff4d4f', fontSize: '20px' }}>
                                                        {item.price.toLocaleString()}đ
                                                    </Text>
                                                </div>
                                                
                                                <Button 
                                                    type="primary"
                                                    shape="round"
                                                    icon={<ShoppingCartOutlined />}
                                                    onClick={(e) => addToCart(e, item)}
                                                    style={{ 
                                                        background: '#001529',
                                                        borderColor: '#001529',
                                                    }}
                                                >
                                                    Thêm
                                                </Button>
                                            </div>
                                        </div>
                                    </Card>
                                </Badge.Ribbon>
                            </Col>
                        ))}
                    </Row>
                )}

                {/* Nút Xem tất cả */}
                <div style={{ textAlign: 'center', marginTop: '50px' }}>
                    <Button 
                        size="large"
                        onClick={() => navigate('/products')}
                        style={{ 
                            height: '50px', padding: '0 50px', fontSize: '16px', borderRadius: '4px',
                            background: 'transparent', border: '2px solid #001529', color: '#001529', fontWeight: 'bold'
                        }}
                    >
                        KHÁM PHÁ CỬA HÀNG <RightCircleOutlined />
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default Home;