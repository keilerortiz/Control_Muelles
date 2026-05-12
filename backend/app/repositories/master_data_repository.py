from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession


class MasterDataRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def list_clients(self) -> list[dict]:
        return await self._fetch_all(
            """
            SELECT Id, Name, IsActive, CreatedAt
            FROM dbo.tbl_Client
            ORDER BY Name ASC
            """
        )

    async def create_client(self, payload: dict) -> dict:
        return await self._insert_named("dbo.tbl_Client", payload)

    async def update_client(self, item_id: int, payload: dict) -> dict | None:
        return await self._update_named("dbo.tbl_Client", item_id, payload)

    async def deactivate_client(self, item_id: int) -> dict | None:
        return await self._deactivate_named("dbo.tbl_Client", item_id)

    async def list_vehicle_types(self) -> list[dict]:
        return await self._fetch_all(
            """
            SELECT Id, Name, IsActive, CreatedAt
            FROM dbo.tbl_VehicleType
            ORDER BY Name ASC
            """
        )

    async def create_vehicle_type(self, payload: dict) -> dict:
        return await self._insert_named("dbo.tbl_VehicleType", payload)

    async def update_vehicle_type(self, item_id: int, payload: dict) -> dict | None:
        return await self._update_named("dbo.tbl_VehicleType", item_id, payload)

    async def deactivate_vehicle_type(self, item_id: int) -> dict | None:
        return await self._deactivate_named("dbo.tbl_VehicleType", item_id)

    async def list_operation_types(self) -> list[dict]:
        return await self._fetch_all(
            """
            SELECT Id, Name, StandardTimeMinutes, IsActive, CreatedAt
            FROM dbo.tbl_OperationType
            ORDER BY Name ASC
            """
        )

    async def create_operation_type(self, payload: dict) -> dict:
        result = await self.session.execute(
            text(
                """
                INSERT INTO dbo.tbl_OperationType (Name, StandardTimeMinutes, IsActive)
                OUTPUT INSERTED.Id, INSERTED.Name, INSERTED.StandardTimeMinutes, INSERTED.IsActive, INSERTED.CreatedAt
                VALUES (:name, :standard_time_minutes, :is_active)
                """
            ),
            {
                "name": payload["name"],
                "standard_time_minutes": payload["standardTimeMinutes"],
                "is_active": payload["isActive"],
            },
        )
        return dict(result.mappings().one())

    async def update_operation_type(self, item_id: int, payload: dict) -> dict | None:
        result = await self.session.execute(
            text(
                """
                UPDATE dbo.tbl_OperationType
                SET Name = :name,
                    StandardTimeMinutes = :standard_time_minutes,
                    IsActive = :is_active
                OUTPUT INSERTED.Id, INSERTED.Name, INSERTED.StandardTimeMinutes, INSERTED.IsActive, INSERTED.CreatedAt
                WHERE Id = :item_id
                """
            ),
            {
                "item_id": item_id,
                "name": payload["name"],
                "standard_time_minutes": payload["standardTimeMinutes"],
                "is_active": payload["isActive"],
            },
        )
        row = result.mappings().first()
        return dict(row) if row else None

    async def deactivate_operation_type(self, item_id: int) -> dict | None:
        result = await self.session.execute(
            text(
                """
                UPDATE dbo.tbl_OperationType
                SET IsActive = 0
                OUTPUT INSERTED.Id, INSERTED.Name, INSERTED.StandardTimeMinutes, INSERTED.IsActive, INSERTED.CreatedAt
                WHERE Id = :item_id
                """
            ),
            {"item_id": item_id},
        )
        row = result.mappings().first()
        return dict(row) if row else None

    async def list_standards(self) -> list[dict]:
        return await self._fetch_all(
            """
            SELECT Id, Name, StandardTimeMinutes, ToleranceMinutes, Description, IsActive, CreatedAt, UpdatedAt
            FROM dbo.tbl_Standard
            ORDER BY Name ASC
            """
        )

    async def create_standard(self, payload: dict) -> dict:
        result = await self.session.execute(
            text(
                """
                INSERT INTO dbo.tbl_Standard (Name, StandardTimeMinutes, ToleranceMinutes, Description, IsActive)
                OUTPUT INSERTED.Id, INSERTED.Name, INSERTED.StandardTimeMinutes, INSERTED.ToleranceMinutes, INSERTED.Description, INSERTED.IsActive, INSERTED.CreatedAt, INSERTED.UpdatedAt
                VALUES (:name, :standard_time_minutes, :tolerance_minutes, :description, :is_active)
                """
            ),
            {
                "name": payload["name"],
                "standard_time_minutes": payload["standardTimeMinutes"],
                "tolerance_minutes": payload["toleranceMinutes"],
                "description": payload.get("description"),
                "is_active": payload["isActive"],
            },
        )
        return dict(result.mappings().one())

    async def update_standard(self, item_id: int, payload: dict) -> dict | None:
        result = await self.session.execute(
            text(
                """
                UPDATE dbo.tbl_Standard
                SET Name = :name,
                    StandardTimeMinutes = :standard_time_minutes,
                    ToleranceMinutes = :tolerance_minutes,
                    Description = :description,
                    IsActive = :is_active,
                    UpdatedAt = GETUTCDATE()
                OUTPUT INSERTED.Id, INSERTED.Name, INSERTED.StandardTimeMinutes, INSERTED.ToleranceMinutes, INSERTED.Description, INSERTED.IsActive, INSERTED.CreatedAt, INSERTED.UpdatedAt
                WHERE Id = :item_id
                """
            ),
            {
                "item_id": item_id,
                "name": payload["name"],
                "standard_time_minutes": payload["standardTimeMinutes"],
                "tolerance_minutes": payload["toleranceMinutes"],
                "description": payload.get("description"),
                "is_active": payload["isActive"],
            },
        )
        row = result.mappings().first()
        return dict(row) if row else None

    async def deactivate_standard(self, item_id: int) -> dict | None:
        result = await self.session.execute(
            text(
                """
                UPDATE dbo.tbl_Standard
                SET IsActive = 0,
                    UpdatedAt = GETUTCDATE()
                OUTPUT INSERTED.Id, INSERTED.Name, INSERTED.StandardTimeMinutes, INSERTED.ToleranceMinutes, INSERTED.Description, INSERTED.IsActive, INSERTED.CreatedAt, INSERTED.UpdatedAt
                WHERE Id = :item_id
                """
            ),
            {"item_id": item_id},
        )
        row = result.mappings().first()
        return dict(row) if row else None

    async def list_business_rules(self) -> list[dict]:
        return await self._fetch_all(
            """
            SELECT
                br.Id,
                br.ClientId,
                c.Name AS ClientName,
                br.VehicleTypeId,
                vt.Name AS VehicleTypeName,
                br.OperationTypeId,
                ot.Name AS OperationTypeName,
                br.StandardId,
                s.Name AS StandardName,
                s.StandardTimeMinutes,
                s.ToleranceMinutes,
                br.IsActive,
                br.CreatedAt,
                br.UpdatedAt
            FROM dbo.tbl_BusinessRule br
            INNER JOIN dbo.tbl_Client c ON c.Id = br.ClientId
            INNER JOIN dbo.tbl_VehicleType vt ON vt.Id = br.VehicleTypeId
            INNER JOIN dbo.tbl_OperationType ot ON ot.Id = br.OperationTypeId
            INNER JOIN dbo.tbl_Standard s ON s.Id = br.StandardId
            ORDER BY c.Name, vt.Name, ot.Name
            """
        )

    async def create_business_rule(self, payload: dict) -> dict:
        result = await self.session.execute(
            text(
                """
                INSERT INTO dbo.tbl_BusinessRule (ClientId, VehicleTypeId, OperationTypeId, StandardId, IsActive)
                OUTPUT INSERTED.Id
                VALUES (:client_id, :vehicle_type_id, :operation_type_id, :standard_id, :is_active)
                """
            ),
            {
                "client_id": payload["clientId"],
                "vehicle_type_id": payload["vehicleTypeId"],
                "operation_type_id": payload["operationTypeId"],
                "standard_id": payload["standardId"],
                "is_active": payload["isActive"],
            },
        )
        inserted_id = int(result.scalar_one())
        return await self.get_business_rule(inserted_id)

    async def update_business_rule(self, item_id: int, payload: dict) -> dict | None:
        result = await self.session.execute(
            text(
                """
                UPDATE dbo.tbl_BusinessRule
                SET ClientId = :client_id,
                    VehicleTypeId = :vehicle_type_id,
                    OperationTypeId = :operation_type_id,
                    StandardId = :standard_id,
                    IsActive = :is_active,
                    UpdatedAt = GETUTCDATE()
                OUTPUT INSERTED.Id
                WHERE Id = :item_id
                """
            ),
            {
                "item_id": item_id,
                "client_id": payload["clientId"],
                "vehicle_type_id": payload["vehicleTypeId"],
                "operation_type_id": payload["operationTypeId"],
                "standard_id": payload["standardId"],
                "is_active": payload["isActive"],
            },
        )
        updated_id = result.scalar()
        return await self.get_business_rule(int(updated_id)) if updated_id else None

    async def deactivate_business_rule(self, item_id: int) -> dict | None:
        result = await self.session.execute(
            text(
                """
                UPDATE dbo.tbl_BusinessRule
                SET IsActive = 0,
                    UpdatedAt = GETUTCDATE()
                OUTPUT INSERTED.Id
                WHERE Id = :item_id
                """
            ),
            {"item_id": item_id},
        )
        updated_id = result.scalar()
        return await self.get_business_rule(int(updated_id)) if updated_id else None

    async def get_business_rule(self, item_id: int) -> dict | None:
        result = await self.session.execute(
            text(
                """
                SELECT
                    br.Id,
                    br.ClientId,
                    c.Name AS ClientName,
                    br.VehicleTypeId,
                    vt.Name AS VehicleTypeName,
                    br.OperationTypeId,
                    ot.Name AS OperationTypeName,
                    br.StandardId,
                    s.Name AS StandardName,
                    s.StandardTimeMinutes,
                    s.ToleranceMinutes,
                    br.IsActive,
                    br.CreatedAt,
                    br.UpdatedAt
                FROM dbo.tbl_BusinessRule br
                INNER JOIN dbo.tbl_Client c ON c.Id = br.ClientId
                INNER JOIN dbo.tbl_VehicleType vt ON vt.Id = br.VehicleTypeId
                INNER JOIN dbo.tbl_OperationType ot ON ot.Id = br.OperationTypeId
                INNER JOIN dbo.tbl_Standard s ON s.Id = br.StandardId
                WHERE br.Id = :item_id
                """
            ),
            {"item_id": item_id},
        )
        row = result.mappings().first()
        return dict(row) if row else None

    async def list_users(self) -> list[dict]:
        return await self._fetch_all(
            """
            SELECT
                u.Id,
                u.Name,
                u.Email,
                u.IsActive,
                u.CreatedAt,
                u.UpdatedAt,
                STUFF(
                    (
                        SELECT ',' + r2.Code
                        FROM dbo.tbl_UserRole ur2
                        INNER JOIN dbo.tbl_Role r2 ON r2.Id = ur2.RoleId
                        WHERE ur2.UserId = u.Id
                        FOR XML PATH(''), TYPE
                    ).value('.', 'NVARCHAR(MAX)'),
                    1,
                    1,
                    ''
                ) AS Roles
            FROM dbo.tbl_User u
            WHERE u.IsDeleted = 0
            ORDER BY u.Name ASC
            """
        )

    async def get_role_ids(self, role_codes: list[str]) -> list[int]:
        if not role_codes:
            return []

        placeholders = ", ".join([f":code_{index}" for index in range(len(role_codes))])
        query = text(f"SELECT Id FROM dbo.tbl_Role WHERE Code IN ({placeholders})")
        params = {f"code_{index}": role_codes[index] for index in range(len(role_codes))}
        result = await self.session.execute(query, params)
        return [int(value) for value in result.scalars().all()]

    async def find_user_by_email(self, email: str, exclude_user_id: int | None = None) -> dict | None:
        query = """
            SELECT Id, Email
            FROM dbo.tbl_User
            WHERE LOWER(Email) = LOWER(:email)
              AND IsDeleted = 0
        """
        params = {"email": email}
        if exclude_user_id is not None:
            query += " AND Id <> :exclude_user_id"
            params["exclude_user_id"] = exclude_user_id
        result = await self.session.execute(text(query), params)
        row = result.mappings().first()
        return dict(row) if row else None

    async def create_user(self, payload: dict) -> int:
        result = await self.session.execute(
            text(
                """
                INSERT INTO dbo.tbl_User (Name, Email, PasswordHash, IsActive)
                OUTPUT INSERTED.Id
                VALUES (:name, :email, :password_hash, :is_active)
                """
            ),
            {
                "name": payload["name"],
                "email": payload["email"],
                "password_hash": payload["passwordHash"],
                "is_active": payload["isActive"],
            },
        )
        return int(result.scalar_one())

    async def update_user(self, user_id: int, payload: dict) -> bool:
        result = await self.session.execute(
            text(
                """
                UPDATE dbo.tbl_User
                SET Name = :name,
                    Email = :email,
                    IsActive = :is_active,
                    UpdatedAt = GETUTCDATE()
                WHERE Id = :user_id
                  AND IsDeleted = 0
                """
            ),
            {
                "user_id": user_id,
                "name": payload["name"],
                "email": payload["email"],
                "is_active": payload["isActive"],
            },
        )
        return result.rowcount > 0

    async def update_user_password_hash(self, user_id: int, password_hash: str) -> None:
        await self.session.execute(
            text(
                """
                UPDATE dbo.tbl_User
                SET PasswordHash = :password_hash,
                    UpdatedAt = GETUTCDATE()
                WHERE Id = :user_id
                """
            ),
            {"user_id": user_id, "password_hash": password_hash},
        )

    async def replace_user_roles(self, user_id: int, role_ids: list[int]) -> None:
        await self.session.execute(text("DELETE FROM dbo.tbl_UserRole WHERE UserId = :user_id"), {"user_id": user_id})
        for role_id in role_ids:
            await self.session.execute(
                text("INSERT INTO dbo.tbl_UserRole (UserId, RoleId) VALUES (:user_id, :role_id)"),
                {"user_id": user_id, "role_id": role_id},
            )

    async def deactivate_user(self, user_id: int) -> bool:
        result = await self.session.execute(
            text(
                """
                UPDATE dbo.tbl_User
                SET IsActive = 0,
                    IsDeleted = 1,
                    UpdatedAt = GETUTCDATE()
                WHERE Id = :user_id
                  AND IsDeleted = 0
                """
            ),
            {"user_id": user_id},
        )
        return result.rowcount > 0

    async def get_user(self, user_id: int) -> dict | None:
        result = await self.session.execute(
            text(
                """
                SELECT
                    u.Id,
                    u.Name,
                    u.Email,
                    u.IsActive,
                    u.CreatedAt,
                    u.UpdatedAt,
                    STUFF(
                        (
                            SELECT ',' + r2.Code
                            FROM dbo.tbl_UserRole ur2
                            INNER JOIN dbo.tbl_Role r2 ON r2.Id = ur2.RoleId
                            WHERE ur2.UserId = u.Id
                            FOR XML PATH(''), TYPE
                        ).value('.', 'NVARCHAR(MAX)'),
                        1,
                        1,
                        ''
                    ) AS Roles
                FROM dbo.tbl_User u
                WHERE u.Id = :user_id
                  AND u.IsDeleted = 0
                """
            ),
            {"user_id": user_id},
        )
        row = result.mappings().first()
        return dict(row) if row else None

    async def _fetch_all(self, query: str) -> list[dict]:
        result = await self.session.execute(text(query))
        return [dict(row) for row in result.mappings().all()]

    async def _insert_named(self, table_name: str, payload: dict) -> dict:
        result = await self.session.execute(
            text(
                f"""
                INSERT INTO {table_name} (Name, IsActive)
                OUTPUT INSERTED.Id, INSERTED.Name, INSERTED.IsActive, INSERTED.CreatedAt
                VALUES (:name, :is_active)
                """
            ),
            {"name": payload["name"], "is_active": payload["isActive"]},
        )
        return dict(result.mappings().one())

    async def _update_named(self, table_name: str, item_id: int, payload: dict) -> dict | None:
        result = await self.session.execute(
            text(
                f"""
                UPDATE {table_name}
                SET Name = :name,
                    IsActive = :is_active
                OUTPUT INSERTED.Id, INSERTED.Name, INSERTED.IsActive, INSERTED.CreatedAt
                WHERE Id = :item_id
                """
            ),
            {"item_id": item_id, "name": payload["name"], "is_active": payload["isActive"]},
        )
        row = result.mappings().first()
        return dict(row) if row else None

    async def _deactivate_named(self, table_name: str, item_id: int) -> dict | None:
        result = await self.session.execute(
            text(
                f"""
                UPDATE {table_name}
                SET IsActive = 0
                OUTPUT INSERTED.Id, INSERTED.Name, INSERTED.IsActive, INSERTED.CreatedAt
                WHERE Id = :item_id
                """
            ),
            {"item_id": item_id},
        )
        row = result.mappings().first()
        return dict(row) if row else None
