/**
 * 个人配置路由
 * @description 个人信息/简历配置 API（前台展示 + 后台管理）
 */
const express = require('express');
const router = express.Router();
const profileController = require('../business/profileBusiness');
const CHECK = require('../utils/check');
const expressJoi = require('@escook/express-joi');
const { auditLog } = require('../middle/global');

// ---- 前台接口（无需鉴权）----
router.get('/', profileController.getProfileController);                       // 获取个人配置

// ---- 管理接口（需鉴权，express-jwt 自动拦截）----
router.post('/save', expressJoi(CHECK.updateProfileCheck), auditLog('SAVE_PROFILE'), profileController.saveProfileController);   // 保存个人配置

module.exports = router;
