/**
 * 个人配置 Service
 * @description sys_profile 表的增删改查操作
 */
const { errorCode } = require('../config/errorCode');

/**
 * @author: yx
 * @method: 获取个人配置（单条）
 * @Date: 2026-03-13
 */
exports.getProfile = () => {
    return new Promise((resolve, reject) => {
        try {
            global.query('SELECT * FROM sys_profile LIMIT 1').then((results) => {
                resolve(results.length ? Object.assign({}, results[0]) : null);
            }).catch(err => reject(err));
        } catch (err) {
            reject({ code: errorCode.UNKNOW, message: err.message });
        }
    });
}

/**
 * @author: yx
 * @method: 保存个人配置（Upsert：有记录则更新，无记录则插入）
 * @param {Object} data 配置数据
 * @Date: 2026-03-13
 */
exports.saveProfile = (data) => {
    return new Promise(async (resolve, reject) => {
        try {
            const existing = await global.query('SELECT id FROM sys_profile LIMIT 1');

            if (existing.length > 0) {
                const sql = 'UPDATE sys_profile SET avatar_url=?, nickname=?, bio=?, github_url=?, resume_content=?, tech_tags=? WHERE id=?';
                await global.query(sql, [data.avatar_url, data.nickname, data.bio, data.github_url, data.resume_content, data.tech_tags || '', existing[0].id]);
            } else {
                const sql = 'INSERT INTO sys_profile (avatar_url, nickname, bio, github_url, resume_content, tech_tags) VALUES (?, ?, ?, ?, ?, ?)';
                await global.query(sql, [data.avatar_url, data.nickname, data.bio, data.github_url, data.resume_content, data.tech_tags || '']);
            }

            resolve();
        } catch (err) {
            reject({ code: errorCode.UNKNOW, message: err.message });
        }
    });
}
