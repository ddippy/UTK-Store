require("dotenv").config();

const pool = require("./db/pool");

async function testDatabase() {
    try {
        const result = await pool.query("SELECT NOW()");

        console.log("เชื่อมต่อ PostgreSQL สำเร็จ");
        console.log(result.rows[0]);

    } catch (error) {
        console.error("เชื่อมต่อไม่สำเร็จ");
        console.error(error);
    } finally {
        await pool.end();
    }
}

testDatabase();