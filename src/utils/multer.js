/**
 * Multer 文件上传配置
 * @description 统一管理文件上传的存储策略、大小限制与类型过滤
 *              存储目录从 base.js 统一配置中读取，不硬编码路径
 */
const multer = require('multer');
const path = require('path');
const { uploadDir } = require('../config/base');

// 存储配置：自定义文件名和存储目录
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);  // 从 base.js 读取上传目录
    },
    filename: (req, file, cb) => {
        // 文件名规则：时间戳-随机数.扩展名
        const ext = path.extname(file.originalname);
        const name = `${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`;
        cb(null, name);
    }
});

// 文件类型白名单过滤
const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp|svg|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname || mimetype) {
        cb(null, true);
    } else {
        cb(new Error('仅支持图片和 PDF 文件'));
    }
};

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 最大 5MB
    fileFilter
});

module.exports = upload;
