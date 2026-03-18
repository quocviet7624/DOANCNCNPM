import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Button, Select, Input, message, Spin, Tag, Empty } from 'antd';
import { ShoppingCartOutlined, SearchOutlined, StarFilled } from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

const { Meta } = Card;
const { Option } = Select;
const { Search } = Input;

const getUserId = () => {
    try {
        const userObj = JSON.parse(localStorage.getItem('user') || '{}');
        return userObj._id || userObj.id || localStorage.getItem('userId') || null;
    } catch {
        return localStorage.getItem('userId') || null;
    }
};

const Products = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const [products,         setProducts]         = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [categories,       setCategories]       = useState([]);
    const [loading,          setLoading]          = useState(true);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [searchText,       setSearchText]       = useState('');

    // ── Đọc ?search= từ URL mỗi khi URL thay đổi (navbar search) ────────────
    useEffect(() => {
        const params  = new URLSearchParams(location.search);
        const keyword = params.get('search') || '';
        setSearchText(keyword);
    }, [location.search]);

    useEffect(() => {
        fetchProducts();
        fetchCategories();
    }, []);

    // ── Lọc lại khi searchText hoặc category hoặc products thay đổi ─────────
    useEffect(() => {
        filterData(selectedCategory, searchText);
    }, [searchText, selectedCategory, products]);

    const fetchCategories = async () => {
        try {
            const res = await axios.get('http://localhost:5000/api/categories');
            setCategories(res.data);
        } catch (err) {
            console.error('Lỗi tải danh mục:', err);
        }
    };

    const fetchProducts = async () => {
        try {
            const res = await axios.get('http://localhost:5000/api/products');
            setProducts(res.data);
            setFilteredProducts(res.data);
        } catch {
            message.error('Không thể tải danh sách sản phẩm!');
        } finally {
            setLoading(false);
        }
    };

    const filterData = (category, keyword) => {
        let temp = [...products];
        if (category !== 'all') {
            temp = temp.filter(p => p.category === category);
        }
        if (keyword && keyword.trim()) {
            const q = keyword.trim().toLowerCase();
            temp = temp.filter(p =>
                p.name.toLowerCase().includes(q) ||
                (p.description && p.description.toLowerCase().includes(q))
            );
        }
        setFilteredProducts(temp);
    };

    // Tìm kiếm nội bộ trong trang — cập nhật URL luôn để đồng bộ navbar
    const handleSearch = (value) => {
        const keyword = value.trim();
        setSearchText(keyword);
        if (keyword) {
            navigate(`/products?search=${encodeURIComponent(keyword)}`, { replace: true });
        } else {
            navigate('/products', { replace: true });
        }
    };

    const addToCart = (e, product) => {
        e.stopPropagation();
        const userId = getUserId();
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
                            placeholder="Tìm kiếm cá, cây, phụ kiện..."
                            value={searchText}
                            onChange={e => setSearchText(e.target.value)}
                            onSearch={handleSearch}
                            allowClear
                            onClear={() => handleSearch('')}
                            enterButton={<SearchOutlined />}
                            size="large"
                        />
                    </Col>
                    <Col xs={24} md={12} style={{ marginTop: window.innerWidth < 768 ? 10 : 0 }}>
                        <Select
                            value={selectedCategory}
                            onChange={setSelectedCategory}
                            style={{ width: '100%' }}
                            size="large"
                        >
                            <Option value="all">Tất cả danh mục</Option>
                            {categories.map(cat => (
                                <Option key={cat._id} value={cat.name}>{cat.name}</Option>
                            ))}
                        </Select>
                    </Col>
                </Row>

                {searchText && (
                    <div style={{ marginTop: 10, fontSize: 13, color: '#888' }}>
                        🔍 Kết quả cho: <strong style={{ color: '#004d40' }}>"{searchText}"</strong>
                        {' '}— {filteredProducts.length} sản phẩm
                        <Button
                            type="link" size="small"
                            onClick={() => handleSearch('')}
                            style={{ color: '#f5222d', padding: '0 4px' }}
                        >
                            Xóa tìm kiếm
                        </Button>
                    </div>
                )}
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
                        <Empty
                            description={
                                searchText
                                    ? `Không tìm thấy sản phẩm nào cho "${searchText}"`
                                    : 'Không tìm thấy sản phẩm nào'
                            }
                        />
                    </div>
                )}
            </Row>
        </div>
    );
};

export default Products;