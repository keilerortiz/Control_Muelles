from app.core.constants import AppointmentStatus


def test_status_flow_order():
    assert AppointmentStatus.AGENDADA == "AGENDADA"
    assert AppointmentStatus.ATENDIDA == "ATENDIDA"
