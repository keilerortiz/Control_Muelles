from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.core.constants import Role


class ActiveNamedPayload(BaseModel):
    name: str = Field(min_length=1, max_length=150)
    isActive: bool = True

    model_config = ConfigDict(extra="forbid")

    @field_validator("name")
    @classmethod
    def normalize_name(cls, value: str) -> str:
        return value.strip()


class OperationTypePayload(ActiveNamedPayload):
    standardTimeMinutes: int = Field(ge=1, le=1440)


class OperatorPayload(ActiveNamedPayload):
    operatorLevel: str = Field(min_length=6, max_length=20)

    @field_validator("operatorLevel")
    @classmethod
    def normalize_operator_level(cls, value: str) -> str:
        normalized = value.strip().upper()
        if normalized not in {"JUNIOR", "SENIOR"}:
            raise ValueError("Nivel de operario inválido")
        return normalized


class NonComplianceReasonPayload(ActiveNamedPayload):
    reasonType: str = Field(min_length=3, max_length=20)

    @field_validator("reasonType")
    @classmethod
    def normalize_reason_type(cls, value: str) -> str:
        normalized = value.strip().upper()
        if normalized not in {"OTC", "OTS"}:
            raise ValueError("Tipo de causal inválido")
        return normalized


class StandardPayload(ActiveNamedPayload):
    standardTimeMinutes: int = Field(ge=1, le=1440)
    toleranceMinutes: int = Field(ge=0, le=1440, default=0)
    description: str | None = Field(default=None, max_length=500)

    @field_validator("description")
    @classmethod
    def normalize_description(cls, value: str | None) -> str | None:
        return value.strip() if value else None


class BusinessRulePayload(BaseModel):
    clientId: int
    vehicleTypeId: int
    operationTypeId: int
    standardId: int
    isActive: bool = True

    model_config = ConfigDict(extra="forbid")


class UserCreatePayload(BaseModel):
    name: str = Field(min_length=1, max_length=150)
    email: str = Field(min_length=3, max_length=255)
    password: str = Field(min_length=8, max_length=128)
    roleCodes: list[str] = Field(min_length=1)
    isActive: bool = True

    model_config = ConfigDict(extra="forbid")

    @field_validator("name")
    @classmethod
    def normalize_name(cls, value: str) -> str:
        return value.strip()

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: str) -> str:
        normalized = value.strip().lower()
        if "@" not in normalized or normalized.startswith("@") or normalized.endswith("@"):
            raise ValueError("Correo inválido")
        local_part, domain_part = normalized.split("@", 1)
        if not local_part or not domain_part:
            raise ValueError("Correo inválido")
        return normalized

    @field_validator("roleCodes")
    @classmethod
    def validate_roles(cls, value: list[str]) -> list[str]:
        normalized = [role.strip().upper() for role in value if role.strip()]
        valid_roles = {role.value for role in Role}
        if not normalized or any(role not in valid_roles for role in normalized):
            raise ValueError("Roles inválidos")
        return sorted(set(normalized))


class UserUpdatePayload(BaseModel):
    name: str = Field(min_length=1, max_length=150)
    email: str = Field(min_length=3, max_length=255)
    password: str | None = Field(default=None, min_length=8, max_length=128)
    roleCodes: list[str] = Field(min_length=1)
    isActive: bool = True

    model_config = ConfigDict(extra="forbid")

    @field_validator("name")
    @classmethod
    def normalize_name(cls, value: str) -> str:
        return value.strip()

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: str) -> str:
        normalized = value.strip().lower()
        if "@" not in normalized or normalized.startswith("@") or normalized.endswith("@"):
            raise ValueError("Correo inválido")
        local_part, domain_part = normalized.split("@", 1)
        if not local_part or not domain_part:
            raise ValueError("Correo inválido")
        return normalized

    @field_validator("password")
    @classmethod
    def normalize_password(cls, value: str | None) -> str | None:
        return value if value else None

    @field_validator("roleCodes")
    @classmethod
    def validate_roles(cls, value: list[str]) -> list[str]:
        normalized = [role.strip().upper() for role in value if role.strip()]
        valid_roles = {role.value for role in Role}
        if not normalized or any(role not in valid_roles for role in normalized):
            raise ValueError("Roles inválidos")
        return sorted(set(normalized))
