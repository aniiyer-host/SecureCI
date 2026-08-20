import json
from fingerprint import generate_fingerprint

INPUT_FILE = "reports/raw/npm-audit/npm-audit-report.json"
OUTPUT_FILE = "reports/normalized/normalized-sca-findings.json"


def normalize_severity(severity):
    mapping = {
        "CRITICAL": "CRITICAL",
        "HIGH": "HIGH",
        "MODERATE": "MEDIUM",
        "LOW": "LOW",
        "INFO": "INFO"
    }

    if not severity:
        return "UNKNOWN"

    return mapping.get(severity.upper(), "UNKNOWN")


def extract_cwes(vulnerability):
    cwes = vulnerability.get("cwe", [])

    normalized = []

    for cwe in cwes:
        if isinstance(cwe, str):
            if cwe.startswith("CWE-"):
                normalized.append(cwe.replace("CWE-", "").split(":")[0])
            else:
                normalized.append(cwe)

    return normalized


with open(INPUT_FILE, "r") as f:
    data = json.load(f)


findings = []

for package_name, vulnerability in data.get("vulnerabilities", {}).items():

    via = vulnerability.get("via", [])

    # npm audit can contain informational strings inside "via".
    # Only process actual vulnerability objects.
    vulnerability_details = [
        item for item in via
        if isinstance(item, dict)
    ]

    if not vulnerability_details:
        continue

    for vuln in vulnerability_details:

        cvss = vuln.get("cvss", {})

        finding = {
            "source": "npm audit",
            "type": "SCA",
            "fingerprint": generate_fingerprint(
                "npm audit",
                "SCA",
                package_name,
                vuln.get("url"),
                vuln.get("title")
            ),
            "package": package_name,
            "severity": normalize_severity(
                vuln.get("severity", vulnerability.get("severity", ""))
            ),
            "direct": vulnerability.get("isDirect", False),
            "cvss": cvss.get("score"),
            "cwe": extract_cwes(vuln),
            "title": vuln.get("title", ""),
            "description": vuln.get("title", ""),
            "affected_versions": vuln.get(
                "range",
                vulnerability.get("range", "")
            ),
            "fix_available": vulnerability.get(
                "fixAvailable", False
            ),
            "nodes": vulnerability.get("nodes", []),
            "references": [
                vuln.get("url")
            ] if vuln.get("url") else []
        }

        findings.append(finding)


metadata = data.get("metadata", {})
vulnerability_metadata = metadata.get("vulnerabilities", {})

normalized = {
    "scanner": "npm audit",
    "type": "SCA",
    "total_findings": len(findings),
    "severity_summary": {
        "critical": vulnerability_metadata.get("critical", 0),
        "high": vulnerability_metadata.get("high", 0),
        "medium": vulnerability_metadata.get("moderate", 0),
        "low": vulnerability_metadata.get("low", 0),
        "info": vulnerability_metadata.get("info", 0)
    },
    "findings": findings
}


with open(OUTPUT_FILE, "w") as f:
    json.dump(normalized, f, indent=2)


print(f"Normalized {len(findings)} npm audit findings.")
print(f"Output written to {OUTPUT_FILE}")