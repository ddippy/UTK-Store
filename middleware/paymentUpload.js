const multer = require("multer");
const path = require("path");
const crypto = require("crypto");

// ========================================
// กำหนดที่เก็บไฟล์
// ========================================

const storage = multer.diskStorage({
  // เก็บสลิปไว้ใน public/uploads
  destination: (req, file, cb) => {
    cb(null, "public/uploads");
  },

  // ตั้งชื่อไฟล์ใหม่ ป้องกันชื่อซ้ำ
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();

    cb(null, `slip-${Date.now()}-${crypto.randomUUID()}${ext}`);
  },
});

// ========================================
// อนุญาตเฉพาะรูปภาพ
// ========================================

const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

  if (allowedTypes.includes(file.mimetype)) {
    return cb(null, true);
  }

  cb(new Error("อนุญาตเฉพาะไฟล์ JPG, PNG หรือ WEBP"));
};

// ========================================
// สร้าง Multer
// ========================================

const upload = multer({
  storage,

  fileFilter,

  // จำกัดขนาดไฟล์ 2 MB
  limits: {
    fileSize: 2 * 1024 * 1024,
  },
});

module.exports = upload;
