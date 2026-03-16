/**
 * 分类路由
 * @description 分类 CRUD API
 */
const express = require('express');
const router = express.Router();
const categoryController = require('../business/categoryBusiness');
const CHECK = require('../utils/check');
const expressJoi = require('@escook/express-joi');
const { auditLog } = require('../middle/global');

// ---- 前台接口（无需鉴权）----
router.get('/list', categoryController.getCategoryListController);                                     // 分类列表

// ---- 管理接口（需鉴权）----
router.post('/save', expressJoi(CHECK.upsertCategoryCheck), auditLog('SAVE_CATEGORY'), categoryController.upsertCategoryController);  // 新增/编辑分类
router.delete('/:id', auditLog('DELETE_CATEGORY'), categoryController.deleteCategoryController);       // 删除分类

module.exports = router;
