/**
 * 请求参数校验规则
 * @description 使用 Joi 定义各接口的参数校验规则，在路由层通过 express-joi 中间件自动校验
 */
const Joi = require('joi');

const base = Joi.string().allow('').allow(null);                        // 可为空的字符串
const REQUIREDSTRING = Joi.string().required();                         // 不能为空的字符串
const POSITIVEINTEGER = Joi.number().min(0).integer().allow('').allow(null);  // 非负整数（可为空）
const POSITIVEINTEGERREQUIRED = Joi.number().min(1).integer().required(); // 大于 0 的必填正整数
const NUMBERARRAY = Joi.array().items(Joi.number().min(0).integer());   // 整数数组
const boolean = Joi.boolean().falsy('N');                               // 布尔值

// =============================== 登录 ===============================

/** 管理员登录校验 */
exports.loginCheck = {
    body: {
        username: REQUIREDSTRING,
        password: REQUIREDSTRING
    }
}

/** 修改密码校验 */
exports.changePasswordCheck = {
    body: {
        oldPassword: REQUIREDSTRING,
        newPassword: Joi.string().min(6).required()   // 新密码至少 6 位
    }
}

// =============================== 个人配置 ===============================

/** 更新个人配置校验 */
exports.updateProfileCheck = {
    body: {
        avatar_url: base,
        nickname: base,
        bio: base,
        github_url: base,
        resume_content: base
    }
}

// =============================== 分类 ===============================

/** 分类 Upsert 校验 */
exports.upsertCategoryCheck = {
    body: {
        id: POSITIVEINTEGER,
        category_name: REQUIREDSTRING,
        sort_order: POSITIVEINTEGER
    }
}

// =============================== 标签 ===============================

/** 标签 Upsert 校验 */
exports.upsertTagCheck = {
    body: {
        id: POSITIVEINTEGER,
        tag_name: REQUIREDSTRING,
        tag_color: base
    }
}

// =============================== 文章 ===============================

/** 文章 Upsert 校验 */
exports.upsertArticleCheck = {
    body: {
        id: POSITIVEINTEGER,
        title: REQUIREDSTRING,
        content: REQUIREDSTRING,
        summary: base,
        category_id: POSITIVEINTEGERREQUIRED,
        cover_images: base,
        tag_ids: NUMBERARRAY
    }
}

/** 文章列表校验 */
exports.articleListCheck = {
    query: {
        page: POSITIVEINTEGER,
        pageSize: POSITIVEINTEGER,
        categoryId: POSITIVEINTEGER,
        tagId: POSITIVEINTEGER
    }
}

// =============================== 项目 ===============================

/** 项目 Upsert 校验 */
exports.upsertProjectCheck = {
    body: {
        id: POSITIVEINTEGER,
        project_name: REQUIREDSTRING,
        description: REQUIREDSTRING,
        arch_images: base,
        github_url: base,
        preview_url: base,
        category_id: POSITIVEINTEGERREQUIRED,
        tag_ids: NUMBERARRAY
    }
}

// =============================== 公共 ===============================

/** ID 参数校验（路由参数）*/
exports.idParamCheck = {
    params: {
        id: POSITIVEINTEGERREQUIRED
    }
}

/** 分页列表校验 */
exports.listCheck = {
    body: {
        keywords: base,
        currentPage: POSITIVEINTEGER,
        limit: POSITIVEINTEGER,
        needTotal: boolean
    }
}
