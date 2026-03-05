const router = require('express').Router();
const Disease = require('../models/Disease');
const multer = require('multer');
const path = require('path');

// Cấu hình Multer để lưu ảnh tạm thời
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/') // Bạn cần tạo thư mục 'uploads' ở root dự án
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname))
    }
});

const upload = multer({ storage: storage });

// API CHATBOT & CHẨN ĐOÁN (Hỗ trợ Text + Ảnh)
router.post('/chat', upload.single('media'), async (req, res) => {
    const { message } = req.body; // Tin nhắn người dùng gửi (VD: "Cá bị đốm trắng")
    const file = req.file;        // File ảnh/video (nếu có)

    try {
        let bestMatch = null;
        let replyText = "";

        // 1. LOGIC GIẢ LẬP PHÂN TÍCH ẢNH (AI Simulation)
        // Trong thực tế, bạn sẽ gửi file.path này tới API AI (như OpenAI Vision hoặc Google Cloud Vision)
        // Ở đây mình giả lập logic: Nếu có ảnh -> Tăng độ chính xác
        if (file) {
            console.log("Đã nhận file:", file.filename);
            // Giả sử AI phân tích ảnh xong
        }

        // 2. TÌM KIẾM BỆNH DỰA TRÊN TỪ KHÓA (Keyword Search)
        // Tìm bệnh có triệu chứng chứa từ khóa người dùng chat
        if (message) {
            const diseases = await Disease.find().populate('recommendProducts');
            
            // Tìm bệnh phù hợp nhất với câu chat
            bestMatch = diseases.map(disease => {
                // Đếm số từ khóa trong message khớp với symptoms của bệnh
                const keywords = message.toLowerCase().split(' ');
                let matchScore = 0;
                
                disease.symptoms.forEach(sym => {
                    keywords.forEach(word => {
                        if (word.length > 2 && sym.toLowerCase().includes(word)) {
                            matchScore++;
                        }
                    });
                });

                return { ...disease._doc, matchScore };
            }).sort((a, b) => b.matchScore - a.matchScore)[0];
        }

        // 3. TẠO CÂU TRẢ LỜI
        if (bestMatch && bestMatch.matchScore > 0) {
            replyText = `Dựa trên mô tả "${message}" ${file ? "và hình ảnh bạn gửi" : ""}, tôi chẩn đoán cá có thể bị: **${bestMatch.name}**.`;
        } else {
            replyText = "Tôi chưa xác định rõ bệnh qua mô tả này. Bạn hãy mô tả kỹ hơn (VD: đốm trắng, lờ đờ, thối vây...) hoặc gửi thêm ảnh nhé.";
            bestMatch = null; // Reset nếu không tìm thấy
        }

        res.json({
            reply: replyText,
            disease: bestMatch, // Gửi kèm thông tin bệnh để hiển thị thuốc
            imageUrl: file ? `http://localhost:5000/uploads/${file.filename}` : null // Trả về link ảnh để hiển thị lại
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Lỗi server', error: err.message });
    }
});

module.exports = router;