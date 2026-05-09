from pydantic import ConfigDict, Field
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "OperationalControl"
    app_env: str = "development"
    app_host: str = "0.0.0.0"
    app_port: int = 8000
    app_debug: bool = True

    db_host: str
    db_port: int = 1433
    db_name: str
    db_user: str
    db_password: str
    db_driver: str = "ODBC Driver 18 for SQL Server"

    jwt_secret: str
    refresh_token_secret: str

    access_token_expire_minutes: int = 15
    refresh_token_expire_days: int = 7
    seed_admin_email: str = "admin@muelles.local"
    seed_admin_password: str = "Admin123!"

    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"
    trusted_hosts: str = "localhost,127.0.0.1,::1"
    rate_limit_per_minute: int = Field(default=100)

    model_config = ConfigDict(env_file=".env", extra="ignore")

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    @property
    def trusted_host_list(self) -> list[str]:
        return [host.strip() for host in self.trusted_hosts.split(",") if host.strip()]

    @property
    def database_url(self) -> str:
        driver = self.db_driver.replace(" ", "+")
        host_part = self.db_host
        if "\\" not in self.db_host:
            host_part = f"{self.db_host}:{self.db_port}"
        return (
            f"mssql+aioodbc://{self.db_user}:{self.db_password}@{host_part}/"
            f"{self.db_name}?driver={driver}&TrustServerCertificate=yes"
        )


settings = Settings()
