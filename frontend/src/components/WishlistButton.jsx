import React, { useEffect, useState } from 'react';
import { HeartOutlined, HeartFilled } from '@ant-design/icons';
import { message, Tooltip } from 'antd';
import { toggleWishlist, checkLiked } from '../api/wishlistAPI';
import { useNavigate } from 'react-router-dom';

/**
 * Nút tim dùng chung — đặt bất kỳ đâu
 * Props:
 *   productId  — ID của sản phẩm
 *   size       — 'sm' | 'md' (default 'md')
 *   style      — inline style override
 */
const WishlistButton = ({ productId, size = 'md', style = {} }) => {
    const navigate = useNavigate();
    const [liked, setLiked] = useState(false);
    const [loading, setLoading] = useState(false);

    const getUserId = () => {
        try {
            const u = JSON.parse(localStorage.getItem('user'));
            return u?._id || u?.id || null;
        } catch { return null; }
    };

    const userId = getUserId();

    useEffect(() => {
        if (!userId || !productId) return;
        checkLiked(userId, productId)
            .then(setLiked)
            .catch(() => {});
    }, [userId, productId]);

    const handleClick = async (e) => {
        e.stopPropagation();
        e.preventDefault();
        if (!userId) {
            message.warning('Vui lòng đăng nhập để lưu yêu thích!');
            navigate('/login');
            return;
        }
        if (loading) return;
        setLoading(true);
        try {
            const res = await toggleWishlist(userId, productId);
            setLiked(res.liked);
            message.success(res.liked ? '❤ Đã thêm vào yêu thích!' : 'Đã bỏ yêu thích');
        } catch {
            message.error('Có lỗi xảy ra');
        } finally {
            setLoading(false);
        }
    };

    const btnSize = size === 'sm' ? 28 : 34;
    const iconSize = size === 'sm' ? 14 : 17;

    return (
        <Tooltip title={liked ? 'Bỏ yêu thích' : 'Thêm vào yêu thích'} placement="top">
            <button
                onClick={handleClick}
                style={{
                    width: btnSize, height: btnSize,
                    borderRadius: '50%',
                    border: liked ? '1.5px solid #c8232c' : '1.5px solid #ddd',
                    background: liked ? '#fff5f5' : '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', transition: 'all 0.2s',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
                    flexShrink: 0,
                    ...style,
                }}
                onMouseEnter={e => {
                    e.currentTarget.style.background = '#fff5f5';
                    e.currentTarget.style.borderColor = '#c8232c';
                    e.currentTarget.style.transform = 'scale(1.1)';
                }}
                onMouseLeave={e => {
                    e.currentTarget.style.background = liked ? '#fff5f5' : '#fff';
                    e.currentTarget.style.borderColor = liked ? '#c8232c' : '#ddd';
                    e.currentTarget.style.transform = 'scale(1)';
                }}
            >
                {liked
                    ? <HeartFilled style={{ fontSize: iconSize, color: '#c8232c' }} />
                    : <HeartOutlined style={{ fontSize: iconSize, color: '#aaa' }} />
                }
            </button>
        </Tooltip>
    );
};

export default WishlistButton;