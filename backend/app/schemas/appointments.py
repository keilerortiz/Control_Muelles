from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class AppointmentCreate(BaseModel):
    clientId: int
    operationTypeId: int
    vehicleTypeId: int
    estimatedTons: float = Field(gt=0)
    scheduledAt: datetime
    driverName: str | None = None
    driverDocument: str | None = None
    vehiclePlate: str | None = None
    nonComplianceComment: str | None = None

    model_config = ConfigDict(extra="forbid")


class AppointmentUpdate(AppointmentCreate):
    version: int
    model_config = ConfigDict(extra="forbid")


class AppointmentCheckIn(BaseModel):
    driverName: str
    driverDocument: str
    vehiclePlate: str
    version: int

    model_config = ConfigDict(extra="forbid")


class AssignResourcesPayload(BaseModel):
    dockId: int
    seniorIds: list[int]
    juniorIds: list[int] = []
    candidatesVersion: int
    reassignDockTouched: bool = False
    reassignSeniorTouched: bool = False
    reassignJuniorTouched: bool = False
    version: int

    model_config = ConfigDict(extra="forbid")


class StartProcessPayload(BaseModel):
    remissions: str
    precincts: str
    version: int

    model_config = ConfigDict(extra="forbid")


class ToSignPayload(BaseModel):
    version: int
    model_config = ConfigDict(extra="forbid")


class FinalizePayload(BaseModel):
    movedWeightKg: float = Field(ge=0)
    otcNonComplianceReason: str | None = None
    otsNonComplianceReason: str | None = None
    nonComplianceComment: str | None = None
    version: int

    model_config = ConfigDict(extra="forbid")


class CheckoutPayload(BaseModel):
    version: int
    model_config = ConfigDict(extra="forbid")


class CancelPayload(BaseModel):
    cancellationReason: str
    version: int

    model_config = ConfigDict(extra="forbid")


class AppointmentListQuery(BaseModel):
    skip: int = 0
    take: int = 20
    search: str | None = None
    status: str | None = None
    date_from: datetime | None = None
    date_to: datetime | None = None

    model_config = ConfigDict(extra="forbid")
