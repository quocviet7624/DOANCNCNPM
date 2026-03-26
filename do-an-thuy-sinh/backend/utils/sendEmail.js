const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendOTPEmail = async (toEmail, otp) => {
  await transporter.sendMail({
    from: `"FC Junior" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: "Mã OTP khôi phục mật khẩu",
    html: `
      <div style="font-family:Arial;max-width:480px;margin:auto;padding:24px;border:1px solid #eee;border-radius:8px;">
        <h2 style="color:#1a5c38;">🔑 Khôi phục mật khẩu - FC Junior</h2>
        <p>Mã OTP của bạn là:</p>
        <div style="font-size:36px;font-weight:bold;letter-spacing:10px;color:#1a5c38;
                    padding:16px;background:#f0f9f4;border-radius:6px;text-align:center;">
          ${otp}
        </div>
        <p style="color:#888;font-size:13px;margin-top:16px;">
          Mã có hiệu lực trong <strong>10 phút</strong>. Không chia sẻ mã này cho ai.
        </p>
      </div>
    `,
  });
};

module.exports = { sendOTPEmail };