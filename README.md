# fhir-cli

The developer toolkit for building FHIR applications.

[![npm version](https://img.shields.io/npm/v/fhir-cli.svg)](https://www.npmjs.com/package/fhir-cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

## Features

- **Project scaffolding** — `fhir new` creates a ready-to-use FHIR project
- **Resource CRUD** — Create, read, update, delete, and history
- **FHIR search** — Query resources with standard FHIR search parameters
- **Validation** — Validate resources against StructureDefinitions
- **FHIRPath** — Evaluate FHIRPath expressions on local files
- **IG management** — Install, remove, and inspect Implementation Guides
- **Engine lifecycle** — Start, status, and stop the FHIR engine
- **Diagnostics** — `fhir doctor` checks your environment

Built on [fhir-engine](https://github.com/nichefish/fhir-engine) with embedded SQLite — no external server required.

## Quick Start

```bash
# Install globally
npm install -g fhir-cli

# Create a new project
fhir new my-project
cd my-project

# Create a patient
fhir resource create examples/resources/patient.json

# Search
fhir query Patient
fhir query "Patient?name=Smith"

# Validate
fhir validate examples/resources/patient.json

# FHIRPath
fhir path examples/resources/patient.json "name.family"
# → ["Smith"]

# Environment check
fhir doctor
```

## Commands

| Command                           | Description               |
| --------------------------------- | ------------------------- |
| `fhir new [name]`                 | Create a new FHIR project |
| `fhir resource create <file>`     | Create resource from JSON |
| `fhir resource get <Type/id>`     | Read a resource           |
| `fhir resource update <file>`     | Update a resource         |
| `fhir resource delete <Type/id>`  | Delete a resource         |
| `fhir resource history <Type/id>` | View version history      |
| `fhir query <expression>`         | FHIR search               |
| `fhir validate <file>`            | Validate a resource       |
| `fhir path <file> <expr>`         | FHIRPath evaluation       |
| `fhir ig list`                    | List loaded IGs           |
| `fhir ig install <name[@ver]>`    | Add IG to config          |
| `fhir ig remove <name>`           | Remove IG from config     |
| `fhir ig info <name>`             | Show IG details           |
| `fhir engine status`              | Show engine status        |
| `fhir engine start`               | Start engine (foreground) |
| `fhir doctor`                     | Environment diagnostics   |

See [docs/commands.md](docs/commands.md) for full reference.

## Configuration

Projects use a `fhir.config.json` file:

```json
{
  "database": {
    "type": "sqlite",
    "path": "./data/fhir.db"
  },
  "packages": {
    "path": "./fhir-packages"
  }
}
```

## Examples

The `examples/` directory contains runnable FHIR resources, FHIRPath expressions, and datasets:

```
examples/
├── resources/          # Patient, Observation, Condition, Bundle
├── fhirpath/           # Testable FHIRPath expression cases
└── datasets/minimal/   # Quick-start dataset
```

All examples are verified by the test suite — they are always valid and up-to-date.

```bash
# Run example validation
fhir validate examples/resources/patient.json

# Run example FHIRPath
fhir path examples/resources/patient.json "name.given"
# → ["John", "Michael"]
```

## Documentation

- [Getting Started](docs/getting-started.md)
- [Command Reference](docs/commands.md)
- [Validation Guide](docs/validation.md)
- [FHIRPath Guide](docs/fhirpath.md)
- [Examples](examples/README.md)
- [Changelog](CHANGELOG.md)

## Requirements

- Node.js >= 18.0.0
- npm >= 9.0.0

## Tech Stack

- **Runtime**: fhir-engine ^0.3.0 (embedded FHIR kernel)
- **Database**: SQLite (via better-sqlite3)
- **Language**: TypeScript 5.9
- **CLI**: Commander ^12
- **Testing**: Vitest ^4

## Development

```bash
git clone https://github.com/medxaidev/fhir-cli.git
cd fhir-cli
npm install

# Run tests
npm test

# Type check
npx tsc --noEmit

# Run CLI in development
npx tsx src/index.ts --help
```

## License

[MIT](LICENSE)
