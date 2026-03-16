/**
 * 用户路由
 * @description 管理员登录、修改密码等 API
 */
const express = require('express');
const router = express.Router();
const userBusiness = require('../business/userBusiness');
const CHECK = require('../utils/check');
const expressJoi = require('@escook/express-joi');
const { auditLog } = require('../middle/global');

// ---- 登录接口（无需鉴权）----
router.post('/login', expressJoi(CHECK.loginCheck), userBusiness.loginController);

// ---- 修改密码（需鉴权）----
router.post('/change-password', expressJoi(CHECK.changePasswordCheck), auditLog('CHANGE_PASSWORD'), userBusiness.changePasswordBusiness);

module.exports = router;
