/**
 * 用户 DAO
 * @description 用户相关的数据库操作（登录查询、密码修改、日志写入）
 */
const { errorCode } = require('../config/errorCode');

/**
 * @author: yx
 * @method: 根据用户名查询用户信息
 * @param {string} username 用户名
 * @param {boolean} needPassword 是否需要返回密码字段
 * @Date: 2026-03-13
 */
exports.getUserByUsername = (username, needPassword = false) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = needPassword
                ? 'SELECT id, username, password FROM sys_user WHERE username = ?'
                : 'SELECT id, username FROM sys_user WHERE username = ?';

            global.query(sql, [username]).then((results) => {
                resolve(results.length ? Object.assign({}, results[0]) : null);
            }).catch(err => reject(err));
        } catch (err) {
            reject({ code: errorCode.UNKNOW, message: err.message });
        }
    });
}

/**
 * @author: yx
 * @method: 根据用户 ID 查询密码哈希（用于修改密码时校验旧密码）
 * @param {number} userId 用户 ID
 * @Date: 2026-03-13
 */
exports.getPasswordByUserId = (userId) => {
    return new Promise((resolve, reject) => {
        try {
            global.query('SELECT password FROM sys_user WHERE id = ?', [userId]).then((results) => {
                resolve(results.length ? results[0].password : null);
            }).catch(err => reject(err));
        } catch (err) {
            reject({ code: errorCode.UNKNOW, message: err.message });
        }
    });
}

/**
 * @author: yx
 * @method: 更新用户密码（存储 bcrypt 哈希值）
 * @param {number} userId 用户 ID
 * @param {string} hashedPassword 加密后的密码
 * @Date: 2026-03-13
 */
exports.updatePassword = (userId, hashedPassword) => {
    return new Promise((resolve, reject) => {
        try {
            global.query('UPDATE sys_user SET password = ? WHERE id = ?', [hashedPassword, userId]).then(() => {
                resolve();
            }).catch(err => reject(err));
        } catch (err) {
            reject({ code: errorCode.UNKNOW, message: err.message });
        }
    });
}

/**
 * @author: yx
 * @method: 写入登录日志
 * @param {number} userId 用户 ID
 * @param {string} ip IP 地址
 * @Date: 2026-03-13
 */
exports.addLoginLog = (userId, ip) => {
    return new Promise((resolve, reject) => {
        try {
            const sql = 'INSERT INTO sys_log (operator_id, operate_type, ip_address) VALUES (?, ?, ?)';
            global.query(sql, [userId, 'LOGIN', ip]).then(() => resolve()).catch(err => reject(err));
        } catch (err) {
            reject({ code: errorCode.UNKNOW, message: err.message });
        }
    });
}

