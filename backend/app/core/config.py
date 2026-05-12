from pathlib import Path
from urllib.parse import quote, urlencode

from pydantic import ConfigDict, Field, model_validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "OperationalControl"
    app_env: str = "development"
    app_host: str = "0.0.0.0"
    app_port: int = 8000
    app_debug: bool = False
    enable_docs: bool | None = None

    db_host: str
    db_port: int = 1433
    db_name: str
    db_user: str
    db_password: str | None = None
    db_password_file: str | None = None
    db_driver: str = "ODBC Driver 18 for SQL Server"
    db_trust_server_certificate: bool = True
    db_pool_size: int = Field(default=10, ge=1)
    db_max_overflow: int = Field(default=20, ge=0)
    db_pool_timeout_seconds: int = Field(default=30, ge=1)
    db_pool_recycle_seconds: int = Field(default=1800, ge=60)
    db_health_timeout_seconds: float = Field(default=3.0, gt=0)

    jwt_secret: str | None = None
    jwt_secret_file: str | None = None
    refresh_token_secret: str | None = None
    refresh_token_secret_file: str | None = None

    access_token_expire_minutes: int = 15
    refresh_token_expire_days: int = 7
    seed_admin_email: str = "admin@muelles.local"
    seed_admin_password: str | None = "Admin123!"
    seed_admin_password_file: str | None = None

    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"
    trusted_hosts: str = "localhost,127.0.0.1,::1"
    gzip_minimum_size: int = Field(default=1000, ge=0)
    log_health_checks: bool = False
    request_log_min_duration_ms: float = Field(default=0, ge=0)
    rate_limit_per_minute: int = Field(default=300, ge=0)
    security_headers_enabled: bool = True
    hsts_enabled: bool = False

    model_config = ConfigDict(env_file=".env", extra="ignore")

    @model_validator(mode="after")
    def resolve_secret_files(self) -> "Settings":
        self.db_password = self._resolve_secret(
            "DB_PASSWORD", self.db_password, self.db_password_file
        )
        self.jwt_secret = self._resolve_secret("JWT_SECRET", self.jwt_secret, self.jwt_secret_file)
        self.refresh_token_secret = self._resolve_secret(
            "REFRESH_TOKEN_SECRET",
            self.refresh_token_secret,
            self.refresh_token_secret_file,
        )
        self.seed_admin_password = self._resolve_secret(
            "SEED_ADMIN_PASSWORD",
            self.seed_admin_password,
            self.seed_admin_password_file,
        )
        return self

    @staticmethod
    def _resolve_secret(name: str, value: str | None, file_path: str | None) -> str:
        if value:
            return value
        if file_path:
            secret = Path(file_path).read_text(encoding="utf-8").strip()
            if secret:
                return secret
        raise ValueError(f"{name} or {name}_FILE must be configured")

    @property
    def is_production(self) -> bool:
        return self.app_env.lower() == "production"

    @property
    def docs_enabled(self) -> bool:
        return (not self.is_production) if self.enable_docs is None else self.enable_docs

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    @property
    def trusted_host_list(self) -> list[str]:
        return [host.strip() for host in self.trusted_hosts.split(",") if host.strip()]

    @property
    def database_url(self) -> str:
        username = quote(self.db_user, safe="")
        password = quote(self.db_password, safe="")
        host_part = self.db_host
        if "\\" not in self.db_host:
            host_part = f"{self.db_host}:{self.db_port}"
        query = urlencode(
            {
                "driver": self.db_driver,
                "TrustServerCertificate": "yes" if self.db_trust_server_certificate else "no",
            }
        )
        return (
            f"mssql+aioodbc://{username}:{password}@{host_part}/"
            f"{quote(self.db_name, safe='')}?{query}"
        )


settings = Settings()
