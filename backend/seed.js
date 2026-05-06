const mongoose = require('mongoose');
const Product = require('./models/Product');
const Disease = require('./models/Disease');
require('dotenv').config();

// Kết nối database
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ Đã kết nối MongoDB'))
    .catch(err => console.error('❌ Lỗi kết nối:', err));

const seedDiseasesOnly = async () => {
    try {
        console.log('🚀 Bắt đầu cập nhật dữ liệu Bệnh cá...');

        // 1. LẤY ID CÁC SẢN PHẨM THUỐC ĐANG CÓ TRONG DB
        // (Chúng ta cần ID để nhúng vào field recommendProducts của Disease)
        const products = await Product.find({
            category: { $in: ["Thuốc & Vi Sinh", "Phụ Kiện & Cây"] } // Lấy thuốc và sưởi
        });

        // Hàm helper để tìm ID thuốc theo tên
        const getProdId = (namePart) => {
            const product = products.find(p => p.name.includes(namePart));
            return product ? product._id : null;
        };

        // 2. DANH SÁCH BỆNH CHI TIẾT
        const diseasesData = [
            {
                name: "Nấm Trắng (White Spot)",
                symptoms: [
                    "Cá xuất hiện các đốm trắng nhỏ li ti khắp mình và vây như hạt muối.",
                    "Cá bơi giật cục, hay cọ mình vào đá, lũa.",
                    "Vây khép lại, cá lờ đờ."
                ],
                treatment: "Tăng nhiệt độ nước lên 29-30 độ C. Dùng thuốc đặc trị nấm hoặc muối hột.",
                recommendProducts: [
                    getProdId("Bio-Knock 2"), 
                    getProdId("Xanh Methylen"), 
                    getProdId("Sưởi Bể Cá")
                ].filter(id => id),
                severity: "Trung bình"
            },
            {
                name: "Thối Vây / Thối Đuôi (Fin Rot)",
                symptoms: [
                    "Vây hoặc đuôi bị tưa, rách, ngắn dần.",
                    "Viền vây có màu trắng đục hoặc đỏ máu.",
                    "Cá bơi lờ đờ, kém ăn."
                ],
                treatment: "Thay 30% nước sạch. Sử dụng kháng sinh hoặc thuốc dưỡng vây.",
                recommendProducts: [
                    getProdId("Tetra Nhật"), 
                    getProdId("Bio-Knock 3"), 
                    getProdId("API Melafix")
                ].filter(id => id),
                severity: "Cao"
            },
            {
                name: "Sình Bụng / Phân Trắng",
                symptoms: [
                    "Bụng cá trương phình to bất thường.",
                    "Đi phân thành sợi dài màu trắng dính ở hậu môn.",
                    "Cá bỏ ăn, núp góc, nhát người."
                ],
                treatment: "Ngừng cho ăn ngay lập tức. Ngâm thuốc Metronidazole và sục khí mạnh.",
                recommendProducts: [
                    getProdId("Thuốc Trị Sình Bụng"), 
                    getProdId("Muối Hột")
                ].filter(id => id),
                severity: "Nguy hiểm"
            },
            {
                name: "Nấm Thủy Mi (Nấm Bông)",
                symptoms: [
                    "Xuất hiện các mảng trắng như bông gòn bám trên thân hoặc vết thương hở.",
                    "Thường gặp khi nước bẩn hoặc cá bị sây sát."
                ],
                treatment: "Vệ sinh bể, dùng thuốc trị nấm mốc chuyên dụng.",
                recommendProducts: [
                    getProdId("API Pimafix"), 
                    getProdId("Bio-Knock 2")
                ].filter(id => id),
                severity: "Trung bình"
            },
            {
                name: "Ký Sinh Trùng Mỏ Neo / Rận Cá",
                symptoms: [
                    "Thấy rõ ký sinh trùng bám trên thân cá (giống cái mỏ neo hoặc con rận tròn).",
                    "Vết bám bị sưng đỏ, chảy máu.",
                    "Cá gầy rộc nhanh chóng."
                ],
                treatment: "Dùng nhíp gắp ký sinh trùng ra (nếu được) và đánh thuốc diệt ký sinh.",
                recommendProducts: [
                    getProdId("Bio-Knock 4")
                ].filter(id => id),
                severity: "Cao"
            },
            {
                name: "Đục Mắt (Cloudy Eye)",
                symptoms: [
                    "Mắt cá bị phủ một lớp màng đục trắng hoặc xám.",
                    "Mắt sưng lồi ra (pop-eye) trong giai đoạn nặng.",
                    "Cá khó định hướng khi bơi."
                ],
                treatment: "Kiểm tra chất lượng nước (NH3/NO3). Thay nước đều và dùng Melafix.",
                recommendProducts: [
                    getProdId("API Melafix"), 
                    getProdId("Tetra Nhật")
                ].filter(id => id),
                severity: "Trung bình"
            },
            {
                name: "Sốc Nước / Stress",
                symptoms: [
                    "Cá bơi loạn xạ hoặc nằm im đáy bể sau khi thay nước hoặc mới mua về.",
                    "Cá thở gấp, mang đập mạnh.",
                    "Màu sắc nhợt nhạt."
                ],
                treatment: "Tắt đèn, sục oxy nhẹ. Bổ sung Vitamin và khoáng chất giảm stress.",
                recommendProducts: [
                    getProdId("Vitamin C"), 
                    getProdId("Seachem Prime"),
                    getProdId("Xanh Methylen")
                ].filter(id => id),
                severity: "Thấp"
            },
             {
                name: "Lở Loét Thân Mình",
                symptoms: [
                    "Trên thân cá xuất hiện các vết loét đỏ, ăn sâu vào thịt.",
                    "Vảy bị bong tróc.",
                    "Thường do nhiễm khuẩn nặng."
                ],
                treatment: "Cách ly cá bệnh. Sử dụng thuốc kháng khuẩn phổ rộng.",
                recommendProducts: [
                    getProdId("Sera Omnipur"), 
                    getProdId("Bio-Knock 3"),
                    getProdId("Tetra Nhật")
                ].filter(id => id),
                severity: "Nguy hiểm"
            }
        ];

        // 3. THỰC HIỆN CẬP NHẬT DATABASE
        // Chỉ xóa bảng Disease cũ, giữ nguyên Product/Category/User
        await Disease.deleteMany({});
        console.log('🧹 Đã xóa danh sách bệnh cũ.');

        const insertedDiseases = await Disease.insertMany(diseasesData);
        console.log(`✅ Đã thêm mới ${insertedDiseases.length} loại bệnh vào cơ sở dữ liệu.`);
        
        console.log('🎉 Cập nhật thành công! (Dữ liệu Sản phẩm và Admin không bị ảnh hưởng)');
        process.exit(0);

    } catch (err) {
        console.error('❌ Lỗi:', err);
        process.exit(1);
    }
};

seedDiseasesOnly();