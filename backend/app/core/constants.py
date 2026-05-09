from enum import StrEnum


class Role(StrEnum):
    PLANEADOR = "PLANEADOR"
    PORTERIA = "PORTERIA"
    SUPERVISOR = "SUPERVISOR"
    CONSULTOR = "CONSULTOR"
    ADMIN = "ADMIN"


class AppointmentStatus(StrEnum):
    AGENDADA = "AGENDADA"
    EN_PATIO = "EN_PATIO"
    ENTREGA_DOCUMENTOS = "ENTREGA_DOCUMENTOS"
    EN_PROCESO = "EN_PROCESO"
    PARA_FIRMAR = "PARA_FIRMAR"
    FINALIZADO = "FINALIZADO"
    ATENDIDA = "ATENDIDA"
    OPERACION_CANCELADA = "OPERACION_CANCELADA"


TERMINAL_STATUSES = {
    AppointmentStatus.ATENDIDA,
    AppointmentStatus.OPERACION_CANCELADA,
}

ACTIVE_RESOURCE_STATUSES = {
    AppointmentStatus.EN_PATIO,
    AppointmentStatus.ENTREGA_DOCUMENTOS,
    AppointmentStatus.EN_PROCESO,
}

ACTIVE_OPERATIONAL_STATUSES = {
    AppointmentStatus.EN_PATIO,
    AppointmentStatus.ENTREGA_DOCUMENTOS,
    AppointmentStatus.EN_PROCESO,
    AppointmentStatus.PARA_FIRMAR,
}
