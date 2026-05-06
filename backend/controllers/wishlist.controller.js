const Wishlist = require('../models/Wishlist');
const Product  = require('../models/Product');

// GET /api/wishlist/:userId  — lấy danh sách yêu thích của user
const getWishlist = async (req, res) => {
    try {
        const { userId } = req.params;
        const items = await Wishlist.find({ userId })
            .populate('productId', 'name price image images avgRating category stock')
            .sort({ createdAt: -1 });

        const products = items
            .filter(item => item.productId) // lọc sản phẩm đã bị xóa
            .map(item => ({
                wishlistId: item._id,
                ...item.productId.toObject(),
            }));

        res.json(products);
    } catch (err) {
        res.status(500).json({ message: 'Lỗi server', error: err.message });
    }
};

// POST /api/wishlist/toggle  — thêm hoặc xóa khỏi wishlist
const toggleWishlist = async (req, res) => {
    try {
        const { userId, productId } = req.body;
        if (!userId || !productId)
            return res.status(400).json({ message: 'Thiếu userId hoặc productId' });

        const existing = await Wishlist.findOne({ userId, productId });
        if (existing) {
            await Wishlist.deleteOne({ _id: existing._id });
            return res.json({ liked: false, message: 'Đã bỏ yêu thích' });
        }

        await Wishlist.create({ userId, productId });
        res.json({ liked: true, message: 'Đã thêm vào yêu thích' });
    } catch (err) {
        res.status(500).json({ message: 'Lỗi server', error: err.message });
    }
};

// GET /api/wishlist/check/:userId/:productId — kiểm tra đã like chưa
const checkWishlist = async (req, res) => {
    try {
        const { userId, productId } = req.params;
        const exists = await Wishlist.findOne({ userId, productId });
        res.json({ liked: !!exists });
    } catch (err) {
        res.status(500).json({ message: 'Lỗi server', error: err.message });
    }
};

// DELETE /api/wishlist/:userId/:productId — xóa thẳng (dùng từ trang wishlist)
const removeFromWishlist = async (req, res) => {
    try {
        const { userId, productId } = req.params;
        await Wishlist.deleteOne({ userId, productId });
        res.json({ message: 'Đã xóa khỏi yêu thích' });
    } catch (err) {
        res.status(500).json({ message: 'Lỗi server', error: err.message });
    }
};

module.exports = { getWishlist, toggleWishlist, checkWishlist, removeFromWishlist };