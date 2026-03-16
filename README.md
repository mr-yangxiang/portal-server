# Portal Server — 个人数字门户系统后端服务

基于 **Node.js + Express** 的 RESTful API 服务，采用 **Router → Business → DAO** 三层 MVC 架构，为个人数字门户系统提供文章管理、项目展示、简历配置、访客统计等完整后端能力。

## 技术栈

| 类别 | 技术 | 版本 |
|------|------|------|
| 运行时 | Node.js | ≥ 16 |
| Web 框架 | Express | 4.21 |
| 数据库 | MySQL | 5.7+ / 8.0 |
| 数据库驱动 | mysql2 | 3.11 |
| 身份认证 | jsonwebtoken + express-jwt | 9.0 / 6.1 |
| 参数校验 | @hapi/joi + @escook/express-joi | 17.1 / 1.1 |
| 密码加密 | bcryptjs | 2.4 |
| 文件上传 | multer | 1.4 |
| 定时任务 | node-schedule | 2.1 |
| 跨域 | cors | 2.8 |

## 目录结构

```
portal-server/
├── app.js                      # Express 服务入口（中间件注册、路由挂载、全局错误处理）
├── package.json
├── database/
│   └── init.sql                # 数据库初始化脚本（11 张表 + 种子数据）
├── public/                     # 静态资源目录（上传的图片文件）
│   └── images/                 # multer 写入目录
└── src/
    ├── config/                 # 全局配置
    │   ├── base.js             # 数据库连接、路径常量、JWT 白名单
    │   ├── pool.js             # MySQL 连接池（mysql2）
    │   ├── jwtSecretKey.js     # JWT 密钥
    │   └── errorCode.js        # 统一错误码 & 错误消息映射
    ├── middle/                 # 中间件
    │   └── global.js           # Token 解析中间件 + 操作审计日志中间件工厂
    ├── router/                 # 路由层（接收请求、绑定校验与审计）
    │   ├── sys.js              # /api/v1/sys — 登录、修改密码
    │   ├── profile.js          # /api/v1/profile — 个人配置
    │   ├── category.js         # /api/v1/category — 分类管理
    │   ├── tag.js              # /api/v1/tag — 标签管理
    │   ├── article.js          # /api/v1/article — 文章管理
    │   ├── project.js          # /api/v1/project — 项目管理
    │   └── common.js           # /api/v1/common — 上传、日志、仪表盘、访客统计
    ├── business/               # 业务层（请求参数处理、业务编排、响应组装）
    │   ├── userBusiness.js     # 登录鉴权、密码修改
    │   ├── profileBusiness.js  # 个人配置读写
    │   ├── categoryBusiness.js # 分类 CRUD
    │   ├── tagBusiness.js      # 标签 CRUD
    │   ├── articleBusiness.js  # 文章 Upsert、列表、详情、删除
    │   ├── projectBusiness.js  # 项目 Upsert、列表、详情、删除
    │   └── commonBusiness.js   # 文件上传、审计日志、仪表盘、访客统计
    ├── dao/                    # 数据访问层（纯 SQL，不含业务逻辑）
    │   ├── userDao.js          # sys_user 表操作
    │   ├── profileDao.js       # sys_profile 表操作
    │   ├── categoryDao.js      # sys_category 表操作
    │   ├── tagDao.js           # sys_tag 表操作（事务删除）
    │   ├── articleDao.js       # biz_article + rel_article_tag 操作（事务 Upsert）
    │   ├── projectDao.js       # biz_project + rel_project_tag 操作（事务 Upsert）
    │   └── commonDao.js        # sys_attachment / sys_log / sys_visit 操作
    └── utils/                  # 工具模块
        ├── mysql.js            # Promise 化数据库查询封装（全局挂载 global.query）
        ├── Transaction.js      # 手动事务封装（begin / query / commit / rollback）
        ├── check.js            # Joi 参数校验规则定义
        ├── multer.js           # multer 上传配置（文件类型过滤、大小限制）
        └── TimedTask.js        # 定时任务（每日 03:00 清理未使用附件）
```

## 快速开始

### 1. 环境准备

- **Node.js** ≥ 16
- **MySQL** 5.7+ 或 8.0
- **npm** 或 **yarn**

### 2. 初始化数据库

```bash
# 登录 MySQL，执行初始化脚本
mysql -u root -p < database/init.sql
```

脚本会自动创建 `portal_db` 数据库及全部 11 张表，并插入默认管理员账号。

### 3. 修改数据库配置

编辑 `src/config/base.js`，修改数据库连接信息：

```javascript
module.exports = {
    host: '127.0.0.1',
    port: 3306,
    user: 'root',
    password: '123456',    // 改为你的数据库密码
    database: 'portal_db',
    // ...
}
```

### 4. 安装依赖 & 启动

```bash
npm install
npm run dev
```

服务默认监听 **http://127.0.0.1:3000**。

## API 接口一览

所有接口统一前缀 `/api/v1`，返回格式 `{ code, data?, message }`。

### 用户模块 `/api/v1/sys`

| 方法 | 路径 | 鉴权 | 说明 |
|------|------|------|------|
| POST | `/login` | 否 | 管理员登录，返回 JWT Token |
| POST | `/change-password` | 是 | 修改密码 |

### 个人配置 `/api/v1/profile`

| 方法 | 路径 | 鉴权 | 说明 |
|------|------|------|------|
| GET | `/` | 否 | 获取个人配置（头像、昵称、简历等） |
| POST | `/save` | 是 | 保存个人配置 |

### 分类管理 `/api/v1/category`

| 方法 | 路径 | 鉴权 | 说明 |
|------|------|------|------|
| GET | `/list` | 否 | 获取所有分类 |
| POST | `/save` | 是 | 新增 / 编辑分类（Upsert） |
| DELETE | `/:id` | 是 | 逻辑删除分类 |

### 标签管理 `/api/v1/tag`

| 方法 | 路径 | 鉴权 | 说明 |
|------|------|------|------|
| GET | `/list` | 否 | 获取所有标签 |
| POST | `/save` | 是 | 新增 / 编辑标签（Upsert，防重名） |
| DELETE | `/:id` | 是 | 删除标签（事务清理关联） |

### 文章管理 `/api/v1/article`

| 方法 | 路径 | 鉴权 | 说明 |
|------|------|------|------|
| GET | `/list` | 否 | 文章列表（分页 + 分类/标签筛选） |
| GET | `/:id` | 否 | 文章详情（含标签、分类名，自增浏览量） |
| POST | `/save` | 是 | 新增 / 编辑文章（事务 Upsert + 标签映射） |
| DELETE | `/:id` | 是 | 逻辑删除文章 |

### 项目管理 `/api/v1/project`

| 方法 | 路径 | 鉴权 | 说明 |
|------|------|------|------|
| GET | `/list` | 否 | 项目列表（分页 + 分类筛选） |
| GET | `/:id` | 否 | 项目详情（含标签、分类名） |
| POST | `/save` | 是 | 新增 / 编辑项目（事务 Upsert + 标签映射） |
| DELETE | `/:id` | 是 | 逻辑删除项目 |

### 公共接口 `/api/v1/common`

| 方法 | 路径 | 鉴权 | 说明 |
|------|------|------|------|
| POST | `/visit` | 否 | 访客流量上报（前台页面自动调用） |
| POST | `/upload` | 是 | 文件上传（仅图片和 PDF） |
| GET | `/log/list` | 是 | 操作审计日志列表（分页） |
| GET | `/dashboard/stats` | 是 | 仪表盘统计数据 |
| GET | `/visit/stats` | 是 | 近 N 天 PV/UV 统计 |
| GET | `/visit/today` | 是 | 今日 PV/UV 概览 |

## 数据库

系统共包含 **11 张数据表**，分为三个域：

| 域 | 表名 | 说明 |
|----|------|------|
| 系统支撑 | `sys_user` | 管理员账号 |
| | `sys_profile` | 个人配置 / 简历（单例） |
| | `sys_category` | 全局分类字典 |
| | `sys_tag` | 技术标签库 |
| | `sys_attachment` | 静态资源附件管理 |
| | `sys_log` | 操作审计日志 |
| | `sys_visit` | 访客流量记录 |
| 核心业务 | `biz_article` | 技术文章主表 |
| | `biz_project` | 工程作品主表 |
| 关系映射 | `rel_article_tag` | 文章-标签多对多关联 |
| | `rel_project_tag` | 项目-标签多对多关联 |

完整建表语句见 `database/init.sql`。

## 核心机制

### JWT 鉴权

- 登录成功后签发 Token（有效期 7 天）
- `express-jwt` 全局拦截，白名单路由免鉴权
- Token 过期返回 `code: 200102`

### 操作审计

- 敏感接口（增删改）自动记录操作日志
- 日志包含：操作人、操作类型、请求详情（JSON）、IP 地址、时间戳

### 附件生命周期

- 上传时 `is_used = 0`（未绑定）
- 业务保存时自动提取图片 URL 并标记 `is_used = 1`
- 每日 03:00 定时清理超过 24 小时仍未绑定的附件（物理删除 + 数据库清理）

### 参数校验

- 所有写接口均通过 `@hapi/joi` 定义校验规则
- `@escook/express-joi` 自动拦截不合法参数，返回 `code: 300100`

## 默认账号

| 用户名 | 密码 |
|--------|------|
| admin | 123456 |
