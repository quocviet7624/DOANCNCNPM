import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Button, Select, Input, message, Spin, Tag } from 'antd';
import { ShoppingCartOutlined, SearchOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const { Meta } = Card;
const { Option } = Select;
const { Search } = Input;

const Products = () => {
    const navigate = useNavigate();
    const [products, setProducts] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState('all');

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            const res = await axios.get('http://localhost:5000/api/products');
            setProducts(res.data);
            setFilteredProducts(res.data);
            setLoading(false);
        } catch (error) {
            message.error('Không thể tải sản phẩm!');
            setLoading(false);
        }
    };

    const handleCategoryChange = (value) => {
        setSelectedCategory(value);
        if (value === 'all') {
            setFilteredProducts(products);
        } else {
            setFilteredProducts(products.filter(p => p.category === value));
        }
    };

    const handleSearch = (value) => {
        if (!value) {
            setFilteredProducts(products);
        } else {
            setFilteredProducts(
                products.filter(p => 
                    p.name.toLowerCase().includes(value.toLowerCase()) ||
                    p.description?.toLowerCase().includes(value.toLowerCase())
                )
            );
        }
    };

    const addToCart = (product) => {
        // Kiểm tra đăng nhập
        const userId = localStorage.getItem('userId');
        if (!userId) {
            message.warning('Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng!');
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
        message.success(`Đã thêm ${product.name} vào giỏ hàng!`);
    };

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: '100px' }}>
                <Spin size="large" tip="Đang tải sản phẩm..." />
            </div>
        );
    }

    return (
        <div style={{ padding: '30px', background: '#f0f2f5', minHeight: '100vh' }}>
            <div style={{ marginBottom: '30px', background: '#fff', padding: '20px', borderRadius: '8px' }}>
                <h1 style={{ color: '#004d40', marginBottom: '20px' }}>🐠 Danh sách sản phẩm</h1>
                
                <Row gutter={16}>
                    <Col span={12}>
                        <Search
                            placeholder="Tìm kiếm sản phẩm..."
                            onSearch={handleSearch}
                            enterButton={<SearchOutlined />}
                            size="large"
                        />
                    </Col>
                    <Col span={12}>
                        <Select
                            value={selectedCategory}
                            onChange={handleCategoryChange}
                            style={{ width: '100%' }}
                            size="large"
                        >
                            <Option value="all">Tất cả danh mục</Option>
                            <Option value="Cá">🐟 Cá cảnh</Option>
                            <Option value="Cây">🌿 Cây thủy sinh</Option>
                            <Option value="Phụ kiện">🔧 Phụ kiện</Option>
                            <Option value="Thuốc">💊 Thuốc & Hóa chất</Option>
                        </Select>
                    </Col>
                </Row>
            </div>

            <Row gutter={[16, 16]}>
                {filteredProducts.map(product => (
                    <Col xs={24} sm={12} md={8} lg={6} key={product._id}>
                        <Card
                            hoverable
                            cover={
                                <img
                                    alt={product.name}
                                    src={product.image || 'https://via.placeholder.com/300x200?text=No+Image'}
                                    style={{ height: '200px', objectFit: 'cover' }}
                                />
                            }
                            actions={[
                                <Button 
                                    type="primary" 
                                    icon={<ShoppingCartOutlined />}
                                    onClick={() => addToCart(product)}
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
                                        <Tag color="green">{product.category}</Tag>
                                        <p style={{ marginTop: '10px', color: '#666' }}>
                                            {product.description}
                                        </p>
                                        <h3 style={{ color: '#d48806', marginTop: '10px' }}>
                                            {product.price.toLocaleString()} VNĐ
                                        </h3>
                                    </div>
                                }
                            />
                        </Card>
                    </Col>
                ))}
            </Row>

            {filteredProducts.length === 0 && (
                <div style={{ textAlign: 'center', padding: '50px' }}>
                    <h3>Không tìm thấy sản phẩm nào 😢</h3>
                </div>
            )}
        </div>
    );
};

export default Products;