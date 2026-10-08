const multer = require("multer");
const path = require("path");
const crypto = require("crypto");

// ========================================
// กำหนดที่เก็บไฟล์
// ========================================

const storage = multer.diskStorage({
    // เก็บสลิปไว้ใน public/uploads; app.js กัน URL สาธารณะและเปิดผ่าน Route ที่ตรวจ ACL
    destination: (req, file, cb) => {
        cb(null, "public/uploads");
    },

    // ตั้งชื่อไฟล์ใหม่ ป้องกันชื่อซ้ำ
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();

        cb(null, `payment-${Date.now()}-${crypto.randomUUID()}${ext}`);
    },
});

// ========================================
// สร้าง Multer
// ========================================

const upload = multer({
    storage,

    // จำกัดขนาดไฟล์ 2 MB
    limits: {
        fileSize: 2 * 1024 * 1024,
    },
});

module.exports = upload;
