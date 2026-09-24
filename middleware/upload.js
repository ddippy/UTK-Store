const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: "public/uploads/",

  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);

    const filename = Date.now() + "-" + Math.round(Math.random() * 1e9) + ext;

    cb(null, filename);
  },
});

const upload = multer({
  storage: storage,
});

module.exports = upload;
