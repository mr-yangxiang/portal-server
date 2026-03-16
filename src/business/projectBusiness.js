/**
 * 项目 Controller
 * @description 处理项目的列表、详情、新增/编辑、删除请求
 */
const ProjectService = require('../dao/projectDao');
const CommonDao = require('../dao/commonDao');
const { errorCode, errorMessage } = require('../config/errorCode');
const { uploadBasePath } = require('../config/base');

/**
 * @author: yx
 * @method: 分页获取项目列表（前台无需鉴权）
 */
exports.getProjectListController = (req, res) => {
    const { page, pageSize } = req.query;

    ProjectService.getProjectList({ page, pageSize }).then((data) => {
        res.send({ code: 200, data });
    }).catch(err => res.send({
        code: err.code || errorCode.UNKNOW,
        message: err.message || errorMessage.UNKNOW
    }));
}

/**
 * @author: yx
 * @method: 获取项目详情（前台无需鉴权）
 */
exports.getProjectDetailController = (req, res) => {
    ProjectService.getProjectDetail(req.params.id).then((data) => {
        if (!data) {
            return res.send({
                code: errorCode.PROJECTNOTEXIST,
                message: errorMessage.PROJECTNOTEXIST
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
 * @method: 项目 Upsert（需鉴权）
 */
exports.upsertProjectController = (req, res) => {
    ProjectService.upsertProject(req.body).then((data) => {
        // 异步标记项目架构图中引用的图片附件为已使用，不阻塞响应
        if (req.body.arch_images) {
            try {
                const arr = JSON.parse(req.body.arch_images);
                const imageUrls = (Array.isArray(arr) ? arr : []).filter(url => url && url.startsWith(uploadBasePath));
                if (imageUrls.length > 0) {
                    CommonDao.markAttachmentsUsed(imageUrls).catch(err => {
                        console.error('[附件绑定] 标记失败:', err.message);
                    });
                }
            } catch (e) { /* arch_images 不是合法 JSON，忽略 */ }
        }

        res.send({
            code: 200,
            data,
            message: req.body.id ? '项目更新成功！' : '项目创建成功！'
        });
    }).catch(err => res.send({
        code: err.code || errorCode.UNKNOW,
        message: err.message || errorMessage.UNKNOW
    }));
}

/**
 * @author: yx
 * @method: 逻辑删除项目（需鉴权）
 */
exports.deleteProjectController = (req, res) => {
    ProjectService.deleteProject(req.params.id).then(() => {
        res.send({ code: 200, message: '项目删除成功！' });
    }).catch(err => res.send({
        code: err.code || errorCode.UNKNOW,
        message: err.message || errorMessage.UNKNOW
    }));
}
