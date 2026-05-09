from datetime import datetime

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession


class AuthRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def get_user_by_email(self, email: str) -> dict | None:
        query = text(
            """
            SELECT Id, Name, Email, PasswordHash, IsActive, Roles
            FROM dbo.vw_UserAuth
            WHERE LOWER(Email) = LOWER(:email)
            """
        )
        result = await self.session.execute(query, {"email": email})
        row = result.mappings().first()
        return dict(row) if row else None

    async def get_user_by_id(self, user_id: int) -> dict | None:
        query = text(
            """
            SELECT Id, Name, Email, PasswordHash, IsActive, Roles
            FROM dbo.vw_UserAuth
            WHERE Id = :user_id
            """
        )
        result = await self.session.execute(query, {"user_id": user_id})
        row = result.mappings().first()
        return dict(row) if row else None

    async def create_refresh_token(
        self,
        user_id: int,
        token_hash: str,
        expires_at: datetime,
        device_info: str | None,
    ) -> None:
        await self.session.execute(
            text("EXEC dbo.usp_InsertRefreshToken :user_id, :token_hash, :expires_at, :device_info"),
            {
                "user_id": user_id,
                "token_hash": token_hash,
                "expires_at": expires_at,
                "device_info": device_info,
            },
        )

    async def get_active_refresh_token(self, token_hash: str) -> dict | None:
        query = text(
            """
            SELECT Id, UserId, TokenHash, ExpiresAt, RevokedAt
            FROM dbo.tbl_RefreshToken
            WHERE TokenHash = :token_hash
              AND RevokedAt IS NULL
              AND ExpiresAt > GETUTCDATE()
            """
        )
        result = await self.session.execute(query, {"token_hash": token_hash})
        row = result.mappings().first()
        return dict(row) if row else None

    async def revoke_refresh_token(self, token_hash: str) -> None:
        await self.session.execute(
            text("EXEC dbo.usp_RevokeRefreshToken :token_hash"),
            {"token_hash": token_hash},
        )

    async def revoke_user_tokens(self, user_id: int) -> None:
        await self.session.execute(
            text("EXEC dbo.usp_RevokeUserRefreshTokens :user_id"),
            {"user_id": user_id},
        )

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
