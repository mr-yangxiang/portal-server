/**
 * 项目 DAO
 * @description biz_project 表 + rel_project_tag 关联表的数据库操作，Upsert 和 Delete 使用事务保护
 */
const { errorCode } = require('../config/errorCode');
const { Transaction } = require('../utils/Transaction');

/**
 * @author: yx
 * @method: 分页获取项目列表
 * @param {Object} params { page, pageSize }
 * @Date: 2026-03-13
 */
exports.getProjectList = ({ page = 1, pageSize = 10 }) => {
    return new Promise(async (resolve, reject) => {
        try {
            const offset = (page - 1) * pageSize;

            const countResults = await global.query('SELECT COUNT(*) as total FROM biz_project WHERE status = 1');
            const total = countResults[0].total;

            const results = await global.query(
                `SELECT p.*, c.category_name
                 FROM biz_project p
                 LEFT JOIN sys_category c ON p.category_id = c.id
                 WHERE p.status = 1
                 ORDER BY p.created_at DESC
                 LIMIT ?, ?`,
                [offset, parseInt(pageSize)]
            );

            const list = results.map(x => Object.assign({}, x));

            // 批量查询每个项目关联的标签
            for (let project of list) {
                const tags = await global.query(
                    `SELECT t.id, t.tag_name, t.tag_color
                     FROM sys_tag t INNER JOIN rel_project_tag rpt ON t.id = rpt.tag_id
                     WHERE rpt.project_id = ?`,
                    [project.id]
                );
                project.tags = tags.map(t => Object.assign({}, t));
            }

            resolve({ list, total, page: parseInt(page), pageSize: parseInt(pageSize) });
        } catch (err) {
            reject({ code: errorCode.UNKNOW, message: err.message });
        }
    });
}

/**
 * @author: yx
 * @method: 获取项目详情
 * @param {number} id 项目 ID
 * @Date: 2026-03-13
 */
exports.getProjectDetail = (id) => {
    return new Promise(async (resolve, reject) => {
        try {
            const results = await global.query(
                `SELECT p.*, c.category_name
                 FROM biz_project p
                 LEFT JOIN sys_category c ON p.category_id = c.id
                 WHERE p.id = ? AND p.status = 1`,
                [id]
            );

            if (!results.length) return resolve(null);

            const project = Object.assign({}, results[0]);
            const tags = await global.query(
                `SELECT t.id, t.tag_name, t.tag_color
                 FROM sys_tag t INNER JOIN rel_project_tag rpt ON t.id = rpt.tag_id
                 WHERE rpt.project_id = ?`,
                [id]
            );
            project.tags = tags.map(t => Object.assign({}, t));

            resolve(project);
        } catch (err) {
            reject({ code: errorCode.UNKNOW, message: err.message });
        }
    });
}

/**
 * @author: yx
 * @method: 项目 Upsert（事务保护：项目主体 + 标签映射表的原子性操作）
 * @param {Object} data 项目数据
 * @Date: 2026-03-13
 */
exports.upsertProject = (data) => {
    return new Promise(async (resolve, reject) => {
        const conn = await Transaction.begin();
        try {
            let projectId = data.id;

            if (data.id) {
                await Transaction.query(conn,
                    'UPDATE biz_project SET project_name=?, description=?, arch_images=?, github_url=?, preview_url=?, category_id=? WHERE id=?',
                    [data.project_name, data.description, data.arch_images || null, data.github_url || '', data.preview_url || '', data.category_id, data.id]
                );
                await Transaction.query(conn, 'DELETE FROM rel_project_tag WHERE project_id = ?', [data.id]);
            } else {
                const results = await Transaction.query(conn,
                    'INSERT INTO biz_project (project_name, description, arch_images, github_url, preview_url, category_id) VALUES (?, ?, ?, ?, ?, ?)',
                    [data.project_name, data.description, data.arch_images || null, data.github_url || '', data.preview_url || '', data.category_id]
                );
                projectId = results.insertId;
            }

            // 批量插入新的标签映射
            if (data.tag_ids && data.tag_ids.length > 0) {
                const values = data.tag_ids.map(tagId => [projectId, tagId]);
                const placeholders = values.map(() => '(?, ?)').join(', ');
                const flatValues = values.flat();
                await Transaction.query(conn,
                    `INSERT INTO rel_project_tag (project_id, tag_id) VALUES ${placeholders}`,
                    flatValues
                );
            }

            await Transaction.commit(conn);
            resolve({ id: projectId });
        } catch (err) {
            await Transaction.rollback(conn);
            reject({ code: errorCode.UNKNOW, message: err.message });
        }
    });
}

/**
 * @author: yx
 * @method: 逻辑删除项目（事务保护：更新状态 + 清理标签映射）
 * @param {number} id 项目 ID
 * @Date: 2026-03-13
 */
exports.deleteProject = (id) => {
    return new Promise(async (resolve, reject) => {
        const conn = await Transaction.begin();
        try {
            await Transaction.query(conn, 'UPDATE biz_project SET status = 0 WHERE id = ?', [id]);
            await Transaction.query(conn, 'DELETE FROM rel_project_tag WHERE project_id = ?', [id]);
            await Transaction.commit(conn);
            resolve();
        } catch (err) {
            await Transaction.rollback(conn);
            reject({ code: errorCode.UNKNOW, message: err.message });
        }
    });
}
