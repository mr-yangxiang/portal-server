-- ============================================================
-- 个人数字门户系统 - 数据库初始化脚本
-- @description 创建 portal_db 数据库及全部 11 张核心数据表
-- @author yx
-- @date 2026-03-16
-- ============================================================

-- 创建数据库（如不存在）
CREATE DATABASE IF NOT EXISTS `portal_db` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;

USE `portal_db`;

-- ============================================================
-- 1. 系统基础支撑域（sys_）
-- ============================================================

-- 1.1 管理员用户表
CREATE TABLE IF NOT EXISTS `sys_user` (
  `id`         INT(11)      NOT NULL AUTO_INCREMENT COMMENT '用户唯一标识',
  `username`   VARCHAR(50)  NOT NULL COMMENT '管理员登录用户名',
  `password`   VARCHAR(255) NOT NULL COMMENT '密码（bcrypt 哈希存储）',
  `created_at` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '最后修改时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='管理员用户表';

-- 1.2 个人配置 / 简历表（单条记录，Upsert 机制）
CREATE TABLE IF NOT EXISTS `sys_profile` (
  `id`              INT(11)      NOT NULL AUTO_INCREMENT COMMENT '配置唯一标识',
  `avatar_url`      VARCHAR(500) DEFAULT NULL COMMENT '个人头像 URL',
  `nickname`        VARCHAR(100) DEFAULT NULL COMMENT '站点展示昵称',
  `bio`             VARCHAR(500) DEFAULT NULL COMMENT '一句话个人简介',
  `github_url`      VARCHAR(500) DEFAULT NULL COMMENT 'GitHub 主页链接',
  `resume_content`  TEXT         DEFAULT NULL COMMENT '简历正文（HTML 富文本）',
  `tech_tags`       VARCHAR(255) DEFAULT NULL COMMENT '首屏核心技术栈标签集合（逗号分隔）',
  `created_at`      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at`      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '最后修改时间',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='个人配置 / 简历表';

-- 1.3 全局分类字典表
CREATE TABLE IF NOT EXISTS `sys_category` (
  `id`            INT(11)     NOT NULL AUTO_INCREMENT COMMENT '分类唯一标识',
  `category_name` VARCHAR(50) NOT NULL COMMENT '分类名称（如：全栈实战、前端架构）',
  `sort_order`    INT(4)      NOT NULL DEFAULT 0 COMMENT '前台导航栏展示排序权重',
  `is_deleted`    TINYINT(1)  NOT NULL DEFAULT 0 COMMENT '逻辑删除标记（0正常，1已删除）',
  `created_at`    DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at`    DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '最后修改时间',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='全局分类字典表';

-- 1.4 技术标签库表
CREATE TABLE IF NOT EXISTS `sys_tag` (
  `id`         INT(11)     NOT NULL AUTO_INCREMENT COMMENT '标签唯一标识',
  `tag_name`   VARCHAR(50) NOT NULL COMMENT '技术标签名（如：Vue3, MySQL）',
  `tag_color`  VARCHAR(20) DEFAULT '#409EFF' COMMENT '前台 Tag 卡片高亮主题色（HEX 码）',
  `created_at` DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '最后修改时间',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='技术标签库表';

-- 1.5 静态资源（附件）管理表
CREATE TABLE IF NOT EXISTS `sys_attachment` (
  `id`         INT(11)      NOT NULL AUTO_INCREMENT COMMENT '资源唯一标识',
  `file_name`  VARCHAR(255) NOT NULL COMMENT '上传时的原始文件名',
  `file_url`   VARCHAR(500) NOT NULL COMMENT '服务器相对路径（如 /public/images/xxx.jpg）',
  `file_size`  INT(11)      NOT NULL DEFAULT 0 COMMENT '文件大小（字节）',
  `is_used`    TINYINT(1)   NOT NULL DEFAULT 0 COMMENT '绑定状态（0:未使用，1:已绑定业务主表）',
  `created_at` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '最后修改时间',
  PRIMARY KEY (`id`),
  KEY `idx_is_used_created` (`is_used`, `created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='静态资源（附件）管理表';

-- 1.6 系统操作审计日志表
CREATE TABLE IF NOT EXISTS `sys_log` (
  `id`           INT(11)      NOT NULL AUTO_INCREMENT COMMENT '日志流水号',
  `operator_id`  INT(11)      NOT NULL DEFAULT 0 COMMENT '操作人 ID（sys_user.id）',
  `operate_type` VARCHAR(255) NOT NULL COMMENT '动作类型（如：LOGIN、SAVE_ARTICLE）',
  `detail`       TEXT         DEFAULT NULL COMMENT '操作详情（JSON 格式，记录请求方法、路径与参数）',
  `ip_address`   VARCHAR(255) DEFAULT NULL COMMENT '操作者的 IP 地址',
  `created_at`   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at`   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '最后修改时间',
  PRIMARY KEY (`id`),
  KEY `idx_operator_id` (`operator_id`),
  KEY `idx_operate_type` (`operate_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='系统操作审计日志表';

-- 1.7 访客流量记录表
CREATE TABLE IF NOT EXISTS `sys_visit` (
  `id`         INT(11)      NOT NULL AUTO_INCREMENT COMMENT '访问记录唯一标识',
  `ip`         VARCHAR(50)  DEFAULT NULL COMMENT '访客 IP 地址',
  `user_agent` VARCHAR(500) DEFAULT NULL COMMENT '浏览器 User-Agent 信息',
  `page_path`  VARCHAR(255) DEFAULT NULL COMMENT '访问的页面路径（如 /、/article/1）',
  `referer`    VARCHAR(500) DEFAULT NULL COMMENT '来源页面 URL',
  `created_at` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '访问时间',
  PRIMARY KEY (`id`),
  KEY `idx_created_at` (`created_at`),
  KEY `idx_ip` (`ip`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='访客流量记录表';

-- ============================================================
-- 2. 核心业务域（biz_）
-- ============================================================

-- 2.1 技术文章主表
CREATE TABLE IF NOT EXISTS `biz_article` (
  `id`           INT(11)      NOT NULL AUTO_INCREMENT COMMENT '文章唯一标识',
  `title`        VARCHAR(200) NOT NULL COMMENT '文章标题',
  `content`      LONGTEXT     NOT NULL COMMENT '文章正文（HTML 富文本）',
  `summary`      VARCHAR(500) DEFAULT NULL COMMENT '摘要（用于列表卡片展示）',
  `category_id`  INT(11)      NOT NULL COMMENT '所属分类 ID（sys_category.id）',
  `cover_images` TEXT         DEFAULT NULL COMMENT '封面图 URL（JSON 数组或单个路径）',
  `view_count`   INT(11)      NOT NULL DEFAULT 0 COMMENT '浏览量计数器',
  `status`       TINYINT(1)   NOT NULL DEFAULT 1 COMMENT '发布状态（1正常，0已删除/隐藏）',
  `created_at`   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at`   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '最后修改时间',
  PRIMARY KEY (`id`),
  KEY `idx_category_id` (`category_id`),
  KEY `idx_status_created` (`status`, `created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='技术文章主表';

-- 2.2 工程作品主表
CREATE TABLE IF NOT EXISTS `biz_project` (
  `id`           INT(11)      NOT NULL AUTO_INCREMENT COMMENT '项目唯一标识',
  `project_name` VARCHAR(100) NOT NULL COMMENT '项目名称',
  `description`  TEXT         NOT NULL COMMENT '项目描述（Markdown 格式）',
  `arch_images`  TEXT         DEFAULT NULL COMMENT '架构图集（JSON 数组，存储图片 URL 列表）',
  `github_url`   VARCHAR(500) DEFAULT NULL COMMENT 'GitHub 仓库链接',
  `preview_url`  VARCHAR(500) DEFAULT NULL COMMENT '在线预览地址',
  `category_id`  INT(11)      NOT NULL COMMENT '所属分类 ID（sys_category.id）',
  `status`       TINYINT(1)   NOT NULL DEFAULT 1 COMMENT '发布状态（1正常，0已删除/隐藏）',
  `created_at`   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at`   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '最后修改时间',
  PRIMARY KEY (`id`),
  KEY `idx_category_id` (`category_id`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='工程作品主表';

-- ============================================================
-- 3. 业务关系映射域（rel_）
-- ============================================================

-- 3.1 文章-标签多对多关联表
CREATE TABLE IF NOT EXISTS `rel_article_tag` (
  `id`         INT(11) NOT NULL AUTO_INCREMENT COMMENT '关联记录 ID',
  `article_id` INT(11) NOT NULL COMMENT '文章 ID（biz_article.id）',
  `tag_id`     INT(11) NOT NULL COMMENT '标签 ID（sys_tag.id）',
  PRIMARY KEY (`id`),
  KEY `idx_article_id` (`article_id`),
  KEY `idx_tag_id` (`tag_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='文章-标签多对多关联表';

-- 3.2 项目-标签多对多关联表
CREATE TABLE IF NOT EXISTS `rel_project_tag` (
  `id`         INT(11) NOT NULL AUTO_INCREMENT COMMENT '关联记录 ID',
  `project_id` INT(11) NOT NULL COMMENT '项目 ID（biz_project.id）',
  `tag_id`     INT(11) NOT NULL COMMENT '标签 ID（sys_tag.id）',
  PRIMARY KEY (`id`),
  KEY `idx_project_id` (`project_id`),
  KEY `idx_tag_id` (`tag_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='项目-标签多对多关联表';

-- ============================================================
-- 4. 初始化种子数据
-- ============================================================

-- 默认管理员账号（密码: 123456，bcrypt 哈希）
INSERT INTO `sys_user` (`username`, `password`) VALUES
('admin', '$2a$10$VaF3GHPp.kwTURo1ggFh/./4HT36/KqyWfIdRwb6PGdPFAVX5Dl2S')
ON DUPLICATE KEY UPDATE `username` = VALUES(`username`);
