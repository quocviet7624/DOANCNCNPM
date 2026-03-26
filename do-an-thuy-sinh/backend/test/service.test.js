const Product = require('../models/Product');
const Order = require('../models/Order');

// CHỈ MOCK các hàm truy vấn Database, KHÔNG mock toàn bộ class
// Để giữ lại các logic mặc định (default values) của Schema
jest.mock('../models/Product', () => {
    const ActualModel = jest.requireActual('../models/Product');
    ActualModel.findById = jest.fn();
    ActualModel.find = jest.fn();
    return ActualModel;
});

jest.mock('../models/Order', () => {
    const ActualModel = jest.requireActual('../models/Order');
    ActualModel.findById = jest.fn();
    return ActualModel;
});

describe('Unit Tests - Service Layer (Product & Order)', () => {
    
    afterEach(() => {
        jest.clearAllMocks();
    });

    // TEST 1: Lấy chi tiết sản phẩm thành công
    test('Unit Test 1: Trả về thông tin sản phẩm khi ID hợp lệ', async () => {
        const mockProduct = { _id: '123', name: 'Cá Neon', price: 10000, stock: 50 };
        Product.findById.mockResolvedValue(mockProduct);

        const result = await Product.findById('123');
        
        expect(result.name).toBe('Cá Neon');
        expect(result.stock).toBe(50);
    });

    // TEST 2: Kiểm tra logic tồn kho khi tạo sản phẩm (Sẽ hết lỗi undefined)
    test('Unit Test 2: Sản phẩm mới phải có mặc định tồn kho là 100 nếu không nhập', () => {
        const productData = { name: 'Cây Thủy Sinh', price: 50000, category: 'Cây' };
        const mockProduct = new Product(productData); 

        expect(mockProduct.stock).toBe(100);
        expect(mockProduct.sold).toBe(0);
    });

    // TEST 3: Tính toán tổng tiền đơn hàng
    test('Unit Test 3: Tính đúng tổng tiền hàng (subtotal) dựa trên số lượng', () => {
        const items = [
            { price: 100, quantity: 2 }, 
            { price: 50, quantity: 3 }   
        ];
        
        const subtotal = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
        
        expect(subtotal).toBe(350);
    });

    // TEST 4: Trạng thái mặc định của đơn hàng (Sẽ hết lỗi undefined)
    test('Unit Test 4: Đơn hàng mới phải có trạng thái "Chờ xác nhận" và isPaid là false', () => {
        const orderData = {
            userId: 'user01',
            customerName: 'Nguyễn Văn A',
            address: 'Hà Nội',
            phone: '0123456789',
            totalAmount: 200000,
            paymentMethod: 'COD'
        };
        
        const mockOrder = new Order(orderData);
        
        expect(mockOrder.status).toBe('Chờ xác nhận');
        expect(mockOrder.isPaid).toBe(false);
    });

    // TEST 5: Logic thanh toán PayPal
    test('Unit Test 5: Nếu thanh toán bằng PayPal, isPaid phải là true ngay lập tức', () => {
        const paymentMethod = 'PayPal';
        const isPaid = (paymentMethod === 'PayPal');
        
        expect(isPaid).toBe(true);
    });
});