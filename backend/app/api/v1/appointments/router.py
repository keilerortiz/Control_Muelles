from datetime import UTC, datetime, timedelta, timezone
from fastapi import APIRouter, Depends, Query, Request

from app.api.v1.appointments.dependencies import get_appointment_service
from app.core.constants import Role
from app.core.responses import success_response
from app.middleware.auth import require_roles
from app.schemas.appointments import (
    AppointmentCheckIn,
    AppointmentCreate,
    AppointmentUpdate,
    AssignResourcesPayload,
    CancelPayload,
    CheckoutPayload,
    FinalizePayload,
    StartProcessPayload,
    ToSignPayload,
)
from app.services.appointment_service import AppointmentService
router = APIRouter(prefix="/appointments", tags=["appointments"])
BOGOTA_TZ = timezone(timedelta(hours=-5))
ALL_APPOINTMENT_ROLES = require_roles(Role.ADMIN, Role.CONSULTOR, Role.PLANEADOR, Role.PORTERIA, Role.SUPERVISOR)
PLANNER_OR_ADMIN = require_roles(Role.PLANEADOR, Role.ADMIN)
SUPERVISOR_OR_ADMIN = require_roles(Role.SUPERVISOR, Role.ADMIN)
GATEHOUSE_OR_ADMIN = require_roles(Role.PORTERIA, Role.ADMIN)


def _origin_client_id(request: Request) -> str | None: return request.headers.get("X-Client-ID")

def _to_bogota_naive(value: datetime | None) -> datetime | None:
    if value is None:
        return None
    if value.tzinfo is None:
        return value
    return value.astimezone(BOGOTA_TZ).replace(tzinfo=None)

@router.get("/dashboard-summary")
async def dashboard_summary(
    date_from: datetime | None = Query(default=None),
    date_to: datetime | None = Query(default=None),
    service: AppointmentService = Depends(get_appointment_service),
    _=Depends(ALL_APPOINTMENT_ROLES),
):
    data = await service.dashboard_summary(
        date_from=_to_bogota_naive(date_from),
        date_to=_to_bogota_naive(date_to),
    )
    return success_response("Dashboard operativo", data)


@router.get("/kpis/timeline")
async def kpis_timeline(
    date_from: datetime | None = Query(default=None),
    date_to: datetime | None = Query(default=None),
    service: AppointmentService = Depends(get_appointment_service),
    _=Depends(ALL_APPOINTMENT_ROLES),
):
    data = await service.kpis_timeline(
        date_from=_to_bogota_naive(date_from),
        date_to=_to_bogota_naive(date_to),
    )
    return success_response("Timeline de KPIs", data)


@router.get("/logistics-dashboard")
async def logistics_dashboard(
    date_from: datetime | None = Query(default=None),
    date_to: datetime | None = Query(default=None),
    service: AppointmentService = Depends(get_appointment_service),
    _=Depends(ALL_APPOINTMENT_ROLES),
):
    data = await service.logistics_dashboard(
        date_from=_to_bogota_naive(date_from),
        date_to=_to_bogota_naive(date_to),
    )
    return success_response("Dashboard logistico", data)


@router.get("/operators/performance")
async def operator_performance(
    date_from: datetime | None = Query(default=None),
    date_to: datetime | None = Query(default=None),
    service: AppointmentService = Depends(get_appointment_service),
    _=Depends(ALL_APPOINTMENT_ROLES),
):
    data = await service.operator_performance(
        date_from=_to_bogota_naive(date_from),
        date_to=_to_bogota_naive(date_to),
    )
    return success_response("Desempeño por operario", data)


@router.get("")
async def list_appointments(
    skip: int = Query(default=0, ge=0),
    take: int = Query(default=20, ge=1, le=100),
    search: str | None = None,
    status: str | None = None,
    date_from: datetime | None = Query(default=None),
    date_to: datetime | None = Query(default=None),
    service: AppointmentService = Depends(get_appointment_service),
    _=Depends(ALL_APPOINTMENT_ROLES),
):
    data = await service.list_appointments(
        skip=skip,
        take=take,
        search=search,
        status=status,
        date_from=_to_bogota_naive(date_from),
        date_to=_to_bogota_naive(date_to),
    )
    return success_response("Listado obtenido", data)


@router.get("/{appointment_id}")
async def get_appointment(
    appointment_id: int,
    service: AppointmentService = Depends(get_appointment_service),
    _=Depends(ALL_APPOINTMENT_ROLES),
):
    data = await service.detail(appointment_id)
    return success_response("Detalle obtenido", data)


@router.get("/{appointment_id}/status-log")
async def status_log(
    appointment_id: int,
    service: AppointmentService = Depends(get_appointment_service),
    _=Depends(ALL_APPOINTMENT_ROLES),
):
    data = await service.status_log(appointment_id)
    return success_response("Historial obtenido", data)


@router.get("/{appointment_id}/candidates")
async def candidates(
    appointment_id: int,
    service: AppointmentService = Depends(get_appointment_service),
    _=Depends(SUPERVISOR_OR_ADMIN),
):
    data = await service.candidates(appointment_id)
    return success_response("Candidatos obtenidos", data)


@router.post("", status_code=201)
async def create_appointment(
    request: Request,
    payload: AppointmentCreate,
    service: AppointmentService = Depends(get_appointment_service),
    current_user=Depends(PLANNER_OR_ADMIN),
):
    data = await service.create(
        payload.model_dump(),
        current_user.user_id,
        request.state.request_id,
        _origin_client_id(request),
    )
    return success_response("Cita creada exitosamente.", data, status_code=201)


@router.put("/{appointment_id}")
async def update_appointment(
    request: Request,
    appointment_id: int,
    payload: AppointmentUpdate,
    service: AppointmentService = Depends(get_appointment_service),
    current_user=Depends(PLANNER_OR_ADMIN),
):
    data = await service.update(
        appointment_id,
        payload.model_dump(),
        current_user.user_id,
        request.state.request_id,
        _origin_client_id(request),
    )
    return success_response("Cita actualizada exitosamente.", data)


@router.delete("/{appointment_id}")
async def delete_appointment(
    request: Request,
    appointment_id: int,
    version: int | None = Query(None),
    service: AppointmentService = Depends(get_appointment_service),
    current_user=Depends(PLANNER_OR_ADMIN),
):
    await service.delete(
        appointment_id,
        current_user.user_id,
        request.state.request_id,
        _origin_client_id(request),
        version=version,
    )
    return success_response("Cita eliminada exitosamente.")


@router.post("/{appointment_id}/checkin")
async def checkin(
    request: Request,
    appointment_id: int,
    payload: AppointmentCheckIn,
    service: AppointmentService = Depends(get_appointment_service),
    current_user=Depends(GATEHOUSE_OR_ADMIN),
):
    data = await service.checkin(
        appointment_id,
        payload.model_dump(),
        current_user.user_id,
        request.state.request_id,
        _origin_client_id(request),
    )
    return success_response("Ingreso registrado exitosamente.", data)


@router.post("/{appointment_id}/assign")
async def assign(
    request: Request,
    appointment_id: int,
    payload: AssignResourcesPayload,
    service: AppointmentService = Depends(get_appointment_service),
    current_user=Depends(SUPERVISOR_OR_ADMIN),
):
    data = await service.assign(
        appointment_id,
        payload.model_dump(),
        current_user.user_id,
        request.state.request_id,
        _origin_client_id(request),
    )
    return success_response("Recursos asignados exitosamente.", data)


@router.post("/{appointment_id}/reassign")
async def reassign(
    request: Request,
    appointment_id: int,
    payload: AssignResourcesPayload,
    service: AppointmentService = Depends(get_appointment_service),
    current_user=Depends(SUPERVISOR_OR_ADMIN),
):
    data = await service.reassign(
        appointment_id,
        payload.model_dump(),
        current_user.user_id,
        request.state.request_id,
        _origin_client_id(request),
    )
    return success_response("Recursos reasignados exitosamente.", data)


@router.post("/{appointment_id}/start-process")
async def start_process(
    request: Request,
    appointment_id: int,
    payload: StartProcessPayload,
    service: AppointmentService = Depends(get_appointment_service),
    current_user=Depends(PLANNER_OR_ADMIN),
):
    data = await service.start_process(
        appointment_id,
        payload.model_dump(),
        current_user.user_id,
        request.state.request_id,
        _origin_client_id(request),
    )
    return success_response("Proceso iniciado exitosamente.", data)


@router.post("/{appointment_id}/to-sign")
async def to_sign(
    request: Request,
    appointment_id: int,
    payload: ToSignPayload,
    service: AppointmentService = Depends(get_appointment_service),
    current_user=Depends(PLANNER_OR_ADMIN),
):
    data = await service.to_sign(
        appointment_id,
        datetime.now(UTC),
        payload.model_dump(),
        current_user.user_id,
        request.state.request_id,
        _origin_client_id(request),
    )
    return success_response("Vehículo enviado a firma exitosamente.", data)


@router.post("/{appointment_id}/finalize")
async def finalize(
    request: Request,
    appointment_id: int,
    payload: FinalizePayload,
    service: AppointmentService = Depends(get_appointment_service),
    current_user=Depends(SUPERVISOR_OR_ADMIN),
):
    data = await service.finalize(
        appointment_id,
        payload.model_dump(),
        current_user.user_id,
        request.state.request_id,
        _origin_client_id(request),
    )
    return success_response("Cita finalizada exitosamente.", data)


@router.post("/{appointment_id}/checkout")
async def checkout(
    request: Request,
    appointment_id: int,
    payload: CheckoutPayload,
    service: AppointmentService = Depends(get_appointment_service),
    current_user=Depends(GATEHOUSE_OR_ADMIN),
):
    data = await service.checkout(
        appointment_id,
        datetime.now(UTC),
        payload.model_dump(),
        current_user.user_id,
        request.state.request_id,
        _origin_client_id(request),
    )
    return success_response("Salida registrada exitosamente.", data)


@router.post("/{appointment_id}/cancel")
async def cancel(
    request: Request,
    appointment_id: int,
    payload: CancelPayload,
    service: AppointmentService = Depends(get_appointment_service),
    current_user=Depends(SUPERVISOR_OR_ADMIN),
):
    data = await service.cancel(
        appointment_id,
        payload.cancellationReason,
        payload.model_dump(),
        current_user.user_id,
        request.state.request_id,
        _origin_client_id(request),
    )
    return success_response("Operación cancelada", data)
