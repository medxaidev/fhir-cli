# Command Reference

## Overview

```
fhir <command> [options]
```

| Command | Description |
|---|---|
| `fhir new [name]` | Create a new FHIR project |
| `fhir resource <subcommand>` | Resource CRUD operations |
| `fhir query <expression>` | FHIR search |
| `fhir validate <file>` | Validate a FHIR resource |
| `fhir path <file> <expr>` | FHIRPath expression evaluation |
| `fhir ig <subcommand>` | IG management |
| `fhir engine <subcommand>` | Engine lifecycle |
| `fhir doctor` | Environment diagnostics |

---

## `fhir new [name]`

Create a new FHIR project with interactive prompts.

```bash
fhir new my-project
```

**Prompts:**
- Project name
- FHIR version (R4)
- Database type (SQLite)
- Include US Core IG
- Generate example resources

---

## `fhir resource`

### `fhir resource create <file>`

Create a resource from a JSON file.

```bash
fhir resource create examples/resources/patient.json
```

**Options:**
- `--config <path>` — Config file path

### `fhir resource get <Type/id>`

Read a resource by reference.

```bash
fhir resource get Patient/abc-123
```

**Options:**
- `--config <path>` — Config file path
- `--format <format>` — Output format: `json` | `text` (default: `json`)

### `fhir resource update <file>`

Update a resource. The JSON file must contain `id` and `resourceType`.

```bash
fhir resource update patient-updated.json
```

**Options:**
- `--config <path>` — Config file path

### `fhir resource delete <Type/id>`

Delete a resource.

```bash
fhir resource delete Patient/abc-123
```

**Options:**
- `--config <path>` — Config file path

### `fhir resource history <Type/id>`

View version history for a resource.

```bash
fhir resource history Patient/abc-123
fhir resource history Patient/abc-123 --format table
```

**Options:**
- `--config <path>` — Config file path
- `--format <format>` — Output format: `json` | `table` (default: `json`)

---

## `fhir query <expression>`

Search for FHIR resources.

```bash
fhir query Patient
fhir query "Patient?name=Smith"
fhir query "Patient?birthdate=ge1990-01-01" --count 5
fhir query "Observation?code=85354-9" --format table
```

**Arguments:**
- `<expression>` — Query in format `ResourceType` or `ResourceType?param=value&...`

**Options:**
- `--format <format>` — Output format: `json` | `table` (default: `json`)
- `--count <n>` — Result limit (default: `20`)
- `--config <path>` — Config file path

---

## `fhir validate <file>`

Validate a FHIR resource against its StructureDefinition.

```bash
fhir validate examples/resources/patient.json
fhir validate examples/resources/observation.json --profile http://hl7.org/fhir/StructureDefinition/vitalsigns
```

**Options:**
- `--profile <url>` — StructureDefinition URL (auto-derived from `resourceType` if omitted)
- `--format <format>` — Output format: `json` | `text` (default: `text`)
- `--config <path>` — Config file path

**Exit codes:**
- `0` — Valid
- `2` — Validation issues found

---

## `fhir path <file> <expression>`

Evaluate a FHIRPath expression against a FHIR resource.

```bash
fhir path examples/resources/patient.json "name.family"
# → ["Smith"]

fhir path examples/resources/patient.json "name.given"
# → ["John", "Michael"]

fhir path examples/resources/patient.json "gender = 'male'"
# → [true]

fhir path examples/resources/observation.json "component.code.coding.display"
# → ["Systolic blood pressure", "Diastolic blood pressure"]
```

**Options:**
- `--format <format>` — Output format: `json` | `text` | `tree` (default: `json`)

---

## `fhir ig`

### `fhir ig list`

List loaded Implementation Guides.

```bash
fhir ig list
fhir ig list --format json
```

**Options:**
- `--format <format>` — Output format: `json` | `table` (default: `table`)
- `--config <path>` — Config file path

### `fhir ig install <name[@version]>`

Add an IG to project configuration.

```bash
fhir ig install hl7.fhir.us.core@6.1.0
fhir ig install hl7.fhir.us.core
```

**Options:**
- `--config <path>` — Config file path

### `fhir ig remove <name>`

Remove an IG from project configuration.

```bash
fhir ig remove hl7.fhir.us.core
```

**Options:**
- `--config <path>` — Config file path

### `fhir ig info <name>`

Display details for a loaded IG.

```bash
fhir ig info hl7.fhir.r4.core
```

**Options:**
- `--format <format>` — Output format: `json` | `table` (default: `table`)
- `--config <path>` — Config file path

### `fhir ig load <path>`

Load a local IG directory.

```bash
fhir ig load ./my-ig
```

---

## `fhir engine`

### `fhir engine status`

Display engine status information.

```bash
fhir engine status
fhir engine status --format json
```

**Options:**
- `--format <format>` — Output format: `json` | `table` (default: `table`)
- `--config <path>` — Config file path

### `fhir engine start`

Start the engine in foreground mode. Press Ctrl+C to stop.

```bash
fhir engine start
```

**Options:**
- `--config <path>` — Config file path

### `fhir engine stop`

Display instructions for stopping the engine (daemon mode planned for Phase 3).

---

## `fhir doctor`

Run environment diagnostics.

```bash
fhir doctor
```

Checks:
- Node.js version (>= 18)
- Configuration file
- Engine initialization
- Database connection
- Loaded packages
- Resource types

**Options:**
- `--config <path>` — Config file path

---

## Global Options

All commands support:

| Option | Description |
|---|---|
| `--help` | Show help for command |
| `--version` | Show version |

## Exit Codes

| Code | Meaning |
|---|---|
| `0` | Success |
| `1` | Runtime error |
| `2` | Validation failed |
| `3` | Resource not found |
| `4` | Configuration error |
| `5` | IG error |
