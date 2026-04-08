const express = require('express');
const router  = express.Router();
const {
    getWishlist,
    toggleWishlist,
    checkWishlist,
    removeFromWishlist,
} = require('../controllers/wishlist.controller');

// Lấy danh sách yêu thích
router.get('/:userId', getWishlist);

// Kiểm tra đã like chưa
router.get('/check/:userId/:productId', checkWishlist);

// Toggle thêm/xóa
router.post('/toggle', toggleWishlist);

// Xóa trực tiếp
router.delete('/:userId/:productId', removeFromWishlist);

module.exports = router;