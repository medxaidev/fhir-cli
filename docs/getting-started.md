# Getting Started

## Prerequisites

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0

## Installation

```bash
npm install -g fhir-cli
```

Or use directly via `npx`:

```bash
npx fhir-cli --help
```

## Create a New Project

```bash
fhir new my-fhir-project
cd my-fhir-project
```

The interactive wizard will guide you through:

1. Project name
2. FHIR version (R4)
3. Database type (SQLite or PostgreSQL)
4. Whether to include US Core IG
5. Whether to generate example resources

This creates:

```
my-fhir-project/
├── fhir.config.json    # Engine configuration
├── package.json        # Node.js package
├── .gitignore
└── resources/          # Your FHIR resources
    └── Patient-example.json
```

## Basic Workflow

### 1. Create a Resource

```bash
fhir resource create resources/Patient-example.json
```

### 2. Read a Resource

```bash
fhir resource get Patient/<id>
```

### 3. Search Resources

```bash
fhir query Patient
fhir query "Patient?name=Smith"
fhir query "Patient?birthdate=ge1990-01-01" --count 10
```

### 4. Validate a Resource

```bash
fhir validate resources/Patient-example.json
```

### 5. Evaluate FHIRPath

```bash
fhir path resources/Patient-example.json "name.family"
```

### 6. Check Environment

```bash
fhir doctor
```

## Configuration

The `fhir.config.json` file controls the engine:

### SQLite (Default)

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

### PostgreSQL

```json
{
  "database": {
    "type": "postgres",
    "url": "postgresql://user:pass@localhost:5432/fhir"
  },
  "packages": {
    "path": "./fhir-packages"
  }
}
```

> **Note:** PostgreSQL requires a running server. Create the database before starting the engine:
>
> ```bash
> createdb fhir
> ```

## Next Steps

- [Command Reference](./commands.md) — All available commands
- [Validation Guide](./validation.md) — Resource validation details
- [FHIRPath Guide](./fhirpath.md) — Expression evaluation
- [Examples](../examples/README.md) — Runnable examples
