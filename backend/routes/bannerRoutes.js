const router = require('express').Router();
const Banner = require('../models/Banner');
const { v2: cloudinary } = require('cloudinary');
const multer = require('multer');
const streamifier = require('streamifier');

// Cấu hình Cloudinary từ .env
cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dyb740ren',
    api_key: process.env.CLOUDINARY_API_KEY || '734489813151711',
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Cấu hình Multer để xử lý file upload (memory storage)
const storage = multer.memoryStorage();
const upload = multer({ 
    storage: storage,
    limits: { fileSize: 50 * 1024 * 1024 }, // Giới hạn 50MB
    fileFilter: (req, file, cb) => {
        // Chỉ chấp nhận ảnh và video
        if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
            cb(null, true);
        } else {
            cb(new Error('Chỉ chấp nhận file ảnh hoặc video!'), false);
        }
    }
});

// Hàm upload lên Cloudinary
const uploadToCloudinary = (fileBuffer, resourceType) => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                resource_type: resourceType, // 'image' hoặc 'video'
                folder: 'fc-junior-banners', // Thư mục trên Cloudinary
                transformation: resourceType === 'video' 
                    ? [
                        { quality: 'auto:good' },
                        { fetch_format: 'auto' }
                    ]
                    : [
                        { quality: 'auto:good' },
                        { fetch_format: 'auto' },
                        { width: 1920, crop: 'limit' } // Giới hạn width tối đa
                    ]
            },
            (error, result) => {
                if (error) {
                    console.error('❌ Lỗi upload Cloudinary:', error);
                    reject(error);
                } else {
                    console.log('✅ Upload thành công:', result.secure_url);
                    resolve(result);
                }
            }
        );

        streamifier.createReadStream(fileBuffer).pipe(uploadStream);
    });
};

// GET - Lấy tất cả banner
router.get('/', async (req, res) => {
    try {
        const banners = await Banner.find().sort({ order: 1 });
        res.json(banners);
    } catch (err) {
        res.status(500).json({ message: 'Lỗi server', error: err.message });
    }
});

// GET - Lấy banner đang active
router.get('/active', async (req, res) => {
    try {
        const banners = await Banner.find({ isActive: true }).sort({ order: 1 });
        res.json(banners);
    } catch (err) {
        res.status(500).json({ message: 'Lỗi server', error: err.message });
    }
});

// POST - Thêm banner mới (có upload file)
router.post('/', upload.single('media'), async (req, res) => {
    try {
        console.log('📥 Dữ liệu nhận được:', req.body);
        
        let mediaUrl = '';
        let mediaType = 'image';
        let cloudinaryPublicId = '';

        // Kiểm tra xem có file được upload không
        if (!req.file) {
            return res.status(400).json({ message: 'Vui lòng chọn file ảnh hoặc video!' });
        }

        console.log('📤 Đang upload file lên Cloudinary...');
        console.log('📁 Loại file:', req.file.mimetype);
        console.log('📏 Kích thước:', (req.file.size / 1024 / 1024).toFixed(2), 'MB');

        // Xác định resource type
        mediaType = req.file.mimetype.startsWith('video/') ? 'video' : 'image';

        // Upload lên Cloudinary
        const uploadResult = await uploadToCloudinary(req.file.buffer, mediaType);
        
        mediaUrl = uploadResult.secure_url;
        cloudinaryPublicId = uploadResult.public_id;

        console.log('✅ Upload thành công!');
        console.log('🔗 URL:', mediaUrl);

        const bannerData = {
            title: req.body.title,
            description: req.body.description || '',
            link: req.body.link || '#',
            order: parseInt(req.body.order) || 0,
            isActive: req.body.isActive === 'true',
            mediaUrl,
            mediaType,
            cloudinaryPublicId
        };

        const newBanner = new Banner(bannerData);
        const saved = await newBanner.save();
        
        console.log('✅ Lưu banner thành công!');
        res.status(201).json(saved);
    } catch (err) {
        console.error('❌ LỖI:', err);
        res.status(500).json({ message: 'Lỗi thêm banner', error: err.message });
    }
});

// PUT - Cập nhật banner
router.put('/:id', upload.single('media'), async (req, res) => {
    try {
        const banner = await Banner.findById(req.params.id);
        if (!banner) {
            return res.status(404).json({ message: 'Không tìm thấy banner' });
        }

        let updateData = {
            title: req.body.title,
            description: req.body.description || '',
            link: req.body.link || '#',
            order: parseInt(req.body.order) || 0,
            isActive: req.body.isActive === 'true'
        };

        // Nếu có file mới được upload
        if (req.file) {
            console.log('📤 Đang upload file mới lên Cloudinary...');

            // Xóa file cũ trên Cloudinary (nếu có)
            if (banner.cloudinaryPublicId) {
                try {
                    await cloudinary.uploader.destroy(banner.cloudinaryPublicId, {
                        resource_type: banner.mediaType
                    });
                    console.log('🗑️ Đã xóa file cũ:', banner.cloudinaryPublicId);
                } catch (deleteErr) {
                    console.warn('⚠️ Không thể xóa file cũ:', deleteErr.message);
                }
            }

            // Upload file mới
            const mediaType = req.file.mimetype.startsWith('video/') ? 'video' : 'image';
            const uploadResult = await uploadToCloudinary(req.file.buffer, mediaType);

            updateData.mediaUrl = uploadResult.secure_url;
            updateData.mediaType = mediaType;
            updateData.cloudinaryPublicId = uploadResult.public_id;

            console.log('✅ Upload file mới thành công!');
        }

        const updated = await Banner.findByIdAndUpdate(
            req.params.id,
            { $set: updateData },
            { new: true }
        );

        res.json(updated);
    } catch (err) {
        console.error('❌ LỖI:', err);
        res.status(500).json({ message: 'Lỗi cập nhật', error: err.message });
    }
});

// DELETE - Xóa banner
router.delete('/:id', async (req, res) => {
    try {
        const banner = await Banner.findById(req.params.id);
        if (!banner) {
            return res.status(404).json({ message: 'Không tìm thấy banner' });
        }

        // Xóa file trên Cloudinary
        if (banner.cloudinaryPublicId) {
            try {
                await cloudinary.uploader.destroy(banner.cloudinaryPublicId, {
                    resource_type: banner.mediaType
                });
                console.log('🗑️ Đã xóa file trên Cloudinary:', banner.cloudinaryPublicId);
            } catch (deleteErr) {
                console.warn('⚠️ Không thể xóa file trên Cloudinary:', deleteErr.message);
            }
        }

        await Banner.findByIdAndDelete(req.params.id);
        res.json({ message: 'Đã xóa banner thành công' });
    } catch (err) {
        console.error('❌ LỖI:', err);
        res.status(500).json({ message: 'Lỗi xóa banner', error: err.message });
    }
});

module.exports = router;