/**
 * 标签 DAO
 * @description sys_tag 表的增删改查操作，删除操作使用事务保护
 */
const { errorCode } = require('../config/errorCode');
const { Transaction } = require('../utils/Transaction');

/**
 * @author: yx
 * @method: 获取全部标签列表
 * @Date: 2026-03-13
 */
exports.getTagList = () => {
    return new Promise((resolve, reject) => {
        try {
            const sql = 'SELECT id, tag_name, tag_color, created_at FROM sys_tag ORDER BY created_at DESC';
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
 * @method: 标签 Upsert（有 id 更新，无 id 新增）+ 防重名校验
 * @param {Object} data { id, tag_name, tag_color }
 * @Date: 2026-03-13
 */
exports.upsertTag = (data) => {
    return new Promise(async (resolve, reject) => {
        try {
            // 防重名校验（排除自身）
            const dup = await global.query(
                'SELECT id FROM sys_tag WHERE tag_name = ? AND id != ?',
                [data.tag_name, data.id || 0]
            );

            if (dup.length > 0) {
                return reject({
                    code: errorCode.TAGNAMEEXIST,
                    message: '标签名称已存在！'
                });
            }

            if (data.id) {
                const sql = 'UPDATE sys_tag SET tag_name=?, tag_color=? WHERE id=?';
                await global.query(sql, [data.tag_name, data.tag_color || '#409EFF', data.id]);
                resolve({ id: data.id });
            } else {
                const sql = 'INSERT INTO sys_tag (tag_name, tag_color) VALUES (?, ?)';
                const results = await global.query(sql, [data.tag_name, data.tag_color || '#409EFF']);
                resolve({ id: results.insertId });
            }
        } catch (err) {
            reject(err.code ? err : { code: errorCode.UNKNOW, message: err.message });
        }
    });
}

/**
 * @author: yx
 * @method: 删除标签（事务保护：同步清理 rel_article_tag + rel_project_tag + sys_tag）
 * @param {number} id 标签 ID
 * @Date: 2026-03-13
 */
exports.deleteTag = (id) => {
    return new Promise(async (resolve, reject) => {
        const conn = await Transaction.begin();
        try {
            await Transaction.query(conn, 'DELETE FROM rel_article_tag WHERE tag_id = ?', [id]);
            await Transaction.query(conn, 'DELETE FROM rel_project_tag WHERE tag_id = ?', [id]);
            await Transaction.query(conn, 'DELETE FROM sys_tag WHERE id = ?', [id]);
            await Transaction.commit(conn);
            resolve();
        } catch (err) {
            await Transaction.rollback(conn);
            reject({ code: errorCode.UNKNOW, message: err.message });
        }
    });
}
