from fastapi import APIRouter, Cookie, Depends

from app.api.v1.auth.dependencies import get_auth_service
from app.core.exceptions import UnauthorizedError
from app.core.responses import success_response
from app.middleware.auth import get_current_user
from app.schemas.auth import LoginRequest, RefreshRequest
from app.services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login")
async def login(payload: LoginRequest, service: AuthService = Depends(get_auth_service)):
    result = await service.login(payload.email, payload.password, device_info="web")
    api_response = success_response(
        "Login exitoso", {"accessToken": result["accessToken"], "user": result["user"]}
    )
    api_response.set_cookie(
        key="refresh_token",
        value=result["refreshToken"],
        httponly=True,
        secure=False,
        samesite="strict",
        max_age=60 * 60 * 24 * 7,
    )
    return api_response


@router.post("/refresh")
async def refresh(
    payload: RefreshRequest,
    refresh_token: str | None = Cookie(default=None),
    service: AuthService = Depends(get_auth_service),
):
    if not refresh_token:
        raise UnauthorizedError("Refresh token requerido")

    result = await service.refresh(refresh_token, payload.device_info)
    api_response = success_response("Token renovado", {"accessToken": result["accessToken"]})
    api_response.set_cookie(
        key="refresh_token",
        value=result["refreshToken"],
        httponly=True,
        secure=False,
        samesite="strict",
        max_age=60 * 60 * 24 * 7,
    )
    return api_response


@router.post("/logout")
async def logout(
    refresh_token: str | None = Cookie(default=None),
    service: AuthService = Depends(get_auth_service),
    current_user=Depends(get_current_user),
):
    await service.logout(refresh_token=refresh_token, user_id=current_user.user_id)
    api_response = success_response("Sesión cerrada")
    api_response.delete_cookie("refresh_token")
    return api_response
