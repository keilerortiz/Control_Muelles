from __future__ import annotations

import hashlib
from datetime import UTC, datetime, timedelta

import bcrypt
from jose import JWTError, jwt

from app.core.config import settings
from app.core.exceptions import UnauthorizedError


def verify_password(plain_password: str, hashed_password: str) -> bool:
    if not hashed_password:
        return False

    try:
        return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))
    except (TypeError, ValueError):
        return False


def get_password_hash(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt(rounds=12)).decode("utf-8")


def _build_payload(subject: str, roles: list[str], expires_delta: timedelta) -> dict:
    now = datetime.now(UTC)
    return {
        "sub": subject,
        "roles": roles,
        "iat": int(now.timestamp()),
        "exp": int((now + expires_delta).timestamp()),
    }


def create_access_token(user_id: int, roles: list[str]) -> str:
    payload = _build_payload(str(user_id), roles, timedelta(minutes=settings.access_token_expire_minutes))
    return jwt.encode(payload, settings.jwt_secret, algorithm="HS256")


def create_refresh_token(user_id: int) -> str:
    payload = _build_payload(str(user_id), [], timedelta(days=settings.refresh_token_expire_days))
    return jwt.encode(payload, settings.refresh_token_secret, algorithm="HS256")


def decode_access_token(token: str) -> dict:
    try:
        return jwt.decode(token, settings.jwt_secret, algorithms=["HS256"])
    except JWTError as exc:
        raise UnauthorizedError("Token inválido o expirado") from exc


def decode_refresh_token(token: str) -> dict:
    try:
        return jwt.decode(token, settings.refresh_token_secret, algorithms=["HS256"])
    except JWTError as exc:
        raise UnauthorizedError("Refresh token inválido o expirado") from exc


def hash_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()
