from pydantic import BaseModel, ConfigDict, EmailStr, field_validator


class LoginRequest(BaseModel):
    email: str
    password: str

    model_config = ConfigDict(extra="forbid")

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: str) -> str:
        normalized = value.strip().lower()
        if not normalized or "@" not in normalized:
            raise ValueError("Email inválido")
        return normalized


class RefreshRequest(BaseModel):
    device_info: str | None = None

    model_config = ConfigDict(extra="forbid")


class UserProfile(BaseModel):
    id: int
    name: str
    email: EmailStr
    roles: list[str]


class LoginResponse(BaseModel):
    accessToken: str
    user: UserProfile


class RefreshResponse(BaseModel):
    accessToken: str
