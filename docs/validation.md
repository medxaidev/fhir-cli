# Validation Guide

`fhir validate` checks FHIR resources against their StructureDefinitions using the fhir-engine runtime validator.

## Basic Usage

```bash
fhir validate <file> [--profile <url>] [--format json|text]
```

## Examples

### Validate a Patient

```bash
fhir validate examples/resources/patient.json
```

Output (text format):
```
✓ 验证通过 — 0 个问题
```

### Validate with a Specific Profile

```bash
fhir validate examples/resources/observation.json \
  --profile http://hl7.org/fhir/StructureDefinition/vitalsigns
```

### JSON Output

```bash
fhir validate examples/resources/patient.json --format json
```

```json
{
  "valid": true,
  "issues": []
}
```

### Invalid Resource

```bash
fhir validate examples/resources/patient-invalid.json
```

Output:
```
✗ 验证失败 — 2 个问题

  error: Patient.gender — value "not-a-valid-gender" is not in ValueSet
  error: Patient.birthDate — "not-a-date" is not a valid date
```

## How It Works

1. The resource file is read and parsed as JSON
2. If `--profile` is not specified, the profile URL is auto-derived:
   `http://hl7.org/fhir/StructureDefinition/{resourceType}`
3. The engine's runtime validator checks the resource against the StructureDefinition
4. Issues are reported with severity, location, and message

## Profile URL Convention

| Resource Type | Default Profile |
|---|---|
| Patient | `http://hl7.org/fhir/StructureDefinition/Patient` |
| Observation | `http://hl7.org/fhir/StructureDefinition/Observation` |
| Condition | `http://hl7.org/fhir/StructureDefinition/Condition` |
| Bundle | `http://hl7.org/fhir/StructureDefinition/Bundle` |

## Exit Codes

- **0** — Validation passed (no issues)
- **2** — Validation issues found
