from __future__ import annotations

from datetime import UTC, datetime
from typing import Any

CANDIDATES_TTL_SECONDS = 30
VALID_CLIENT_IDS = {1, 2}
VALID_OPERATION_TYPE_IDS = {1, 2}
VALID_VEHICLE_TYPE_IDS = {1, 2}

ERROR_METADATA: dict[str, tuple[str, int]] = {
    "INVALID_DATE": ("Fecha invalida", 409),
    "VALIDATION_ERROR": ("Error de validacion", 400),
    "RESOURCE_NOT_FOUND": ("Recurso no encontrado", 404),
    "INVALID_STATUS_FOR_UPDATE": ("Estado invalido para actualizar", 409),
    "INVALID_STATUS_FOR_DELETE": ("Estado invalido para eliminar", 409),
    "INVALID_STATE_TRANSITION": ("Transicion invalida", 409),
    "DOCK_BUSY": ("Muelle ocupado", 409),
    "OPERATORS_BUSY": ("Operarios ocupados", 409),
    "CANDIDATES_EXPIRED": ("Candidatos expirados", 409),
    "INVALID_PROCESS_START_AT": ("Inicio de proceso invalido", 409),
    "INVALID_PROCESS_END_AT": ("Fin de proceso invalido", 409),
    "INVALID_FINALIZED_AT": ("Fecha de finalizacion invalida", 409),
    "INVALID_CHECKOUT_AT": ("Fecha de checkout invalida", 409),
}


def to_iso(value: datetime | None) -> str | None:
    if value is None:
        return None
    if value.tzinfo is None:
        value = value.replace(tzinfo=UTC)
    return value.isoformat()


def normalize_datetime(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value.replace(tzinfo=UTC)
    return value.astimezone(UTC)


def parse_dt(value: Any) -> datetime | None:
    if not value:
        return None
    if isinstance(value, datetime):
        return normalize_datetime(value)
    return datetime.fromisoformat(str(value))
