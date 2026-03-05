import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Button, Select, Input, message, Spin, Tag, Empty } from 'antd';
import { ShoppingCartOutlined, SearchOutlined, StarFilled } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const { Meta } = Card;
const { Option } = Select;
const { Search } = Input;

const Products = () => {
    const navigate = useNavigate();
    const [products, setProducts] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]);
    // 1. Thêm state để lưu danh mục
    const [categories, setCategories] = useState([]); 
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState('all');

    useEffect(() => {
        // 2. Gọi cả 2 API khi trang load
        fetchProducts();
        fetchCategories();
    }, []);

    // 3. Hàm lấy danh sách danh mục từ Server
    const fetchCategories = async () => {
        try {
            const res = await axios.get('http://localhost:5000/api/categories');
            setCategories(res.data);
        } catch (error) {
            console.error('Lỗi tải danh mục:', error);
            // Không cần alert lỗi này để tránh làm phiền user, chỉ cần log
        }
    };

    const fetchProducts = async () => {
        try {
            const res = await axios.get('http://localhost:5000/api/products');
            setProducts(res.data);
            setFilteredProducts(res.data);
            setLoading(false);
        } catch (error) {
            message.error('Không thể tải danh sách sản phẩm!');
            setLoading(false);
        }
    };

    const handleCategoryChange = (value) => {
        setSelectedCategory(value);
        filterData(value, document.getElementById('search-input')?.value || '');
    };

    const handleSearch = (value) => {
        filterData(selectedCategory, value);
    };

    const filterData = (category, keyword) => {
        let temp = [...products];

        if (category !== 'all') {
            // So sánh tên danh mục (String)
            temp = temp.filter(p => p.category === category);
        }

        if (keyword) {
            temp = temp.filter(p => 
                p.name.toLowerCase().includes(keyword.toLowerCase()) ||
                (p.description && p.description.toLowerCase().includes(keyword.toLowerCase()))
            );
        }
        setFilteredProducts(temp);
    };

    const addToCart = (e, product) => {
        e.stopPropagation();
        const userId = localStorage.getItem('userId') || JSON.parse(localStorage.getItem('user') || '{}')._id;
        
        if (!userId) {
            message.warning('Vui lòng đăng nhập để mua hàng!');
            navigate('/login');
            return;
        }

        const cart = JSON.parse(localStorage.getItem('cart') || '[]');
        const existingItem = cart.find(item => item._id === product._id);
        
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            cart.push({ ...product, quantity: 1 });
        }
        
        localStorage.setItem('cart', JSON.stringify(cart));
        window.dispatchEvent(new Event('storage'));
        message.success(`Đã thêm ${product.name} vào giỏ!`);
    };

    if (loading) return <div style={{ textAlign: 'center', marginTop: 50 }}><Spin size="large" /></div>;

    return (
        <div style={{ padding: '30px', background: '#f0f2f5', minHeight: '100vh' }}>
            <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', marginBottom: '30px' }}>
                <h2 style={{ color: '#004d40', marginBottom: 20 }}>🐠 Cửa Hàng Thủy Sinh</h2>
                <Row gutter={16}>
                    <Col xs={24} md={12}>
                        <Search
                            id="search-input"
                            placeholder="Tìm kiếm cá, cây, phụ kiện..."
                            onSearch={handleSearch}
                            enterButton={<SearchOutlined />}
                            size="large"
                            allowClear
                        />
                    </Col>
                    <Col xs={24} md={12} style={{ marginTop: window.innerWidth < 768 ? 10 : 0 }}>
                        <Select
                            value={selectedCategory}
                            onChange={handleCategoryChange}
                            style={{ width: '100%' }}
                            size="large"
                        >
                            {/* Option mặc định */}
                            <Option value="all">Tất cả danh mục</Option>
                            
                            {/* 4. Render danh mục động từ State */}
                            {categories.map((cat) => (
                                <Option key={cat._id} value={cat.name}>
                                    {cat.name}
                                </Option>
                            ))}

                        </Select>
                    </Col>
                </Row>
            </div>

            <Row gutter={[16, 16]}>
                {filteredProducts.length > 0 ? (
                    filteredProducts.map(product => (
                        <Col xs={24} sm={12} md={8} lg={6} key={product._id}>
                            <Card
                                hoverable
                                onClick={() => navigate(`/product/${product._id}`)}
                                cover={
                                    <img
                                        alt={product.name}
                                        src={product.image}
                                        style={{ height: '200px', objectFit: 'cover' }}
                                    />
                                }
                                actions={[
                                    <Button 
                                        type="primary" 
                                        onClick={(e) => addToCart(e, product)}
                                        icon={<ShoppingCartOutlined />}
                                        style={{ background: '#fadb14', borderColor: '#fadb14', color: '#000' }}
                                    >
                                        Thêm vào giỏ
                                    </Button>
                                ]}
                            >
                                <Meta
                                    title={product.name}
                                    description={
                                        <div>
                                            <Tag color="cyan">{product.category}</Tag>
                                            <div style={{ marginTop: 8, fontWeight: 'bold', color: '#d48806' }}>
                                                {product.price.toLocaleString()} đ
                                            </div>
                                            <div style={{ fontSize: 12, color: '#888' }}>
                                                <StarFilled style={{ color: '#fadb14' }} /> {product.avgRating?.toFixed(1) || 0} ({product.numReviews || 0})
                                            </div>
                                        </div>
                                    }
                                />
                            </Card>
                        </Col>
                    ))
                ) : (
                    <div style={{ width: '100%', padding: 50 }}>
                        <Empty description="Không tìm thấy sản phẩm nào" />
                    </div>
                )}
            </Row>
        </div>
    );
};

export default Products;