const router = require('express').Router();
const Disease = require('../models/Disease');

// POST - Chẩn đoán bệnh dựa trên triệu chứng
router.post('/', async (req, res) => {
    const { userSymptoms } = req.body; 
    
    if (!userSymptoms || userSymptoms.length === 0) {
        return res.status(400).json({ message: "Vui lòng chọn ít nhất một triệu chứng" });
    }

    try {
        // Lấy tất cả bệnh từ database và populate sản phẩm gợi ý
        const diseases = await Disease.find().populate('recommendProducts');
        
        // Tính điểm khớp cho từng bệnh
        let bestMatch = diseases.map(disease => {
            // Đếm số triệu chứng khớp
            let matchCount = disease.symptoms.filter(symptom => 
                userSymptoms.includes(symptom)
            ).length;
            
            return { 
                ...disease._doc, 
                matchCount 
            };
        })
        .sort((a, b) => b.matchCount - a.matchCount)[0]; // Lấy bệnh khớp nhiều nhất

        // Nếu không có bệnh nào khớp
        if (!bestMatch || bestMatch.matchCount === 0) {
            return res.json({ 
                message: "Không tìm thấy bệnh phù hợp với các triệu chứng đã chọn" 
            });
        }

        res.json(bestMatch);
    } catch (err) {
        res.status(500).json({ 
            message: 'Lỗi chẩn đoán', 
            error: err.message 
        });
    }
});

// GET - Lấy danh sách tất cả bệnh (cho Admin)
router.get('/', async (req, res) => {
    try {
        const diseases = await Disease.find().populate('recommendProducts');
        res.json(diseases);
    } catch (err) {
        res.status(500).json({ message: 'Lỗi lấy danh sách bệnh', error: err.message });
    }
});

module.exports = router;