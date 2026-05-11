from fastapi import Depends

from app.db.session import get_db_session
from app.repositories.master_data_repository import MasterDataRepository
from app.services.master_data_service import MasterDataService


def get_master_data_service(session=Depends(get_db_session)) -> MasterDataService:
    return MasterDataService(MasterDataRepository(session))
