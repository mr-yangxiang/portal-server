/**
 * 用户 Business
 * @description 管理员登录、修改密码等业务编排，调用 userDao 完成数据操作
 */
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { jwtSecretKey } = require('../config/jwtSecretKey');
const UserDao = require('../dao/userDao');
const { errorCode, errorMessage } = require('../config/errorCode');

/**
 * @author: yx
 * @method: 管理员登录
 * @param {*} req 请求体
 * @param {*} res 返回体
 * @Date: 2026-03-13
 */
exports.loginController = async (req, res) => {
    try {
        const { username, password } = req.body;

        // 查询用户（携带密码字段）
        const user = await UserDao.getUserByUsername(username, true);

        if (!user) {
            return res.send({
                code: errorCode.WRONGPASSWORD,
                message: errorMessage.WRONGPASSWORD
            });
        }

        // bcrypt 密码比对
        const isMatch = bcrypt.compareSync(password, user.password);
        if (!isMatch) {
            return res.send({
                code: errorCode.WRONGPASSWORD,
                message: errorMessage.WRONGPASSWORD
            });
        }

        // 签发 JWT Token（有效期 7 天）
        const tokenPayload = { id: user.id, username: user.username };
        const token = 'Bearer ' + jwt.sign(tokenPayload, jwtSecretKey, { expiresIn: '7d' });

        // 挂载用户信息用于审计日志
        req.userInfo = tokenPayload;

        // 异步写入登录日志
        const rawIp = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.socket.remoteAddress || '';
        const ip = rawIp.split(',')[0].trim().replace(/^::ffff:/, '');
        UserDao.addLoginLog(user.id, ip).catch(err => {
            console.error('[登录日志] 写入失败:', err.message);
        });

        res.send({
            code: 200,
            data: { token, username: user.username },
            message: '登录成功！'
        });
    } catch (err) {
        res.send({
            code: err.code || errorCode.UNKNOW,
            message: err.message || errorMessage.UNKNOW
        });
    }
}

/**
 * @author: yx
 * @method: 修改密码（需鉴权，校验旧密码 → bcrypt 加密新密码 → 更新）
 * @param {*} req 请求体 { oldPassword, newPassword }
 * @param {*} res 返回体
 * @Date: 2026-03-13
 */
exports.changePasswordBusiness = async (req, res) => {
    try {
        const { oldPassword, newPassword } = req.body;
        const userId = req.userInfo.id;

        // 从 DAO 查询当前密码哈希
        const currentHash = await UserDao.getPasswordByUserId(userId);
        if (!currentHash) {
            return res.send({
                code: errorCode.USERNOTEXIST,
                message: errorMessage.USERNOTEXIST
            });
        }

        // 校验旧密码
        const isMatch = bcrypt.compareSync(oldPassword, currentHash);
        if (!isMatch) {
            return res.send({
                code: errorCode.WRONGPASSWORD,
                message: '旧密码错误！'
            });
        }

        // 加密新密码（10 轮盐值）
        const newHash = bcrypt.hashSync(newPassword, 10);

        // 通过 DAO 更新密码
        await UserDao.updatePassword(userId, newHash);

        res.send({
            code: 200,
            message: '密码修改成功，请重新登录！'
        });
    } catch (err) {
        res.send({
            code: err.code || errorCode.UNKNOW,
            message: err.message || errorMessage.UNKNOW
        });
    }
}

