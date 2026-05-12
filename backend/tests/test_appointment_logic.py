from datetime import UTC, datetime, timedelta

import pytest

from app.core.exceptions import AppError
from app.services.appointment_service import _InMemoryAppointmentsStore


def build_store() -> _InMemoryAppointmentsStore:
    return _InMemoryAppointmentsStore()


def test_update_requires_real_change():
    store = build_store()
    current = store.detail(1)

    with pytest.raises(AppError) as exc_info:
        store.update(
            1,
            {
                "clientId": current["ClientId"],
                "operationTypeId": current["OperationTypeId"],
                "vehicleTypeId": current["VehicleTypeId"],
                "estimatedTons": current["EstimatedTons"],
                "scheduledAt": datetime.fromisoformat(current["ScheduledAt"]),
            },
        )

    assert exc_info.value.error_code == "VALIDATION_ERROR"
    assert exc_info.value.details["rule"] == "NO_CHANGES_DETECTED"


def test_assign_rejects_expired_candidates():
    store = build_store()
    store.checkin(
        1,
        {
            "driverName": "Conductor 1",
            "driverDocument": "1010",
            "vehiclePlate": "ABC123",
        },
        9,
    )

    expired_version = int((datetime.now(UTC) - timedelta(seconds=31)).timestamp())

    with pytest.raises(AppError) as exc_info:
        store.assign(1, 1, expired_version, 9)

    assert exc_info.value.error_code == "CANDIDATES_EXPIRED"


def test_reassign_stays_in_en_proceso():
    store = build_store()
    store.checkin(
        1,
        {
            "driverName": "Conductor 1",
            "driverDocument": "1010",
            "vehiclePlate": "ABC123",
        },
        9,
    )
    valid_version = int(datetime.now(UTC).timestamp())
    store.assign(1, 1, valid_version, 9)
    store.start_process(
        1,
        datetime.now(UTC) - timedelta(minutes=10),
        datetime.now(UTC) - timedelta(minutes=5),
        "REM-001",
        "PREC-001",
        9,
    )

    updated = store.reassign(1, 2, int(datetime.now(UTC).timestamp()), 9)

    assert updated["Status"] == "EN_PROCESO"
    assert updated["DockId"] == 2


def test_start_process_requires_document_delivery_before_process_start():
    store = build_store()
    store.checkin(
        1,
        {
            "driverName": "Conductor 1",
            "driverDocument": "1010",
            "vehiclePlate": "ABC123",
        },
        9,
    )
    store.assign(1, 1, int(datetime.now(UTC).timestamp()), 9)

    with pytest.raises(AppError) as exc_info:
        store.start_process(
            1,
            datetime.now(UTC),
            datetime.now(UTC) - timedelta(minutes=1),
            "REM-001",
            "PREC-001",
            9,
        )

    assert exc_info.value.error_code == "INVALID_PROCESS_START_AT"
