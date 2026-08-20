import json

INPUT_FILE = "reports/raw/syft/syft-report.json"
OUTPUT_FILE = "normalized-sbom.json"


with open(INPUT_FILE, "r") as f:
    data = json.load(f)


components = []

for artifact in data.get("artifacts", []):
    components.append({
        "name": artifact.get("name"),
        "version": artifact.get("version"),
        "type": artifact.get("type"),
        "purl": artifact.get("purl"),
        "licenses": artifact.get("licenses", []),
        "locations": [
            location.get("path")
            for location in artifact.get("locations", [])
            if location.get("path")
        ]
    })


normalized = {
    "scanner": "Syft",
    "type": "SBOM",
    "format": "syft-json",
    "image": data.get("source", {}).get("target", "UNKNOWN"),
    "total_components": len(components),
    "components": components
}


with open(OUTPUT_FILE, "w") as f:
    json.dump(normalized, f, indent=2)


print(f"Normalized {len(components)} SBOM components.")
print(f"Output written to {OUTPUT_FILE}")