from datetime import datetime

from pydantic import BaseModel, ConfigDict


class ApiEnvelope(BaseModel):
    success: bool
    message: str
    data: dict


class PaginationQuery(BaseModel):
    skip: int = 0
    take: int = 20
    sort_by: str | None = None
    search: str | None = None

    model_config = ConfigDict(extra="forbid")


class TimeStampRange(BaseModel):
    from_at: datetime | None = None
    to_at: datetime | None = None

    model_config = ConfigDict(extra="forbid")
