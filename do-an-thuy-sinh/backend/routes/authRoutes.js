const router = require('express').Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'fc-junior-aquarium-super-secret-key-2024';

// ── Helper: xác thực token & kiểm tra quyền admin ──
const verifyAdmin = (req) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) throw { status: 401, message: 'Chưa đăng nhập!' };
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== 'admin') throw { status: 403, message: 'Không có quyền truy cập!' };
    return decoded;
};

// Helper: admin HOẶC staff đều vào được (dùng cho các route không phải quản lý user)
const verifyAdminOrStaff = (req) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) throw { status: 401, message: 'Chưa đăng nhập!' };
    const decoded = jwt.verify(token, JWT_SECRET);
    if (!['admin', 'staff'].includes(decoded.role)) throw { status: 403, message: 'Không có quyền truy cập!' };
    return decoded;
};

const verifyToken = (req) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) throw { status: 401, message: 'Chưa đăng nhập!' };
    return jwt.verify(token, JWT_SECRET);
};

const handleErr = (res, err) => {
    if (err.status) return res.status(err.status).json({ message: err.message });
    console.error(err);
    res.status(500).json({ message: 'Lỗi server', error: err.message });
};


// POST - Đăng ký
router.post('/register', async (req, res) => {
    try {
        const { username, password, email, role, fullName, phone } = req.body;

        const existingUser = await User.findOne({ username });
        if (existingUser) return res.status(400).json({ message: 'Tên đăng nhập đã tồn tại!' });

        if (email) {
            const existingEmail = await User.findOne({ email });
            if (existingEmail) return res.status(400).json({ message: 'Email đã được sử dụng!' });
        }

        const newUser = new User({
            username,
            password,
            email:    email    || '',
            role:     role     || 'customer',
            fullName: fullName || '',
            phone:    phone    || '',
        });

        await newUser.save();
        console.log('✅ Đăng ký thành công:', username);

        res.status(201).json({
            message: 'Đăng ký thành công!',
            user: { id: newUser._id, username: newUser.username, role: newUser.role, fullName: newUser.fullName },
        });
    } catch (err) { handleErr(res, err); }
});

// POST - Đăng nhập
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        const user = await User.findOne({ username });
        if (!user) return res.status(401).json({ message: 'Tên đăng nhập hoặc mật khẩu không đúng!' });
        if (!user.isActive) return res.status(403).json({ message: 'Tài khoản đã bị khóa!' });

        const isMatch = await user.comparePassword(password);
        if (!isMatch) return res.status(401).json({ message: 'Tên đăng nhập hoặc mật khẩu không đúng!' });

        const token = jwt.sign(
            { id: user._id, username: user.username, role: user.role },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        console.log('✅ Đăng nhập thành công:', username, '| Role:', user.role);

        res.json({
            message: 'Đăng nhập thành công!',
            token,
            user: {
                id: user._id, username: user.username,
                email: user.email, fullName: user.fullName,
                phone: user.phone, role: user.role,
            },
        });
    } catch (err) { handleErr(res, err); }
});

// GET - Thông tin user hiện tại
router.get('/me', async (req, res) => {
    try {
        const decoded = verifyToken(req);
        const user = await User.findById(decoded.id).select('-password');
        if (!user) return res.status(404).json({ message: 'Không tìm thấy user!' });
        res.json({ user });
    } catch (err) { handleErr(res, err); }
});

// PUT - Cập nhật profile
router.put('/profile', async (req, res) => {
    try {
        const decoded = verifyToken(req);
        const { fullName, email, phone, address } = req.body;

        const updatedUser = await User.findByIdAndUpdate(
            decoded.id,
            { fullName, email, phone, address },
            { new: true }
        ).select('-password');

        console.log('✅ Cập nhật profile:', decoded.username);
        res.json({ message: 'Cập nhật thông tin thành công!', user: updatedUser });
    } catch (err) { handleErr(res, err); }
});

// PUT - Đổi mật khẩu
router.put('/change-password', async (req, res) => {
    try {
        const decoded = verifyToken(req);
        const { oldPassword, newPassword } = req.body;

        const user = await User.findById(decoded.id);
        const isMatch = await user.comparePassword(oldPassword);
        if (!isMatch) return res.status(400).json({ message: 'Mật khẩu cũ không đúng!' });

        user.password = newPassword;
        await user.save();

        console.log('✅ Đổi mật khẩu:', decoded.username);
        res.json({ message: 'Đổi mật khẩu thành công!' });
    } catch (err) { handleErr(res, err); }
});



// GET - Danh sách tất cả users (chỉ admin)
router.get('/users', async (req, res) => {
    try {
        verifyAdmin(req);  // staff không vào được
        const users = await User.find().select('-password').sort({ createdAt: -1 });
        res.json(users);
    } catch (err) { handleErr(res, err); }
});

// PUT - Khóa / mở khóa tài khoản
router.put('/users/:id/toggle-status', async (req, res) => {
    try {
        verifyAdmin(req);

        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'Không tìm thấy user!' });

        user.isActive = !user.isActive;
        await user.save();

        console.log('✅ Toggle status:', user.username, '| Active:', user.isActive);
        res.json({ message: 'Cập nhật trạng thái thành công!', user: { id: user._id, username: user.username, isActive: user.isActive } });
    } catch (err) { handleErr(res, err); }
});

// PUT - Đổi vai trò (customer / staff / admin)
router.put('/users/:id/change-role', async (req, res) => {
    try {
        const decoded = verifyAdmin(req);
        const { role } = req.body;

        const VALID_ROLES = ['customer', 'staff', 'admin'];
        if (!VALID_ROLES.includes(role)) {
            return res.status(400).json({ message: `Vai trò không hợp lệ! Phải là: ${VALID_ROLES.join(', ')}` });
        }

        // Không cho tự đổi role của chính mình
        if (decoded.id === req.params.id) {
            return res.status(403).json({ message: 'Không thể đổi vai trò của chính mình!' });
        }

        const updated = await User.findByIdAndUpdate(
            req.params.id,
            { role },
            { new: true }
        ).select('-password');

        if (!updated) return res.status(404).json({ message: 'Không tìm thấy user!' });

        console.log('✅ Đổi role:', updated.username, '→', role);
        res.json({ message: `Đã đổi vai trò thành ${role}!`, user: updated });
    } catch (err) { handleErr(res, err); }
});

// DELETE - Xóa user
router.delete('/users/:id', async (req, res) => {
    try {
        const decoded = verifyAdmin(req);

        // Không cho tự xóa chính mình
        if (decoded.id === req.params.id) {
            return res.status(403).json({ message: 'Không thể xóa tài khoản của chính mình!' });
        }

        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) return res.status(404).json({ message: 'Không tìm thấy user!' });

        console.log('✅ Đã xóa user:', user.username);
        res.json({ message: 'Đã xóa user thành công!' });
    } catch (err) { handleErr(res, err); }
});

module.exports = router;