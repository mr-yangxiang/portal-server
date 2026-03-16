/**
 * 公共 Business
 * @description 文件上传、审计日志查询、仪表盘统计等公共接口的业务编排
 */
const CommonDao = require('../dao/commonDao');
const { errorCode, errorMessage } = require('../config/errorCode');
const { buildFileUrl } = require('../config/base');

/**
 * @author: yx
 * @method: 文件上传（需鉴权）
 * @param {*} req 请求体（multer 已解析 req.file）
 * @param {*} res 返回体
 * @Date: 2026-03-13
 */
exports.uploadController = (req, res) => {
    if (!req.file) {
        return res.send({
            code: errorCode.FILECANNOTBEEMPTY,
            message: errorMessage.FILECANNOTBEEMPTY
        });
    }

    // 通过 base.js 统一配置生成文件 URL
    const fileUrl = buildFileUrl(req.file.filename);

    CommonDao.saveAttachment({
        file_name: req.file.originalname,
        file_url: fileUrl,
        file_size: req.file.size
    }).then(() => {
        res.send({
            code: 200,
            data: {
                url: fileUrl,
                name: req.file.originalname,
                size: req.file.size
            },
            message: '上传成功！'
        });
    }).catch(err => res.send({
        code: err.code || errorCode.UNKNOW,
        message: err.message || errorMessage.UNKNOW
    }));
}

/**
 * @author: yx
 * @method: 分页获取操作审计日志（需鉴权）
 */
exports.getLogListController = (req, res) => {
    const { page, pageSize, operateType } = req.query;

    CommonDao.getLogList({ page, pageSize, operateType }).then((data) => {
        res.send({ code: 200, data });
    }).catch(err => res.send({
        code: err.code || errorCode.UNKNOW,
        message: err.message || errorMessage.UNKNOW
    }));
}

/**
 * @author: yx
 * @method: 获取仪表盘统计数据
 */
exports.getDashboardStatsController = (req, res) => {
    CommonDao.getDashboardStats().then((data) => {
        res.send({ code: 200, data });
    }).catch(err => res.send({
        code: err.code || errorCode.UNKNOW,
        message: err.message || errorMessage.UNKNOW
    }));
}

/**
 * @author: yx
 * @method: 记录访客访问（无需鉴权，前台页面自动上报）
 */
exports.recordVisitController = (req, res) => {
    const ip = req.headers['x-forwarded-for']
        || req.headers['x-real-ip']
        || req.connection.remoteAddress
        || '';
    const realIp = ip.split(',')[0].trim().replace(/^::ffff:/, '');

    const data = {
        ip: realIp,
        user_agent: req.headers['user-agent'] || '',
        page_path: req.body.page_path || '',
        referer: req.headers['referer'] || req.body.referer || ''
    };

    CommonDao.recordVisit(data).then(() => {
        res.send({ code: 200, message: '访问记录已上报' });
    }).catch(err => res.send({
        code: err.code || errorCode.UNKNOW,
        message: err.message || errorMessage.UNKNOW
    }));
}

/**
 * @author: yx
 * @method: 获取近 N 天流量统计（需鉴权，仪表盘调用）
 */
exports.getVisitStatsController = (req, res) => {
    const days = parseInt(req.query.days) || 7;

    CommonDao.getVisitStats(days).then((data) => {
        res.send({ code: 200, data });
    }).catch(err => res.send({
        code: err.code || errorCode.UNKNOW,
        message: err.message || errorMessage.UNKNOW
    }));
}

/**
 * @author: yx
 * @method: 获取今日访客概览（需鉴权）
 */
exports.getTodayVisitSummaryController = (req, res) => {
    CommonDao.getTodayVisitSummary().then((data) => {
        res.send({ code: 200, data });
    }).catch(err => res.send({
        code: err.code || errorCode.UNKNOW,
        message: err.message || errorMessage.UNKNOW
    }));
}
