# FHIRPath Guide

`fhir path` evaluates FHIRPath expressions against FHIR resources without needing a running server.

## Basic Usage

```bash
fhir path <file> <expression> [--format json|text|tree]
```

## Examples

### Extract Patient Name

```bash
fhir path examples/resources/patient.json "name.family"
# → ["Smith"]

fhir path examples/resources/patient.json "name.given"
# → ["John", "Michael"]
```

### Boolean Expressions

```bash
fhir path examples/resources/patient.json "gender = 'male'"
# → [true]
```

### Filtering with `where()`

```bash
fhir path examples/resources/patient.json "telecom.where(system = 'email').value"
# → ["john.smith@example.com"]
```

### Counting

```bash
fhir path examples/resources/patient.json "telecom.count()"
# → [2]
```

### Observation Components

```bash
fhir path examples/resources/observation.json "component.code.coding.display"
# → ["Systolic blood pressure", "Diastolic blood pressure"]
```

### Resource Type

```bash
fhir path examples/resources/patient.json "resourceType"
# → ["Patient"]
```

## Common FHIRPath Expressions

| Expression | Description |
|---|---|
| `name.family` | Family name(s) |
| `name.given` | Given name(s) |
| `identifier.value` | Identifier values |
| `telecom.where(system = 'phone').value` | Phone numbers |
| `telecom.where(system = 'email').value` | Email addresses |
| `address.city` | Cities |
| `gender` | Gender |
| `birthDate` | Birth date |
| `resourceType` | Resource type |
| `meta.versionId` | Version ID |
| `meta.lastUpdated` | Last updated timestamp |

## FHIRPath Functions

Commonly used functions:

| Function | Example |
|---|---|
| `where(expr)` | `telecom.where(system = 'phone')` |
| `exists()` | `name.exists()` |
| `count()` | `telecom.count()` |
| `first()` | `name.first().family` |
| `last()` | `name.last()` |
| `empty()` | `telecom.empty()` |
| `not()` | `deceased.not()` |
| `contains(string)` | `name.family.contains('Sm')` |
| `startsWith(string)` | `name.family.startsWith('Sm')` |
| `matches(regex)` | `birthDate.matches('[0-9]{4}')` |

## Using with Examples

The `examples/fhirpath/expressions.json` file contains testable expression/expected pairs:

```json
{
  "cases": [
    {
      "file": "resources/patient.json",
      "expression": "name.family",
      "expected": ["Smith"]
    }
  ]
}
```

These are automatically tested by the test suite to ensure examples stay correct.

## Reference

- [FHIRPath Specification](http://hl7.org/fhirpath/)
- [FHIR FHIRPath](https://www.hl7.org/fhir/fhirpath.html)
