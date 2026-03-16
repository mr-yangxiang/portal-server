/**
 * 文章路由
 * @description 文章 CRUD API（前台展示 + 后台管理）
 */
const express = require('express');
const router = express.Router();
const articleController = require('../business/articleBusiness');
const CHECK = require('../utils/check');
const expressJoi = require('@escook/express-joi');
const { auditLog } = require('../middle/global');

// ---- 前台接口（无需鉴权）----
router.get('/list', articleController.getArticleListController);              // 文章列表（分页+筛选）
router.get('/:id', articleController.getArticleDetailController);            // 文章详情

// ---- 管理接口（需鉴权）----
router.post('/save', expressJoi(CHECK.upsertArticleCheck), auditLog('SAVE_ARTICLE'), articleController.upsertArticleController);   // 新增/编辑文章
router.delete('/:id', auditLog('DELETE_ARTICLE'), articleController.deleteArticleController);          // 删除文章

module.exports = router;
