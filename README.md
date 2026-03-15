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

Projects use a `fhir.config.json` file created by `fhir new`. Below is a **complete configuration reference** with all supported fields:

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
  ],
  "packageResolve": {
    "allowDownload": true
  }
}
```

### Configuration Fields

| Field                          | Type                       | Required       | Description                                |
| ------------------------------ | -------------------------- | -------------- | ------------------------------------------ |
| `fhirVersion`                  | `"R4"`                     | No             | FHIR version (currently only R4 supported) |
| `database.type`                | `"sqlite"` \| `"postgres"` | Yes            | Database backend                           |
| `database.path`                | `string`                   | Yes (SQLite)   | Path to SQLite database file               |
| `database.url`                 | `string`                   | Yes (Postgres) | PostgreSQL connection URL                  |
| `packages.path`                | `string`                   | Yes            | Directory for FHIR package files           |
| `igs`                          | `Array<{name, version?}>`  | No             | Implementation Guides to load              |
| `packageResolve.allowDownload` | `boolean`                  | No             | Allow network downloads (default: `true`)  |

### Minimal Configuration (SQLite)

```json
{
  "database": { "type": "sqlite", "path": "./data/fhir.db" },
  "packages": { "path": "./fhir-packages" },
  "igs": [{ "name": "hl7.fhir.r4.core", "version": "4.0.1" }]
}
```

### PostgreSQL Configuration

```json
{
  "database": {
    "type": "postgres",
    "url": "postgresql://user:pass@localhost:5432/fhir"
  },
  "packages": { "path": "./fhir-packages" },
  "igs": [{ "name": "hl7.fhir.r4.core", "version": "4.0.1" }]
}
```

### Offline Configuration (No Network)

```json
{
  "database": { "type": "sqlite", "path": "./data/fhir.db" },
  "packages": { "path": "./fhir-packages" },
  "igs": [{ "name": "hl7.fhir.r4.core", "version": "4.0.1" }],
  "packageResolve": { "allowDownload": false }
}
```

When `allowDownload` is `false`, the engine only uses packages already present locally in `fhir-packages/` or in the system cache (`~/.fhir/packages`). Useful for CI/CD and air-gapped environments.

## Package Resolution

fhir-cli uses a **three-tier resolution strategy** to ensure FHIR packages are available:

```
1. Local first   → fhir-packages/<name>/ already exists? Use it.
2. System cache   → ~/.fhir/packages/<name>#<version> exists? Create link.
3. Network download → Download from FHIR Package Registry → cache → link.
```

### How It Works

When you run `fhir new` or `fhir ig install`, the CLI:

1. Reads the `igs` array from `fhir.config.json`
2. For each IG, checks if it already exists in `fhir-packages/`
3. If not, checks the system cache at `~/.fhir/packages/`
4. If not cached, downloads from the [FHIR Package Registry](https://packages.fhir.org/) to the system cache
5. Creates a directory junction/symlink from `fhir-packages/<name>` → system cache

On the next engine startup, packages are loaded from `fhir-packages/` and database tables are automatically created/migrated.

### Three Ways to Provide Packages

#### Method 1: Automatic Download (Recommended)

```bash
# Install adds to config AND downloads the package
fhir ig install hl7.fhir.r4.core@4.0.1

# Or create a project — R4 Core is downloaded automatically
fhir new my-project
```

#### Method 2: System Cache

If you've previously used FHIR tools (e.g., FHIR Shorthand, IG Publisher), packages may already be cached at `~/.fhir/packages/`. The CLI will detect and link them automatically — no re-download needed.

```bash
# Check what's in your system cache
ls ~/.fhir/packages/
# hl7.fhir.r4.core#4.0.1/
# hl7.fhir.us.core#6.1.0/
```

#### Method 3: Manual Placement (Offline/Custom IG)

Place package directories directly into `fhir-packages/`:

```
my-project/
└── fhir-packages/
    └── hl7.fhir.r4.core/
        ├── package.json          ← must contain name + version
        └── package/
            ├── StructureDefinition-Patient.json
            ├── SearchParameter-*.json
            └── ...
```

This is ideal for:

- **Offline/air-gapped environments** — pre-bundle packages
- **Custom IGs** — place your own IG package alongside standard ones
- **CI/CD** — check packages into your repo or restore from cache

### Custom Implementation Guides

Custom IGs follow the same FHIR package format. If your IG defines:

- **New SearchParameters** → Automatically indexed in the database
- **Profiles** (constraints on existing resources) → New SearchParameters take effect
- **New resource types** (with `kind: resource`) → New database tables created

```bash
# Install a custom/third-party IG
fhir ig install my-org.custom-ig@1.0.0

# Or place it manually
cp -r /path/to/my-org.custom-ig fhir-packages/my-org.custom-ig
```

### Schema Migration

When IGs change (install/remove/upgrade), the engine automatically:

1. Computes a schema checksum from loaded StructureDefinitions + SearchParameters
2. Compares with the stored checksum in the database
3. If different → runs differential DDL migration (add tables, add columns, reindex)

**No manual migration is needed.** Just install/remove IGs and restart the engine.

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

- **Runtime**: fhir-engine ^0.4.0 (embedded FHIR kernel with package resolution)
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
