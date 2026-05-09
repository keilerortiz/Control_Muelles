from fastapi import APIRouter, Depends, Query

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


@router.get("/dashboard-summary")
async def dashboard_summary(
    service: AppointmentService = Depends(get_appointment_service),
    _=Depends(require_roles(Role.ADMIN, Role.CONSULTOR, Role.PLANEADOR, Role.PORTERIA, Role.SUPERVISOR)),
):
    data = await service.dashboard_summary()
    return success_response("Dashboard operativo", data)


@router.get("")
async def list_appointments(
    skip: int = Query(default=0, ge=0),
    take: int = Query(default=20, ge=1, le=100),
    search: str | None = None,
    status: str | None = None,
    service: AppointmentService = Depends(get_appointment_service),
    _=Depends(require_roles(Role.ADMIN, Role.CONSULTOR, Role.PLANEADOR, Role.PORTERIA, Role.SUPERVISOR)),
):
    data = await service.list_appointments(skip=skip, take=take, search=search, status=status)
    return success_response("Listado obtenido", data)


@router.get("/{appointment_id}")
async def get_appointment(
    appointment_id: int,
    service: AppointmentService = Depends(get_appointment_service),
    _=Depends(require_roles(Role.ADMIN, Role.CONSULTOR, Role.PLANEADOR, Role.PORTERIA, Role.SUPERVISOR)),
):
    data = await service.detail(appointment_id)
    return success_response("Detalle obtenido", data)


@router.get("/{appointment_id}/status-log")
async def status_log(
    appointment_id: int,
    service: AppointmentService = Depends(get_appointment_service),
    _=Depends(require_roles(Role.ADMIN, Role.CONSULTOR, Role.PLANEADOR, Role.PORTERIA, Role.SUPERVISOR)),
):
    data = await service.status_log(appointment_id)
    return success_response("Historial obtenido", data)


@router.get("/{appointment_id}/candidates")
async def candidates(
    appointment_id: int,
    service: AppointmentService = Depends(get_appointment_service),
    _=Depends(require_roles(Role.SUPERVISOR, Role.ADMIN)),
):
    data = await service.candidates(appointment_id)
    return success_response("Candidatos obtenidos", data)


@router.post("", status_code=201)
async def create_appointment(
    payload: AppointmentCreate,
    service: AppointmentService = Depends(get_appointment_service),
    current_user=Depends(require_roles(Role.PLANEADOR, Role.ADMIN)),
):
    data = await service.create(payload.model_dump(), current_user.user_id)
    return success_response("Cita creada", data, status_code=201)


@router.put("/{appointment_id}")
async def update_appointment(
    appointment_id: int,
    payload: AppointmentUpdate,
    service: AppointmentService = Depends(get_appointment_service),
    current_user=Depends(require_roles(Role.PLANEADOR, Role.ADMIN)),
):
    data = await service.update(appointment_id, payload.model_dump(), current_user.user_id)
    return success_response("Cita actualizada", data)


@router.delete("/{appointment_id}")
async def delete_appointment(
    appointment_id: int,
    service: AppointmentService = Depends(get_appointment_service),
    current_user=Depends(require_roles(Role.PLANEADOR, Role.ADMIN)),
):
    await service.delete(appointment_id, current_user.user_id)
    return success_response("Cita eliminada")


@router.post("/{appointment_id}/checkin")
async def checkin(
    appointment_id: int,
    payload: AppointmentCheckIn,
    service: AppointmentService = Depends(get_appointment_service),
    current_user=Depends(require_roles(Role.PORTERIA, Role.ADMIN)),
):
    data = await service.checkin(appointment_id, payload.model_dump(), current_user.user_id)
    return success_response("Check-in exitoso", data)


@router.post("/{appointment_id}/assign")
async def assign(
    appointment_id: int,
    payload: AssignResourcesPayload,
    service: AppointmentService = Depends(get_appointment_service),
    current_user=Depends(require_roles(Role.SUPERVISOR, Role.ADMIN)),
):
    data = await service.assign(appointment_id, payload.model_dump(), current_user.user_id)
    return success_response("Recursos asignados", data)


@router.post("/{appointment_id}/reassign")
async def reassign(
    appointment_id: int,
    payload: AssignResourcesPayload,
    service: AppointmentService = Depends(get_appointment_service),
    current_user=Depends(require_roles(Role.SUPERVISOR, Role.ADMIN)),
):
    data = await service.reassign(appointment_id, payload.model_dump(), current_user.user_id)
    return success_response("Recursos reasignados", data)


@router.post("/{appointment_id}/start-process")
async def start_process(
    appointment_id: int,
    payload: StartProcessPayload,
    service: AppointmentService = Depends(get_appointment_service),
    current_user=Depends(require_roles(Role.PLANEADOR, Role.ADMIN)),
):
    data = await service.start_process(appointment_id, payload.processStartAt, current_user.user_id)
    return success_response("Proceso iniciado", data)


@router.post("/{appointment_id}/to-sign")
async def to_sign(
    appointment_id: int,
    payload: ToSignPayload,
    service: AppointmentService = Depends(get_appointment_service),
    current_user=Depends(require_roles(Role.PLANEADOR, Role.ADMIN)),
):
    data = await service.to_sign(appointment_id, payload.processEndAt, current_user.user_id)
    return success_response("Cita en firma", data)


@router.post("/{appointment_id}/finalize")
async def finalize(
    appointment_id: int,
    payload: FinalizePayload,
    service: AppointmentService = Depends(get_appointment_service),
    current_user=Depends(require_roles(Role.SUPERVISOR, Role.ADMIN)),
):
    data = await service.finalize(appointment_id, payload.model_dump(), current_user.user_id)
    return success_response("Cita finalizada", data)


@router.post("/{appointment_id}/checkout")
async def checkout(
    appointment_id: int,
    payload: CheckoutPayload,
    service: AppointmentService = Depends(get_appointment_service),
    current_user=Depends(require_roles(Role.PORTERIA, Role.ADMIN)),
):
    data = await service.checkout(appointment_id, payload.checkoutAt, current_user.user_id)
    return success_response("Checkout exitoso", data)


@router.post("/{appointment_id}/cancel")
async def cancel(
    appointment_id: int,
    payload: CancelPayload,
    service: AppointmentService = Depends(get_appointment_service),
    current_user=Depends(require_roles(Role.SUPERVISOR, Role.ADMIN)),
):
    data = await service.cancel(appointment_id, payload.cancellationReason, current_user.user_id)
    return success_response("Operación cancelada", data)
