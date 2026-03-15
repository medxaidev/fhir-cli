# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.3.0] - 2026-03-15

### Added

- **Package resolution** — `fhir ig install` now downloads and links FHIR packages automatically
- **Three-tier resolution strategy**: local → system cache → network download
- `fhir new` now resolves all configured IGs at project creation time
- Offline mode support via `packageResolve.allowDownload: false` in config
- Comprehensive configuration documentation in README.md and examples/README.md
  - All config field reference with types and descriptions
  - SQLite, PostgreSQL, offline, and custom IG config examples
  - Package resolution strategy explained with three methods
  - Schema migration documentation

### Changed

- Upgraded fhir-engine dependency from ^0.3.0 to ^0.4.0
- `fhir ig install` now updates config AND downloads/links the package
- `fhir new` generated `package.json` references fhir-engine ^0.4.0
- `createProject()` now returns `ResolvePackagesResult` with resolution details
- `fhir new` displays package resolution results after scaffolding

### Removed

- Deleted `src/core/package-resolver.ts` — package resolution now handled by fhir-engine

### Fixed

- **`fhir ig install` only updated config, didn't download packages** — now resolves packages into `fhir-packages/`
- **`fhir new` created empty `fhir-packages/`** — now populates it with resolved packages
- **Engine loaded 0 packages after `fhir new`** — resolved; R4 Core is downloaded automatically
- **`no such table: Patient_References`** — root cause was missing packages; now fixed

## [0.2.0] - 2026-03-15

### Added

- `fhir resource history <Type/id>` — View resource version history
- `fhir engine start` — Start engine in foreground mode
- `fhir engine status` — Display engine status (JSON/table)
- `fhir engine stop` — Stop engine (foreground: Ctrl+C)
- `fhir ig install <name[@version]>` — Add IG to project configuration
- `fhir ig remove <name>` — Remove IG from project configuration
- `fhir ig info <name>` — Display loaded IG details
- `examples/` directory with runnable FHIR resource examples
- `examples/fhirpath/expressions.json` — Testable FHIRPath expression cases
- `examples/datasets/minimal/` — Minimal dataset for quick testing
- `docs/` directory with user-facing documentation
  - Getting Started guide
  - Command Reference
  - Validation Guide
  - FHIRPath Guide
- Example-based test suite (21 tests) verifying example correctness

### Changed

- `fhir query` upgraded to use `engine.search()` high-level API (fhir-engine v0.3.0)
- Removed all transitive imports from `fhir-persistence` and `fhir-runtime`

### Fixed

- N/A

## [0.1.0] - 2026-03-15

### Added

- `fhir new [name]` — Interactive project scaffolding
- `fhir resource create <file>` — Create resource from JSON
- `fhir resource get <Type/id>` — Read resource
- `fhir resource update <file>` — Update resource
- `fhir resource delete <Type/id>` — Delete resource
- `fhir query <expression>` — FHIR search with query parameters
- `fhir validate <file>` — Resource validation against StructureDefinition
- `fhir path <file> <expr>` — FHIRPath expression evaluation
- `fhir ig list` — List loaded Implementation Guides
- `fhir ig load <path>` — Load local IG directory
- `fhir doctor` — Environment diagnostics
- Core infrastructure: config-loader, engine-factory, error-handler, output formatter
- 68 tests across 8 test files

### Dependencies

- fhir-engine ^0.3.0
- commander ^12
- chalk ^5
- ora ^8
- prompts ^2
- fs-extra ^11
