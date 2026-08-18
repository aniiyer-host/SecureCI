const fs = require("fs");
const path = require("path");
const pool = require("./db");

function loadJson(filePath) {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

async function createBuild(buildNumber) {
    const result = await pool.query(
        `
        INSERT INTO builds (jenkins_build_number, status)
        VALUES ($1, $2)
        ON CONFLICT (jenkins_build_number)
        DO UPDATE SET status = EXCLUDED.status
        RETURNING id
        `,
        [buildNumber, "COMPLETED"]
    );

    return result.rows[0].id;
}

async function insertFinding(client, buildId, finding) {
    const result = await client.query(
        `
        INSERT INTO findings (
            build_id,
            fingerprint,
            source,
            type,
            severity,
            confidence,
            title,
            description
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
        ON CONFLICT (build_id, fingerprint)
        DO UPDATE SET
            severity = EXCLUDED.severity,
            confidence = EXCLUDED.confidence,
            title = EXCLUDED.title,
            description = EXCLUDED.description
        RETURNING id
        `,
        [
            buildId,
            finding.fingerprint,
            finding.source,
            finding.type,
            finding.severity || null,
            finding.confidence || null,
            finding.title || "",
            finding.description || null
        ]
    );

    return result.rows[0].id;
}

async function importSast(client, buildId, report) {
    for (const finding of report.findings || []) {
        const findingId = await insertFinding(client, buildId, finding);

        await client.query(
            `
            INSERT INTO sast_details (
                finding_id,
                rule_id,
                cwe,
                references_json,
                affected_files
            )
            VALUES ($1,$2,$3,$4,$5)
            ON CONFLICT (finding_id)
            DO UPDATE SET
                rule_id = EXCLUDED.rule_id,
                cwe = EXCLUDED.cwe,
                references_json = EXCLUDED.references_json,
                affected_files = EXCLUDED.affected_files
            `,
            [
                findingId,
                finding.rule_id || null,
                finding.cwe || null,
                JSON.stringify(finding.references || []),
                JSON.stringify(finding.affected_files || [])
            ]
        );
    }
}

async function importSca(client, buildId, report) {
    for (const finding of report.findings || []) {
        const findingId = await insertFinding(client, buildId, finding);

        await client.query(
            `
            INSERT INTO sca_details (
                finding_id,
                package,
                cvss,
                direct,
                cwe,
                affected_versions,
                fix_available,
                nodes,
                references_json
            )
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
            ON CONFLICT (finding_id)
            DO UPDATE SET
                package = EXCLUDED.package,
                cvss = EXCLUDED.cvss,
                direct = EXCLUDED.direct,
                cwe = EXCLUDED.cwe,
                affected_versions = EXCLUDED.affected_versions,
                fix_available = EXCLUDED.fix_available,
                nodes = EXCLUDED.nodes,
                references_json = EXCLUDED.references_json
            `,
            [
                findingId,
                finding.package || null,
                finding.cvss ?? null,
                finding.direct ?? false,
                JSON.stringify(finding.cwe || []),
                finding.affected_versions || null,
                finding.fix_available ?? false,
                JSON.stringify(finding.nodes || []),
                JSON.stringify(finding.references || [])
            ]
        );
    }
}

async function importDast(client, buildId, report) {
    for (const finding of report.findings || []) {
        const findingId = await insertFinding(client, buildId, finding);

        await client.query(
            `
            INSERT INTO dast_details (
                finding_id,
                plugin_id,
                cwe,
                affected_urls,
                instances,
                solution
            )
            VALUES ($1,$2,$3,$4,$5,$6)
            ON CONFLICT (finding_id)
            DO UPDATE SET
                plugin_id = EXCLUDED.plugin_id,
                cwe = EXCLUDED.cwe,
                affected_urls = EXCLUDED.affected_urls,
                instances = EXCLUDED.instances,
                solution = EXCLUDED.solution
            `,
            [
                findingId,
                finding.plugin_id || null,
                finding.cwe || null,
                JSON.stringify(finding.affected_urls || []),
                finding.instances || 0,
                finding.solution || null
            ]
        );
    }
}

async function importSbom(client, buildId, report) {
    for (const component of report.components || []) {
        await client.query(
            `
            INSERT INTO sbom_components (
                build_id,
                name,
                version,
                type,
                purl,
                licenses,
                locations
            )
            VALUES ($1,$2,$3,$4,$5,$6,$7)
            `,
            [
                buildId,
                component.name,
                component.version || null,
                component.type || null,
                component.purl || null,
                JSON.stringify(component.licenses || []),
                JSON.stringify(component.locations || [])
            ]
        );
    }
}

async function importBuild(buildNumber, reportsDirectory) {
    const client = await pool.connect();

    const reportFiles = [
    "sast-findings.json",
    "sca-findings.json",
    "dast-findings.json",
    "sbom.json"
];

const existingReports = reportFiles.filter(file =>
    fs.existsSync(path.join(reportsDirectory, file))
);

if (existingReports.length === 0) {
    client.release();

    throw new Error(
        `No normalized reports found in ${reportsDirectory}`
    );
}

    try {
        await client.query("BEGIN");

        const buildId = await createBuild(buildNumber);

        console.log(`Importing Jenkins Build #${buildNumber}`);
        console.log(`Database build ID: ${buildId}`);

        const sastPath = path.join(
            reportsDirectory,
            "sast-findings.json"
        );

        const scaPath = path.join(
            reportsDirectory,
            "sca-findings.json"
        );

        const dastPath = path.join(
            reportsDirectory,
            "dast-findings.json"
        );

        const sbomPath = path.join(
            reportsDirectory,
            "sbom.json"
        );

        if (fs.existsSync(sastPath)) {
            console.log("Importing SAST...");
            await importSast(
                client,
                buildId,
                loadJson(sastPath)
            );
        } else {
            console.log("SAST report not found.");
        }

        if (fs.existsSync(scaPath)) {
            console.log("Importing SCA...");
            await importSca(
                client,
                buildId,
                loadJson(scaPath)
            );
        } else {
            console.log("SCA report not found.");
        }

        if (fs.existsSync(dastPath)) {
            console.log("Importing DAST...");
            await importDast(
                client,
                buildId,
                loadJson(dastPath)
            );
        } else {
            console.log("DAST report not found.");
        }

        if (fs.existsSync(sbomPath)) {
            console.log("Importing SBOM...");
            await importSbom(
                client,
                buildId,
                loadJson(sbomPath)
            );
        } else {
            console.log("SBOM report not found.");
        }

        await client.query("COMMIT");

        console.log(
            `Build #${buildNumber} imported successfully.`
        );

    } catch (error) {
        await client.query("ROLLBACK");

        console.error(
            "Import failed. Transaction rolled back."
        );

        throw error;

    } finally {
        client.release();
    }
}

async function main() {
    const buildNumber = process.argv[2];
    const reportsDirectory = process.argv[3];

    if (!buildNumber || !reportsDirectory) {
        console.error(
            "Usage: node server/importer.js <build-number> <reports-directory>"
        );

        process.exit(1);
    }

    try {
        await importBuild(
            Number(buildNumber),
            reportsDirectory
        );
    } catch (error) {
        console.error(error);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

main();