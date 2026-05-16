from copy import deepcopy
from datetime import UTC, datetime

from app.core.exceptions import AppError, NotFoundError
from app.services.master_data_dev_seed import build_master_data_seed


def _now_iso():
    return datetime.now(UTC).isoformat()


class MasterDataDevStore:
    def __init__(self) -> None:
        seed = build_master_data_seed(_now_iso())
        self._next_ids = seed["next_ids"]
        self.clients = seed["clients"]
        self.vehicle_types = seed["vehicle_types"]
        self.operation_types = seed["operation_types"]
        self.docks = seed["docks"]
        self.non_compliance_reasons = seed["non_compliance_reasons"]
        self.operators = seed["operators"]
        self.standards = seed["standards"]
        self.business_rules = seed["business_rules"]
        self.users = seed["users"]

    def list_catalogs(self) -> dict:
        return {
            "clients": self._sorted(self.clients),
            "vehicleTypes": self._sorted(self.vehicle_types),
            "operationTypes": self._sorted(self.operation_types),
            "docks": self._sorted(self.docks),
            "nonComplianceReasons": self._sorted(self.non_compliance_reasons),
            "operators": self._sorted(self.operators),
            "standards": self._sorted(self.standards),
            "businessRules": [self._hydrate_rule(item) for item in self._sorted(self.business_rules)],
            "users": [self._hydrate_user(item) for item in self._sorted(self.users)],
            "roles": [{"value": role, "label": role.title()} for role in ["ADMIN", "CONSULTOR", "PLANEADOR", "SUPERVISOR", "PORTERIA"]],
        }

    def create_named(self, bucket_name: str, payload: dict) -> dict:
        item_id = self._next_ids[bucket_name]
        self._next_ids[bucket_name] += 1
        row = {"Id": item_id, "Name": payload["name"], "IsActive": payload["isActive"], "CreatedAt": _now_iso()}
        if bucket_name == "operation_types":
            row["StandardTimeMinutes"] = payload["standardTimeMinutes"]
        self._bucket(bucket_name)[item_id] = row
        return deepcopy(row)

    def update_named(self, bucket_name: str, item_id: int, payload: dict) -> dict:
        bucket = self._bucket(bucket_name)
        if item_id not in bucket:
            raise NotFoundError("Registro no encontrado")
        bucket[item_id]["Name"] = payload["name"]
        bucket[item_id]["IsActive"] = payload["isActive"]
        if bucket_name == "operation_types":
            bucket[item_id]["StandardTimeMinutes"] = payload["standardTimeMinutes"]
        return deepcopy(bucket[item_id])

    def deactivate_named(self, bucket_name: str, item_id: int) -> dict:
        bucket = self._bucket(bucket_name)
        if item_id not in bucket:
            raise NotFoundError("Registro no encontrado")
        bucket[item_id]["IsActive"] = False
        return deepcopy(bucket[item_id])

    def create_non_compliance_reason(self, payload: dict) -> dict:
        self._ensure_unique_non_compliance_reason(payload["name"], payload["reasonType"])
        item_id = self._next_ids["non_compliance_reasons"]
        self._next_ids["non_compliance_reasons"] += 1
        row = {
            "Id": item_id,
            "Name": payload["name"],
            "ReasonType": payload["reasonType"],
            "IsActive": payload["isActive"],
            "CreatedAt": _now_iso(),
            "UpdatedAt": None,
        }
        self.non_compliance_reasons[item_id] = row
        return deepcopy(row)

    def update_non_compliance_reason(self, item_id: int, payload: dict) -> dict:
        row = self.non_compliance_reasons.get(item_id)
        if not row:
            raise NotFoundError("Registro no encontrado")
        self._ensure_unique_non_compliance_reason(payload["name"], payload["reasonType"], exclude_id=item_id)
        row.update({
            "Name": payload["name"],
            "ReasonType": payload["reasonType"],
            "IsActive": payload["isActive"],
            "UpdatedAt": _now_iso(),
        })
        return deepcopy(row)

    def deactivate_non_compliance_reason(self, item_id: int) -> dict:
        row = self.non_compliance_reasons.get(item_id)
        if not row:
            raise NotFoundError("Registro no encontrado")
        row["IsActive"] = False
        row["UpdatedAt"] = _now_iso()
        return deepcopy(row)

    def create_standard(self, payload: dict) -> dict:
        item_id = self._next_ids["standards"]
        self._next_ids["standards"] += 1
        row = {
            "Id": item_id,
            "Name": payload["name"],
            "StandardTimeMinutes": payload["standardTimeMinutes"],
            "ToleranceMinutes": payload["toleranceMinutes"],
            "Description": payload.get("description"),
            "IsActive": payload["isActive"],
            "CreatedAt": _now_iso(),
            "UpdatedAt": None,
        }
        self.standards[item_id] = row
        return deepcopy(row)

    def update_standard(self, item_id: int, payload: dict) -> dict:
        row = self.standards.get(item_id)
        if not row:
            raise NotFoundError("Registro no encontrado")
        row.update({
            "Name": payload["name"],
            "StandardTimeMinutes": payload["standardTimeMinutes"],
            "ToleranceMinutes": payload["toleranceMinutes"],
            "Description": payload.get("description"),
            "IsActive": payload["isActive"],
            "UpdatedAt": _now_iso(),
        })
        return deepcopy(row)

    def deactivate_standard(self, item_id: int) -> dict:
        row = self.standards.get(item_id)
        if not row:
            raise NotFoundError("Registro no encontrado")
        row["IsActive"] = False
        row["UpdatedAt"] = _now_iso()
        return deepcopy(row)

    def create_operator(self, payload: dict) -> dict:
        item_id = self._next_ids["operators"]
        self._next_ids["operators"] += 1
        row = {
            "Id": item_id,
            "Name": payload["name"],
            "OperatorLevel": payload["operatorLevel"],
            "MaxConcurrentOperations": 1,
            "IsActive": payload["isActive"],
            "CreatedAt": _now_iso(),
        }
        self.operators[item_id] = row
        return deepcopy(row)

    def update_operator(self, item_id: int, payload: dict) -> dict:
        row = self.operators.get(item_id)
        if not row:
            raise NotFoundError("Registro no encontrado")
        row.update({
            "Name": payload["name"],
            "OperatorLevel": payload["operatorLevel"],
            "IsActive": payload["isActive"],
        })
        return deepcopy(row)

    def deactivate_operator(self, item_id: int) -> dict:
        row = self.operators.get(item_id)
        if not row:
            raise NotFoundError("Registro no encontrado")
        row["IsActive"] = False
        return deepcopy(row)

    def create_rule(self, payload: dict) -> dict:
        self._validate_rule(payload)
        item_id = self._next_ids["business_rules"]
        self._next_ids["business_rules"] += 1
        row = {
            "Id": item_id,
            "ClientId": payload["clientId"],
            "VehicleTypeId": payload["vehicleTypeId"],
            "OperationTypeId": payload["operationTypeId"],
            "StandardId": payload["standardId"],
            "IsActive": payload["isActive"],
            "CreatedAt": _now_iso(),
            "UpdatedAt": None,
        }
        self.business_rules[item_id] = row
        return self._hydrate_rule(row)

    def update_rule(self, item_id: int, payload: dict) -> dict:
        row = self.business_rules.get(item_id)
        if not row:
            raise NotFoundError("Registro no encontrado")
        self._validate_rule(payload, exclude_id=item_id)
        row.update({
            "ClientId": payload["clientId"],
            "VehicleTypeId": payload["vehicleTypeId"],
            "OperationTypeId": payload["operationTypeId"],
            "StandardId": payload["standardId"],
            "IsActive": payload["isActive"],
            "UpdatedAt": _now_iso(),
        })
        return self._hydrate_rule(row)

    def deactivate_rule(self, item_id: int) -> dict:
        row = self.business_rules.get(item_id)
        if not row:
            raise NotFoundError("Registro no encontrado")
        row["IsActive"] = False
        row["UpdatedAt"] = _now_iso()
        return self._hydrate_rule(row)

    def create_user(self, payload: dict) -> dict:
        self._ensure_unique_user_email(payload["email"])
        item_id = self._next_ids["users"]
        self._next_ids["users"] += 1
        row = {
            "Id": item_id,
            "Name": payload["name"],
            "Email": payload["email"],
            "IsActive": payload["isActive"],
            "CreatedAt": _now_iso(),
            "UpdatedAt": None,
            "Roles": list(payload["roleCodes"]),
        }
        self.users[item_id] = row
        return self._hydrate_user(row)

    def update_user(self, item_id: int, payload: dict) -> dict:
        row = self.users.get(item_id)
        if not row:
            raise NotFoundError("Registro no encontrado")
        self._ensure_unique_user_email(payload["email"], exclude_id=item_id)
        row.update({
            "Name": payload["name"],
            "Email": payload["email"],
            "IsActive": payload["isActive"],
            "Roles": list(payload["roleCodes"]),
            "UpdatedAt": _now_iso(),
        })
        return self._hydrate_user(row)

    def deactivate_user(self, item_id: int) -> dict:
        row = self.users.get(item_id)
        if not row:
            raise NotFoundError("Registro no encontrado")
        row["IsActive"] = False
        row["UpdatedAt"] = _now_iso()
        return self._hydrate_user(row)

    def _validate_rule(self, payload: dict, exclude_id: int | None = None) -> None:
        if payload["clientId"] not in self.clients or payload["vehicleTypeId"] not in self.vehicle_types or payload["operationTypeId"] not in self.operation_types or payload["standardId"] not in self.standards:
            raise AppError("La regla referencia un maestro inexistente", error_code="VALIDATION_ERROR", status_code=400)

        duplicated = next(
            (
                row
                for row in self.business_rules.values()
                if row["ClientId"] == payload["clientId"]
                and row["VehicleTypeId"] == payload["vehicleTypeId"]
                and row["OperationTypeId"] == payload["operationTypeId"]
                and row["Id"] != exclude_id
            ),
            None,
        )
        if duplicated:
            raise AppError("Ya existe una regla para la combinación cliente-vehículo-operación", error_code="VALIDATION_ERROR", status_code=409)

    def _ensure_unique_user_email(self, email: str, exclude_id: int | None = None) -> None:
        duplicated = next(
            (
                row
                for row in self.users.values()
                if row["Email"].lower() == email.lower() and row["Id"] != exclude_id
            ),
            None,
        )
        if duplicated:
            raise AppError("Ya existe un usuario con ese correo", error_code="VALIDATION_ERROR", status_code=409)

    def _ensure_unique_non_compliance_reason(self, name: str, reason_type: str, exclude_id: int | None = None) -> None:
        normalized_name = name.strip().lower()
        normalized_reason_type = reason_type.strip().upper()
        duplicated = next(
            (
                row
                for row in self.non_compliance_reasons.values()
                if row["Id"] != exclude_id
                and row["Name"].strip().lower() == normalized_name
                and str(row["ReasonType"]).strip().upper() == normalized_reason_type
            ),
            None,
        )
        if duplicated:
            raise AppError("Ya existe una causal con ese nombre para el tipo seleccionado", error_code="VALIDATION_ERROR", status_code=409)

    def _bucket(self, bucket_name: str) -> dict:
        return {
            "clients": self.clients,
            "vehicle_types": self.vehicle_types,
            "operation_types": self.operation_types,
            "docks": self.docks,
            "non_compliance_reasons": self.non_compliance_reasons,
            "operators": self.operators,
        }[bucket_name]

    def _sorted(self, bucket: dict) -> list[dict]:
        return [deepcopy(bucket[key]) for key in sorted(bucket.keys())]

    def _hydrate_rule(self, item: dict) -> dict:
        rule = deepcopy(item)
        rule["ClientName"] = self.clients[rule["ClientId"]]["Name"]
        rule["VehicleTypeName"] = self.vehicle_types[rule["VehicleTypeId"]]["Name"]
        rule["OperationTypeName"] = self.operation_types[rule["OperationTypeId"]]["Name"]
        rule["StandardName"] = self.standards[rule["StandardId"]]["Name"]
        rule["StandardTimeMinutes"] = self.standards[rule["StandardId"]]["StandardTimeMinutes"]
        rule["ToleranceMinutes"] = self.standards[rule["StandardId"]]["ToleranceMinutes"]
        return rule

    def _hydrate_user(self, item: dict) -> dict:
        user = deepcopy(item)
        user["Roles"] = ",".join(user["Roles"])
        return user


MASTER_DATA_DEV_STORE = MasterDataDevStore()
