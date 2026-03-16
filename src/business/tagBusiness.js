/**
 * 标签 Controller
 * @description 处理标签的列表、新增/编辑、删除请求
 */
const TagService = require('../dao/tagDao');
const { errorCode, errorMessage } = require('../config/errorCode');

/**
 * @author: yx
 * @method: 获取标签列表（前台无需鉴权）
 */
exports.getTagListController = (req, res) => {
    TagService.getTagList().then((data) => {
        res.send({ code: 200, data });
    }).catch(err => res.send({
        code: err.code || errorCode.UNKNOW,
        message: err.message || errorMessage.UNKNOW
    }));
}

/**
 * @author: yx
 * @method: 标签 Upsert（有 id 更新，无 id 新增，含防重名校验）
 */
exports.upsertTagController = (req, res) => {
    TagService.upsertTag(req.body).then((data) => {
        res.send({
            code: 200,
            data,
            message: req.body.id ? '标签更新成功！' : '标签新增成功！'
        });
    }).catch(err => res.send({
        code: err.code || errorCode.UNKNOW,
        message: err.message || errorMessage.UNKNOW
    }));
}

/**
 * @author: yx
 * @method: 删除标签（同步清理关联关系）
 */
exports.deleteTagController = (req, res) => {
    TagService.deleteTag(req.params.id).then(() => {
        res.send({ code: 200, message: '标签删除成功！' });
    }).catch(err => res.send({
        code: err.code || errorCode.UNKNOW,
        message: err.message || errorMessage.UNKNOW
    }));
}
