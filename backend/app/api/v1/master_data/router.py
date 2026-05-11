from fastapi import APIRouter, Depends

from app.api.v1.master_data.dependencies import get_master_data_service
from app.core.constants import Role
from app.core.responses import success_response
from app.middleware.auth import require_roles
from app.schemas.master_data import (
    ActiveNamedPayload,
    BusinessRulePayload,
    OperationTypePayload,
    StandardPayload,
    UserCreatePayload,
    UserUpdatePayload,
)
from app.services.master_data_service import MasterDataService

router = APIRouter(prefix="/masters", tags=["masters"])


@router.get("/catalogs")
async def get_catalogs(
    service: MasterDataService = Depends(get_master_data_service),
    _=Depends(require_roles(Role.ADMIN, Role.CONSULTOR, Role.PLANEADOR, Role.PORTERIA, Role.SUPERVISOR)),
):
    return success_response("Maestros obtenidos", await service.catalogs())


@router.post("/clients", status_code=201)
async def create_client(payload: ActiveNamedPayload, service: MasterDataService = Depends(get_master_data_service), _=Depends(require_roles(Role.ADMIN))):
    return success_response("Cliente creado", await service.create_client(payload.model_dump()), status_code=201)


@router.put("/clients/{item_id}")
async def update_client(item_id: int, payload: ActiveNamedPayload, service: MasterDataService = Depends(get_master_data_service), _=Depends(require_roles(Role.ADMIN))):
    return success_response("Cliente actualizado", await service.update_client(item_id, payload.model_dump()))


@router.delete("/clients/{item_id}")
async def delete_client(item_id: int, service: MasterDataService = Depends(get_master_data_service), _=Depends(require_roles(Role.ADMIN))):
    return success_response("Cliente desactivado", await service.delete_client(item_id))


@router.post("/vehicle-types", status_code=201)
async def create_vehicle_type(payload: ActiveNamedPayload, service: MasterDataService = Depends(get_master_data_service), _=Depends(require_roles(Role.ADMIN))):
    return success_response("Tipo de vehículo creado", await service.create_vehicle_type(payload.model_dump()), status_code=201)


@router.put("/vehicle-types/{item_id}")
async def update_vehicle_type(item_id: int, payload: ActiveNamedPayload, service: MasterDataService = Depends(get_master_data_service), _=Depends(require_roles(Role.ADMIN))):
    return success_response("Tipo de vehículo actualizado", await service.update_vehicle_type(item_id, payload.model_dump()))


@router.delete("/vehicle-types/{item_id}")
async def delete_vehicle_type(item_id: int, service: MasterDataService = Depends(get_master_data_service), _=Depends(require_roles(Role.ADMIN))):
    return success_response("Tipo de vehículo desactivado", await service.delete_vehicle_type(item_id))


@router.post("/operation-types", status_code=201)
async def create_operation_type(payload: OperationTypePayload, service: MasterDataService = Depends(get_master_data_service), _=Depends(require_roles(Role.ADMIN))):
    return success_response("Tipo de operación creado", await service.create_operation_type(payload.model_dump()), status_code=201)


@router.put("/operation-types/{item_id}")
async def update_operation_type(item_id: int, payload: OperationTypePayload, service: MasterDataService = Depends(get_master_data_service), _=Depends(require_roles(Role.ADMIN))):
    return success_response("Tipo de operación actualizado", await service.update_operation_type(item_id, payload.model_dump()))


@router.delete("/operation-types/{item_id}")
async def delete_operation_type(item_id: int, service: MasterDataService = Depends(get_master_data_service), _=Depends(require_roles(Role.ADMIN))):
    return success_response("Tipo de operación desactivado", await service.delete_operation_type(item_id))


@router.post("/standards", status_code=201)
async def create_standard(payload: StandardPayload, service: MasterDataService = Depends(get_master_data_service), _=Depends(require_roles(Role.ADMIN))):
    return success_response("Estándar creado", await service.create_standard(payload.model_dump()), status_code=201)


@router.put("/standards/{item_id}")
async def update_standard(item_id: int, payload: StandardPayload, service: MasterDataService = Depends(get_master_data_service), _=Depends(require_roles(Role.ADMIN))):
    return success_response("Estándar actualizado", await service.update_standard(item_id, payload.model_dump()))


@router.delete("/standards/{item_id}")
async def delete_standard(item_id: int, service: MasterDataService = Depends(get_master_data_service), _=Depends(require_roles(Role.ADMIN))):
    return success_response("Estándar desactivado", await service.delete_standard(item_id))


@router.post("/business-rules", status_code=201)
async def create_business_rule(payload: BusinessRulePayload, service: MasterDataService = Depends(get_master_data_service), _=Depends(require_roles(Role.ADMIN))):
    return success_response("Regla creada", await service.create_business_rule(payload.model_dump()), status_code=201)


@router.put("/business-rules/{item_id}")
async def update_business_rule(item_id: int, payload: BusinessRulePayload, service: MasterDataService = Depends(get_master_data_service), _=Depends(require_roles(Role.ADMIN))):
    return success_response("Regla actualizada", await service.update_business_rule(item_id, payload.model_dump()))


@router.delete("/business-rules/{item_id}")
async def delete_business_rule(item_id: int, service: MasterDataService = Depends(get_master_data_service), _=Depends(require_roles(Role.ADMIN))):
    return success_response("Regla desactivada", await service.delete_business_rule(item_id))


@router.post("/users", status_code=201)
async def create_user(payload: UserCreatePayload, service: MasterDataService = Depends(get_master_data_service), _=Depends(require_roles(Role.ADMIN))):
    return success_response("Usuario creado", await service.create_user(payload.model_dump()), status_code=201)


@router.put("/users/{user_id}")
async def update_user(user_id: int, payload: UserUpdatePayload, service: MasterDataService = Depends(get_master_data_service), _=Depends(require_roles(Role.ADMIN))):
    return success_response("Usuario actualizado", await service.update_user(user_id, payload.model_dump()))


@router.delete("/users/{user_id}")
async def delete_user(user_id: int, service: MasterDataService = Depends(get_master_data_service), _=Depends(require_roles(Role.ADMIN))):
    return success_response("Usuario desactivado", await service.delete_user(user_id))
