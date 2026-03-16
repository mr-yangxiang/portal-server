/**
 * ============================================================
 * 个人数字门户系统 - Express 服务入口
 * @description 基于 MVC 架构（Router → Business → DAO）
 * @author yx
 * @date 2026-03-13
 * ============================================================
 */
const express = require('express');
const app = express();
const expressJwt = require('express-jwt');
const { jwtSecretKey } = require('./src/config/jwtSecretKey');
const { serverName, filterRouter, uploadDir, publicDir, uploadBasePath } = require('./src/config/base');
const { userInfoMiddle } = require('./src/middle/global');
const { pool, query } = require('./src/utils/mysql');
const { TimedTask } = require('./src/utils/TimedTask');
const { errorCode, errorMessage } = require('./src/config/errorCode');
const path = require('path');
const fs = require('fs');
const Joi = require('@hapi/joi');

// ---- 全局挂载数据库查询方法 ----
global.pool = pool;
global.query = query;

// ---- 确保上传目录存在 ----
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// ---- 基础中间件 ----
const bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 跨域支持
const cors = require('cors');
app.use(cors());

// 静态文件托管（上传资源）
app.use(uploadBasePath, express.static(publicDir));

// ---- Token 解析中间件（express-jwt 自动拦截非白名单路由）----
app.use(expressJwt({ secret: jwtSecretKey, algorithms: ['HS256'] }).unless({ path: filterRouter }));

// ---- 自定义全局中间件 ----
app.use(userInfoMiddle);

// ---- 路由注册 ----
const sysRouter = require('./src/router/sys');
const profileRouter = require('./src/router/profile');
const categoryRouter = require('./src/router/category');
const tagRouter = require('./src/router/tag');
const articleRouter = require('./src/router/article');
const projectRouter = require('./src/router/project');
const commonRouter = require('./src/router/common');

app.use(serverName + '/api/v1/sys',        sysRouter);         // 登录
app.use(serverName + '/api/v1/profile',    profileRouter);     // 个人配置
app.use(serverName + '/api/v1/category',   categoryRouter);    // 分类管理
app.use(serverName + '/api/v1/tag',        tagRouter);         // 标签管理
app.use(serverName + '/api/v1/article',    articleRouter);     // 文章管理
app.use(serverName + '/api/v1/project',    projectRouter);     // 项目管理
app.use(serverName + '/api/v1/common',     commonRouter);      // 公共接口

// ---- 全局错误处理中间件 ----
app.use((err, req, res, next) => {
    // express-jwt 鉴权失败
    if (err.name === 'UnauthorizedError') {
        return res.send({
            code: errorCode.AUTHENTICATIONFAILED,
            message: errorMessage.AUTHENTICATIONFAILED
        });
    }

    // JWT 过期
    if (err.message && err.message === 'jwt expired') {
        return res.send({
            code: errorCode.TOKENEXPIRED,
            message: errorMessage.TOKENEXPIRED
        });
    }

    // Joi 参数校验失败或其他验证异常
    if (err instanceof Joi.ValidationError || err.name === 'ValidationError' || err.isJoi) {
        return res.send({
            code: errorCode.PARAMERROR,
            message: err.message || '参数校验未通过'
        });
    }

    // 其他未知错误，必须拦截返回给前端而不是 let it crash with 404
    console.error('[全局异常]', err);
    return res.status(500).send({
        code: errorCode.UNKNOW,
        message: 'Server Internal Error: ' + err.message
    });
});

// ---- 注册定时任务 ----
new TimedTask();

// ---- 启动服务 ----
app.listen(3000, () => {
    console.log('\n🚀 个人数字门户后端服务已启动');
    console.log('   地址: http://127.0.0.1:3000');
    console.log('   架构: Router → Business → DAO (MVC)\n');
});
