/**
 * 标签路由
 * @description 标签 CRUD API
 */
const express = require('express');
const router = express.Router();
const tagController = require('../business/tagBusiness');
const CHECK = require('../utils/check');
const expressJoi = require('@escook/express-joi');
const { auditLog } = require('../middle/global');

// ---- 前台接口（无需鉴权）----
router.get('/list', tagController.getTagListController);                                              // 标签列表

// ---- 管理接口（需鉴权）----
router.post('/save', expressJoi(CHECK.upsertTagCheck), auditLog('SAVE_TAG'), tagController.upsertTagController);  // 新增/编辑标签
router.delete('/:id', auditLog('DELETE_TAG'), tagController.deleteTagController);                     // 删除标签

module.exports = router;
