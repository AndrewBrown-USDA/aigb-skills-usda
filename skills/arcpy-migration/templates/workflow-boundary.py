from dataclasses import dataclass
from pathlib import Path


@dataclass(frozen=True)
class WorkflowContext:
    input_dir: Path
    output_dir: Path
    temp_dir: Path
    input_crs: str
    output_crs: str
    horizontal_units: str
    vertical_units: str | None
    nodata: float | int | None
    overwrite: bool = False


def run_adapter(context):
    """Read external inputs, invoke the pure core, and write declared artifacts."""
    inputs = load_inputs(context)
    result = run_core(inputs, context)
    return write_outputs(result, context)


def run_core(inputs, context):
    """Pure transformation boundary: no ArcPy, globals, or project state."""
    validate_contract(inputs, context)
    transformed = transform(inputs, context)
    return {
        "status": "complete",
        "artifacts": transformed.artifacts,
        "diagnostics": transformed.diagnostics,
        "provenance": transformed.provenance,
        "limitations": transformed.limitations,
    }


def write_outputs(result, context):
    """Write only declared artifacts and return their paths and checksums."""
    context.output_dir.mkdir(parents=True, exist_ok=True)
    return result
