from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.appointment_repository_commands import AppointmentRepositoryCommandsMixin
from app.repositories.appointment_repository_queries import AppointmentRepositoryQueriesMixin


class AppointmentRepository(AppointmentRepositoryQueriesMixin, AppointmentRepositoryCommandsMixin):
    def __init__(self, session: AsyncSession) -> None:
        self.session = session
