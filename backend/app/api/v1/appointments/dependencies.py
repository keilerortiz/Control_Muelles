from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db_session
from app.repositories.appointment_repository import AppointmentRepository
from app.services.appointment_service import AppointmentService


def get_appointment_repository(session: AsyncSession = Depends(get_db_session)) -> AppointmentRepository:
    return AppointmentRepository(session)


def get_appointment_service(
    repository: AppointmentRepository = Depends(get_appointment_repository),
) -> AppointmentService:
    return AppointmentService(repository)
