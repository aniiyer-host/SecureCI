const pool = require("./db");

describe("Database connection", () => {
    afterAll(async () => {
        await pool.end();
    });

    test("connects to PostgreSQL", async () => {
        const result = await pool.query("SELECT NOW()");

        expect(result.rows).toHaveLength(1);
        expect(result.rows[0]).toHaveProperty("now");
    });
});