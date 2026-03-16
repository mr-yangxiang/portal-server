/**
 * 事务管理工具
 * @description 对 mysql2 连接池封装事务操作，确保多步 SQL 的原子性
 * @example
 *   const conn = await Transaction.begin();
 *   try {
 *       await Transaction.query(conn, 'INSERT ...', [params]);
 *       await Transaction.query(conn, 'DELETE ...', [params]);
 *       await Transaction.commit(conn);
 *   } catch (err) {
 *       await Transaction.rollback(conn);
 *       throw err;
 *   }
 */
const pool = require('../config/pool');

class Transaction {
    /**
     * 从连接池获取连接并开启事务
     * @returns {Promise<Connection>} 数据库连接对象
     */
    static begin() {
        return new Promise((resolve, reject) => {
            pool.getConnection((err, connection) => {
                if (err) return reject(err);
                connection.beginTransaction((txErr) => {
                    if (txErr) {
                        connection.release();
                        return reject(txErr);
                    }
                    resolve(connection);
                });
            });
        });
    }

    /**
     * 在事务连接上执行 SQL 查询
     * @param {Connection} connection 事务连接对象
     * @param {string} sql SQL 语句
     * @param {Array} params 参数化查询的参数
     * @returns {Promise} 查询结果
     */
    static query(connection, sql, params) {
        return new Promise((resolve, reject) => {
            connection.query(sql, params, (error, results) => {
                if (error) return reject(error);
                resolve(results);
            });
        });
    }

    /**
     * 提交事务并释放连接
     * @param {Connection} connection 事务连接对象
     */
    static commit(connection) {
        return new Promise((resolve, reject) => {
            connection.commit((err) => {
                if (err) {
                    return Transaction.rollback(connection).then(() => reject(err));
                }
                connection.release();
                resolve();
            });
        });
    }

    /**
     * 回滚事务并释放连接
     * @param {Connection} connection 事务连接对象
     */
    static rollback(connection) {
        return new Promise((resolve) => {
            connection.rollback(() => {
                connection.release();
                resolve();
            });
        });
    }
}

module.exports = { Transaction };
