import React, { useRef } from 'react';
import { Layout, Typography, Row, Col, Card, Divider, Carousel, Button, Space } from 'antd';
import { 
  LeftOutlined, 
  RightOutlined, 
  EnvironmentFilled, 
  PhoneFilled, 
  MailFilled, 
  ClockCircleFilled 
} from '@ant-design/icons';

// ── IMPORT ẢNH LOCAL ──
import img1 from '../assets/1.png';
import img2 from '../assets/2.png';
import img3 from '../assets/3.png';

const { Content } = Layout;
const { Title, Text, Paragraph } = Typography;

const PRIMARY = '#004d40';
const ACCENT = '#fadb14';

const bannerSlides = [img1, img2, img3];

const AboutPage = () => {
  const carouselRef = useRef();

  return (
    <Content style={{ padding: '0', background: '#f0f2f5', minHeight: '100vh' }}>
      
      {/* ── SECTION 1: BANNER VỪA VẶN (MAX-WIDTH 1200PX ĐỂ ĐỒNG BỘ NỘI DUNG) ── */}
      <div style={{ width: '100%', maxWidth: '1200px', margin: '0 auto', padding: '20px 20px 0 20px' }}>
        <Card 
          bodyStyle={{ padding: 0 }} 
          bordered={false} 
          style={{ borderRadius: 20, overflow: 'hidden', boxShadow: '0 15px 35px rgba(0,0,0,0.1)' }}
        >
          <div style={{ position: 'relative', width: '100%' }}>
            {/* Nút điều hướng - Tinh chỉnh nhỏ lại cho tinh tế */}
            <Button 
              icon={<LeftOutlined />} 
              onClick={() => carouselRef.current.prev()}
              style={{ 
                position: 'absolute', left: 20, top: '50%', transform: 'translateY(-50%)', 
                zIndex: 10, borderRadius: '50%', background: 'rgba(255,255,255,0.8)', 
                border: 'none', height: 40, width: 40, fontSize: 16 
              }} 
            />
            <Button 
              icon={<RightOutlined />} 
              onClick={() => carouselRef.current.next()}
              style={{ 
                position: 'absolute', right: 20, top: '50%', transform: 'translateY(-50%)', 
                zIndex: 10, borderRadius: '50%', background: 'rgba(255,255,255,0.8)', 
                border: 'none', height: 40, width: 40, fontSize: 16 
              }} 
            />
            
            <Carousel autoplay effect="fade" ref={carouselRef} dots={true} speed={1000}>
              {bannerSlides.map((url, index) => (
                <div key={index}>
                  <div style={{
                    width: '100%',
                    height: '500px', // Chiều cao vừa phải, không chiếm hết trang
                    backgroundImage: `url(${url})`,
                    backgroundSize: 'cover', // Đảm bảo ảnh lấp đầy khung đẹp mắt
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat'
                  }} />
                </div>
              ))}
            </Carousel>

            {/* Lớp phủ chữ - Tinh chỉnh padding để không che ảnh */}
            <div style={{ 
              position: 'absolute', 
              bottom: 0, 
              left: 0, 
              width: '100%', 
              zIndex: 5, 
              background: 'linear-gradient(transparent, rgba(0,77,64,0.85))', 
              padding: '60px 40px 30px', 
              color: '#fff',
              textAlign: 'left'
            }}>
              <Title level={1} style={{ color: '#fff', margin: 0, fontSize: 'clamp(24px, 5vw, 40px)', fontWeight: 800 }}>
                FC JUNIOR AQUATIC
              </Title>
              <div style={{ height: '4px', width: '80px', background: ACCENT, margin: '10px 0' }}></div>
              <Text style={{ color: '#f0f0f0', fontSize: '16px', letterSpacing: '0.5px', display: 'block' }}>
                KIẾN TẠO KIỆT TÁC THỦY SINH TRONG LÒNG ĐÀ NẴNG
              </Text>
            </div>
          </div>
        </Card>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 20px' }}>
        
        {/* ── SECTION 2: GIỚI THIỆU ── */}
        <Row align="middle" gutter={[40, 40]}>
          <Col xs={24} md={12}>
            <Title level={2} style={{ color: PRIMARY, fontSize: '28px' }}>VỀ CHÚNG TÔI</Title>
            <Paragraph style={{ fontSize: 16, color: '#444', lineHeight: '1.7', textAlign: 'justify' }}>
              Tại <b>FC Junior</b>, chúng tôi không chỉ bán bể cá, chúng tôi mang cả thiên nhiên vào không gian sống của bạn. 
              Với tâm niệm mỗi hồ thủy sinh là một tác phẩm nghệ thuật, đội ngũ của chúng tôi luôn tỉ mỉ trong từng viên đá, ngọn cỏ để tạo ra hệ sinh thái bền vững và thẩm mỹ nhất.
            </Paragraph>
            <Button type="primary" size="large" style={{ background: PRIMARY, borderColor: PRIMARY, borderRadius: 8, height: 45, padding: '0 30px' }}>
              Khám phá ngay
            </Button>
          </Col>
          <Col xs={24} md={12}>
            <img src={img1} alt="About" style={{ width: '100%', borderRadius: 20, boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }} />
          </Col>
        </Row>

        <Divider style={{ margin: '50px 0' }} />

        {/* ── SECTION 3: LIÊN HỆ & BẢN ĐỒ ── */}
        <Row gutter={[32, 32]}>
          <Col xs={24} lg={10}>
            <Title level={3} style={{ color: PRIMARY, marginBottom: 25 }}>Thông Tin Liên Hệ</Title>
            <Space direction="vertical" size={16} style={{ width: '100%' }}>
              {[
                { icon: <EnvironmentFilled />, label: 'Địa chỉ', content: '29 Dương Bá Trạc, Hải Châu, Đà Nẵng' },
                { icon: <PhoneFilled />, label: 'Điện thoại', content: '0852 192 629' },
                { icon: <MailFilled />, label: 'Email', content: 'lequocviet76st@gmail.com' },
                { icon: <ClockCircleFilled />, label: 'Giờ mở cửa', content: '08:00 - 21:00' },
              ].map((item, i) => (
                <Card key={i} className="contact-info-card" bodyStyle={{ padding: '12px 20px' }}>
                  <Space size={15}>
                    <div className="icon-box">{item.icon}</div>
                    <div>
                      <Text type="secondary" style={{ fontSize: 11, textTransform: 'uppercase' }}>{item.label}</Text>
                      <Text strong style={{ display: 'block', fontSize: 15 }}>{item.content}</Text>
                    </div>
                  </Space>
                </Card>
              ))}
            </Space>
          </Col>

          <Col xs={24} lg={14}>
            <div style={{ borderRadius: 20, overflow: 'hidden', boxShadow: '0 5px 15px rgba(0,0,0,0.1)', height: '100%', minHeight: 400 }}>
              <iframe
                title="FC Junior Map"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3834.463282434282!2d108.2195!3d16.041!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTYwMDInMjcuNiJOIDEwOMKwMTMnMTAuMiJF!5e0!3m2!1svi!2s!4v1625000000000"
                width="100%" height="100%" style={{ border: 0 }} allowFullScreen="" loading="lazy"
              ></iframe>
            </div>
          </Col>
        </Row>
      </div>

      {/* ── CSS TỐI ƯU ── */}
      <style>{`
        .contact-info-card { border-radius: 12px; transition: all 0.3s ease; border: 1px solid #f0f0f0; }
        .contact-info-card:hover { transform: translateX(10px); border-color: ${PRIMARY}; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
        .icon-box { background: ${PRIMARY}; color: white; width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 18px; }
        
        /* Chỉnh thanh điều hướng Carousel (Dots) */
        .ant-carousel .slick-dots li button { background: ${ACCENT} !important; height: 4px !important; opacity: 0.5; }
        .ant-carousel .slick-dots li.slick-active button { width: 24px !important; opacity: 1; background: ${ACCENT} !important; }
        
        /* Responsive cho Mobile */
        @media (max-width: 768px) {
          .ant-carousel .slick-slide div div { height: 300px !important; }
        }
      `}</style>
    </Content>
  );
};

export default AboutPage;