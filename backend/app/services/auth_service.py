from datetime import UTC, datetime, timedelta
from typing import Awaitable, Callable

from app.core.config import settings
from app.core.exceptions import UnauthorizedError
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_refresh_token,
    get_password_hash,
    hash_token,
    verify_password,
)
from app.repositories.auth_repository import AuthRepository
from sqlalchemy.exc import OperationalError, SQLAlchemyError

LEGACY_ADMIN_HASH = "$2b$12$C6UzMDM.H6dfI/f/IKcEe.3vQW9IoWl6iYx3vGN9VOGBev5nYe9y"


class AuthService:
    def __init__(self, repository: AuthRepository) -> None:
        self.repository = repository

    async def login(self, email: str, password: str, device_info: str | None) -> dict:
        normalized_email = email.strip().lower()
        try:
            user = await self.repository.get_user_by_email(normalized_email)
        except (OperationalError, SQLAlchemyError):
            return self._build_development_fallback_session_if_allowed(normalized_email, password)

        if not user or not user["IsActive"]:
            return self._build_development_fallback_session_if_allowed(normalized_email, password)

        password_is_valid = verify_password(password, user["PasswordHash"])
        if not password_is_valid:
            password_is_valid = await self._migrate_legacy_admin_hash_if_needed(user, email, password)
            if not password_is_valid:
                raise UnauthorizedError("Credenciales inválidas")

        roles = [role for role in user["Roles"].split(",") if role]
        access_token = create_access_token(user_id=user["Id"], roles=roles)
        refresh_token = create_refresh_token(user_id=user["Id"])
        refresh_expires_at = datetime.now(UTC) + timedelta(days=7)

        try:
            await self._run_in_transaction(
                lambda: self.repository.create_refresh_token(
                    user_id=user["Id"],
                    token_hash=hash_token(refresh_token),
                    expires_at=refresh_expires_at,
                    device_info=device_info,
                ),
            )
        except (OperationalError, SQLAlchemyError):
            fallback_is_allowed = self._is_development_seed_user(
                normalized_email,
                password,
                user["Email"],
            )
            if not fallback_is_allowed:
                raise

        return {
            "accessToken": access_token,
            "refreshToken": refresh_token,
            "user": {
                "id": user["Id"],
                "name": user["Name"],
                "email": user["Email"],
                "roles": roles,
            },
        }

    async def refresh(self, refresh_token: str, device_info: str | None) -> dict:
        payload = decode_refresh_token(refresh_token)
        user_id = int(payload["sub"])
        token_hash = hash_token(refresh_token)

        token_record = await self.repository.get_active_refresh_token(token_hash)
        if not token_record:
            raise UnauthorizedError("Refresh token revocado")

        user = await self.repository.get_user_by_id(user_id)
        if not user or not user["IsActive"]:
            raise UnauthorizedError("Usuario no autorizado")

        roles = [role for role in user["Roles"].split(",") if role]
        next_access_token = create_access_token(user_id=user_id, roles=roles)
        next_refresh_token = create_refresh_token(user_id=user_id)
        refresh_expires_at = datetime.now(UTC) + timedelta(days=7)

        async def refresh_transaction() -> None:
            await self.repository.revoke_refresh_token(token_hash)
            await self.repository.create_refresh_token(
                user_id=user_id,
                token_hash=hash_token(next_refresh_token),
                expires_at=refresh_expires_at,
                device_info=device_info,
            )

        await self._run_in_transaction(refresh_transaction)

        return {
            "accessToken": next_access_token,
            "refreshToken": next_refresh_token,
        }

    async def logout(self, refresh_token: str | None, user_id: int | None) -> None:
        async def logout_transaction() -> None:
            if refresh_token:
                await self.repository.revoke_refresh_token(hash_token(refresh_token))
            elif user_id is not None:
                await self.repository.revoke_user_tokens(user_id)

        await self._run_in_transaction(logout_transaction)

    async def _migrate_legacy_admin_hash_if_needed(
        self,
        user: dict,
        email: str,
        password: str,
    ) -> bool:
        is_admin_seed_user = (
            email.strip().lower() == settings.seed_admin_email.lower()
            and user["Email"].strip().lower() == settings.seed_admin_email.lower()
        )
        has_legacy_hash = user["PasswordHash"] == LEGACY_ADMIN_HASH
        is_seed_password = password == settings.seed_admin_password

        if not (is_admin_seed_user and has_legacy_hash and is_seed_password):
            return False

        upgraded_hash = get_password_hash(settings.seed_admin_password)
        await self._run_in_transaction(
            lambda: self.repository.update_user_password_hash(user["Id"], upgraded_hash),
        )

        return True

    def _build_development_fallback_session_if_allowed(self, email: str, password: str) -> dict:
        if not self._is_development_seed_user(email, password):
            raise UnauthorizedError("Credenciales inválidas")

        roles = ["ADMIN"]
        user_id = 1
        return {
            "accessToken": create_access_token(user_id=user_id, roles=roles),
            "refreshToken": create_refresh_token(user_id=user_id),
            "user": {
                "id": user_id,
                "name": "Admin Control Muelles",
                "email": settings.seed_admin_email,
                "roles": roles,
            },
        }

    def _is_development_seed_user(
        self,
        email: str,
        password: str,
        user_email: str | None = None,
    ) -> bool:
        if settings.app_env.lower() != "development":
            return False

        expected_email = settings.seed_admin_email.strip().lower()
        effective_email = (user_email or email).strip().lower()
        return (
            effective_email == expected_email
            and password == settings.seed_admin_password
        )

    async def _run_in_transaction(self, action: Callable[[], Awaitable[None]]) -> None:
        if self.repository.session.in_transaction():
            await action()
            return

        async with self.repository.session.begin():
            await action()
