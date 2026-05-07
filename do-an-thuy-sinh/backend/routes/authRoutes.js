const router = require('express').Router();
const User   = require('../models/User');
const jwt    = require('jsonwebtoken');
const mongoose = require('mongoose');
const { forgotPassword, verifyOTP, resetPassword } = require('../controllers/authController');

const JWT_SECRET = process.env.JWT_SECRET || 'fc-junior-aquarium-super-secret-key-2024';

// ── Helpers ───────────────────────────────────────────────────────────────────
const verifyAdmin = (req) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) throw { status: 401, message: 'Chưa đăng nhập!' };
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== 'admin') throw { status: 403, message: 'Không có quyền truy cập!' };
    return decoded;
};

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

// ── Auth ──────────────────────────────────────────────────────────────────────

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

// ── Quên mật khẩu ────────────────────────────────────────────────────────────
router.post('/forgot-password', forgotPassword);
router.post('/verify-otp',      verifyOTP);
router.post('/reset-password',  resetPassword);

// ── Địa chỉ giao hàng (lưu vào MongoDB) ──────────────────────────────────────

// GET /auth/addresses — Lấy danh sách địa chỉ
router.get('/addresses', async (req, res) => {
    try {
        const decoded = verifyToken(req);
        const user = await User.findById(decoded.id).select('addresses defaultAddressId').lean();
        if (!user) return res.status(404).json({ message: 'Không tìm thấy user!' });

        res.json({
            addresses: user.addresses || [],
            defaultAddressId: user.defaultAddressId || null,
        });
    } catch (err) { handleErr(res, err); }
});

// POST /auth/addresses — Thêm địa chỉ mới
router.post('/addresses', async (req, res) => {
    try {
        const decoded = verifyToken(req);
        const { name, phone, city, detail } = req.body;

        if (!name || !phone || !city || !detail) {
            return res.status(400).json({ message: 'Vui lòng điền đầy đủ thông tin địa chỉ!' });
        }

        // Kiểm tra số lượng trước
        const user = await User.findById(decoded.id).select('addresses defaultAddressId').lean();
        if (!user) return res.status(404).json({ message: 'Không tìm thấy user!' });

        const currentLen = (user.addresses || []).length;
        if (currentLen >= 5) {
            return res.status(400).json({ message: 'Tối đa 5 địa chỉ. Xóa bớt để thêm mới!' });
        }

        const newAddr = { _id: new mongoose.Types.ObjectId(), name, phone, city, detail };

        // Dùng $push để ghi thẳng vào DB
        const update = { $push: { addresses: newAddr } };

        // Nếu là địa chỉ đầu tiên → set default luôn
        if (currentLen === 0) {
            update.$set = { defaultAddressId: newAddr._id.toString() };
        }

        await User.findByIdAndUpdate(decoded.id, update, { new: true });

        // Lấy defaultAddressId sau update
        const defaultAddressId = currentLen === 0
            ? newAddr._id.toString()
            : (user.defaultAddressId || null);

        console.log('✅ Thêm địa chỉ:', decoded.username, '|', name);
        res.status(201).json({
            message: 'Đã thêm địa chỉ mới!',
            address: newAddr,
            defaultAddressId,
        });
    } catch (err) { handleErr(res, err); }
});

// PUT /auth/addresses/:addrId — Sửa địa chỉ
router.put('/addresses/:addrId', async (req, res) => {
    try {
        const decoded = verifyToken(req);
        const { name, phone, city, detail } = req.body;
        const addrId = req.params.addrId;

        // Dùng positional operator $ để update đúng subdocument
        const result = await User.findOneAndUpdate(
            { _id: decoded.id, 'addresses._id': new mongoose.Types.ObjectId(addrId) },
            {
                $set: {
                    'addresses.$.name':   name,
                    'addresses.$.phone':  phone,
                    'addresses.$.city':   city,
                    'addresses.$.detail': detail,
                }
            },
            { new: true }
        ).select('addresses').lean();

        if (!result) return res.status(404).json({ message: 'Không tìm thấy địa chỉ!' });

        const updated = result.addresses.find(a => a._id.toString() === addrId);
        console.log('✅ Sửa địa chỉ:', decoded.username, '|', addrId);
        res.json({ message: 'Đã cập nhật địa chỉ!', address: updated });
    } catch (err) { handleErr(res, err); }
});

// DELETE /auth/addresses/:addrId — Xóa địa chỉ
router.delete('/addresses/:addrId', async (req, res) => {
    try {
        const decoded = verifyToken(req);
        const addrId  = req.params.addrId;

        const user = await User.findById(decoded.id).select('addresses defaultAddressId').lean();
        if (!user) return res.status(404).json({ message: 'Không tìm thấy user!' });

        if ((user.defaultAddressId || '') === addrId) {
            return res.status(400).json({ message: 'Không thể xóa địa chỉ mặc định!' });
        }

        const exists = (user.addresses || []).some(a => a._id.toString() === addrId);
        if (!exists) return res.status(404).json({ message: 'Không tìm thấy địa chỉ!' });

        await User.findByIdAndUpdate(decoded.id, {
            $pull: { addresses: { _id: new mongoose.Types.ObjectId(addrId) } }
        });

        console.log('✅ Xóa địa chỉ:', decoded.username, '|', addrId);
        res.json({ message: 'Đã xóa địa chỉ!' });
    } catch (err) { handleErr(res, err); }
});

// PUT /auth/addresses/:addrId/set-default — Đặt địa chỉ mặc định
router.put('/addresses/:addrId/set-default', async (req, res) => {
    try {
        const decoded = verifyToken(req);
        const addrId  = req.params.addrId;

        const user = await User.findById(decoded.id).select('addresses').lean();
        if (!user) return res.status(404).json({ message: 'Không tìm thấy user!' });

        const exists = (user.addresses || []).some(a => a._id.toString() === addrId);
        if (!exists) return res.status(404).json({ message: 'Không tìm thấy địa chỉ!' });

        await User.findByIdAndUpdate(decoded.id, { $set: { defaultAddressId: addrId } });

        console.log('✅ Đặt mặc định:', decoded.username, '|', addrId);
        res.json({ message: 'Đã đặt địa chỉ mặc định!', defaultAddressId: addrId });
    } catch (err) { handleErr(res, err); }
});

// ── Quản lý users (admin) ─────────────────────────────────────────────────────

// GET - Danh sách tất cả users
router.get('/users', async (req, res) => {
    try {
        verifyAdmin(req);
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

// PUT - Đổi vai trò
router.put('/users/:id/change-role', async (req, res) => {
    try {
        const decoded = verifyAdmin(req);
        const { role } = req.body;

        const VALID_ROLES = ['customer', 'staff', 'admin'];
        if (!VALID_ROLES.includes(role)) {
            return res.status(400).json({ message: `Vai trò không hợp lệ! Phải là: ${VALID_ROLES.join(', ')}` });
        }

        if (decoded.id === req.params.id) {
            return res.status(403).json({ message: 'Không thể đổi vai trò của chính mình!' });
        }

        const updated = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select('-password');
        if (!updated) return res.status(404).json({ message: 'Không tìm thấy user!' });

        console.log('✅ Đổi role:', updated.username, '→', role);
        res.json({ message: `Đã đổi vai trò thành ${role}!`, user: updated });
    } catch (err) { handleErr(res, err); }
});

// DELETE - Xóa user
router.delete('/users/:id', async (req, res) => {
    try {
        const decoded = verifyAdmin(req);

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