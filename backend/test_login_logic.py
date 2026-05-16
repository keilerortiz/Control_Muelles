"""
Comprehensive login flow diagnostic script.
Tests each step of the authentication pipeline to isolate failures.
"""
import asyncio
import sys
import traceback

async def main():
    print("=" * 60)
    print("LOGIN FLOW DIAGNOSTIC")
    print("=" * 60)

    # Step 1: Config
    print("\n[1] Loading config...")
    try:
        from app.core.config import settings
        print(f"    APP_ENV: {settings.app_env}")
        print(f"    DB_HOST: {settings.db_host}")
        print(f"    DB_NAME: {settings.db_name}")
        print(f"    SEED_ADMIN_EMAIL: {settings.seed_admin_email}")
        print(f"    SEED_ADMIN_PASSWORD: {settings.seed_admin_password}")
        print(f"    DATABASE_URL: {settings.database_url[:60]}...")
        print("    [OK] Config loaded")
    except Exception:
        traceback.print_exc()
        print("    [FAIL] Config")
        return

    # Step 2: DB Connection
    print("\n[2] Testing DB connection...")
    try:
        from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
        from sqlalchemy import text
        engine = create_async_engine(settings.database_url)
        async with engine.connect() as conn:
            result = await conn.execute(text("SELECT 1 AS ok"))
            row = result.fetchone()
            print(f"    Result: {row}")
            print("    [OK] DB connection")
    except Exception:
        traceback.print_exc()
        print("    [FAIL] DB connection")
        print("    --> Will test development fallback path instead")
        await test_fallback_path(settings)
        return

    # Step 3: vw_UserAuth view
    print("\n[3] Querying vw_UserAuth...")
    try:
        async with AsyncSession(engine) as session:
            result = await session.execute(
                text("SELECT TOP 5 Id, Name, Email, PasswordHash, IsActive, Roles FROM dbo.vw_UserAuth")
            )
            rows = result.mappings().all()
            if not rows:
                print("    [WARN] No users found in vw_UserAuth")
            else:
                for r in rows:
                    print(f"    User: Id={r['Id']}, Email={r['Email']}, IsActive={r['IsActive']}, Roles={r['Roles']}")
                    print(f"           PasswordHash={r['PasswordHash'][:30]}...")
            print("    [OK] View accessible")
    except Exception:
        traceback.print_exc()
        print("    [FAIL] vw_UserAuth query")

    # Step 4: Lookup admin user
    print("\n[4] Looking up admin@muelles.local...")
    try:
        async with AsyncSession(engine) as session:
            result = await session.execute(
                text("SELECT Id, Name, Email, PasswordHash, IsActive, Roles FROM dbo.vw_UserAuth WHERE LOWER(Email) = LOWER(:email)"),
                {"email": "admin@muelles.local"}
            )
            row = result.mappings().first()
            if row:
                user = dict(row)
                print(f"    Found: Id={user['Id']}, Name={user['Name']}, IsActive={user['IsActive']}")
                print(f"    PasswordHash: {user['PasswordHash']}")
                print(f"    Roles: {user['Roles']}")
            else:
                print("    [WARN] User admin@muelles.local NOT FOUND in DB")
                print("    --> Login will use development fallback path")
    except Exception:
        traceback.print_exc()
        print("    [FAIL] User lookup")

    # Step 5: Password verification
    print("\n[5] Testing password verification...")
    try:
        from app.core.security import verify_password, get_password_hash
        if row:
            pw_hash = user["PasswordHash"]
            for password in ["12345678", "Admin123!"]:
                result = verify_password(password, pw_hash)
                print(f"    verify_password('{password}', hash) = {result}")
        else:
            print("    [SKIP] No user found to verify")
    except Exception:
        traceback.print_exc()
        print("    [FAIL] Password verification")

    # Step 6: Token generation
    print("\n[6] Testing token generation...")
    try:
        from app.core.security import create_access_token, create_refresh_token
        at = create_access_token(user_id=1, roles=["ADMIN"])
        rt = create_refresh_token(user_id=1)
        print(f"    AccessToken: {at[:50]}...")
        print(f"    RefreshToken: {rt[:50]}...")
        print("    [OK] Token generation")
    except Exception:
        traceback.print_exc()
        print("    [FAIL] Token generation")

    # Step 7: tbl_RefreshToken table
    print("\n[7] Testing tbl_RefreshToken table...")
    try:
        async with AsyncSession(engine) as session:
            result = await session.execute(
                text("SELECT TOP 1 * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'tbl_RefreshToken'")
            )
            cols = result.mappings().all()
            if cols:
                print("    Columns in tbl_RefreshToken:")
                result2 = await session.execute(
                    text("SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'tbl_RefreshToken' ORDER BY ORDINAL_POSITION")
                )
                for c in result2.mappings().all():
                    print(f"      - {c['COLUMN_NAME']} ({c['DATA_TYPE']}, nullable={c['IS_NULLABLE']})")
            else:
                print("    [WARN] tbl_RefreshToken table NOT FOUND")
            print("    [OK] Table schema")
    except Exception:
        traceback.print_exc()
        print("    [FAIL] tbl_RefreshToken check")

    # Step 8: usp_InsertRefreshToken stored procedure
    print("\n[8] Testing usp_InsertRefreshToken SP...")
    try:
        async with AsyncSession(engine) as session:
            result = await session.execute(
                text("SELECT OBJECT_ID('dbo.usp_InsertRefreshToken', 'P') AS sp_id")
            )
            sp_row = result.mappings().first()
            if sp_row and sp_row["sp_id"]:
                print(f"    SP exists, object_id={sp_row['sp_id']}")
                # Try to get the SP definition
                result2 = await session.execute(
                    text("SELECT OBJECT_DEFINITION(OBJECT_ID('dbo.usp_InsertRefreshToken')) AS def_text")
                )
                sp_def = result2.mappings().first()
                if sp_def and sp_def["def_text"]:
                    print(f"    SP Definition:\n{sp_def['def_text']}")
            else:
                print("    [WARN] usp_InsertRefreshToken SP NOT FOUND")
            print("    [OK] SP check")
    except Exception:
        traceback.print_exc()
        print("    [FAIL] SP check")

    # Step 9: Full login flow via AuthService
    print("\n[9] Full login flow test...")
    try:
        from app.repositories.auth_repository import AuthRepository
        from app.services.auth_service import AuthService
        async with AsyncSession(engine) as session:
            repo = AuthRepository(session)
            svc = AuthService(repo)
            result = await svc.login("admin@muelles.local", "12345678", "diagnostic-test")
            print(f"    Login SUCCESS!")
            print(f"    User: {result['user']}")
            print(f"    AccessToken: {result['accessToken'][:40]}...")
    except Exception:
        traceback.print_exc()
        print("    [FAIL] Full login flow")

    await engine.dispose()
    print("\n" + "=" * 60)
    print("DIAGNOSTIC COMPLETE")
    print("=" * 60)


async def test_fallback_path(settings):
    print("\n[FALLBACK] Testing development fallback...")
    from app.core.security import create_access_token, create_refresh_token
    is_dev = settings.app_env.lower() == "development"
    email_match = "admin@muelles.local" == settings.seed_admin_email.strip().lower()
    pw_match = "12345678" == settings.seed_admin_password
    print(f"    is_development: {is_dev}")
    print(f"    email matches seed: {email_match}")
    print(f"    password matches seed: {pw_match}")
    print(f"    seed_admin_password value: '{settings.seed_admin_password}'")
    if is_dev and email_match and pw_match:
        print("    --> Fallback would SUCCEED")
    else:
        print("    --> Fallback would FAIL (credentials don't match seed)")
        if not pw_match:
            print(f"    --> Password '12345678' != seed '{settings.seed_admin_password}'")


if __name__ == "__main__":
    asyncio.run(main())
