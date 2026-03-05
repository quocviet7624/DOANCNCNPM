import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
    Row, Col, Button, InputNumber, Tag, Divider, 
    Rate, message, Spin, Card, Avatar, Input, Form, List, Empty 
} from 'antd';
import { 
    ShoppingCartOutlined, LeftOutlined, UserOutlined, StarFilled 
} from '@ant-design/icons';
import axios from 'axios';

const { TextArea } = Input;
const { Meta } = Card;

const ProductDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [form] = Form.useForm();

    const [product, setProduct] = useState(null);
    const [relatedProducts, setRelatedProducts] = useState([]); // 1. State sản phẩm liên quan
    const [loading, setLoading] = useState(true);
    const [quantity, setQuantity] = useState(1);
    
    // Auth & Review States
    const [currentUserId, setCurrentUserId] = useState(null);
    const [hasOrdered, setHasOrdered] = useState(false); 
    const [hasReviewed, setHasReviewed] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // --- Helper: Lấy User ID an toàn ---
    const getUserIdFromStorage = () => {
        const storedUserId = localStorage.getItem('userId');
        if (storedUserId) return storedUserId;
        try {
            const userObj = JSON.parse(localStorage.getItem('user'));
            return userObj?._id || userObj?.id || null;
        } catch { return null; }
    };

    // --- 2. Lấy danh sách sản phẩm liên quan ---
    const fetchRelatedProducts = async (category, currentId) => {
        try {
            // Gọi API lấy tất cả sản phẩm (hoặc API lọc theo category nếu backend hỗ trợ)
            const res = await axios.get('http://localhost:5000/api/products');
            const allProducts = res.data;
            
            // Lọc sản phẩm cùng danh mục, loại bỏ sản phẩm hiện tại, lấy tối đa 4 món
            const related = allProducts
                .filter(p => p.category === category && p._id !== currentId)
                .slice(0, 4);
            
            setRelatedProducts(related);
        } catch (error) {
            console.error('Lỗi tải sản phẩm liên quan', error);
        }
    };

    // --- 3. Fetch Product Detail ---
    const fetchProductDetail = useCallback(async () => {
        try {
            setLoading(true);
            const res = await axios.get(`http://localhost:5000/api/products/${id}`);
            const data = res.data;
            setProduct(data);
            
            // Sau khi có thông tin sản phẩm, gọi hàm lấy sản phẩm liên quan
            fetchRelatedProducts(data.category, data._id);

            const userId = getUserIdFromStorage();
            if (userId && data.reviews) {
                const reviewed = data.reviews.some(r => String(r.userId) === String(userId));
                setHasReviewed(reviewed);
            }
        } catch (error) {
            message.error('Lỗi tải sản phẩm!');
        } finally {
            setLoading(false);
        }
    }, [id]);

    // --- 4. Check Order Status ---
    const checkUserOrderStatus = useCallback(async (userId) => {
        try {
            const res = await axios.get(`http://localhost:5000/api/orders/user/${userId}`);
            const orders = res.data;
            
            const isPurchased = orders.some(order => 
                order.status === 'Đã giao' && 
                order.items.some(item => String(item.product || item._id) === String(id))
            );
            setHasOrdered(isPurchased);
        } catch (error) {
            // console.warn('API Order chưa sẵn sàng hoặc user chưa mua hàng.');
            
            // MẸO: Nếu bạn đang test và chưa làm xong API Order, 
            // hãy bỏ comment dòng dưới để cho phép review thoải mái:
            // setHasOrdered(true); 
        }
    }, [id]);

    useEffect(() => {
        window.scrollTo(0, 0); // Cuộn lên đầu trang khi đổi sản phẩm
        const userId = getUserIdFromStorage();
        setCurrentUserId(userId);
        fetchProductDetail();
        
        if (userId) {
            checkUserOrderStatus(userId);
        }
    }, [id, fetchProductDetail, checkUserOrderStatus]);

    // --- Add to Cart ---
    const addToCart = (prod = product, qty = quantity) => {
        if (!currentUserId) {
            message.warning('Vui lòng đăng nhập để mua hàng!');
            navigate('/login');
            return;
        }

        const cart = JSON.parse(localStorage.getItem('cart') || '[]');
        const existingItem = cart.find(item => item._id === prod._id);

        if (existingItem) {
            existingItem.quantity += qty;
        } else {
            cart.push({ ...prod, quantity: qty });
        }

        localStorage.setItem('cart', JSON.stringify(cart));
        window.dispatchEvent(new Event('storage'));
        message.success(`Đã thêm ${prod.name} vào giỏ!`);
    };

    // --- Submit Review ---
    const handleSubmitReview = async (values) => {
        if (!currentUserId) return message.error('Vui lòng đăng nhập!');
        setSubmitting(true);

        try {
            let username = 'Người dùng';
            try {
                const u = JSON.parse(localStorage.getItem('user'));
                username = u.username || u.name || u.email;
            } catch {}

            await axios.post(`http://localhost:5000/api/products/${id}/reviews`, {
                userId: currentUserId,
                username: username,
                rating: values.rating,
                comment: values.comment
            });

            message.success('Cảm ơn đánh giá của bạn!');
            form.resetFields();
            fetchProductDetail(); // Reload lại để hiện review mới
        } catch (error) {
            message.error(error.response?.data?.message || 'Lỗi gửi đánh giá');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div style={{ textAlign: 'center', padding: 50 }}><Spin size="large" /></div>;
    if (!product) return <div style={{ textAlign: 'center', padding: 50 }}>Không tìm thấy sản phẩm</div>;

    return (
        <div style={{ padding: '30px', background: '#f0f2f5', minHeight: '100vh' }}>
            <div style={{ maxWidth: 1200, margin: '0 auto' }}>
                <Button icon={<LeftOutlined />} onClick={() => navigate('/products')} style={{ marginBottom: 20 }}>
                    Quay lại danh sách
                </Button>

                <Row gutter={[32, 32]} style={{ background: '#fff', padding: 20, borderRadius: 8 }}>
                    <Col xs={24} md={10}>
                        <div style={{ border: '1px solid #eee', borderRadius: 8, overflow: 'hidden', textAlign: 'center' }}>
                            <img alt={product.name} src={product.image} style={{ width: '100%', maxHeight: 400, objectFit: 'contain' }} />
                        </div>
                    </Col>
                    <Col xs={24} md={14}>
                        <Tag color="cyan" style={{ marginBottom: 10, fontSize: 14, padding: '4px 10px' }}>{product.category}</Tag>
                        <h1 style={{ fontSize: 28, marginBottom: 10, fontWeight: 700 }}>{product.name}</h1>
                        <h2 style={{ color: '#d48806', fontSize: 30, margin: '15px 0' }}>{product.price.toLocaleString()} đ</h2>
                        
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 20 }}>
                            <Rate disabled allowHalf value={product.avgRating || 0} />
                            <span style={{ marginLeft: 10, color: '#888' }}>({product.numReviews || 0} đánh giá) | Đã bán: {product.sold || 0}</span>
                        </div>
                        
                        <p style={{ fontSize: 16, lineHeight: 1.8, color: '#555' }}>{product.description}</p>
                        
                        <Divider />
                        
                        <div style={{ marginBottom: 20 }}>
                            <span style={{ marginRight: 15, fontWeight: 500 }}>Số lượng:</span>
                            <InputNumber min={1} max={product.stock} value={quantity} onChange={setQuantity} size="large" />
                            <span style={{ marginLeft: 15, color: '#888' }}>
                                {product.stock > 0 ? `Còn ${product.stock} sản phẩm` : <span style={{color: 'red'}}>Hết hàng</span>}
                            </span>
                        </div>

                        <Button 
                            type="primary" 
                            size="large" 
                            icon={<ShoppingCartOutlined />} 
                            onClick={() => addToCart(product, quantity)}
                            disabled={product.stock <= 0}
                            style={{ 
                                width: 220, height: 50, fontSize: 18,
                                background: '#fadb14', borderColor: '#fadb14', color: '#000', fontWeight: 'bold' 
                            }}
                        >
                            {product.stock > 0 ? 'THÊM VÀO GIỎ' : 'TẠM HẾT HÀNG'}
                        </Button>
                    </Col>
                </Row>

                {/* --- SẢN PHẨM LIÊN QUAN --- */}
                {relatedProducts.length > 0 && (
                    <div style={{ marginTop: 40 }}>
                        <h3 style={{ fontSize: 22, color: '#004d40', marginBottom: 20, borderLeft: '4px solid #004d40', paddingLeft: 10 }}>
                            Sản phẩm liên quan
                        </h3>
                        <Row gutter={[16, 16]}>
                            {relatedProducts.map(rel => (
                                <Col xs={12} sm={12} md={6} key={rel._id}>
                                    <Card
                                        hoverable
                                        onClick={() => navigate(`/product/${rel._id}`)}
                                        cover={<img alt={rel.name} src={rel.image} style={{ height: 180, objectFit: 'cover' }} />}
                                    >
                                        <Meta 
                                            title={rel.name} 
                                            description={
                                                <div>
                                                    <div style={{ fontWeight: 'bold', color: '#d48806' }}>{rel.price.toLocaleString()} đ</div>
                                                    <div style={{ fontSize: 12 }}><StarFilled style={{color: '#fadb14'}}/> {rel.avgRating?.toFixed(1) || 0}</div>
                                                </div>
                                            } 
                                        />
                                    </Card>
                                </Col>
                            ))}
                        </Row>
                    </div>
                )}

                {/* --- Review Section --- */}
                <div style={{ marginTop: 40, background: '#fff', padding: 20, borderRadius: 8 }}>
                    <h3 style={{ fontSize: 20, marginBottom: 20 }}>Đánh giá & Nhận xét</h3>
                    
                    {/* Form đánh giá */}
                    <Card style={{ marginBottom: 20, background: '#fafafa' }} bordered={false}>
                        {!currentUserId ? (
                            <div style={{ textAlign: 'center' }}>🔒 <Link to="/login">Đăng nhập</Link> để viết đánh giá.</div>
                        ) : hasReviewed ? (
                            <div style={{ textAlign: 'center', color: 'green', fontSize: 16 }}>✓ Bạn đã đánh giá sản phẩm này.</div>
                        ) : !hasOrdered ? (
                            <div style={{ textAlign: 'center', color: '#faad14' }}>
                                ℹ️ Bạn cần mua sản phẩm này và đơn hàng được giao thành công để viết đánh giá.
                            </div>
                        ) : (
                            <Form form={form} onFinish={handleSubmitReview} layout="vertical">
                                <Form.Item name="rating" label="Chất lượng sản phẩm" rules={[{ required: true, message: 'Vui lòng chọn sao!' }]}>
                                    <Rate />
                                </Form.Item>
                                <Form.Item name="comment" label="Nhận xét" rules={[{ required: true, min: 5, message: 'Nhập ít nhất 5 ký tự!' }]}>
                                    <TextArea rows={3} placeholder="Chia sẻ cảm nhận của bạn về sản phẩm..." />
                                </Form.Item>
                                <Button type="primary" htmlType="submit" loading={submitting}>Gửi đánh giá</Button>
                            </Form>
                        )}
                    </Card>

                    {/* Danh sách đánh giá */}
                    <List
                        itemLayout="horizontal"
                        dataSource={[...product.reviews].reverse()}
                        renderItem={item => (
                            <List.Item>
                                <List.Item.Meta
                                    avatar={<Avatar icon={<UserOutlined />} style={{ backgroundColor: '#87d068' }} />}
                                    title={
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span style={{ fontWeight: 'bold' }}>{item.username}</span>
                                            <span style={{ fontSize: 12, color: '#999' }}>{new Date(item.createdAt).toLocaleDateString('vi-VN')}</span>
                                        </div>
                                    }
                                    description={
                                        <div>
                                            <Rate disabled value={item.rating} style={{ fontSize: 12 }} />
                                            <div style={{ marginTop: 8, color: '#333' }}>{item.comment}</div>
                                        </div>
                                    }
                                />
                            </List.Item>
                        )}
                        locale={{ emptyText: <Empty description="Chưa có đánh giá nào." /> }}
                    />
                </div>
            </div>
        </div>
    );
};

export default ProductDetail;