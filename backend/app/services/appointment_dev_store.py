from app.services.appointment_dev_store_base import AppointmentDevStoreBase
from app.services.appointment_dev_store_commands import AppointmentDevStoreCommandsMixin
from app.services.appointment_dev_store_queries import AppointmentDevStoreQueriesMixin


class _InMemoryAppointmentsStore(
    AppointmentDevStoreBase,
    AppointmentDevStoreQueriesMixin,
    AppointmentDevStoreCommandsMixin,
):
    pass


DEV_APPOINTMENTS_STORE = _InMemoryAppointmentsStore()
