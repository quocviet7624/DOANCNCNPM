// Thuật toán: Trả về bệnh có nhiều triệu chứng khớp nhất
router.post('/check', (req, res) => {
    const userSymptoms = req.body.symptoms; // Mảng ID triệu chứng khách chọn
    // Logic: Duyệt DB và tìm bệnh có chứa nhiều ID này nhất
    // Trả về kết quả + Thuốc tương ứng
});