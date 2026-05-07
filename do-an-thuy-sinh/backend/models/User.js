const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const AddressSchema = new mongoose.Schema({
    name:   { type: String, required: true },
    phone:  { type: String, required: true },
    city:   { type: String, required: true },
    detail: { type: String, required: true },
});
// Mongoose tự tạo _id cho mỗi subdocument

const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        minlength: 3
    },
    email: {
        type: String,
        trim: true,
        lowercase: true,
        default: ''
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    role: {
        type: String,
        enum: ['customer', 'staff', 'admin'],
        default: 'customer'
    },
    fullName: { type: String, default: '' },
    phone:    { type: String, default: '' },
    address:  { type: String, default: '' },   // địa chỉ text trên profile
    isActive: { type: Boolean, default: true },

    // ── Danh sách địa chỉ giao hàng ──────────────────────────────────────────
    addresses: { type: [AddressSchema], default: [] },
    defaultAddressId: { type: String, default: null },

    resetOTP:        { type: String, default: null },
    resetOTPExpires: { type: Date,   default: null },
}, { timestamps: true });

UserSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (err) { next(err); }
});

UserSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);