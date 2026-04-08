const bcrypt           = require("bcryptjs");
const crypto           = require("crypto");
const User             = require("../models/User");
const { sendOTPEmail } = require("../utils/sendEmail");

// ── BƯỚC 1: Nhận email → gửi OTP ──────────────────────────────────
const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: "Vui lòng nhập email." });
        }

        const user = await User.findOne({ email });
        if (!user) {
            // Trả 200 để không lộ email có tồn tại không
            return res.status(200).json({ message: "Nếu email tồn tại, mã OTP đã được gửi." });
        }

        // Tạo OTP 6 số
        const otp       = Math.floor(100000 + Math.random() * 900000).toString();
        const hashedOTP = await bcrypt.hash(otp, 10);

        user.resetOTP        = hashedOTP;
        user.resetOTPExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 phút
        await user.save();

        await sendOTPEmail(email, otp);

        res.status(200).json({ message: "Mã OTP đã được gửi đến email của bạn." });

    } catch (err) {
        console.error("forgotPassword error:", err);
        res.status(500).json({ message: "Lỗi server, vui lòng thử lại." });
    }
};

// ── BƯỚC 2: Nhận OTP → xác minh ───────────────────────────────────
const verifyOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({ message: "Thiếu email hoặc mã OTP." });
        }

        const user = await User.findOne({ email });
        if (!user || !user.resetOTP || !user.resetOTPExpires) {
            return res.status(400).json({ message: "OTP không hợp lệ." });
        }

        // Kiểm tra hết hạn
        if (user.resetOTPExpires < new Date()) {
            user.resetOTP        = null;
            user.resetOTPExpires = null;
            await user.save();
            return res.status(400).json({ message: "Mã OTP đã hết hạn. Vui lòng yêu cầu mã mới." });
        }

        // So sánh OTP
        const isMatch = await bcrypt.compare(otp, user.resetOTP);
        if (!isMatch) {
            return res.status(400).json({ message: "Mã OTP không đúng." });
        }

        // Tạo resetToken → lưu lại để dùng bước 3
        const resetToken     = crypto.randomBytes(32).toString("hex");
        user.resetOTP        = resetToken;
        user.resetOTPExpires = new Date(Date.now() + 10 * 60 * 1000); // thêm 10 phút để đặt lại mật khẩu
        await user.save();

        res.status(200).json({
            message: "Xác minh OTP thành công.",
            resetToken,
        });

    } catch (err) {
        console.error("verifyOTP error:", err);
        res.status(500).json({ message: "Lỗi server, vui lòng thử lại." });
    }
};

// ── BƯỚC 3: Đặt lại mật khẩu mới ─────────────────────────────────
const resetPassword = async (req, res) => {
    try {
        const { email, resetToken, newPassword } = req.body;

        if (!email || !resetToken || !newPassword) {
            return res.status(400).json({ message: "Thiếu thông tin cần thiết." });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ message: "Mật khẩu phải có ít nhất 6 ký tự." });
        }

        const user = await User.findOne({ email });
        if (!user || user.resetOTP !== resetToken) {
            return res.status(400).json({ message: "Token không hợp lệ." });
        }

        if (user.resetOTPExpires < new Date()) {
            return res.status(400).json({ message: "Phiên đặt lại mật khẩu đã hết hạn." });
        }

        // Lưu password mới — pre('save') trong User.js sẽ tự hash
        user.password        = newPassword;
        user.resetOTP        = null;
        user.resetOTPExpires = null;
        await user.save();

        res.status(200).json({ message: "Đặt lại mật khẩu thành công!" });

    } catch (err) {
        console.error("resetPassword error:", err);
        res.status(500).json({ message: "Lỗi server, vui lòng thử lại." });
    }
};

module.exports = { forgotPassword, verifyOTP, resetPassword };