/**
 * 基础配置
 * @description 服务名、数据库连接、静态资源路径、路由白名单等全局配置
 *              所有路径相关配置统一从此文件读取，禁止在局部代码中硬编码
 */
const path = require('path');

const serverName = '';  // 服务名，本地开发用空字符串；线上部署可改为 '/portal'

// 项目根目录（portal-server/）
const rootPath = path.resolve(__dirname, '../..');

module.exports = {
    // 数据库配置
    host: '127.0.0.1',
    port: 3306,
    user: 'root',
    password: 'yang.19960525',
    database: 'portal_db',

    // 服务名 
    serverName,

    // ============ 静态资源路径配置 ============
    rootPath,                                                   // 项目根目录绝对路径
    uploadBasePath: '/public',                                  // 静态资源 URL 前缀（Express 托管路径）
    imgPath: '/images/',                                        // 图片子目录
    uploadDir: path.join(rootPath, 'public/images'),            // 图片上传物理目录（绝对路径）
    publicDir: path.join(rootPath, 'public'),                   // 静态资源根物理目录

    /**
     * 根据附件的 file_url（相对路径）拼接出物理绝对路径
     * @param {string} fileUrl 附件的相对路径，如 /public/images/xxx.jpg
     * @returns {string} 绝对路径
     */
    resolveFilePath: (fileUrl) => path.join(rootPath, fileUrl),

    /**
     * 根据文件名拼接出前端访问的 URL 路径
     * @param {string} filename 文件名
     * @returns {string} URL 路径，如 /public/images/xxx.jpg
     */
    buildFileUrl: (filename) => `/public/images/${filename}`,

    // ============ 路由白名单 ============
    // 不需要 Token 验证的路由
    filterRouter: [
        serverName + '/api/v1/sys/login',               // 管理员登录
        serverName + '/api/v1/profile',                  // 获取个人配置（前台）
        serverName + '/api/v1/category/list',            // 获取分类列表（前台）
        serverName + '/api/v1/tag/list',                 // 获取标签列表（前台）
        serverName + '/api/v1/article/list',             // 获取文章列表（前台）
        /^.*\/api\/v1\/article\/\d+$/,                   // 获取文章详情（前台，动态路由）
        serverName + '/api/v1/project/list',             // 获取项目列表（前台）
        /^.*\/api\/v1\/project\/\d+$/,                   // 获取项目详情（前台，动态路由）
        serverName + '/api/v1/common/visit',              // 访客流量上报（前台）
    ]
}
