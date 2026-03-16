/**
 * 定时任务管理器
 * @description 注册系统级定时任务（如附件清理），在 app.js 启动时调用
 *              所有数据库操作均通过 DAO 层完成，路径配置从 base.js 读取
 */
const schedule = require('node-schedule');
const CommonDao = require('../dao/commonDao');
const { resolveFilePath } = require('../config/base');
const fs = require('fs');

class TimedTask {
    constructor() {
        this.initCleanupJob();
    }

    /**
     * 附件清理定时任务
     * @description 每日凌晨 3:00 自动清理：创建超过 24 小时且 is_used=0 的废弃附件
     *              通过 CommonDao 获取待清理列表和执行删除，路径通过 base.resolveFilePath 解析
     */
    initCleanupJob() {
        schedule.scheduleJob('0 0 3 * * *', async () => {
            console.log('[定时清理] 开始扫描未使用的附件...');

            try {
                // 通过 DAO 查询待清理附件
                const attachments = await CommonDao.getExpiredUnusedAttachments();

                if (!attachments.length) {
                    console.log('[定时清理] 无需清理的废弃附件');
                    return;
                }

                console.log(`[定时清理] 发现 ${attachments.length} 个废弃附件，开始清理...`);

                for (const attachment of attachments) {
                    // 通过 base.js 配置解析文件物理路径
                    const filePath = resolveFilePath(attachment.file_url);
                    if (fs.existsSync(filePath)) {
                        fs.unlinkSync(filePath);
                        console.log(`[定时清理] 已删除文件: ${filePath}`);
                    }

                    // 通过 DAO 删除数据库记录
                    await CommonDao.deleteAttachmentById(attachment.id);
                }

                console.log(`[定时清理] 清理完成，共处理 ${attachments.length} 个废弃附件`);
            } catch (err) {
                console.error('[定时清理] 执行失败:', err.message);
            }
        });

        console.log('[定时清理] 附件清理任务已注册 (每日 03:00 执行)');
    }
}

module.exports = { TimedTask };
