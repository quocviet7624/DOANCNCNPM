import axios from 'axios';

const BASE = 'http://localhost:5000/api/wishlist';

// Lấy danh sách yêu thích
export const fetchWishlist = (userId) =>
    axios.get(`${BASE}/${userId}`).then(r => r.data);

// Kiểm tra 1 sản phẩm đã được yêu thích chưa
export const checkLiked = (userId, productId) =>
    axios.get(`${BASE}/check/${userId}/${productId}`).then(r => r.data.liked);

// Toggle yêu thích (trả về { liked: bool })
export const toggleWishlist = (userId, productId) =>
    axios.post(`${BASE}/toggle`, { userId, productId }).then(r => r.data);

// Xóa khỏi wishlist
export const removeWishlistItem = (userId, productId) =>
    axios.delete(`${BASE}/${userId}/${productId}`).then(r => r.data);