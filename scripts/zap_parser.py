import json
from fingerprint import generate_fingerprint

with open("zap-alerts.json", "r") as f:
    data = json.load(f)

grouped = {}

for alert in data.get("alerts", []):

    plugin_id = alert.get("pluginId")

    if plugin_id not in grouped:

        grouped[plugin_id] = {
            "source": "OWASP ZAP",
            "type": "DAST",
            "fingerprint": generate_fingerprint(
                "OWASP ZAP",
                "DAST",
                plugin_id
            ),
            "plugin_id": plugin_id,
            "title": alert.get("alert"),
            "severity": alert.get("risk", "").upper(),
            "confidence": alert.get("confidence", "").upper(),
            "cwe": alert.get("cweid"),
            "description": alert.get("description"),
            "solution": alert.get("solution"),
            "affected_urls": [],
            "instances": 0
        }

    grouped[plugin_id]["affected_urls"].append(
        alert.get("url")
    )

    grouped[plugin_id]["instances"] += 1

output = {
    "scanner": "OWASP ZAP",
    "type": "DAST",
    "total_findings": len(grouped),
    "findings": list(grouped.values())
}

with open("normalized-dast-findings.json", "w") as f:
    json.dump(output, f, indent=2)

print("Normalized findings written.")