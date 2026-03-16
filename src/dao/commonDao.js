/**
 * 公共 DAO
 * @description 文件上传记录、审计日志、仪表盘统计、附件清理等数据库操作
 */
const { errorCode } = require('../config/errorCode');

// =============================== 附件相关 ===============================

/**
 * @author: yx
 * @method: 保存附件记录到 sys_attachment
 * @param {Object} data { file_name, file_url, file_size }
 * @Date: 2026-03-13
 */
exports.saveAttachment = (data) => {
    return new Promise((resolve, reject) => {
        try {
            const sql = 'INSERT INTO sys_attachment (file_name, file_url, file_size, is_used) VALUES (?, ?, ?, 0)';
            global.query(sql, [data.file_name, data.file_url, data.file_size]).then((results) => {
                resolve({ id: results.insertId });
            }).catch(err => reject(err));
        } catch (err) {
            reject({ code: errorCode.UNKNOW, message: err.message });
        }
    });
}

/**
 * @author: yx
 * @method: 查询超时未使用的废弃附件（供定时清理任务调用）
 * @returns {Promise<Array>} 废弃附件列表 [{ id, file_url }]
 * @Date: 2026-03-13
 */
exports.getExpiredUnusedAttachments = () => {
    return new Promise((resolve, reject) => {
        try {
            const sql = `SELECT id, file_url FROM sys_attachment
                         WHERE is_used = 0 AND created_at < DATE_SUB(NOW(), INTERVAL 24 HOUR)`;
            global.query(sql).then((results) => {
                resolve(results.map(x => Object.assign({}, x)));
            }).catch(err => reject(err));
        } catch (err) {
            reject({ code: errorCode.UNKNOW, message: err.message });
        }
    });
}

/**
 * @author: yx
 * @method: 根据 ID 删除附件记录
 * @param {number} id 附件 ID
 * @Date: 2026-03-13
 */
exports.deleteAttachmentById = (id) => {
    return new Promise((resolve, reject) => {
        try {
            global.query('DELETE FROM sys_attachment WHERE id = ?', [id]).then(() => {
                resolve();
            }).catch(err => reject(err));
        } catch (err) {
            reject({ code: errorCode.UNKNOW, message: err.message });
        }
    });
}

/**
 * @author: yx
 * @method: 根据文件 URL 列表批量标记附件为已使用（is_used = 1）
 * @param {Array<string>} fileUrls 文件 URL 路径数组
 * @Date: 2026-03-16
 */
exports.markAttachmentsUsed = (fileUrls) => {
    if (!fileUrls || fileUrls.length === 0) return Promise.resolve();
    return new Promise((resolve, reject) => {
        try {
            const placeholders = fileUrls.map(() => '?').join(', ');
            const sql = `UPDATE sys_attachment SET is_used = 1 WHERE file_url IN (${placeholders}) AND is_used = 0`;
            global.query(sql, fileUrls).then(() => resolve()).catch(err => reject(err));
        } catch (err) {
            reject({ code: errorCode.UNKNOW, message: err.message });
        }
    });
}

// =============================== 审计日志相关 ===============================

/**
 * @author: yx
 * @method: 写入操作审计日志（供中间件调用）
 * @param {Object} data { operator_id, operate_type, detail, ip_address }
 * @Date: 2026-03-13
 */
exports.insertAuditLog = (data) => {
    return new Promise((resolve, reject) => {
        try {
            const sql = 'INSERT INTO sys_log (operator_id, operate_type, detail, ip_address) VALUES (?, ?, ?, ?)';
            global.query(sql, [data.operator_id, data.operate_type, data.detail, data.ip_address]).then(() => {
                resolve();
            }).catch(err => reject(err));
        } catch (err) {
            reject({ code: errorCode.UNKNOW, message: err.message });
        }
    });
}

/**
 * @author: yx
 * @method: 分页获取操作审计日志
 * @param {Object} params { page, pageSize, operateType }
 * @Date: 2026-03-13
 */
exports.getLogList = ({ page = 1, pageSize = 20, operateType }) => {
    return new Promise(async (resolve, reject) => {
        try {
            const offset = (page - 1) * pageSize;
            let whereClauses = ['1=1'];
            let params = [];

            if (operateType) {
                whereClauses.push('l.operate_type = ?');
                params.push(operateType);
            }

            const whereSQL = whereClauses.join(' AND ');

            const countResults = await global.query(
                `SELECT COUNT(*) as total FROM sys_log l WHERE ${whereSQL}`, params
            );
            const total = countResults[0].total;

            const results = await global.query(
                `SELECT l.*, u.username as operator_name
                 FROM sys_log l
                 LEFT JOIN sys_user u ON l.operator_id = u.id
                 WHERE ${whereSQL}
                 ORDER BY l.created_at DESC
                 LIMIT ?, ?`,
                [...params, offset, parseInt(pageSize)]
            );

            resolve({
                list: results.map(x => Object.assign({}, x)),
                total,
                page: parseInt(page),
                pageSize: parseInt(pageSize)
            });
        } catch (err) {
            reject({ code: errorCode.UNKNOW, message: err.message });
        }
    });
}

// =============================== 仪表盘统计 ===============================

/**
 * @author: yx
 * @method: 获取仪表盘统计数据
 * @Date: 2026-03-13
 */
exports.getDashboardStats = () => {
    return new Promise(async (resolve, reject) => {
        try {
            const [articles] = await global.query('SELECT COUNT(*) as total FROM biz_article WHERE status = 1');
            const [projects] = await global.query('SELECT COUNT(*) as total FROM biz_project WHERE status = 1');
            const [views] = await global.query('SELECT IFNULL(SUM(view_count), 0) as total FROM biz_article WHERE status = 1');
            const [categories] = await global.query('SELECT COUNT(*) as total FROM sys_category WHERE is_deleted = 0');
            const [tags] = await global.query('SELECT COUNT(*) as total FROM sys_tag');

            resolve({
                articleCount: articles.total,
                projectCount: projects.total,
                totalViews: views.total,
                categoryCount: categories.total,
                tagCount: tags.total
            });
        } catch (err) {
            reject({ code: errorCode.UNKNOW, message: err.message });
        }
    });
}

// =============================== 访客流量相关 ===============================

/**
 * @author: yx
 * @method: 记录一次访客访问
 * @param {Object} data { ip, user_agent, page_path, referer }
 * @Date: 2026-03-16
 */
exports.recordVisit = (data) => {
    return new Promise((resolve, reject) => {
        try {
            const sql = 'INSERT INTO sys_visit (ip, user_agent, page_path, referer) VALUES (?, ?, ?, ?)';
            global.query(sql, [data.ip || '', data.user_agent || '', data.page_path || '', data.referer || ''])
                .then(() => resolve())
                .catch(err => reject(err));
        } catch (err) {
            reject({ code: errorCode.UNKNOW, message: err.message });
        }
    });
}

/**
 * @author: yx
 * @method: 获取近 N 天的每日 PV（页面浏览量）和 UV（独立访客数）
 * @param {number} days 统计天数（默认7天）
 * @returns {Promise<Array>} [{ date, pv, uv }, ...]
 * @Date: 2026-03-16
 */
exports.getVisitStats = (days = 7) => {
    return new Promise(async (resolve, reject) => {
        try {
            const sql = `
                SELECT
                    DATE(created_at) AS date,
                    COUNT(*) AS pv,
                    COUNT(DISTINCT ip) AS uv
                FROM sys_visit
                WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
                GROUP BY DATE(created_at)
                ORDER BY date ASC
            `;
            const results = await global.query(sql, [days]);
            resolve(results.map(x => Object.assign({}, x)));
        } catch (err) {
            reject({ code: errorCode.UNKNOW, message: err.message });
        }
    });
}

/**
 * @author: yx
 * @method: 获取今日的 PV 和 UV
 * @returns {Promise<Object>} { todayPv, todayUv }
 * @Date: 2026-03-16
 */
exports.getTodayVisitSummary = () => {
    return new Promise(async (resolve, reject) => {
        try {
            const [result] = await global.query(
                'SELECT COUNT(*) AS pv, COUNT(DISTINCT ip) AS uv FROM sys_visit WHERE DATE(created_at) = CURDATE()'
            );
            resolve({ todayPv: result.pv, todayUv: result.uv });
        } catch (err) {
            reject({ code: errorCode.UNKNOW, message: err.message });
        }
    });
}
