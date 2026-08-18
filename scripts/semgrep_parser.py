import json
from fingerprint import generate_fingerprint

INPUT_FILE = "reports/semgrep-report.json"
OUTPUT_FILE = "normalized-sast-findings.json"


def extract_cwe(metadata):
    cwes = metadata.get("cwe", [])

    if not cwes:
        return None

    # Semgrep usually returns values like:
    # "CWE-250: Execution with Unnecessary Privileges"
    first_cwe = cwes[0]

    if first_cwe.startswith("CWE-"):
        return first_cwe.split(":")[0].replace("CWE-", "")

    return first_cwe


def normalize_severity(severity):
    mapping = {
        "ERROR": "HIGH",
        "WARNING": "MEDIUM",
        "INFO": "LOW"
    }

    if not severity:
        return "UNKNOWN"

    return mapping.get(severity.upper(), "UNKNOWN")


with open(INPUT_FILE, "r") as f:
    data = json.load(f)


findings = []

for result in data.get("results", []):
    extra = result.get("extra", {})
    metadata = extra.get("metadata", {})
    start = result.get("start", {})
    end = result.get("end", {})

    print("DEBUG severity:", repr(extra.get("severity")))
    finding = {
        "source": "Semgrep",
        "type": "SAST",
        "fingerprint": generate_fingerprint(
            "Semgrep",
            "SAST",
            result.get("check_id"),
            result.get("path"),
            start.get("line")
        ),
        "rule_id": result.get("check_id"),
        "title": extra.get("message"),
        "severity": normalize_severity(extra.get("severity", "")),
        "confidence": metadata.get("confidence", "UNKNOWN"),
        "cwe": extract_cwe(metadata),
        "affected_files": [
            {
                "file": result.get("path"),
                "start_line": start.get("line"),
                "start_col": start.get("col"),
                "end_line": end.get("line"),
                "end_col": end.get("col")
            }
        ],
        "instances": 1,
        "description": extra.get("message"),
        "references": metadata.get("references", [])
    }

    findings.append(finding)


normalized = {
    "scanner": "Semgrep",
    "type": "SAST",
    "total_result_instances": len(data.get("results", [])),
    "total_findings": len(findings),
    "findings": findings
}


with open(OUTPUT_FILE, "w") as f:
    json.dump(normalized, f, indent=2)

print(f"Normalized {len(findings)} Semgrep findings.")
print(f"Output written to {OUTPUT_FILE}")