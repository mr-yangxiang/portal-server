/**
 * 全局中间件
 * @description Token 解析 & 用户信息挂载、操作审计日志
 *              所有数据库操作均通过 DAO 层完成，不直接编写 SQL
 */
const jwt = require('jsonwebtoken');
const { jwtSecretKey } = require('../config/jwtSecretKey');
const { errorCode, errorMessage } = require('../config/errorCode');
const CommonDao = require('../dao/commonDao');

/**
 * Token 解析中间件
 * @description 从 Authorization 头中解析 Token，将用户信息挂载到 req.userInfo
 */
exports.userInfoMiddle = async (req, res, next) => {
    if (req.headers.authorization) {
        try {
            const token = req.headers.authorization;
            if (token) {
                const userInfo = jwt.verify(token.split('Bearer ')[1], jwtSecretKey);
                req.userInfo = userInfo;
            }
        } catch (err) {
            if (err.name === 'TokenExpiredError') {
                return res.send({
                    code: errorCode.TOKENEXPIRED,
                    message: errorMessage.TOKENEXPIRED
                });
            }
        }
    }
    next();
}

/**
 * 操作审计日志中间件工厂
 * @param {string} operateType 操作类型标识（如 LOGIN、SAVE_ARTICLE）
 * @returns {Function} Express 中间件函数
 * @description 拦截管理端敏感操作，通过 CommonDao 异步写入 sys_log，不阻塞主业务响应
 */
exports.auditLog = (operateType) => {
    return (req, res, next) => {
        // 保存原始 res.send 方法
        const originalSend = res.send.bind(res);

        res.send = (body) => {
            // 立即恢复原始 send，防止重复触发
            res.send = originalSend;

            // 仅在请求成功时记录审计日志
            try {
                const parsed = typeof body === 'string' ? JSON.parse(body) : body;
                if (parsed && parsed.code === 200) {
                    const userId = req.userInfo ? req.userInfo.id : 0;
                    const rawIp = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.socket.remoteAddress || '';
                    const ip = rawIp.split(',')[0].trim().replace(/^::ffff:/, '');
                    const detail = JSON.stringify({
                        method: req.method,
                        path: req.originalUrl,
                        body: req.body
                    });

                    // 通过 DAO 异步写入日志，不等待结果，不阻塞响应
                    CommonDao.insertAuditLog({
                        operator_id: userId,
                        operate_type: operateType,
                        detail: detail,
                        ip_address: ip
                    }).catch(err => {
                        console.error('[审计日志] 写入失败:', err.message);
                    });
                }
            } catch (e) {
                // JSON 解析失败不影响响应
            }

            return originalSend.call(res, body);
        };

        next();
    };
}
