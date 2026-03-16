/**
 * 分类 Controller
 * @description 处理分类的列表、新增/编辑、删除请求
 */
const CategoryService = require('../dao/categoryDao');
const { errorCode, errorMessage } = require('../config/errorCode');

/**
 * @author: yx
 * @method: 获取分类列表（前台无需鉴权）
 * @param {*} req 请求体
 * @param {*} res 返回体
 * @Date: 2026-03-13
 */
exports.getCategoryListController = (req, res) => {
    CategoryService.getCategoryList().then((data) => {
        res.send({ code: 200, data });
    }).catch(err => res.send({
        code: err.code || errorCode.UNKNOW,
        message: err.message || errorMessage.UNKNOW
    }));
}

/**
 * @author: yx
 * @method: 分类 Upsert（有 id 更新，无 id 新增）
 * @param {*} req 请求体
 * @param {*} res 返回体
 * @Date: 2026-03-13
 */
exports.upsertCategoryController = (req, res) => {
    CategoryService.upsertCategory(req.body).then((data) => {
        res.send({
            code: 200,
            data,
            message: req.body.id ? '分类更新成功！' : '分类新增成功！'
        });
    }).catch(err => res.send({
        code: err.code || errorCode.UNKNOW,
        message: err.message || errorMessage.UNKNOW
    }));
}

/**
 * @author: yx
 * @method: 逻辑删除分类
 * @param {*} req 请求体
 * @param {*} res 返回体
 * @Date: 2026-03-13
 */
exports.deleteCategoryController = (req, res) => {
    CategoryService.deleteCategory(req.params.id).then(() => {
        res.send({ code: 200, message: '分类删除成功！' });
    }).catch(err => res.send({
        code: err.code || errorCode.UNKNOW,
        message: err.message || errorMessage.UNKNOW
    }));
}
