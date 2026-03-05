import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Select, InputNumber, message, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import axios from 'axios';

const { Option } = Select;

const ProductManagement = () => {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]); // <--- 1. Thêm state lưu danh mục
    const [loading, setLoading] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [form] = Form.useForm();

    useEffect(() => {
        fetchProducts();
        fetchCategories(); // <--- 2. Gọi hàm lấy danh mục khi trang tải
    }, []);

    // Hàm lấy danh sách sản phẩm
    const fetchProducts = async () => {
        setLoading(true);
        try {
            const res = await axios.get('http://localhost:5000/api/products');
            setProducts(res.data);
        } catch (error) {
            message.error('Không thể tải sản phẩm!');
        }
        setLoading(false);
    };

    // Hàm lấy danh sách danh mục (MỚI)
    const fetchCategories = async () => {
        try {
            const res = await axios.get('http://localhost:5000/api/categories');
            setCategories(res.data);
        } catch (error) {
            console.error('Lỗi tải danh mục:', error);
            // Không cần hiện lỗi quá gắt, chỉ log ra console
        }
    };

    const handleAdd = () => {
        setEditingProduct(null);
        form.resetFields();
        setIsModalVisible(true);
    };

    const handleEdit = (record) => {
        setEditingProduct(record);
        form.setFieldsValue(record);
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

    const handleSubmit = async (values) => {
        try {
            if (editingProduct) {
                await axios.put(`http://localhost:5000/api/products/${editingProduct._id}`, values);
                message.success('Cập nhật sản phẩm thành công!');
            } else {
                await axios.post('http://localhost:5000/api/products', values);
                message.success('Thêm sản phẩm thành công!');
            }
            setIsModalVisible(false);
            fetchProducts();
        } catch (error) {
            message.error('Có lỗi xảy ra!');
        }
    };

    const columns = [
        {
            title: 'Hình ảnh',
            dataIndex: 'image',
            key: 'image',
            render: (image) => (
                <img 
                    src={image || 'https://via.placeholder.com/60'} 
                    alt="product"
                    style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: '4px' }}
                />
            )
        },
        {
            title: 'Tên sản phẩm',
            dataIndex: 'name',
            key: 'name',
        },
        {
            title: 'Danh mục',
            dataIndex: 'category',
            key: 'category',
        },
        {
            title: 'Giá',
            dataIndex: 'price',
            key: 'price',
            render: (price) => `${price.toLocaleString()} VNĐ`
        },
        {
            title: 'Mô tả',
            dataIndex: 'description',
            key: 'description',
            ellipsis: true,
        },
        {
            title: 'Thao tác',
            key: 'action',
            render: (_, record) => (
                <div>
                    <Button 
                        icon={<EditOutlined />} 
                        onClick={() => handleEdit(record)}
                        style={{ marginRight: 8 }}
                    >
                        Sửa
                    </Button>
                    <Popconfirm
                        title="Bạn có chắc muốn xóa?"
                        onConfirm={() => handleDelete(record._id)}
                        okText="Có"
                        cancelText="Không"
                    >
                        <Button danger icon={<DeleteOutlined />}>Xóa</Button>
                    </Popconfirm>
                </div>
            )
        }
    ];

    return (
        <div>
            <div style={{ marginBottom: 16 }}>
                <Button 
                    type="primary" 
                    icon={<PlusOutlined />}
                    onClick={handleAdd}
                    size="large"
                >
                    Thêm sản phẩm mới
                </Button>
            </div>

            <Table
                columns={columns}
                dataSource={products}
                rowKey="_id"
                loading={loading}
            />

            <Modal
                title={editingProduct ? 'Sửa sản phẩm' : 'Thêm sản phẩm mới'}
                open={isModalVisible}
                onCancel={() => setIsModalVisible(false)}
                footer={null}
            >
                <Form form={form} onFinish={handleSubmit} layout="vertical">
                    <Form.Item
                        label="Tên sản phẩm"
                        name="name"
                        rules={[{ required: true, message: 'Vui lòng nhập tên!' }]}
                    >
                        <Input />
                    </Form.Item>

                    {/* --- PHẦN ĐÃ SỬA: SELECT DYNAMIC --- */}
                    <Form.Item
                        label="Danh mục"
                        name="category"
                        rules={[{ required: true, message: 'Vui lòng chọn danh mục!' }]}
                    >
                        <Select placeholder="Chọn danh mục">
                            {categories.map((cat) => (
                                <Option key={cat._id} value={cat.name}>
                                    {cat.name}
                                </Option>
                            ))}
                        </Select>
                    </Form.Item>
                    {/* ----------------------------------- */}

                    <Form.Item
                        label="Giá (VNĐ)"
                        name="price"
                        rules={[{ required: true, message: 'Vui lòng nhập giá!' }]}
                    >
                        <InputNumber style={{ width: '100%' }} min={0} formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} parser={value => value.replace(/\$\s?|(,*)/g, '')} />
                    </Form.Item>

                    <Form.Item label="Mô tả" name="description">
                        <Input.TextArea rows={3} />
                    </Form.Item>

                    <Form.Item label="Link hình ảnh" name="image">
                        <Input placeholder="https://example.com/image.jpg" />
                    </Form.Item>

                    <Button type="primary" htmlType="submit" block>
                        {editingProduct ? 'Cập nhật' : 'Thêm mới'}
                    </Button>
                </Form>
            </Modal>
        </div>
    );
};

export default ProductManagement;