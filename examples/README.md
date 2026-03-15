# fhir-cli Examples

Runnable examples for all `fhir-cli` commands. These files are also used by the test suite to ensure examples stay valid.

## Quick Start

```bash
# Initialize a project
fhir new my-project
cd my-project

# Create a patient
fhir resource create ../examples/resources/patient.json

# Validate a resource
fhir validate ../examples/resources/patient.json

# Query resources
fhir query Patient
fhir query "Patient?name=Smith"

# FHIRPath evaluation
fhir path ../examples/resources/patient.json "name.family"
fhir path ../examples/resources/observation.json "component.value.value"

# View resource history
fhir resource history Patient/<id>

# Engine status
fhir engine status
```

## Directory Structure

```
examples/
├── resources/
│   ├── patient.json              # Complete Patient resource
│   ├── patient-invalid.json      # Invalid Patient (for validation testing)
│   ├── observation.json          # Blood pressure Observation
│   ├── condition.json            # Diabetes Condition
│   └── bundle-transaction.json   # Transaction Bundle (Patient + Observation)
├── fhirpath/
│   └── expressions.json          # Common FHIRPath expressions with expected results
├── datasets/
│   └── minimal/                  # Minimal dataset for quick testing
│       ├── patients.json
│       └── observations.json
└── README.md
```

## Project Configuration Examples

### Basic `fhir.config.json` (Default from `fhir new`)

```json
{
  "fhirVersion": "R4",
  "database": {
    "type": "sqlite",
    "path": "./data/fhir.db"
  },
  "packages": {
    "path": "./fhir-packages"
  },
  "igs": [{ "name": "hl7.fhir.r4.core", "version": "4.0.1" }]
}
```

> **Note:** `hl7.fhir.r4.core` is the base R4 specification package. Without it, no resource types (Patient, Observation, etc.) will be available and the engine cannot create database tables.

### With US Core IG

```json
{
  "fhirVersion": "R4",
  "database": {
    "type": "sqlite",
    "path": "./data/fhir.db"
  },
  "packages": {
    "path": "./fhir-packages"
  },
  "igs": [
    { "name": "hl7.fhir.r4.core", "version": "4.0.1" },
    { "name": "hl7.fhir.us.core", "version": "6.1.0" }
  ]
}
```

### Offline / Air-Gapped Configuration

```json
{
  "database": {
    "type": "sqlite",
    "path": "./data/fhir.db"
  },
  "packages": {
    "path": "./fhir-packages"
  },
  "igs": [{ "name": "hl7.fhir.r4.core", "version": "4.0.1" }],
  "packageResolve": {
    "allowDownload": false
  }
}
```

When `allowDownload` is `false`, packages are only resolved from:

1. Local `fhir-packages/` directory (manually placed)
2. System cache at `~/.fhir/packages/`

No network requests will be made.

### PostgreSQL Configuration

```json
{
  "database": {
    "type": "postgres",
    "url": "postgresql://user:pass@localhost:5432/fhir"
  },
  "packages": {
    "path": "./fhir-packages"
  },
  "igs": [{ "name": "hl7.fhir.r4.core", "version": "4.0.1" }]
}
```

### Custom IG Configuration

```json
{
  "database": {
    "type": "sqlite",
    "path": "./data/fhir.db"
  },
  "packages": {
    "path": "./fhir-packages"
  },
  "igs": [
    { "name": "hl7.fhir.r4.core", "version": "4.0.1" },
    { "name": "my-org.custom-ig", "version": "1.0.0" }
  ]
}
```

Custom IG packages must be placed in `fhir-packages/my-org.custom-ig/` with a valid `package.json` and resource definitions in `package/`.

## Package Resolution — How It Works

When `fhir new` or `fhir ig install` runs, packages are resolved in this order:

| Priority | Source           | Path                                            | When Used                              |
| -------- | ---------------- | ----------------------------------------------- | -------------------------------------- |
| 1        | **Local**        | `fhir-packages/<name>/`                         | Package already in project             |
| 2        | **System cache** | `~/.fhir/packages/<name>#<version>/`            | Previously downloaded by any FHIR tool |
| 3        | **Network**      | [packages.fhir.org](https://packages.fhir.org/) | First-time download                    |

### IG Management Workflow

```bash
# Install an IG (updates config + downloads package)
fhir ig install hl7.fhir.us.core@6.1.0
# ✓ 已添加 hl7.fhir.us.core@6.1.0 到配置
# ℹ 正在解析并下载 FHIR 包...
# ✓ 已解析 hl7.fhir.us.core@6.1.0 (cache)

# List loaded IGs
fhir ig list

# Show IG details
fhir ig info hl7.fhir.r4.core

# Remove an IG
fhir ig remove hl7.fhir.us.core
```

### Manual Package Placement

For offline environments or custom IGs, place the package directory directly:

```
fhir-packages/
├── hl7.fhir.r4.core/           ← Standard R4 Core
│   ├── package.json
│   └── package/
│       ├── StructureDefinition-Patient.json
│       ├── SearchParameter-Patient-name.json
│       └── ...
└── my-org.custom-ig/            ← Your custom IG
    ├── package.json
    └── package/
        ├── StructureDefinition-MyProfile.json
        ├── SearchParameter-MyParam.json
        └── ...
```

The `package.json` must contain at minimum:

```json
{
  "name": "my-org.custom-ig",
  "version": "1.0.0"
}
```

### Schema Migration on IG Changes

When you install, remove, or upgrade an IG, the engine automatically handles database schema changes on the next startup:

- **New IG installed** → New tables and search index columns are created
- **IG removed** → Tables remain (data is preserved), no longer indexed
- **IG upgraded** → Differential migration (new columns, reindex if needed)

No manual migration steps required.

## Using Examples in Tests

Tests import examples directly to ensure they remain valid:

```typescript
import patient from "../../examples/resources/patient.json";
```

## Validation Examples

```bash
# Valid resource — should pass
fhir validate examples/resources/patient.json

# Invalid resource — should report issues
fhir validate examples/resources/patient-invalid.json

# With specific profile
fhir validate examples/resources/patient.json --profile http://hl7.org/fhir/StructureDefinition/Patient
```

## FHIRPath Examples

```bash
# Get patient family name
fhir path examples/resources/patient.json "name.family"
# → ["Smith"]

# Get all given names
fhir path examples/resources/patient.json "name.given"
# → ["John", "Michael"]

# Check gender
fhir path examples/resources/patient.json "gender = 'male'"
# → [true]

# Get observation components
fhir path examples/resources/observation.json "component.code.coding.display"
# → ["Systolic blood pressure", "Diastolic blood pressure"]

# Get systolic value
fhir path examples/resources/observation.json "component.where(code.coding.code = '8480-6').value.value"
# → [120]
```
