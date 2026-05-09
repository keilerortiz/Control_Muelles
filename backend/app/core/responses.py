from fastapi.encoders import jsonable_encoder
from fastapi.responses import JSONResponse


def success_response(message: str, data: object = None, status_code: int = 200) -> JSONResponse:
    return JSONResponse(
        status_code=status_code,
        content=jsonable_encoder(
            {"success": True, "message": message, "data": data if data is not None else {}},
        ),
    )


def error_response(
    *,
    message: str,
    error_code: str,
    correlation_id: str,
    status_code: int,
    data: object = None,
) -> JSONResponse:
    return JSONResponse(
        status_code=status_code,
        content=jsonable_encoder(
            {
                "success": False,
                "message": message,
                "data": None,
                "error": {
                    "code": error_code,
                    "details": data if data is not None else {},
                },
                "correlationId": correlation_id,
            },
        ),
    )
