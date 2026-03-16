/**
 * 公共路由
 * @description 文件上传、审计日志、仪表盘统计等公共 API
 */
const express = require('express');
const router = express.Router();
const commonController = require('../business/commonBusiness');
const upload = require('../utils/multer');
const { auditLog } = require('../middle/global');

// ---- 前台接口（无需鉴权）----
router.post('/visit', commonController.recordVisitController);                                                 // 访客流量上报

// ---- 管理接口（需鉴权）----
router.post('/upload', auditLog('UPLOAD_FILE'), upload.single('file'), commonController.uploadController);   // 文件上传
router.get('/log/list', commonController.getLogListController);                                               // 审计日志列表
router.get('/dashboard/stats', commonController.getDashboardStatsController);                                 // 仪表盘统计
router.get('/visit/stats', commonController.getVisitStatsController);                                         // 流量统计（近N天PV/UV）
router.get('/visit/today', commonController.getTodayVisitSummaryController);                                  // 今日访客概览

module.exports = router;
