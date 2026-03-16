/**
 * 文章 DAO
 * @description biz_article 表 + rel_article_tag 关联表的数据库操作，Upsert 使用事务保护
 */
const { errorCode } = require('../config/errorCode');
const { Transaction } = require('../utils/Transaction');

/**
 * @author: yx
 * @method: 分页获取文章列表（支持按分类/标签筛选）
 * @param {Object} params { page, pageSize, categoryId, tagId }
 * @Date: 2026-03-13
 */
exports.getArticleList = ({ page = 1, pageSize = 10, categoryId, tagId, keyword }) => {
    return new Promise(async (resolve, reject) => {
        try {
            const offset = (page - 1) * pageSize;
            let whereClauses = ['a.status = 1'];
            let params = [];
            let joinClause = '';

            if (keyword) {
                whereClauses.push('a.title LIKE ?');
                params.push(`%${keyword}%`);
            }

            if (categoryId) {
                whereClauses.push('a.category_id = ?');
                params.push(categoryId);
            }

            if (tagId) {
                joinClause = 'INNER JOIN rel_article_tag rat ON a.id = rat.article_id';
                whereClauses.push('rat.tag_id = ?');
                params.push(tagId);
            }

            const whereSQL = whereClauses.join(' AND ');

            // 查询总数
            const countResults = await global.query(
                `SELECT COUNT(DISTINCT a.id) as total FROM biz_article a ${joinClause} WHERE ${whereSQL}`,
                params
            );
            const total = countResults[0].total;

            // 查询分页数据（关联分类名称）
            const results = await global.query(
                `SELECT DISTINCT a.id, a.title, a.summary, a.category_id, c.category_name,
                        a.cover_images, a.view_count, a.status, a.created_at, a.updated_at
                 FROM biz_article a
                 LEFT JOIN sys_category c ON a.category_id = c.id
                 ${joinClause}
                 WHERE ${whereSQL}
                 ORDER BY a.created_at DESC
                 LIMIT ?, ?`,
                [...params, offset, parseInt(pageSize)]
            );

            const list = results.map(x => Object.assign({}, x));

            // 批量查询每篇文章关联的标签
            for (let article of list) {
                const tags = await global.query(
                    `SELECT t.id, t.tag_name, t.tag_color
                     FROM sys_tag t INNER JOIN rel_article_tag rat ON t.id = rat.tag_id
                     WHERE rat.article_id = ?`,
                    [article.id]
                );
                article.tags = tags.map(t => Object.assign({}, t));
            }

            resolve({ list, total, page: parseInt(page), pageSize: parseInt(pageSize) });
        } catch (err) {
            reject({ code: errorCode.UNKNOW, message: err.message });
        }
    });
}

/**
 * @author: yx
 * @method: 获取文章详情（异步自增浏览量）
 * @param {number} id 文章 ID
 * @Date: 2026-03-13
 */
exports.getArticleDetail = (id) => {
    return new Promise(async (resolve, reject) => {
        try {
            const results = await global.query(
                `SELECT a.*, c.category_name
                 FROM biz_article a
                 LEFT JOIN sys_category c ON a.category_id = c.id
                 WHERE a.id = ? AND a.status = 1`,
                [id]
            );

            if (!results.length) return resolve(null);

            const article = Object.assign({}, results[0]);

            // 查询关联标签
            const tags = await global.query(
                `SELECT t.id, t.tag_name, t.tag_color
                 FROM sys_tag t INNER JOIN rel_article_tag rat ON t.id = rat.tag_id
                 WHERE rat.article_id = ?`,
                [id]
            );
            article.tags = tags.map(t => Object.assign({}, t));

            // 异步自增浏览量（不阻塞返回）
            global.query('UPDATE biz_article SET view_count = view_count + 1 WHERE id = ?', [id])
                .catch(err => console.error('[浏览量自增] 失败:', err.message));

            resolve(article);
        } catch (err) {
            reject({ code: errorCode.UNKNOW, message: err.message });
        }
    });
}

/**
 * @author: yx
 * @method: 文章 Upsert（事务保护：文章主体 + 标签映射表的原子性操作）
 * @param {Object} data { id, title, content, summary, category_id, cover_images, tag_ids }
 * @Date: 2026-03-13
 */
exports.upsertArticle = (data) => {
    return new Promise(async (resolve, reject) => {
        const conn = await Transaction.begin();
        try {
            let articleId = data.id;

            if (data.id) {
                // 更新文章主体
                await Transaction.query(conn,
                    'UPDATE biz_article SET title=?, content=?, summary=?, category_id=?, cover_images=? WHERE id=?',
                    [data.title, data.content, data.summary || '', data.category_id, data.cover_images || null, data.id]
                );
                // 清除旧的标签映射
                await Transaction.query(conn, 'DELETE FROM rel_article_tag WHERE article_id = ?', [data.id]);
            } else {
                // 新增文章
                const results = await Transaction.query(conn,
                    'INSERT INTO biz_article (title, content, summary, category_id, cover_images) VALUES (?, ?, ?, ?, ?)',
                    [data.title, data.content, data.summary || '', data.category_id, data.cover_images || null]
                );
                articleId = results.insertId;
            }

            // 批量插入新的标签映射
            if (data.tag_ids && data.tag_ids.length > 0) {
                const values = data.tag_ids.map(tagId => [articleId, tagId]);
                const placeholders = values.map(() => '(?, ?)').join(', ');
                const flatValues = values.flat();
                await Transaction.query(conn,
                    `INSERT INTO rel_article_tag (article_id, tag_id) VALUES ${placeholders}`,
                    flatValues
                );
            }

            await Transaction.commit(conn);
            resolve({ id: articleId });
        } catch (err) {
            await Transaction.rollback(conn);
            reject({ code: errorCode.UNKNOW, message: err.message });
        }
    });
}

/**
 * @author: yx
 * @method: 逻辑删除文章
 * @param {number} id 文章 ID
 * @Date: 2026-03-13
 */
exports.deleteArticle = (id) => {
    return new Promise((resolve, reject) => {
        try {
            global.query('UPDATE biz_article SET status = 0 WHERE id = ?', [id]).then(() => {
                resolve();
            }).catch(err => reject(err));
        } catch (err) {
            reject({ code: errorCode.UNKNOW, message: err.message });
        }
    });
}
