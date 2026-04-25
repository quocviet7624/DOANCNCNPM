/**
 * ProductManagement.jsx
 * Quản lý sản phẩm - Admin Panel
 * Tính năng: Thêm, sửa, xóa sản phẩm với hỗ trợ upload/nhập link ảnh
 */

import React, { useState, useEffect } from 'react';
import {
    Table,
    Button,
    Modal,
    Form,
    Input,
    Select,
    InputNumber,
    message,
    Popconfirm,
    Upload,
    Image,
    Space,
} from 'antd';
import {
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    UploadOutlined,
    LinkOutlined,
    CloseCircleOutlined,
} from '@ant-design/icons';
import axios from 'axios';

const { Option } = Select;

/**
 * Component chính quản lý sản phẩm
 * Quản lý danh sách sản phẩm, hình ảnh, giá, tồn kho
 */
const ProductManagement = () => {
    // ===== STATE: Quản lý dữ liệu sản phẩm & form =====
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [form] = Form.useForm();

    // ===== STATE: Quản lý hình ảnh (link/upload) =====
    const [imageMode, setImageMode] = useState('link');
    const [imageLinks, setImageLinks] = useState(['']);
    const [uploadedImages, setUploadedImages] = useState([]);
    const [previewVisible, setPreviewVisible] = useState(false);
    const [previewImage, setPreviewImage] = useState('');

    // ===== EFFECT: Load dữ liệu khi component mount =====
    useEffect(
        () => {
            fetchProducts();
            fetchCategories();
        },
        []
    );

    // ===== API: Lấy danh sách sản phẩm từ server =====
    const fetchProducts = async () => {
        setLoading(true);
        try {
            const res = await axios.get('http://localhost:5000/api/products');
            setProducts(res.data);
        } catch (error) {
            message.error('Không thể tải sản phẩm!');
        } finally {
            setLoading(false);
        }
    };

    const fetchCategories = async () => {
        try {
            const res = await axios.get('http://localhost:5000/api/categories');
            setCategories(res.data);
        } catch (error) {
            console.error('Lỗi tải danh mục:', error);
        }
    };

    // ===== HELPER: Reset trạng thái ảnh khi đóng modal =====
    const resetImageStates = () => {
        setImageMode('link');
        setImageLinks(['']);
        setUploadedImages([]);
    };

    const handleAdd = () => {
        setEditingProduct(null);
        form.resetFields();
        resetImageStates();
        setIsModalVisible(true);
    };

    const handleEdit = (record) => {
        setEditingProduct(record);
        form.setFieldsValue({ ...record, stock: record.stock ?? 0 });
        resetImageStates();
        if (record.images && record.images.length > 0) {
            setImageLinks(record.images);
        } else if (record.image) {
            setImageLinks([record.image]);
        } else {
            setImageLinks(['']);
        }
        setImageMode('link');
        setIsModalVisible(true);
    };

    const handleDelete = async (id) => {
        try {
            await axios.delete(`http://localhost:5000/api/products/${id}`);
            message.success('Đã xóa sản phẩm!');
            fetchProducts();
        } catch (error) {
            message.error('Không thể xóa sản phẩm!');
        }
    };

    const addLinkField = () => {
        if (imageLinks.length >= 5) return message.warning('Tối đa 5 ảnh!');
        setImageLinks([...imageLinks, '']);
    };

    const updateLink = (index, value) => {
        const newLinks = [...imageLinks];
        newLinks[index] = value;
        setImageLinks(newLinks);
    };

    const removeLink = (index) => {
        if (imageLinks.length === 1) return setImageLinks(['']);
        setImageLinks(imageLinks.filter((_, i) => i !== index));
    };

    const handleUploadChange = ({ fileList }) => {
        const newList = fileList.map(file => {
            if (file.originFileObj && !file.url) {
                return { ...file, url: URL.createObjectURL(file.originFileObj) };
            }
            return file;
        });
        if (newList.length > 5) { message.warning('Tối đa 5 ảnh!'); return; }
        setUploadedImages(newList);
    };

    const handlePreview = async (file) => {
        setPreviewImage(file.url || file.thumbUrl);
        setPreviewVisible(true);
    };

    const handleSubmit = async (values) => {
        try {
            let finalImages = [];
            if (imageMode === 'link') {
                finalImages = imageLinks.filter(l => l.trim() !== '');
            } else {
                finalImages = uploadedImages.map(f => f.url).filter(Boolean);
            }

            if (finalImages.length === 0) return message.error('Vui lòng thêm ít nhất 1 ảnh!');

            const payload = {
                ...values,
                image: finalImages[0],
                images: finalImages,
            };

            if (editingProduct) {
                await axios.put(`http://localhost:5000/api/products/${editingProduct._id}`, payload);
                message.success('Cập nhật sản phẩm thành công!');
            } else {
                await axios.post('http://localhost:5000/api/products', payload);
                message.success('Thêm sản phẩm thành công!');
            }

            setIsModalVisible(false);
            resetImageStates();
            fetchProducts();
        } catch (error) {
            message.error('Có lỗi xảy ra!');
        }
    };

    const columns = [
        {
            title: 'Hình ảnh', dataIndex: 'images', key: 'images', width: 120,
            render: (images, record) => {
                const imgs = images?.length > 0 ? images : (record.image ? [record.image] : []);
                return (
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        {imgs.slice(0, 3).map((src, i) => (
                            <Image key={i} src={src || 'https://via.placeholder.com/50'}
                                width={48} height={48}
                                style={{ objectFit: 'cover', borderRadius: 4, border: '1px solid #eee' }}
                                preview={{ mask: false }}
                            />
                        ))}
                        {imgs.length > 3 && (
                            <div style={{ width: 48, height: 48, borderRadius: 4, background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: '#666', border: '1px solid #eee' }}>
                                +{imgs.length - 3}
                            </div>
                        )}
                    </div>
                );
            }
        },
        { title: 'Tên sản phẩm', dataIndex: 'name', key: 'name', ellipsis: true },
        { title: 'Danh mục', dataIndex: 'category', key: 'category', width: 120 },
        {
            title: 'Giá (VNĐ)', dataIndex: 'price', key: 'price', width: 130,
            render: (price) => <span style={{ color: '#c8232c', fontWeight: 600 }}>{price?.toLocaleString()}đ</span>
        },
        {
            title: 'Tồn kho', dataIndex: 'stock', key: 'stock', width: 90,
            render: (stock) => (
                <span style={{
                    background: stock > 10 ? '#f6ffed' : stock > 0 ? '#fffbe6' : '#fff1f0',
                    color: stock > 10 ? '#52c41a' : stock > 0 ? '#faad14' : '#f5222d',
                    padding: '2px 10px', borderRadius: 12, fontWeight: 600, fontSize: 13,
                    border: `1px solid ${stock > 10 ? '#b7eb8f' : stock > 0 ? '#ffe58f' : '#ffa39e'}`,
                }}>
                    {stock ?? 0}
                </span>
            )
        },
        { title: 'Mô tả', dataIndex: 'description', key: 'description', ellipsis: true },
        {
            title: 'Thao tác', key: 'action', width: 150,
            render: (_, record) => (
                <Space>
                    <Button icon={<EditOutlined />} onClick={() => handleEdit(record)} size="small" type="primary" ghost>Sửa</Button>
                    <Popconfirm title="Bạn có chắc muốn xóa sản phẩm này?" onConfirm={() => handleDelete(record._id)} okText="Xóa" cancelText="Hủy" okButtonProps={{ danger: true }}>
                        <Button danger icon={<DeleteOutlined />} size="small">Xóa</Button>
                    </Popconfirm>
                </Space>
            )
        }
    ];

    return (
        <div style={{ padding: 0 }}>
            <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Quản lý sản phẩm</h2>
                <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd} size="large" style={{ background: '#c8232c', borderColor: '#c8232c' }}>
                    Thêm sản phẩm mới
                </Button>
            </div>

            <Table columns={columns} dataSource={products} rowKey="_id" loading={loading}
                pagination={{ pageSize: 10, showSizeChanger: true }} scroll={{ x: 900 }} bordered size="middle" />

            <Modal
                title={<span style={{ fontSize: 16, fontWeight: 700 }}>{editingProduct ? '✏️ Sửa sản phẩm' : '➕ Thêm sản phẩm mới'}</span>}
                open={isModalVisible}
                onCancel={() => { setIsModalVisible(false); resetImageStates(); }}
                footer={null} width={620} destroyOnClose
            >
                <Form form={form} onFinish={handleSubmit} layout="vertical" style={{ marginTop: 8 }}>
                    <Form.Item label="Tên sản phẩm" name="name" rules={[{ required: true, message: 'Vui lòng nhập tên sản phẩm!' }]}>
                        <Input placeholder="Nhập tên sản phẩm..." />
                    </Form.Item>

                    <Form.Item label="Danh mục" name="category" rules={[{ required: true, message: 'Vui lòng chọn danh mục!' }]}>
                        <Select placeholder="Chọn danh mục" showSearch>
                            {categories.map((cat) => (<Option key={cat._id} value={cat.name}>{cat.name}</Option>))}
                        </Select>
                    </Form.Item>

                    <div style={{ display: 'flex', gap: 16 }}>
                        <Form.Item label="Giá (VNĐ)" name="price" rules={[{ required: true, message: 'Vui lòng nhập giá!' }]} style={{ flex: 1 }}>
                            <InputNumber style={{ width: '100%' }} min={0} placeholder="0"
                                formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                parser={v => v.replace(/\$\s?|(,*)/g, '')} addonAfter="đ" />
                        </Form.Item>
                        <Form.Item label="Số lượng tồn kho" name="stock" rules={[{ required: true, message: 'Vui lòng nhập số lượng!' }]} style={{ flex: 1 }}>
                            <InputNumber style={{ width: '100%' }} min={0} placeholder="0" addonAfter="sp" />
                        </Form.Item>
                    </div>

                    <Form.Item label="Mô tả sản phẩm" name="description">
                        <Input.TextArea rows={3} placeholder="Nhập mô tả sản phẩm..." />
                    </Form.Item>

                    <Form.Item label={<span style={{ fontWeight: 600 }}>Hình ảnh sản phẩm <span style={{ color: '#888', fontWeight: 400, marginLeft: 8, fontSize: 12 }}>(tối đa 5 ảnh)</span></span>}>
                        <div style={{ display: 'flex', gap: 0, marginBottom: 12, border: '1px solid #d9d9d9', borderRadius: 6, overflow: 'hidden', width: 'fit-content' }}>
                            {[
                                { key: 'link', label: <><LinkOutlined /> Nhập link URL</> },
                                { key: 'upload', label: <><UploadOutlined /> Tải ảnh lên</> },
                            ].map(tab => (
                                <button key={tab.key} type="button" onClick={() => setImageMode(tab.key)}
                                    style={{ padding: '6px 16px', border: 'none', background: imageMode === tab.key ? '#c8232c' : '#fff', color: imageMode === tab.key ? '#fff' : '#444', fontWeight: imageMode === tab.key ? 600 : 400, cursor: 'pointer', fontSize: 13, transition: 'all 0.2s' }}>
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {imageMode === 'link' && (
                            <div>
                                {imageLinks.map((link, index) => (
                                    <div key={index} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                                        <Input value={link} onChange={e => updateLink(index, e.target.value)}
                                            placeholder={`https://example.com/image${index + 1}.jpg`}
                                            prefix={<LinkOutlined style={{ color: '#bbb' }} />} style={{ flex: 1 }} />
                                        {link.trim() && (
                                            <Image src={link} width={40} height={40}
                                                style={{ objectFit: 'cover', borderRadius: 4, border: '1px solid #eee', flexShrink: 0 }}
                                                fallback="https://via.placeholder.com/40?text=Lỗi" preview={false} />
                                        )}
                                        <CloseCircleOutlined onClick={() => removeLink(index)}
                                            style={{ color: '#ff4d4f', fontSize: 18, cursor: 'pointer', flexShrink: 0 }} />
                                    </div>
                                ))}
                                {imageLinks.length < 5 && (
                                    <Button type="dashed" onClick={addLinkField} icon={<PlusOutlined />} block style={{ marginTop: 4 }}>Thêm ảnh</Button>
                                )}
                            </div>
                        )}

                        {imageMode === 'upload' && (
                            <div>
                                <Upload listType="picture-card" fileList={uploadedImages} onChange={handleUploadChange}
                                    onPreview={handlePreview} beforeUpload={() => false} accept="image/*" multiple>
                                    {uploadedImages.length < 5 && (
                                        <div><PlusOutlined /><div style={{ marginTop: 8, fontSize: 12 }}>Chọn ảnh</div></div>
                                    )}
                                </Upload>
                                <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>💡 Hỗ trợ JPG, PNG, WEBP. Kéo thả hoặc click để chọn.</div>
                            </div>
                        )}
                    </Form.Item>

                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
                        <Button onClick={() => { setIsModalVisible(false); resetImageStates(); }}>Hủy</Button>
                        <Button type="primary" htmlType="submit" style={{ background: '#c8232c', borderColor: '#c8232c', minWidth: 120 }}>
                            {editingProduct ? 'Cập nhật' : 'Thêm mới'}
                        </Button>
                    </div>
                </Form>
            </Modal>

            <Image style={{ display: 'none' }} preview={{ visible: previewVisible, src: previewImage, onVisibleChange: (vis) => setPreviewVisible(vis) }} />
        </div>
    );
};

export default ProductManagement;