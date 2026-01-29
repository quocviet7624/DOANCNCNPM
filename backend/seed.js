const mongoose = require('mongoose');
const Product = require('./models/Product');
const Disease = require('./models/Disease');
const User = require('./models/User');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ Đã kết nối MongoDB để seed data'))
    .catch(err => console.error('❌ Lỗi kết nối:', err));

const seedData = async () => {
    try {
        console.log('🧹 Đang xóa dữ liệu cũ...');
        await Product.deleteMany({});
        await Disease.deleteMany({});
        await User.deleteMany({});

        console.log('🌱 Đang tạo sản phẩm mẫu...');
        const products = await Product.insertMany([
            // THUỐC
            { 
                name: "Bio-Knock 2", 
                price: 30000, 
                category: "Thuốc", 
                description: "Trị nấm trắng, ký sinh trùng trên cá", 
                image: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300",
                stock: 50
            },
            { 
                name: "Xanh Methylen", 
                price: 15000, 
                category: "Thuốc", 
                description: "Sát khuẩn vết thương, phòng bệnh", 
                image: "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=300",
                stock: 100
            },
            { 
                name: "Sera Omnipur", 
                price: 85000, 
                category: "Thuốc", 
                description: "Điều trị đa dạng bệnh cá", 
                image: "https://images.unsplash.com/photo-1576671081837-49000212a370?w=300",
                stock: 30
            },

            // CÁ CẢNH
            { 
                name: "Cá Neon", 
                price: 10000, 
                category: "Cá", 
                description: "Cá bơi theo đàn, màu xanh đỏ rực rỡ", 
                image: "https://images.unsplash.com/photo-1522069169874-c58ec4b76be5?w=300",
                stock: 200
            },
            { 
                name: "Cá Betta", 
                price: 50000, 
                category: "Cá", 
                description: "Cá xiêm, vây dài đẹp mắt", 
                image: "https://images.unsplash.com/photo-1520990644579-08ae84c85a92?w=300",
                stock: 80
            },
            { 
                name: "Cá Guppy", 
                price: 8000, 
                category: "Cá", 
                description: "Cá bảy màu sinh sản nhanh", 
                image: "https://images.unsplash.com/photo-1535591273668-578e31182c4f?w=300",
                stock: 150
            },

            // CÂY THỦY SINH
            { 
                name: "Cây Trân Châu Mini", 
                price: 20000, 
                category: "Cây", 
                description: "Cây thảm dễ trồng cho người mới", 
                image: "https://images.unsplash.com/photo-1497250681960-ef046c08a56e?w=300",
                stock: 60
            },
            { 
                name: "Cây Lá Xanh", 
                price: 15000, 
                category: "Cây", 
                description: "Cây thủy sinh cơ bản, dễ chăm", 
                image: "https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=300",
                stock: 100
            },

            // PHỤ KIỆN
            { 
                name: "Máy sủi oxy mini", 
                price: 120000, 
                category: "Phụ kiện", 
                description: "Cung cấp oxy cho bể cá", 
                image: "https://images.unsplash.com/photo-1524678606370-a47ad25cb82a?w=300",
                stock: 40
            },
            { 
                name: "Đèn LED thủy sinh", 
                price: 250000, 
                category: "Phụ kiện", 
                description: "Đèn chiếu sáng cho cây và cá", 
                image: "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=300",
                stock: 25
            },
        ]);

        console.log(`✅ Đã tạo ${products.length} sản phẩm!`);

        console.log('🩺 Đang tạo bệnh và gợi ý thuốc...');
        await Disease.insertMany([
            {
                name: "Bệnh Nấm Trắng (White Spot)",
                symptoms: ["Đốm trắng", "Cọ mình vào đá", "Bơi lờ đờ"],
                treatment: "Tăng nhiệt độ nước lên 28-30°C, dùng Bio-Knock 2 hoặc Xanh Methylen",
                recommendProducts: [products[0]._id, products[1]._id],
                severity: "Trung bình"
            },
            {
                name: "Bệnh Vây Rách",
                symptoms: ["Vây bị rách", "Viền đỏ ở vây", "Bơi lờ đờ"],
                treatment: "Cách ly cá bệnh, dùng Xanh Methylen hoặc Sera Omnipur",
                recommendProducts: [products[1]._id, products[2]._id],
                severity: "Nhẹ"
            },
            {
                name: "Bệnh Thối Vây",
                symptoms: ["Vây bị rách", "Viền đen ở vây", "Bỏ ăn"],
                treatment: "Thay nước thường xuyên, dùng thuốc kháng sinh chuyên dụng",
                recommendProducts: [products[2]._id],
                severity: "Nghiêm trọng"
            }
        ]);

        console.log('✅ Đã tạo bệnh và liên kết thuốc!');

        console.log('👤 Đang tạo tài khoản Admin mặc định...');
        
        // QUAN TRỌNG: Không hash ở đây vì User model đã có pre-save hook
        const adminUser = new User({
            username: 'admin',
            password: 'admin123',  // Password thô, sẽ tự động hash bởi pre-save hook
            role: 'admin',
            email: 'admin@fcjunior.com',
            fullName: 'Administrator',
            isActive: true
        });

        await adminUser.save();

        console.log('✅ Tạo tài khoản Admin thành công!');
        console.log('📌 Username: admin');
        console.log('📌 Password: admin123');
        console.log('');
        console.log('🎉 HOÀN TẤT! Dữ liệu đã được bơm vào database.');
        
        process.exit(0);
    } catch (err) {
        console.error('❌ Lỗi seed data:', err);
        process.exit(1);
    }
};

seedData();