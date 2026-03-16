/**
 * MySQL 连接池配置
 * @description 使用 mysql2 创建连接池，全局复用 TCP 连接
 */
const mysql = require('mysql2');
const config = require('./base');

const pool = mysql.createPool({
    host: config.host,
    port: config.port,
    user: config.user,
    password: config.password,
    database: config.database,
    connectionLimit: 10,            // 最大连接数
    waitForConnections: true,       // 无可用连接时排队等待
    queueLimit: 0,                  // 排队无上限
    charset: 'utf8mb4',
    dateStrings: true,              // 强制把数据库的 Datetime/Timestamp 原样转为字符串而非 js 的 Date 对象
    timezone: '+08:00'              // 锁定东八区时区，防止时区发生八小时偏移
});

module.exports = pool;
