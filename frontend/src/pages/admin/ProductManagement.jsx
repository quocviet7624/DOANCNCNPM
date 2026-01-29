import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Select, InputNumber, message, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import axios from 'axios';

const { Option } = Select;

const ProductManagement = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [form] = Form.useForm();

    useEffect(() => {
        fetchProducts();
    }, []);

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

                    <Form.Item
                        label="Danh mục"
                        name="category"
                        rules={[{ required: true, message: 'Vui lòng chọn danh mục!' }]}
                    >
                        <Select>
                            <Option value="Cá">Cá</Option>
                            <Option value="Cây">Cây</Option>
                            <Option value="Phụ kiện">Phụ kiện</Option>
                            <Option value="Thuốc">Thuốc</Option>
                        </Select>
                    </Form.Item>

                    <Form.Item
                        label="Giá (VNĐ)"
                        name="price"
                        rules={[{ required: true, message: 'Vui lòng nhập giá!' }]}
                    >
                        <InputNumber style={{ width: '100%' }} min={0} />
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