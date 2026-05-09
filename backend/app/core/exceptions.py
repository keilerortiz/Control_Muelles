from http import HTTPStatus


class AppError(Exception):
    def __init__(
        self,
        message: str,
        error_code: str = "BUSINESS_ERROR",
        status_code: int = HTTPStatus.BAD_REQUEST,
        details: dict | None = None,
    ) -> None:
        super().__init__(message)
        self.message = message
        self.error_code = error_code
        self.status_code = status_code
        self.details = details or {}


class UnauthorizedError(AppError):
    def __init__(self, message: str = "No autorizado") -> None:
        super().__init__(message=message, error_code="UNAUTHORIZED", status_code=HTTPStatus.UNAUTHORIZED)


class ForbiddenError(AppError):
    def __init__(self, message: str = "Acceso denegado") -> None:
        super().__init__(message=message, error_code="ACCESS_DENIED", status_code=HTTPStatus.FORBIDDEN)


class NotFoundError(AppError):
    def __init__(self, message: str = "Recurso no encontrado") -> None:
        super().__init__(message=message, error_code="RESOURCE_NOT_FOUND", status_code=HTTPStatus.NOT_FOUND)
