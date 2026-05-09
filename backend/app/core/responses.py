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
    request_id: str,
    status_code: int,
    data: object = None,
) -> JSONResponse:
    return JSONResponse(
        status_code=status_code,
        content=jsonable_encoder(
            {
                "success": False,
                "message": message,
                "errorCode": error_code,
                "requestId": request_id,
                "data": data if data is not None else {},
            },
        ),
    )
