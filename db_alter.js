const pool = require('./src/config/pool');

const alterTable = async () => {
    try {
        await pool.promise().query("ALTER TABLE sys_profile ADD COLUMN tech_tags VARCHAR(255) DEFAULT '' COMMENT '技术栈标签（逗号分隔）'");
        console.log('ALTER TABLE success');
    } catch (e) {
        if (e.code === 'ER_DUP_FIELDNAME') {
            console.log('Column already exists');
        } else {
            console.error('ALTER TABLE failed:', e);
        }
    } finally {
        pool.end();
    }
};

alterTable();
