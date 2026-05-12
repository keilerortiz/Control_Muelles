from app.core.config import settings
from app.repositories.appointment_repository import AppointmentRepository
from app.services.appointment_dev_store import DEV_APPOINTMENTS_STORE, _InMemoryAppointmentsStore
from app.services.appointment_service_actions import AppointmentServiceActionsMixin
from app.services.appointment_service_crud import AppointmentServiceCrudMixin
from app.services.appointment_service_helpers import AppointmentServiceHelpersMixin
from app.services.appointment_service_reads import AppointmentServiceReadsMixin


class AppointmentService(
    AppointmentServiceHelpersMixin,
    AppointmentServiceReadsMixin,
    AppointmentServiceCrudMixin,
    AppointmentServiceActionsMixin,
):
    def __init__(self, repository: AppointmentRepository) -> None:
        self.repository = repository
        self._dev_mode = settings.app_env.lower() == "development"
