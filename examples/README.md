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

## Using Examples in Tests

Tests import examples directly to ensure they remain valid:

```typescript
import patient from '../../examples/resources/patient.json';
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
