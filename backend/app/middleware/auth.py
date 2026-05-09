from collections.abc import Callable

from fastapi import Depends, Header

from app.core.exceptions import ForbiddenError, UnauthorizedError
from app.core.security import decode_access_token


class AuthUser(dict):
    @property
    def user_id(self) -> int:
        return int(self["sub"])

    @property
    def roles(self) -> list[str]:
        return list(self.get("roles", []))


def get_current_user(authorization: str | None = Header(default=None)) -> AuthUser:
    if not authorization or not authorization.startswith("Bearer "):
        raise UnauthorizedError("Bearer token requerido")
    token = authorization.replace("Bearer ", "", 1).strip()
    return AuthUser(decode_access_token(token))


def require_roles(*required_roles: str) -> Callable:
    def dependency(current_user: AuthUser = Depends(get_current_user)) -> AuthUser:
        if not set(required_roles).intersection(set(current_user.roles)):
            raise ForbiddenError("Rol insuficiente")
        return current_user

    return dependency
