CREATE TABLE IF NOT EXISTS builds (
    id SERIAL PRIMARY KEY,
    jenkins_build_number INTEGER NOT NULL UNIQUE,
    status VARCHAR(50) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS findings (
    id SERIAL PRIMARY KEY,
    build_id INTEGER NOT NULL REFERENCES builds(id) ON DELETE CASCADE,

    fingerprint VARCHAR(255) NOT NULL,

    source VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL,

    severity VARCHAR(20),
    confidence VARCHAR(20),

    title TEXT NOT NULL,
    description TEXT,

    status VARCHAR(20) NOT NULL DEFAULT 'open',

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(build_id, fingerprint)
);

CREATE TABLE IF NOT EXISTS sast_details (
    finding_id INTEGER PRIMARY KEY REFERENCES findings(id) ON DELETE CASCADE,

    rule_id TEXT,
    cwe VARCHAR(50),

    references_json JSONB,

    affected_files JSONB
);

CREATE TABLE IF NOT EXISTS sca_details (
    finding_id INTEGER PRIMARY KEY REFERENCES findings(id) ON DELETE CASCADE,

    package TEXT,
    cvss NUMERIC,

    direct BOOLEAN,

    cwe JSONB,

    affected_versions TEXT,

    fix_available BOOLEAN,

    nodes JSONB,
    references_json JSONB
);

CREATE TABLE IF NOT EXISTS dast_details (
    finding_id INTEGER PRIMARY KEY REFERENCES findings(id) ON DELETE CASCADE,

    plugin_id VARCHAR(100),
    cwe VARCHAR(50),

    affected_urls JSONB,

    instances INTEGER,

    solution TEXT
);

CREATE TABLE IF NOT EXISTS sbom_components (
    id SERIAL PRIMARY KEY,

    build_id INTEGER NOT NULL REFERENCES builds(id) ON DELETE CASCADE,

    name TEXT NOT NULL,
    version TEXT,
    type VARCHAR(100),
    purl TEXT,

    licenses JSONB,
    locations JSONB
);

CREATE INDEX IF NOT EXISTS idx_findings_build_id
    ON findings(build_id);

CREATE INDEX IF NOT EXISTS idx_findings_fingerprint
    ON findings(fingerprint);

CREATE INDEX IF NOT EXISTS idx_findings_severity
    ON findings(severity);

CREATE INDEX IF NOT EXISTS idx_findings_source
    ON findings(source);

CREATE INDEX IF NOT EXISTS idx_sbom_build_id
    ON sbom_components(build_id);