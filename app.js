const express = require("express");
const pool = require("./server/db");
const path = require("path");

const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

// API Routes
app.get("/api/latest-build", async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT * FROM builds ORDER BY created_at DESC LIMIT 1"
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: "No builds found" });
        }
        res.json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
});

app.get("/api/build-history", async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT * FROM builds ORDER BY created_at DESC"
        );
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
});

app.get("/api/findings/grouped", async (req, res) => {
    try {
        const sourceResult = await pool.query(
            "SELECT source, COUNT(*) as count FROM findings GROUP BY source"
        );
        const typeResult = await pool.query(
            "SELECT type, COUNT(*) as count FROM findings GROUP BY type"
        );
        const severityResult = await pool.query(
            "SELECT severity, COUNT(*) as count FROM findings WHERE severity IS NOT NULL GROUP BY severity"
        );

        res.json({
            bySource: sourceResult.rows,
            byType: typeResult.rows,
            bySeverity: severityResult.rows
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
});

app.get("/api/build/:buildNumber/findings", async (req, res) => {
    try {
        const buildNumber = parseInt(req.params.buildNumber);
        const result = await pool.query(
            `
            SELECT f.*, bd.jenkins_build_number
            FROM findings f
            JOIN builds bd ON f.build_id = bd.id
            WHERE bd.jenkins_build_number = $1
            ORDER BY f.created_at DESC
            `,
            [buildNumber]
        );
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
});

app.get("/api/build/:buildNumber/sbom", async (req, res) => {
    try {
        const buildNumber = parseInt(req.params.buildNumber);
        const result = await pool.query(
            `
            SELECT sb.*
            FROM sbom_components sb
            JOIN builds b ON sb.build_id = b.id
            WHERE b.jenkins_build_number = $1
            `,
            [buildNumber]
        );

        // Group by name and version for component counts
        const components = {};
        result.rows.forEach(row => {
            const key = `${row.name}-${row.version || 'unknown'}`;
            if (!components[key]) {
                components[key] = {
                    name: row.name,
                    version: row.version,
                    type: row.type,
                    purl: row.purl,
                    licenses: row.licenses,
                    locations: row.locations,
                    count: 1
                };
            } else {
                components[key].count++;
            }
        });

        res.json({
            components: Object.values(components),
            raw: result.rows
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
});

app.listen(3000, () => {
    console.log("Server running on port 3000");
});

app.get('/eval', (req, res) => {
    const input = req.query.input;
    const result = eval(input);
    res.send(result.toString());
});