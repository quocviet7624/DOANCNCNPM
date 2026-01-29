const router = require('express').Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Secret key cho JWT
const JWT_SECRET = process.env.JWT_SECRET || 'fc-junior-aquarium-super-secret-key-2024';

// POST - Đăng ký tài khoản
router.post('/register', async (req, res) => {
    try {
        const { username, password, email, role, fullName, phone } = req.body;

        console.log('📥 Nhận request đăng ký:', { username, email, role });

        // Kiểm tra username đã tồn tại chưa
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            console.log('⚠️ Username đã tồn tại:', username);
            return res.status(400).json({ 
                message: 'Tên đăng nhập đã tồn tại!' 
            });
        }

        // Kiểm tra email nếu có
        if (email) {
            const existingEmail = await User.findOne({ email });
            if (existingEmail) {
                console.log('⚠️ Email đã tồn tại:', email);
                return res.status(400).json({ 
                    message: 'Email đã được sử dụng!' 
                });
            }
        }

        // Tạo user mới
        const newUser = new User({
            username,
            password,
            email: email || '',
            role: role || 'customer', // Mặc định là customer
            fullName: fullName || '',
            phone: phone || ''
        });

        await newUser.save();

        console.log('✅ Đăng ký thành công:', username);

        res.status(201).json({ 
            message: 'Đăng ký thành công!',
            user: {
                id: newUser._id,
                username: newUser.username,
                role: newUser.role,
                fullName: newUser.fullName
            }
        });
    } catch (err) {
        console.error('❌ Lỗi đăng ký:', err);
        res.status(500).json({ 
            message: 'Lỗi server khi đăng ký',
            error: err.message 
        });
    }
});

// POST - Đăng nhập
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        console.log('📥 Nhận request đăng nhập:', username);

        // Tìm user
        const user = await User.findOne({ username });
        if (!user) {
            console.log('⚠️ Không tìm thấy user:', username);
            return res.status(401).json({ 
                message: 'Tên đăng nhập hoặc mật khẩu không đúng!' 
            });
        }

        // Kiểm tra tài khoản có bị khóa không
        if (!user.isActive) {
            console.log('⚠️ Tài khoản bị khóa:', username);
            return res.status(403).json({ 
                message: 'Tài khoản đã bị khóa!' 
            });
        }

        // So sánh password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            console.log('⚠️ Mật khẩu không đúng:', username);
            return res.status(401).json({ 
                message: 'Tên đăng nhập hoặc mật khẩu không đúng!' 
            });
        }

        // Tạo JWT token
        const token = jwt.sign(
            { 
                id: user._id, 
                username: user.username,
                role: user.role 
            },
            JWT_SECRET,
            { expiresIn: '7d' } // Token hết hạn sau 7 ngày
        );

        console.log('✅ Đăng nhập thành công:', username, '| Role:', user.role);

        res.json({
            message: 'Đăng nhập thành công!',
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                fullName: user.fullName,
                phone: user.phone,
                role: user.role
            }
        });
    } catch (err) {
        console.error('❌ Lỗi đăng nhập:', err);
        res.status(500).json({ 
            message: 'Lỗi server khi đăng nhập',
            error: err.message 
        });
    }
});

// GET - Lấy thông tin user hiện tại (cần token)
router.get('/me', async (req, res) => {
    try {
        // Lấy token từ header
        const token = req.headers.authorization?.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({ message: 'Chưa đăng nhập!' });
        }

        // Verify token
        const decoded = jwt.verify(token, JWT_SECRET);
        
        // Lấy thông tin user
        const user = await User.findById(decoded.id).select('-password');
        
        if (!user) {
            return res.status(404).json({ message: 'Không tìm thấy user!' });
        }

        res.json({ user });
    } catch (err) {
        console.error('❌ Lỗi xác thực:', err);
        res.status(401).json({ 
            message: 'Token không hợp lệ!',
            error: err.message 
        });
    }
});

// PUT - Cập nhật thông tin user
router.put('/profile', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({ message: 'Chưa đăng nhập!' });
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        
        const { fullName, email, phone, address } = req.body;
        
        const updatedUser = await User.findByIdAndUpdate(
            decoded.id,
            { 
                fullName, 
                email, 
                phone, 
                address 
            },
            { new: true }
        ).select('-password');

        console.log('✅ Cập nhật profile thành công:', decoded.username);

        res.json({ 
            message: 'Cập nhật thông tin thành công!',
            user: updatedUser 
        });
    } catch (err) {
        console.error('❌ Lỗi cập nhật:', err);
        res.status(500).json({ 
            message: 'Lỗi server',
            error: err.message 
        });
    }
});

// PUT - Đổi mật khẩu
router.put('/change-password', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({ message: 'Chưa đăng nhập!' });
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        const { oldPassword, newPassword } = req.body;

        const user = await User.findById(decoded.id);
        
        // Kiểm tra mật khẩu cũ
        const isMatch = await user.comparePassword(oldPassword);
        if (!isMatch) {
            return res.status(400).json({ message: 'Mật khẩu cũ không đúng!' });
        }

        // Cập nhật mật khẩu mới
        user.password = newPassword;
        await user.save();

        console.log('✅ Đổi mật khẩu thành công:', decoded.username);

        res.json({ message: 'Đổi mật khẩu thành công!' });
    } catch (err) {
        console.error('❌ Lỗi đổi mật khẩu:', err);
        res.status(500).json({ 
            message: 'Lỗi server',
            error: err.message 
        });
    }
});

// GET - Lấy danh sách tất cả users (chỉ admin)
router.get('/users', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({ message: 'Chưa đăng nhập!' });
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        
        // Kiểm tra quyền admin
        if (decoded.role !== 'admin') {
            return res.status(403).json({ message: 'Không có quyền truy cập!' });
        }

        const users = await User.find().select('-password').sort({ createdAt: -1 });
        
        res.json(users);
    } catch (err) {
        console.error('❌ Lỗi lấy danh sách users:', err);
        res.status(500).json({ 
            message: 'Lỗi server',
            error: err.message 
        });
    }
});

// PUT - Cập nhật trạng thái user (admin)
router.put('/users/:id/toggle-status', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({ message: 'Chưa đăng nhập!' });
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        
        // Kiểm tra quyền admin
        if (decoded.role !== 'admin') {
            return res.status(403).json({ message: 'Không có quyền truy cập!' });
        }

        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'Không tìm thấy user!' });
        }

        user.isActive = !user.isActive;
        await user.save();

        console.log('✅ Cập nhật trạng thái user:', user.username, '| Active:', user.isActive);

        res.json({ 
            message: 'Cập nhật trạng thái thành công!',
            user: {
                id: user._id,
                username: user.username,
                isActive: user.isActive
            }
        });
    } catch (err) {
        console.error('❌ Lỗi cập nhật trạng thái:', err);
        res.status(500).json({ 
            message: 'Lỗi server',
            error: err.message 
        });
    }
});

// DELETE - Xóa user (admin)
router.delete('/users/:id', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({ message: 'Chưa đăng nhập!' });
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        
        // Kiểm tra quyền admin
        if (decoded.role !== 'admin') {
            return res.status(403).json({ message: 'Không có quyền truy cập!' });
        }

        const user = await User.findByIdAndDelete(req.params.id);
        
        if (!user) {
            return res.status(404).json({ message: 'Không tìm thấy user!' });
        }

        console.log('✅ Đã xóa user:', user.username);

        res.json({ message: 'Đã xóa user thành công!' });
    } catch (err) {
        console.error('❌ Lỗi xóa user:', err);
        res.status(500).json({ 
            message: 'Lỗi server',
            error: err.message 
        });
    }
});

module.exports = router;