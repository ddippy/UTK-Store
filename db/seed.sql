SET client_encoding = 'UTF8';

INSERT INTO
    categories (name)
VALUES
    ('เสื้อผ้า'),
    ('เครื่องเขียน'),
    ('กระเป๋า'),
    ('ของใช้');

INSERT INTO
    products (
        code,
        name,
        category_id,
        price,
        description,
        status
    )
VALUES
    (
        'SH001',
        'เสื้อ UTK Classic',
        1,
        299.00,
        'เสื้อยืดมหาวิทยาลัย UTK รุ่น Classic',
        'ACTIVE'
    ),
    (
        'PEN001',
        'ปากกา UTK',
        2,
        25.00,
        'ปากกาสำหรับนักศึกษา UTK',
        'ACTIVE'
    ),
    (
        'BAG001',
        'กระเป๋า UTK',
        3,
        450.00,
        'กระเป๋าสะพายมหาวิทยาลัย UTK',
        'ACTIVE'
    ),
    (
        'MUG001',
        'แก้วน้ำ UTK',
        4,
        199.00,
        'แก้วน้ำ UTK',
        'ACTIVE'
    );

INSERT INTO
    product_variants (product_id, size, color, stock)
VALUES
    -- เสื้อ UTK
    (1, 'S', 'ขาว', 10),
    (1, 'M', 'ขาว', 15),
    (1, 'L', 'ขาว', 12),
    (1, 'XL', 'ขาว', 5),
    -- ปากกา UTK
    (2, NULL, 'ดำ', 40),
    (2, NULL, 'น้ำเงิน', 50),
    -- กระเป๋า UTK
    (3, NULL, 'ดำ', 20),
    -- แก้วน้ำ UTK
    (4, NULL, 'ขาว', 15);