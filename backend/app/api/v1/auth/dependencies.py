from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db_session
from app.repositories.auth_repository import AuthRepository
from app.services.auth_service import AuthService


def get_auth_repository(session: AsyncSession = Depends(get_db_session)) -> AuthRepository:
    return AuthRepository(session)


def get_auth_service(repository: AuthRepository = Depends(get_auth_repository)) -> AuthService:
    return AuthService(repository)
