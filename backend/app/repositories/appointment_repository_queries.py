from __future__ import annotations

from datetime import datetime

from sqlalchemy import text


class AppointmentRepositoryQueriesMixin:
    async def get_dashboard_summary(self) -> dict:
        result = await self.session.execute(text("SELECT * FROM dbo.vw_DashboardSummary"))
        row = result.mappings().first()
        return dict(row) if row else {}

    async def get_operational_snapshot(self, date_from=None, date_to=None) -> list[dict]:
        result = await self.session.execute(
            text(
                """
                SELECT *
                FROM dbo.vw_AppointmentOperational
                WHERE (:date_from IS NULL OR ScheduledAt >= :date_from)
                  AND (:date_to IS NULL OR ScheduledAt <= :date_to)
                ORDER BY ScheduledAt DESC
                """
            ),
            {"date_from": date_from, "date_to": date_to},
        )
        return [dict(row) for row in result.mappings().all()]

    async def list_appointments(
        self,
        skip: int,
        take: int,
        search: str | None,
        status: str | None,
        date_from=None,
        date_to=None,
    ) -> list[dict]:
        query = text(
            """
            SELECT *
            FROM dbo.vw_AppointmentOperational
            WHERE (:search IS NULL OR ClientName LIKE '%' + :search + '%' OR VehiclePlate LIKE '%' + :search + '%')
              AND (:status IS NULL OR Status = :status)
              AND (:date_from IS NULL OR ScheduledAt >= :date_from)
              AND (:date_to IS NULL OR ScheduledAt <= :date_to)
            ORDER BY ScheduledAt DESC
            OFFSET :skip ROWS FETCH NEXT :take ROWS ONLY
            """
        )
        result = await self.session.execute(
            query,
            {
                "skip": skip,
                "take": take,
                "search": search,
                "status": status,
                "date_from": date_from,
                "date_to": date_to,
            },
        )
        return [dict(row) for row in result.mappings().all()]

    async def count_appointments(self, search: str | None, status: str | None, date_from=None, date_to=None) -> int:
        query = text(
            """
            SELECT COUNT(1)
            FROM dbo.vw_AppointmentOperational
            WHERE (:search IS NULL OR ClientName LIKE '%' + :search + '%' OR VehiclePlate LIKE '%' + :search + '%')
              AND (:status IS NULL OR Status = :status)
              AND (:date_from IS NULL OR ScheduledAt >= :date_from)
              AND (:date_to IS NULL OR ScheduledAt <= :date_to)
            """
        )
        result = await self.session.execute(
            query,
            {"search": search, "status": status, "date_from": date_from, "date_to": date_to},
        )
        return int(result.scalar_one())

    async def get_appointment(self, appointment_id: int) -> dict | None:
        result = await self.session.execute(
            text("SELECT * FROM dbo.vw_AppointmentOperational WHERE Id = :appointment_id"),
            {"appointment_id": appointment_id},
        )
        row = result.mappings().first()
        return dict(row) if row else None

    async def get_status_log(self, appointment_id: int) -> list[dict]:
        result = await self.session.execute(
            text(
                """
                SELECT *
                FROM dbo.vw_AppointmentStatusLog
                WHERE AppointmentId = :appointment_id
                ORDER BY ChangedAt ASC
                """
            ),
            {"appointment_id": appointment_id},
        )
        return [dict(row) for row in result.mappings().all()]

    async def get_candidates(self, appointment_id: int) -> dict:
        dock_rows = await self.session.execute(
            text(
                """
                SELECT d.Id, d.Name
                FROM dbo.tbl_Dock d
                WHERE d.IsActive = 1
                """
            )
        )
        operator_rows = await self.session.execute(
            text(
                """
                SELECT Id, Name, OperatorLevel, MaxConcurrentOperations, ActiveAssignments
                FROM dbo.vw_OperatorAvailability
                WHERE IsActive = 1
                """
            )
        )
        generated_at = int(datetime.utcnow().timestamp())
        return {
            "appointmentId": appointment_id,
            "version": generated_at,
            "generatedAt": generated_at,
            "expiresAt": generated_at + 30,
            "ttlSeconds": 30,
            "docks": [dict(row) for row in dock_rows.mappings().all()],
            "operators": [dict(row) for row in operator_rows.mappings().all()],
        }
