/**
 * 分类 Service
 * @description sys_category 表的增删改查操作
 */
const { errorCode } = require('../config/errorCode');

/**
 * @author: yx
 * @method: 获取所有正常的分类（is_deleted=0）
 * @Date: 2026-03-13
 */
exports.getCategoryList = () => {
    return new Promise((resolve, reject) => {
        try {
            const sql = 'SELECT id, category_name, sort_order, created_at FROM sys_category WHERE is_deleted = 0 ORDER BY sort_order ASC';
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
 * @method: 分类 Upsert（有 id 更新，无 id 新增）
 * @param {Object} data { id, category_name, sort_order }
 * @Date: 2026-03-13
 */
exports.upsertCategory = (data) => {
    return new Promise((resolve, reject) => {
        try {
            if (data.id) {
                const sql = 'UPDATE sys_category SET category_name=?, sort_order=? WHERE id=?';
                global.query(sql, [data.category_name, data.sort_order || 0, data.id]).then(() => {
                    resolve({ id: data.id });
                }).catch(err => reject(err));
            } else {
                const sql = 'INSERT INTO sys_category (category_name, sort_order) VALUES (?, ?)';
                global.query(sql, [data.category_name, data.sort_order || 0]).then((results) => {
                    resolve({ id: results.insertId });
                }).catch(err => reject(err));
            }
        } catch (err) {
            reject({ code: errorCode.UNKNOW, message: err.message });
        }
    });
}

/**
 * @author: yx
 * @method: 逻辑删除分类
 * @param {number} id 分类 ID
 * @Date: 2026-03-13
 */
exports.deleteCategory = (id) => {
    return new Promise((resolve, reject) => {
        try {
            global.query('UPDATE sys_category SET is_deleted = 1 WHERE id = ?', [id]).then(() => {
                resolve();
            }).catch(err => reject(err));
        } catch (err) {
            reject({ code: errorCode.UNKNOW, message: err.message });
        }
    });
}
