from fastapi import APIRouter

from app.api.v1.appointments.router import router as appointments_router
from app.api.v1.auth.router import router as auth_router

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(auth_router)
api_router.include_router(appointments_router)
