/**
 * 项目路由
 * @description 项目 CRUD API（前台展示 + 后台管理）
 */
const express = require('express');
const router = express.Router();
const projectController = require('../business/projectBusiness');
const CHECK = require('../utils/check');
const expressJoi = require('@escook/express-joi');
const { auditLog } = require('../middle/global');

// ---- 前台接口（无需鉴权）----
router.get('/list', projectController.getProjectListController);              // 项目列表
router.get('/:id', projectController.getProjectDetailController);            // 项目详情

// ---- 管理接口（需鉴权）----
router.post('/save', expressJoi(CHECK.upsertProjectCheck), auditLog('SAVE_PROJECT'), projectController.upsertProjectController); // 新增/编辑项目
router.delete('/:id', auditLog('DELETE_PROJECT'), projectController.deleteProjectController);          // 删除项目

module.exports = router;
