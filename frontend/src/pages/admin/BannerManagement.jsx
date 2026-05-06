import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Upload, Switch, message, Popconfirm, Image, Progress } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, UploadOutlined, PlayCircleOutlined } from '@ant-design/icons';
import axios from 'axios';

const { TextArea } = Input;

const BannerManagement = () => {
    const [banners, setBanners] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingBanner, setEditingBanner] = useState(null);
    const [fileList, setFileList] = useState([]);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [submitting, setSubmitting] = useState(false); // Thêm state này
    const [form] = Form.useForm();

    useEffect(() => {
        fetchBanners();
    }, []);

    const fetchBanners = async () => {
        setLoading(true);
        try {
            const res = await axios.get('http://localhost:5000/api/banners');
            setBanners(res.data);
        } catch (error) {
            message.error('Không thể tải banner!');
        }
        setLoading(false);
    };

    const handleAdd = () => {
        setEditingBanner(null);
        form.resetFields();
        setFileList([]);
        setIsModalVisible(true);
    };

    const handleEdit = (record) => {
        setEditingBanner(record);
        form.setFieldsValue(record);
        
        if (record.mediaUrl) {
            setFileList([{
                uid: '-1',
                name: 'current-media',
                status: 'done',
                url: record.mediaUrl,
            }]);
        }
        setIsModalVisible(true);
    };

    const handleDelete = async (id) => {
        try {
            await axios.delete(`http://localhost:5000/api/banners/${id}`);
            message.success('Đã xóa banner!');
            fetchBanners();
        } catch (error) {
            message.error('Không thể xóa banner!');
        }
    };

    const handleFileChange = ({ fileList: newFileList }) => {
        setFileList(newFileList);
    };

    const handleSubmit = async (values) => {
        // Ngăn submit nhiều lần
        if (submitting) {
            console.log('⚠️ Đang xử lý, vui lòng chờ...');
            return;
        }

        // Kiểm tra file khi thêm mới
        if (!editingBanner && fileList.length === 0) {
            message.error('Vui lòng chọn file ảnh hoặc video!');
            return;
        }

        setSubmitting(true);
        setUploadProgress(0);

        try {
            const formData = new FormData();
            formData.append('title', values.title);
            formData.append('description', values.description || '');
            formData.append('link', values.link || '#');
            formData.append('order', values.order || 0);
            formData.append('isActive', values.isActive);

            // Nếu có file mới được chọn
            if (fileList.length > 0 && fileList[0].originFileObj) {
                formData.append('media', fileList[0].originFileObj);
                console.log('📤 Chuẩn bị upload file:', fileList[0].name);
            }

            const config = {
                headers: { 'Content-Type': 'multipart/form-data' },
                onUploadProgress: (progressEvent) => {
                    const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    setUploadProgress(percent);
                    console.log('📊 Upload progress:', percent + '%');
                }
            };

            let response;
            if (editingBanner) {
                response = await axios.put(
                    `http://localhost:5000/api/banners/${editingBanner._id}`, 
                    formData, 
                    config
                );
                message.success('Cập nhật banner thành công!');
            } else {
                response = await axios.post(
                    'http://localhost:5000/api/banners', 
                    formData, 
                    config
                );
                message.success('Thêm banner thành công!');
            }

            console.log('✅ Response:', response.data);
            
            setIsModalVisible(false);
            setFileList([]);
            setUploadProgress(0);
            form.resetFields();
            fetchBanners();
        } catch (error) {
            console.error('❌ Error:', error);
            const errorMsg = error.response?.data?.message || error.message || 'Có lỗi xảy ra';
            message.error(errorMsg);
            setUploadProgress(0);
        } finally {
            setSubmitting(false);
        }
    };

    const columns = [
        {
            title: 'Hình ảnh / Video',
            dataIndex: 'mediaUrl',
            key: 'mediaUrl',
            width: 220,
            render: (mediaUrl, record) => {
                if (record.mediaType === 'video') {
                    return (
                        <div style={{ position: 'relative', width: 200, height: 100 }}>
                            <video 
                                src={mediaUrl} 
                                style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '4px' }}
                            />
                            <PlayCircleOutlined 
                                style={{ 
                                    position: 'absolute', 
                                    top: '50%', 
                                    left: '50%', 
                                    transform: 'translate(-50%, -50%)',
                                    fontSize: '40px',
                                    color: 'white'
                                }} 
                            />
                        </div>
                    );
                }
                return (
                    <Image 
                        src={mediaUrl || 'https://via.placeholder.com/200x100'} 
                        alt="banner"
                        width={200}
                        height={100}
                        style={{ objectFit: 'cover', borderRadius: '4px' }}
                    />
                );
            }
        },
        {
            title: 'Tiêu đề',
            dataIndex: 'title',
            key: 'title',
        },
        {
            title: 'Mô tả',
            dataIndex: 'description',
            key: 'description',
            ellipsis: true,
        },
        {
            title: 'Loại',
            dataIndex: 'mediaType',
            key: 'mediaType',
            render: (type) => type === 'video' ? '🎥 Video' : '🖼️ Hình ảnh'
        },
        {
            title: 'Thứ tự',
            dataIndex: 'order',
            key: 'order',
        },
        {
            title: 'Trạng thái',
            dataIndex: 'isActive',
            key: 'isActive',
            render: (isActive) => (
                <span style={{ color: isActive ? 'green' : 'red', fontWeight: 'bold' }}>
                    {isActive ? '✓ Đang hiển thị' : '✗ Đã ẩn'}
                </span>
            )
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
                <h2 style={{ display: 'inline-block', marginRight: 20 }}>
                    🎬 Quản lý Banner Trang Chủ
                </h2>
                <Button 
                    type="primary" 
                    icon={<PlusOutlined />}
                    onClick={handleAdd}
                    size="large"
                >
                    Thêm banner mới
                </Button>
            </div>

            <Table
                columns={columns}
                dataSource={banners}
                rowKey="_id"
                loading={loading}
            />

            <Modal
                title={editingBanner ? '✏️ Sửa Banner' : '➕ Thêm Banner Mới'}
                open={isModalVisible}
                onCancel={() => {
                    if (!submitting) {
                        setIsModalVisible(false);
                        setFileList([]);
                        setUploadProgress(0);
                        form.resetFields();
                    }
                }}
                footer={null}
                width={600}
                maskClosable={!submitting}
                closable={!submitting}
            >
                <Form 
                    form={form} 
                    onFinish={handleSubmit} 
                    layout="vertical"
                >
                    <Form.Item
                        label="Tiêu đề Banner"
                        name="title"
                        rules={[{ required: true, message: 'Vui lòng nhập tiêu đề!' }]}
                    >
                        <Input placeholder="VD: FC JUNIOR AQUARIUM" disabled={submitting} />
                    </Form.Item>

                    <Form.Item label="Mô tả / Slogan" name="description">
                        <TextArea 
                            rows={2} 
                            placeholder="VD: Mang thiên nhiên xanh vào không gian sống của bạn"
                            disabled={submitting}
                        />
                    </Form.Item>

                    <Form.Item 
                        label="Upload Ảnh hoặc Video"
                        extra="Hỗ trợ: JPG, PNG, GIF, MP4, WebM (Max 50MB)"
                        required={!editingBanner}
                    >
                        <Upload
                            listType="picture-card"
                            fileList={fileList}
                            onChange={handleFileChange}
                            beforeUpload={() => false}
                            maxCount={1}
                            accept="image/*,video/*"
                            disabled={submitting}
                        >
                            {fileList.length === 0 && (
                                <div>
                                    <UploadOutlined />
                                    <div style={{ marginTop: 8 }}>Chọn file</div>
                                </div>
                            )}
                        </Upload>
                        
                        {uploadProgress > 0 && (
                            <Progress 
                                percent={uploadProgress} 
                                status={uploadProgress === 100 ? 'success' : 'active'} 
                            />
                        )}
                    </Form.Item>

                    <Form.Item label="Link đích (khi click banner)" name="link">
                        <Input placeholder="/products hoặc để trống" disabled={submitting} />
                    </Form.Item>

                    <Form.Item
                        label="Thứ tự hiển thị"
                        name="order"
                        initialValue={0}
                        extra="Số nhỏ hơn sẽ hiển thị trước"
                    >
                        <Input type="number" min={0} disabled={submitting} />
                    </Form.Item>

                    <Form.Item
                        label="Trạng thái"
                        name="isActive"
                        valuePropName="checked"
                        initialValue={true}
                    >
                        <Switch 
                            checkedChildren="✓ Hiển thị" 
                            unCheckedChildren="✗ Ẩn"
                            disabled={submitting}
                        />
                    </Form.Item>

                    <Button 
                        type="primary" 
                        htmlType="submit" 
                        block 
                        size="large"
                        style={{ marginTop: 20 }}
                        loading={submitting}
                        disabled={submitting}
                    >
                        {submitting 
                            ? 'Đang xử lý...' 
                            : (editingBanner ? 'Cập nhật Banner' : 'Thêm Banner')
                        }
                    </Button>
                </Form>
            </Modal>
        </div>
    );
};

export default BannerManagement;