import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, message, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import axios from 'axios';

const CategoryManagement = () => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [form] = Form.useForm();

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        setLoading(true);
        try {
            const res = await axios.get('http://localhost:5000/api/categories');
            setCategories(res.data);
        } catch (error) {
            message.error('Lỗi tải danh mục!');
        }
        setLoading(false);
    };

    const handleSubmit = async (values) => {
        try {
            if (editingCategory) {
                await axios.put(`http://localhost:5000/api/categories/${editingCategory._id}`, values);
                message.success('Đã cập nhật danh mục!');
            } else {
                await axios.post('http://localhost:5000/api/categories', values);
                message.success('Thêm danh mục thành công!');
            }
            setIsModalVisible(false);
            fetchCategories();
        } catch (error) {
            message.error('Lỗi: Có thể tên danh mục đã tồn tại!');
        }
    };

    const handleDelete = async (id) => {
        try {
            await axios.delete(`http://localhost:5000/api/categories/${id}`);
            message.success('Đã xóa danh mục!');
            fetchCategories();
        } catch (error) {
            message.error('Không thể xóa danh mục!');
        }
    };

    const openModal = (record = null) => {
        setEditingCategory(record);
        if (record) form.setFieldsValue(record);
        else form.resetFields();
        setIsModalVisible(true);
    };

    const columns = [
        { title: 'Tên danh mục', dataIndex: 'name', key: 'name' },
        { title: 'Mô tả', dataIndex: 'description', key: 'description' },
        {
            title: 'Thao tác',
            key: 'action',
            render: (_, record) => (
                <>
                    <Button icon={<EditOutlined />} onClick={() => openModal(record)} style={{ marginRight: 8 }}>Sửa</Button>
                    <Popconfirm title="Xóa danh mục này?" onConfirm={() => handleDelete(record._id)}>
                        <Button danger icon={<DeleteOutlined />}>Xóa</Button>
                    </Popconfirm>
                </>
            )
        }
    ];

    return (
        <div>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal()} style={{ marginBottom: 16 }}>
                Thêm danh mục
            </Button>
            <Table dataSource={categories} columns={columns} rowKey="_id" loading={loading} />
            
            <Modal
                title={editingCategory ? "Sửa danh mục" : "Thêm danh mục"}
                open={isModalVisible}
                onCancel={() => setIsModalVisible(false)}
                footer={null}
            >
                <Form form={form} onFinish={handleSubmit} layout="vertical">
                    <Form.Item name="name" label="Tên danh mục" rules={[{ required: true }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="description" label="Mô tả">
                        <Input.TextArea />
                    </Form.Item>
                    <Button type="primary" htmlType="submit" block>Lưu</Button>
                </Form>
            </Modal>
        </div>
    );
};

export default CategoryManagement;