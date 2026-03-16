/**
 * 文章 Controller
 * @description 处理文章的列表、详情、新增/编辑、删除请求
 */
const ArticleService = require('../dao/articleDao');
const CommonDao = require('../dao/commonDao');
const { errorCode, errorMessage } = require('../config/errorCode');
const { uploadBasePath } = require('../config/base');

/**
 * 从 HTML 富文本和封面 JSON 中提取本站图片的相对路径
 * @param {string} content HTML 富文本
 * @param {string} coverImages 封面图 JSON 字符串
 * @returns {Array<string>} 图片路径数组（如 ['/public/images/xxx.jpg']）
 */
function extractImageUrls(content, coverImages) {
    const urls = [];
    // 从 HTML 中提取 src 属性中的本站图片路径
    if (content) {
        const regex = new RegExp(`(${uploadBasePath.replace('/', '\\/')}\\/[^"'\\s]+)`, 'g');
        let match;
        while ((match = regex.exec(content)) !== null) {
            urls.push(match[1]);
        }
    }
    // 从封面图 JSON 数组中提取
    if (coverImages) {
        try {
            const arr = JSON.parse(coverImages);
            if (Array.isArray(arr)) {
                arr.forEach(url => { if (url && url.startsWith(uploadBasePath)) urls.push(url); });
            }
        } catch (e) {
            if (coverImages.startsWith(uploadBasePath)) urls.push(coverImages);
        }
    }
    return [...new Set(urls)];
}

/**
 * @author: yx
 * @method: 分页获取文章列表（支持分类/标签筛选，前台无需鉴权）
 * @param {*} req 请求体 (query: page, pageSize, categoryId, tagId)
 * @param {*} res 返回体
 * @Date: 2026-03-13
 */
exports.getArticleListController = (req, res) => {
    const { page, pageSize, categoryId, tagId, keyword } = req.query;

    ArticleService.getArticleList({ page, pageSize, categoryId, tagId, keyword }).then((data) => {
        res.send({ code: 200, data });
    }).catch(err => res.send({
        code: err.code || errorCode.UNKNOW,
        message: err.message || errorMessage.UNKNOW
    }));
}

/**
 * @author: yx
 * @method: 获取文章详情（含浏览量自增，前台无需鉴权）
 * @param {*} req 请求体 (params: id)
 * @param {*} res 返回体
 * @Date: 2026-03-13
 */
exports.getArticleDetailController = (req, res) => {
    ArticleService.getArticleDetail(req.params.id).then((data) => {
        if (!data) {
            return res.send({
                code: errorCode.ARTICLENOTEXIST,
                message: errorMessage.ARTICLENOTEXIST
            });
        }
        res.send({ code: 200, data });
    }).catch(err => res.send({
        code: err.code || errorCode.UNKNOW,
        message: err.message || errorMessage.UNKNOW
    }));
}

/**
 * @author: yx
 * @method: 文章 Upsert（需鉴权，事务处理标签映射）
 * @param {*} req 请求体 (body: id, title, content, summary, category_id, cover_images, tag_ids)
 * @param {*} res 返回体
 * @Date: 2026-03-13
 */
exports.upsertArticleController = (req, res) => {
    ArticleService.upsertArticle(req.body).then((data) => {
        // 异步标记文章中引用的图片附件为已使用，不阻塞响应
        const imageUrls = extractImageUrls(req.body.content, req.body.cover_images);
        if (imageUrls.length > 0) {
            CommonDao.markAttachmentsUsed(imageUrls).catch(err => {
                console.error('[附件绑定] 标记失败:', err.message);
            });
        }

        res.send({
            code: 200,
            data,
            message: req.body.id ? '文章更新成功！' : '文章发布成功！'
        });
    }).catch(err => res.send({
        code: err.code || errorCode.UNKNOW,
        message: err.message || errorMessage.UNKNOW
    }));
}

/**
 * @author: yx
 * @method: 逻辑删除文章（需鉴权）
 * @param {*} req 请求体 (params: id)
 * @param {*} res 返回体
 * @Date: 2026-03-13
 */
exports.deleteArticleController = (req, res) => {
    ArticleService.deleteArticle(req.params.id).then(() => {
        res.send({ code: 200, message: '文章删除成功！' });
    }).catch(err => res.send({
        code: err.code || errorCode.UNKNOW,
        message: err.message || errorMessage.UNKNOW
    }));
}
