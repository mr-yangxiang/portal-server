const pool = require('./src/config/pool');

const checkData = async () => {
    try {
        const [rows] = await pool.promise().query("SELECT * FROM sys_profile");
        console.log(rows);
    } catch (e) {
        console.error('Query failed:', e);
    } finally {
        pool.end();
    }
};

checkData();
