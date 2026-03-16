/**
 * 个人配置 Controller
 * @description 处理个人配置的获取与保存请求
 */
const ProfileService = require('../dao/profileDao');
const CommonDao = require('../dao/commonDao');
const { errorCode, errorMessage } = require('../config/errorCode');
const { uploadBasePath } = require('../config/base');

/**
 * @author: yx
 * @method: 获取个人配置（前台无需鉴权）
 * @param {*} req 请求体
 * @param {*} res 返回体
 * @Date: 2026-03-13
 */
exports.getProfileController = (req, res) => {
    ProfileService.getProfile().then((data) => {
        res.send({ code: 200, data });
    }).catch(err => res.send({
        code: err.code || errorCode.UNKNOW,
        message: err.message || errorMessage.UNKNOW
    }));
}

/**
 * @author: yx
 * @method: 保存个人配置（需鉴权，Upsert 机制）
 * @param {*} req 请求体
 * @param {*} res 返回体
 * @Date: 2026-03-13
 */
exports.saveProfileController = (req, res) => {
    ProfileService.saveProfile(req.body).then(() => {
        // 异步标记配置中引用的图片附件为已使用，不阻塞响应
        const imageUrls = [];
        if (req.body.avatar_url && req.body.avatar_url.startsWith(uploadBasePath)) {
            imageUrls.push(req.body.avatar_url);
        }
        // 从简历 HTML 正文中提取本站图片
        if (req.body.resume_content) {
            const regex = new RegExp(`(${uploadBasePath.replace('/', '\\/')}\\/[^"'\\s]+)`, 'g');
            let match;
            while ((match = regex.exec(req.body.resume_content)) !== null) {
                imageUrls.push(match[1]);
            }
        }
        if (imageUrls.length > 0) {
            CommonDao.markAttachmentsUsed([...new Set(imageUrls)]).catch(err => {
                console.error('[附件绑定] 标记失败:', err.message);
            });
        }

        res.send({ code: 200, message: '配置保存成功！' });
    }).catch(err => res.send({
        code: err.code || errorCode.UNKNOW,
        message: err.message || errorMessage.UNKNOW
    }));
}
