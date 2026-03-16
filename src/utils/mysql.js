/**
 * MySQL 查询工具封装
 * @description 对连接池进行 Promise 化封装，全局挂载使用
 */
const pool = require('../config/pool');
const { errorCode } = require('../config/errorCode');

/**
 * 执行 SQL 查询
 * @param {string} sql SQL 语句
 * @param {Array} params 参数化查询的参数数组
 * @returns {Promise} 查询结果
 */
const query = (sql, params) => {
    return new Promise((resolve, reject) => {
        pool.getConnection((err, connection) => {
            if (err) {
                reject({
                    code: errorCode.UNKNOW,
                    message: err.message
                });
                return;
            }

            connection.query(sql, params, (error, results, fields) => {
                connection.release(); // 无论成功失败都归还连接
                if (error) {
                    reject({
                        code: errorCode.UNKNOW,
                        message: error.message
                    });
                } else {
                    resolve(results);
                }
            });
        });
    });
}

module.exports = {
    pool,
    query
}
