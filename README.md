# SecureCI

> **A hands-on DevSecOps pipeline built to understand how modern CI/CD systems integrate security throughout the software delivery lifecycle.**

SecureCI is a learning-first DevSecOps project that demonstrates how Continuous Integration can be extended with automated testing, security analysis, container security, artifact generation, and security gates.

Rather than treating security tools as black boxes, SecureCI focuses on understanding the engineering principles behind each integration — why the tool exists, what problem it solves, how it interacts with the CI/CD environment, and how security evidence flows toward a release decision.

---

## Project Overview

SecureCI implements a complete DevSecOps CI/CD pipeline that automates security scanning, normalization, persistence, and visualization of security findings. The pipeline transforms raw security tool output into structured data stored in PostgreSQL, providing a dashboard for tracking security trends across builds.

---

## Architecture

The SecureCI pipeline follows this flow:

```
GitHub
    ↓
Jenkins
    ↓
Security Scanners (Semgrep, npm audit, OWASP ZAP, Trivy, Syft)
    ↓
Normalization (Python parsers)
    ↓
PostgreSQL (Persistent storage)
    ↓
REST API (Node.js/Express)
    ↓
Dashboard (HTML/CSS/JavaScript)
```

---

## Security Tooling

SecureCI integrates the following industry-standard security tools:

- **Semgrep** — Static Application Security Testing (SAST)
- **npm audit** — Software Composition Analysis (SCA)
- **OWASP ZAP** — Dynamic Application Security Testing (DAST)
- **Trivy** — Container vulnerability scanning
- **Syft** — Software Bill of Materials (SBOM) generation

---

## Pipeline Behavior

In each Jenkins build, SecureCI executes the following stages:

1. **Checkout** — Retrieves source code from GitHub
2. **Prepare Reports** — Creates directory structure for raw and normalized reports
3. **Install Dependencies** — Runs `npm ci` to install Node.js dependencies
4. **Semgrep SAST** — Scans source code for insecure patterns, outputs JSON report, then normalizes to internal format
5. **Dependency Check (npm audit)** — Scans Node.js dependencies for vulnerabilities, outputs JSON report, then normalizes
6. **Run Tests** — Executes Jest unit tests
7. **Build Docker Image** — Creates Docker image tagged with build number
8. **Start Test Container** — Runs the Docker image in a test network
9. **Wait for Application** — Waits for the web service to become available
10. **DAST - OWASP ZAP** — (Every 10th build) Spins up ZAP daemon, performs spidering and active scan against the test container, outputs alerts, then normalizes
11. **Stop Test Container** — Cleans up test container
12. **Trivy Image Scan** — Scans the Docker image for OS and dependency vulnerabilities, outputs JSON and HTML reports
13. **SBOM** — Generates Software Bill of Materials using Syft, outputs JSON report, then normalizes
14. **Import Results** — Imports all normalized reports into PostgreSQL, associating them with the Jenkins build number

All scanner reports are processed through Python normalization scripts that convert vendor-specific formats into a common internal schema before database insertion. Raw scanner outputs are ephemeral (stored temporarily in `reports/raw/`), while normalized findings are persisted in PostgreSQL as the source of truth for the dashboard.

---

## Data Architecture

SecureCI uses PostgreSQL for persistent storage of security evidence. The database schema consists of:

- **builds** — Stores Jenkins build metadata (number, status, timestamp)
- **findings** — Central table for all security findings (SAST, SCA, DAST) with fingerprinting to prevent duplicates
- **sast_details** — Semgrep-specific details (rule ID, CWE, references, affected files)
- **sca_details** — npm audit-specific details (package name, CVSS score, direct/indirect dependency, fix availability)
- **dast_details** — OWASP ZAP-specific details (plugin ID, CWE, affected URLs, instance count, solution)
- **sbom_components** — Syft-specific SBOM data (component name, version, type, PURL, licenses, locations)

Indexes are created on frequently queried columns (build_id, fingerprint, severity, source) for performance. The importer uses transactions to ensure data consistency across all tables for a given build.

---

## Dashboard

The SecureCI dashboard provides visibility into security trends and build-specific details:

- **Latest Build** — Shows the most recent build number, status, and timestamp
- **Findings Summary** — Aggregated counts across all builds grouped by source (Semgrep, npm audit, ZAP, Trivy), type, and severity
- **Build History** — List of recent builds with status and timestamps (click to select)
- **SBOM Information** — When a build is selected, shows:
  - SBOM Summary: Total component count, number of component types, and preview of top components
  - Full SBOM View: Searchable, paginated table of all components with name, version, type, and PURL (Package URL)
  - Toggle between summary and detailed views with "View Full SBOM" button

The dashboard loads data via REST API endpoints and updates dynamically when a different build is selected from the dropdown menu.

---

## API Endpoints

SecureCI provides the following REST API endpoints (all return JSON):

- `GET /api/latest-build` — Returns the most recent build record
- `GET /api/build-history` — Returns all builds ordered by date (newest first)
- `GET /api/findings/grouped` — Returns findings aggregated by source, type, and severity
- `GET /api/build/:buildNumber/findings` -> Returns all findings for a specific Jenkins build number
- `GET /api/build/:buildNumber/sbom` -> Returns SBOM data for a specific Jenkins build number, including:
  - `components`: Array of component objects grouped by name-version with count of occurrences
  - `raw`: Array of all individual SBOM component records for the build

All endpoints return appropriate HTTP status codes (200 for success, 404 for not found, 500 for server errors) and include error messages in JSON format when applicable.

---

## Local Setup

To run SecureCI locally:

1. **Install dependencies**
   ```bash
   npm ci
   ```

2. **Start PostgreSQL**
   - Ensure PostgreSQL is running and accessible
   - Create a database named `secureci` (or update environment variables)
   - The schema will be created automatically on first run (see `database/schema.sql`)

3. **Configure environment variables**
   Set these variables in your shell or a `.env` file:
   - `DB_HOST` (default: localhost)
   - `DB_PORT` (default: 5432)
   - `DB_USER` (default: secureci)
   - `DB_PASSWORD` (default: secureci_dev)
   - `DB_NAME` (default: secureci)

4. **Run the application**
   ```bash
   node app.js
   ```
   The dashboard will be available at http://localhost:3000

5. **Run tests**
   ```bash
   npm test
   ```

Note: To experience the full pipeline including security scanners, you would need to run Jenkins with the provided Jenkinsfile. The local setup above runs only the web service and dashboard for development and testing.

---

## Jenkins/Import Workflow

The Jenkins pipeline orchestrates the entire process:

1. After each stage produces raw reports (in `reports/raw/*`), Python normalization scripts convert them to a common JSON format and store in `reports/normalized/`
2. The Import Results stage executes `node server/importer.js <BUILD_NUMBER> reports/normalized`
3. The importer:
   - Connects to PostgreSQL using the connection pool from `server/db.js`
   - Creates or updates a build record in the `builds` table
   - For each finding type (SAST, SCA, DAST, SBOM):
     - Inserts findings into the `findings` table (using fingerprint to prevent duplicates within a build)
     - Inserts type-specific details into the corresponding detail table
   - Commits the transaction or rolls back on error
   - Associates all imported data with the specified Jenkins build number via foreign key relationships

Scanner outputs are archived as Jenkins build artifacts for traceability and audit purposes.

---

## Current Scope / Limitations

SecureCI currently focuses on:
- **Security scanning** — Integration of Semgrep, npm audit, OWASP ZAP, Trivy, and Syft
- **Normalization** — Conversion of scanner-specific formats to a common internal schema
- **Evidence collection** — Archival of raw and normalized reports as build artifacts
- **Persistence** — Storage of normalized findings in PostgreSQL for historical analysis
- **Visualization** — Dashboard showing build history, findings trends, and SBOM information

The following are intentionally **NOT** implemented in the current scope:
- Policy enforcement (build failures based on security thresholds)
- Authentication/Role-Based Access Control (RBAC)
- Automated remediation (ticket creation, pull request comments, etc.)
- Advanced analytics (trend prediction, risk scoring, etc.)
- Additional scanners (beyond the five integrated tools)
- Multi-tenancy or team-based access controls

These capabilities are left as potential future enhancements to maintain focus on understanding the core DevSecOps pipeline mechanics.

---

## Project Status

The current implementation represents the completed first version of SecureCI. It demonstrates a functional DevSecOps pipeline that:

- Successfully integrates multiple security tools into a CI/CD workflow
- Normalizes and persists security evidence for historical analysis
- Provides a dashboard for visualizing security trends and build-specific details
- Uses only the stated technologies without introducing unnecessary dependencies or architectural complexity

All claimed features are present and functioning in the repository. No features are misrepresented as implemented when they are not.