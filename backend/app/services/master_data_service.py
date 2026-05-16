from collections.abc import Awaitable, Callable

from sqlalchemy.exc import DBAPIError

from app.core.config import settings
from app.core.constants import Role
from app.core.exceptions import AppError, NotFoundError
from app.core.security import get_password_hash
from app.repositories.master_data_repository import MasterDataRepository
from app.services.master_data_dev_store import MASTER_DATA_DEV_STORE


class MasterDataService:
    def __init__(self, repository: MasterDataRepository) -> None:
        self.repository = repository
        self._dev_mode = settings.app_env.lower() == "development"

    async def catalogs(self) -> dict:
        try:
            return {
                "clients": await self.repository.list_clients(),
                "vehicleTypes": await self.repository.list_vehicle_types(),
                "operationTypes": await self.repository.list_operation_types(),
                "docks": await self.repository.list_docks(),
                "nonComplianceReasons": await self._list_non_compliance_reasons_safely(),
                "operators": await self.repository.list_operators(),
                "standards": await self.repository.list_standards(),
                "businessRules": await self.repository.list_business_rules(),
                "users": [self._normalize_user(row) for row in await self.repository.list_users()],
                "roles": [{"value": role.value, "label": role.value.title()} for role in Role],
            }
        except DBAPIError:
            if self._dev_mode:
                return MASTER_DATA_DEV_STORE.list_catalogs()
            raise

    async def create_client(self, payload: dict) -> dict:
        return await self._execute_named(
            lambda: self.repository.create_client(payload),
            lambda: MASTER_DATA_DEV_STORE.create_named("clients", payload),
        )

    async def update_client(self, item_id: int, payload: dict) -> dict:
        return await self._execute_named(
            lambda: self.repository.update_client(item_id, payload),
            lambda: MASTER_DATA_DEV_STORE.update_named("clients", item_id, payload),
        )

    async def delete_client(self, item_id: int) -> dict:
        return await self._execute_named(
            lambda: self.repository.deactivate_client(item_id),
            lambda: MASTER_DATA_DEV_STORE.deactivate_named("clients", item_id),
        )

    async def create_vehicle_type(self, payload: dict) -> dict:
        return await self._execute_named(
            lambda: self.repository.create_vehicle_type(payload),
            lambda: MASTER_DATA_DEV_STORE.create_named("vehicle_types", payload),
        )

    async def update_vehicle_type(self, item_id: int, payload: dict) -> dict:
        return await self._execute_named(
            lambda: self.repository.update_vehicle_type(item_id, payload),
            lambda: MASTER_DATA_DEV_STORE.update_named("vehicle_types", item_id, payload),
        )

    async def delete_vehicle_type(self, item_id: int) -> dict:
        return await self._execute_named(
            lambda: self.repository.deactivate_vehicle_type(item_id),
            lambda: MASTER_DATA_DEV_STORE.deactivate_named("vehicle_types", item_id),
        )

    async def create_operation_type(self, payload: dict) -> dict:
        return await self._execute_named(
            lambda: self.repository.create_operation_type(payload),
            lambda: MASTER_DATA_DEV_STORE.create_named("operation_types", payload),
        )

    async def update_operation_type(self, item_id: int, payload: dict) -> dict:
        return await self._execute_named(
            lambda: self.repository.update_operation_type(item_id, payload),
            lambda: MASTER_DATA_DEV_STORE.update_named("operation_types", item_id, payload),
        )

    async def delete_operation_type(self, item_id: int) -> dict:
        return await self._execute_named(
            lambda: self.repository.deactivate_operation_type(item_id),
            lambda: MASTER_DATA_DEV_STORE.deactivate_named("operation_types", item_id),
        )

    async def create_dock(self, payload: dict) -> dict:
        return await self._execute_named(
            lambda: self.repository.create_dock(payload),
            lambda: MASTER_DATA_DEV_STORE.create_named("docks", payload),
        )

    async def update_dock(self, item_id: int, payload: dict) -> dict:
        return await self._execute_named(
            lambda: self.repository.update_dock(item_id, payload),
            lambda: MASTER_DATA_DEV_STORE.update_named("docks", item_id, payload),
        )

    async def delete_dock(self, item_id: int) -> dict:
        return await self._execute_named(
            lambda: self.repository.deactivate_dock(item_id),
            lambda: MASTER_DATA_DEV_STORE.deactivate_named("docks", item_id),
        )

    async def create_non_compliance_reason(self, payload: dict) -> dict:
        return await self._execute_named(
            lambda: self.repository.create_non_compliance_reason(payload),
            lambda: MASTER_DATA_DEV_STORE.create_non_compliance_reason(payload),
        )

    async def update_non_compliance_reason(self, item_id: int, payload: dict) -> dict:
        return await self._execute_named(
            lambda: self.repository.update_non_compliance_reason(item_id, payload),
            lambda: MASTER_DATA_DEV_STORE.update_non_compliance_reason(item_id, payload),
        )

    async def delete_non_compliance_reason(self, item_id: int) -> dict:
        return await self._execute_named(
            lambda: self.repository.deactivate_non_compliance_reason(item_id),
            lambda: MASTER_DATA_DEV_STORE.deactivate_non_compliance_reason(item_id),
        )

    async def create_operator(self, payload: dict) -> dict:
        return await self._execute_named(
            lambda: self.repository.create_operator(payload),
            lambda: MASTER_DATA_DEV_STORE.create_operator(payload),
        )

    async def update_operator(self, item_id: int, payload: dict) -> dict:
        return await self._execute_named(
            lambda: self.repository.update_operator(item_id, payload),
            lambda: MASTER_DATA_DEV_STORE.update_operator(item_id, payload),
        )

    async def delete_operator(self, item_id: int) -> dict:
        return await self._execute_named(
            lambda: self.repository.deactivate_operator(item_id),
            lambda: MASTER_DATA_DEV_STORE.deactivate_operator(item_id),
        )

    async def create_standard(self, payload: dict) -> dict:
        return await self._execute_named(
            lambda: self.repository.create_standard(payload),
            lambda: MASTER_DATA_DEV_STORE.create_standard(payload),
        )

    async def update_standard(self, item_id: int, payload: dict) -> dict:
        return await self._execute_named(
            lambda: self.repository.update_standard(item_id, payload),
            lambda: MASTER_DATA_DEV_STORE.update_standard(item_id, payload),
        )

    async def delete_standard(self, item_id: int) -> dict:
        return await self._execute_named(
            lambda: self.repository.deactivate_standard(item_id),
            lambda: MASTER_DATA_DEV_STORE.deactivate_standard(item_id),
        )

    async def create_business_rule(self, payload: dict) -> dict:
        return await self._execute_named(
            lambda: self.repository.create_business_rule(payload),
            lambda: MASTER_DATA_DEV_STORE.create_rule(payload),
        )

    async def update_business_rule(self, item_id: int, payload: dict) -> dict:
        return await self._execute_named(
            lambda: self.repository.update_business_rule(item_id, payload),
            lambda: MASTER_DATA_DEV_STORE.update_rule(item_id, payload),
        )

    async def delete_business_rule(self, item_id: int) -> dict:
        return await self._execute_named(
            lambda: self.repository.deactivate_business_rule(item_id),
            lambda: MASTER_DATA_DEV_STORE.deactivate_rule(item_id),
        )

    async def create_user(self, payload: dict) -> dict:
        normalized = {**payload, "email": payload["email"].strip().lower()}
        return await self._run_user_mutation(
            lambda: self._create_user_db(normalized),
            lambda: MASTER_DATA_DEV_STORE.create_user(normalized),
        )

    async def update_user(self, user_id: int, payload: dict) -> dict:
        normalized = {**payload, "email": payload["email"].strip().lower()}
        return await self._run_user_mutation(
            lambda: self._update_user_db(user_id, normalized),
            lambda: MASTER_DATA_DEV_STORE.update_user(user_id, normalized),
        )

    async def delete_user(self, user_id: int) -> dict:
        return await self._run_user_mutation(
            lambda: self._delete_user_db(user_id),
            lambda: MASTER_DATA_DEV_STORE.deactivate_user(user_id),
        )

    async def _create_user_db(self, payload: dict) -> dict:
        async def action() -> dict:
            if await self.repository.find_user_by_email(payload["email"]):
                raise AppError("Ya existe un usuario con ese correo", error_code="VALIDATION_ERROR", status_code=409)

            role_ids = await self.repository.get_role_ids(payload["roleCodes"])
            if len(role_ids) != len(payload["roleCodes"]):
                raise AppError("Uno o más roles no existen", error_code="VALIDATION_ERROR", status_code=400)

            user_id = await self.repository.create_user({
                **payload,
                "passwordHash": get_password_hash(payload["password"]),
            })
            await self.repository.replace_user_roles(user_id, role_ids)
            row = await self.repository.get_user(user_id)
            return self._normalize_user(row) if row else None

        return await self._run_in_transaction(action)

    async def _update_user_db(self, user_id: int, payload: dict) -> dict | None:
        async def action() -> dict:
            if await self.repository.find_user_by_email(payload["email"], exclude_user_id=user_id):
                raise AppError("Ya existe un usuario con ese correo", error_code="VALIDATION_ERROR", status_code=409)

            role_ids = await self.repository.get_role_ids(payload["roleCodes"])
            if len(role_ids) != len(payload["roleCodes"]):
                raise AppError("Uno o más roles no existen", error_code="VALIDATION_ERROR", status_code=400)

            updated = await self.repository.update_user(user_id, payload)
            if not updated:
                raise NotFoundError("Usuario no encontrado")
            if payload.get("password"):
                await self.repository.update_user_password_hash(user_id, get_password_hash(payload["password"]))
            await self.repository.replace_user_roles(user_id, role_ids)
            row = await self.repository.get_user(user_id)
            return self._normalize_user(row) if row else None

        return await self._run_in_transaction(action)

    async def _delete_user_db(self, user_id: int) -> dict | None:
        async def action() -> dict:
            existing = await self.repository.get_user(user_id)
            if not existing:
                raise NotFoundError("Usuario no encontrado")
            deleted = await self.repository.deactivate_user(user_id)
            if not deleted:
                raise NotFoundError("Usuario no encontrado")
            normalized = self._normalize_user(existing) or {}
            return {**normalized, "IsActive": False}

        return await self._run_in_transaction(action)

    async def _execute_named(self, primary_action: Callable[[], Awaitable[dict | None]], fallback_action: Callable[[], dict]) -> dict:
        try:
            result = await self._run_in_transaction(primary_action)
        except DBAPIError:
            if self._dev_mode:
                return fallback_action()
            raise
        if not result:
            raise NotFoundError("Registro no encontrado")
        return result

    async def _run_user_mutation(self, primary_action: Callable[[], Awaitable[dict | None]], fallback_action: Callable[[], dict]) -> dict:
        try:
            result = await primary_action()
        except DBAPIError:
            if self._dev_mode:
                return fallback_action()
            raise
        if not result:
            raise NotFoundError("Registro no encontrado")
        return result

    def _normalize_user(self, row: dict | None) -> dict | None:
        if not row:
            return None
        return {
            **row,
            "roleCodes": [role for role in (row.get("Roles") or "").split(",") if role],
        }

    async def _list_non_compliance_reasons_safely(self) -> list[dict]:
        try:
            return await self.repository.list_non_compliance_reasons()
        except DBAPIError:
            if self._dev_mode:
                return MASTER_DATA_DEV_STORE.list_catalogs().get("nonComplianceReasons", [])
            return []

    async def _run_in_transaction(self, action: Callable[[], Awaitable[dict | None]]) -> dict | None:
        if self.repository.session.in_transaction():
            return await action()

        async with self.repository.session.begin():
            return await action()
