# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.6.0] - 2026-03-16

### Changed

- Upgraded fhir-engine dependency from ^0.5.1 to ^0.6.0 (includes fhir-persistence ^0.6.0, fhir-runtime ^0.9.0, fhir-definition ^0.6.0)
- `fhir new` generated `package.json` references fhir-engine ^0.6.0

### Added

- **Full-text search support** — fhir-engine now includes high-performance full-text search capabilities:
  - SQLite: FTS5 virtual tables for string search parameters (name, address, etc.)
  - PostgreSQL: tsvector/GIN indexes for optimized text search with ranking
  - Automatic fallback to LIKE queries when full-text search is disabled
- **Semantic version resolution** — Package installation now supports version ranges (e.g., `^4.0.0`, `latest`)
- **Network resilience** — Package downloads include retry logic, timeout handling, and offline fallback to cached packages
- **FHIR version introspection** — Engine can now report loaded FHIR versions (e.g., `['4.0.1']`)
- **Remote terminology provider interface** — Foundation for delegating terminology operations to external servers (preparation for fhir-server)

### Performance

- String search queries (e.g., `Patient?name=Smith`) now use full-text indexes instead of LIKE scans on large datasets
- PostgreSQL full-text search with tsvector provides sub-50ms query times on 10,000+ record tables

## [0.5.0] - 2026-03-16

### Fixed

- **PostgreSQL schema migration failures** — Fixed multiple PostgreSQL-specific SQL compatibility issues:
  - Dynamic `pg` package import in fhir-engine (ESM compatibility)
  - SQLite-specific `datetime('now')` replaced with `CURRENT_TIMESTAMP` for PostgreSQL
  - SQLite `AUTOINCREMENT` replaced with PostgreSQL `SERIAL` for auto-increment columns
  - SQLite `INSERT OR REPLACE` replaced with PostgreSQL `INSERT ... ON CONFLICT` for upsert operations
  - Missing `CREATE EXTENSION pg_trgm` and `btree_gin` in migration DDL path
  - Ambiguous `"id"` column reference in lookup table EXISTS subqueries causing `text = integer` type mismatch
- **PostgreSQL GIN index creation** — GIN indexes on TEXT columns now include required `pg_trgm` extension and operator class
- **Lookup table search on PostgreSQL** — `Patient?name=Smith` and similar queries now work correctly with qualified column references

### Changed

- Upgraded fhir-engine dependency from ^0.5.0 to ^0.5.1 (includes fhir-persistence ^0.5.0)
- `fhir new` generated `package.json` references fhir-engine ^0.5.1
- PostgreSQL is now fully supported with all CRUD operations and search queries working correctly

## [0.4.0] - 2026-03-15

### Added

- **PostgreSQL support** — fhir-cli now supports both SQLite and PostgreSQL databases
  - `fhir new` wizard offers SQLite or PostgreSQL database selection
  - PostgreSQL connection error handling with actionable hints (connection refused, auth failed)
  - PostgreSQL example config at `examples/configs/fhir.config.postgres.json`
  - PostgreSQL integration test suite (`integration-postgres.test.ts`)
- **Example config files** — `examples/configs/` with SQLite and PostgreSQL config templates
- **Lookup table search** — `Patient?name=Smith`, `Patient?address-city=...`, `Patient?email=...` now work correctly

### Changed

- Upgraded fhir-engine dependency from ^0.4.1 to ^0.4.2 (includes fhir-persistence ^0.3.0)
- `fhir new` generated `package.json` references fhir-engine ^0.4.2
- Engine factory no longer rejects PostgreSQL config — proper PG error handling added
- Updated all documentation for dual-database support

### Fixed

- **Lookup table search returned empty results** — `Patient?name=Smith` and similar queries using HumanName, Address, ContactPoint, Identifier lookup tables always returned empty results due to ambiguous `"id"` column reference in EXISTS subqueries (fixed in fhir-persistence ^0.3.0)

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
