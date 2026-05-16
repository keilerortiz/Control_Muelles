"""
Database schema validator — compares what the backend expects vs what exists in SQL Server.
"""
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy import text
from app.core.config import settings

EXPECTED_TABLES = [
    "tbl_Role", "tbl_User", "tbl_UserRole", "tbl_Client",
    "tbl_OperationType", "tbl_Standard", "tbl_VehicleType",
    "tbl_Dock", "tbl_DockCapability", "tbl_BusinessRule",
    "tbl_Appointment", "tbl_Operator", "tbl_AppointmentOperator",
    "tbl_AssignmentLog", "tbl_AppointmentStatusLog",
    "tbl_RefreshToken", "tbl_AppointmentEvent", "tbl_AppointmentAudit",
]

EXPECTED_VIEWS = [
    "vw_UserAuth", "vw_AppointmentOperational",
    "vw_AppointmentStatusLog", "vw_DashboardSummary",
    "vw_OperatorAvailability",
]

EXPECTED_SPS = [
    "usp_InsertRefreshToken", "usp_RevokeRefreshToken", "usp_RevokeUserRefreshTokens",
    "usp_InsertAppointmentStatusLog", "usp_InsertAppointmentEvent",
    "usp_InsertAppointmentAudit", "usp_ValidateCandidatesVersion",
    "usp_GetDashboardSummary",
    "usp_CreateAppointment", "usp_UpdateAppointment", "usp_DeleteAppointment",
    "usp_CheckinAppointment", "usp_AssignAppointmentResource",
    "usp_ReassignAppointmentResource", "usp_StartAppointmentProcess",
    "usp_MoveAppointmentToSign", "usp_FinalizeAppointment",
    "usp_CheckoutAppointment", "usp_CancelAppointment",
]


async def main():
    engine = create_async_engine(settings.database_url)
    async with AsyncSession(engine) as session:
        print("=" * 60)
        print("DATABASE SCHEMA VALIDATION")
        print(f"DB: {settings.db_host}/{settings.db_name}")
        print("=" * 60)

        # Check tables
        print("\n--- TABLES ---")
        result = await session.execute(text(
            "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE='BASE TABLE' AND TABLE_SCHEMA='dbo'"
        ))
        db_tables = {r[0] for r in result.fetchall()}
        for t in EXPECTED_TABLES:
            status = "OK" if t in db_tables else "MISSING"
            print(f"  [{status}] {t}")

        # Check views
        print("\n--- VIEWS ---")
        result = await session.execute(text(
            "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.VIEWS WHERE TABLE_SCHEMA='dbo'"
        ))
        db_views = {r[0] for r in result.fetchall()}
        for v in EXPECTED_VIEWS:
            status = "OK" if v in db_views else "MISSING"
            print(f"  [{status}] {v}")

        # Check SPs
        print("\n--- STORED PROCEDURES ---")
        result = await session.execute(text(
            "SELECT ROUTINE_NAME FROM INFORMATION_SCHEMA.ROUTINES WHERE ROUTINE_TYPE='PROCEDURE' AND ROUTINE_SCHEMA='dbo'"
        ))
        db_sps = {r[0] for r in result.fetchall()}
        for sp in EXPECTED_SPS:
            status = "OK" if sp in db_sps else "MISSING"
            print(f"  [{status}] {sp}")

        # Check tbl_RefreshToken columns match what backend expects
        print("\n--- tbl_RefreshToken COLUMNS ---")
        result = await session.execute(text(
            "SELECT COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='tbl_RefreshToken' ORDER BY ORDINAL_POSITION"
        ))
        for r in result.fetchall():
            print(f"  {r[0]} ({r[1]})")

        # Check data counts
        print("\n--- DATA COUNTS ---")
        for table in ["tbl_Role", "tbl_User", "tbl_UserRole", "tbl_Client",
                       "tbl_OperationType", "tbl_VehicleType", "tbl_Dock",
                       "tbl_Operator", "tbl_Standard", "tbl_BusinessRule", "tbl_Appointment"]:
            try:
                result = await session.execute(text(f"SELECT COUNT(*) FROM dbo.{table}"))
                count = result.scalar()
                print(f"  {table}: {count} rows")
            except Exception as e:
                print(f"  {table}: ERROR - {e}")

        # Quick login flow test
        print("\n--- LOGIN FLOW TEST ---")
        try:
            result = await session.execute(text(
                "SELECT Id, Email, PasswordHash, IsActive, Roles FROM dbo.vw_UserAuth WHERE LOWER(Email) = 'admin@muelles.local'"
            ))
            row = result.mappings().first()
            if row:
                print(f"  User found: Id={row['Id']}, Email={row['Email']}, Active={row['IsActive']}, Roles={row['Roles']}")
                from app.core.security import verify_password
                ok = verify_password("12345678", row["PasswordHash"])
                print(f"  Password '12345678' valid: {ok}")
            else:
                print("  [MISSING] User admin@muelles.local not found in vw_UserAuth!")
        except Exception as e:
            print(f"  [ERROR] {e}")

    await engine.dispose()
    print("\n" + "=" * 60)
    print("VALIDATION COMPLETE")
    print("=" * 60)


if __name__ == "__main__":
    asyncio.run(main())
