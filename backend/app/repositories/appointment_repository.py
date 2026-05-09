from datetime import datetime

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession


class AppointmentRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def get_dashboard_summary(self) -> dict:
        result = await self.session.execute(text("SELECT * FROM dbo.vw_DashboardSummary"))
        row = result.mappings().first()
        return dict(row) if row else {}

    async def get_operational_snapshot(self) -> list[dict]:
        result = await self.session.execute(text("SELECT * FROM dbo.vw_AppointmentOperational ORDER BY ScheduledAt DESC"))
        return [dict(row) for row in result.mappings().all()]

    async def list_appointments(self, skip: int, take: int, search: str | None, status: str | None) -> list[dict]:
        query = text(
            """
            SELECT *
            FROM dbo.vw_AppointmentOperational
            WHERE (:search IS NULL OR ClientName LIKE '%' + :search + '%' OR VehiclePlate LIKE '%' + :search + '%')
              AND (:status IS NULL OR Status = :status)
            ORDER BY ScheduledAt DESC
            OFFSET :skip ROWS FETCH NEXT :take ROWS ONLY
            """
        )
        result = await self.session.execute(
            query,
            {"skip": skip, "take": take, "search": search, "status": status},
        )
        return [dict(row) for row in result.mappings().all()]

    async def count_appointments(self, search: str | None, status: str | None) -> int:
        query = text(
            """
            SELECT COUNT(1)
            FROM dbo.vw_AppointmentOperational
            WHERE (:search IS NULL OR ClientName LIKE '%' + :search + '%' OR VehiclePlate LIKE '%' + :search + '%')
              AND (:status IS NULL OR Status = :status)
            """
        )
        result = await self.session.execute(query, {"search": search, "status": status})
        value = result.scalar_one()
        return int(value)

    async def get_appointment(self, appointment_id: int) -> dict | None:
        query = text("SELECT * FROM dbo.vw_AppointmentOperational WHERE Id = :appointment_id")
        result = await self.session.execute(query, {"appointment_id": appointment_id})
        row = result.mappings().first()
        return dict(row) if row else None

    async def get_status_log(self, appointment_id: int) -> list[dict]:
        query = text(
            """
            SELECT *
            FROM dbo.vw_AppointmentStatusLog
            WHERE AppointmentId = :appointment_id
            ORDER BY ChangedAt ASC
            """
        )
        result = await self.session.execute(query, {"appointment_id": appointment_id})
        return [dict(row) for row in result.mappings().all()]

    async def get_candidates(self, appointment_id: int) -> dict:
        dock_query = text(
            """
            SELECT d.Id, d.Name
            FROM dbo.tbl_Dock d
            WHERE d.IsActive = 1
            """
        )
        operator_query = text(
            """
            SELECT Id, Name, OperatorLevel, MaxConcurrentOperations, ActiveAssignments
            FROM dbo.vw_OperatorAvailability
            WHERE IsActive = 1
            """
        )
        dock_rows = await self.session.execute(dock_query)
        operator_rows = await self.session.execute(operator_query)
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

    async def create_appointment(self, payload: dict, user_id: int, correlation_id: str) -> int:
        output_sql = text(
            """
            DECLARE @newId INT;
            EXEC dbo.usp_CreateAppointment
                @ClientId=:client_id,
                @OperationTypeId=:operation_type_id,
                @VehicleTypeId=:vehicle_type_id,
                @EstimatedTons=:estimated_tons,
                @ScheduledAt=:scheduled_at,
                @CreatedBy=:created_by,
                @CorrelationId=:correlation_id,
                @AppointmentId=@newId OUTPUT;
            SELECT @newId AS AppointmentId;
            """
        )
        result = await self.session.execute(
            output_sql,
            {
                "client_id": payload["clientId"],
                "operation_type_id": payload["operationTypeId"],
                "vehicle_type_id": payload["vehicleTypeId"],
                "estimated_tons": payload["estimatedTons"],
                "scheduled_at": payload["scheduledAt"],
                "created_by": user_id,
                "correlation_id": correlation_id,
            },
        )
        row = result.mappings().first()
        return int(row["AppointmentId"])

    async def update_appointment(self, appointment_id: int, payload: dict, user_id: int, correlation_id: str) -> None:
        await self.session.execute(
            text(
                "EXEC dbo.usp_UpdateAppointment :appointment_id, :client_id, :operation_type_id, :vehicle_type_id, :estimated_tons, :scheduled_at, :updated_by, :correlation_id"
            ),
            {
                "appointment_id": appointment_id,
                "client_id": payload["clientId"],
                "operation_type_id": payload["operationTypeId"],
                "vehicle_type_id": payload["vehicleTypeId"],
                "estimated_tons": payload["estimatedTons"],
                "scheduled_at": payload["scheduledAt"],
                "updated_by": user_id,
                "correlation_id": correlation_id,
            },
        )

    async def delete_appointment(self, appointment_id: int, user_id: int, correlation_id: str) -> None:
        await self.session.execute(
            text("EXEC dbo.usp_DeleteAppointment :appointment_id, :deleted_by, :correlation_id"),
            {"appointment_id": appointment_id, "deleted_by": user_id, "correlation_id": correlation_id},
        )

    async def checkin(self, appointment_id: int, payload: dict, user_id: int, correlation_id: str) -> None:
        await self.session.execute(
            text(
                "EXEC dbo.usp_CheckInAppointment :appointment_id, :driver_name, :driver_document, :vehicle_plate, :changed_by, :correlation_id"
            ),
            {
                "appointment_id": appointment_id,
                "driver_name": payload["driverName"],
                "driver_document": payload["driverDocument"],
                "vehicle_plate": payload["vehiclePlate"],
                "changed_by": user_id,
                "correlation_id": correlation_id,
            },
        )

    async def assign(
        self,
        appointment_id: int,
        dock_id: int,
        operator_ids: list[int],
        candidates_version: int,
        user_id: int,
        correlation_id: str,
    ) -> None:
        operators_csv = ",".join(str(operator_id) for operator_id in operator_ids)
        await self.session.execute(
            text(
                "EXEC dbo.usp_AssignAppointmentResource :appointment_id, :dock_id, :operator_ids, :candidates_version, :changed_by, :correlation_id"
            ),
            {
                "appointment_id": appointment_id,
                "dock_id": dock_id,
                "operator_ids": operators_csv,
                "candidates_version": candidates_version,
                "changed_by": user_id,
                "correlation_id": correlation_id,
            },
        )

    async def reassign(
        self,
        appointment_id: int,
        dock_id: int,
        operator_ids: list[int],
        candidates_version: int,
        user_id: int,
        correlation_id: str,
    ) -> None:
        operators_csv = ",".join(str(operator_id) for operator_id in operator_ids)
        await self.session.execute(
            text(
                "EXEC dbo.usp_ReassignAppointmentResource :appointment_id, :dock_id, :operator_ids, :candidates_version, :changed_by, :correlation_id"
            ),
            {
                "appointment_id": appointment_id,
                "dock_id": dock_id,
                "operator_ids": operators_csv,
                "candidates_version": candidates_version,
                "changed_by": user_id,
                "correlation_id": correlation_id,
            },
        )

    async def start_process(
        self,
        appointment_id: int,
        document_delivery_at: datetime,
        process_start_at: datetime,
        user_id: int,
        correlation_id: str,
    ) -> None:
        await self.session.execute(
            text(
                "EXEC dbo.usp_StartAppointmentProcess :appointment_id, :document_delivery_at, :process_start_at, :changed_by, :correlation_id"
            ),
            {
                "appointment_id": appointment_id,
                "document_delivery_at": document_delivery_at,
                "process_start_at": process_start_at,
                "changed_by": user_id,
                "correlation_id": correlation_id,
            },
        )

    async def to_sign(self, appointment_id: int, process_end_at: datetime, user_id: int, correlation_id: str) -> None:
        await self.session.execute(
            text(
                "EXEC dbo.usp_MoveAppointmentToSign :appointment_id, :process_end_at, :changed_by, :correlation_id"
            ),
            {
                "appointment_id": appointment_id,
                "process_end_at": process_end_at,
                "changed_by": user_id,
                "correlation_id": correlation_id,
            },
        )

    async def finalize(self, appointment_id: int, payload: dict, user_id: int, correlation_id: str) -> None:
        await self.session.execute(
            text(
                "EXEC dbo.usp_FinalizeAppointment :appointment_id, :finalized_at, :moved_weight_kg, :otc_reason, :ots_reason, :comment, :changed_by, :correlation_id"
            ),
            {
                "appointment_id": appointment_id,
                "finalized_at": payload["finalizedAt"],
                "moved_weight_kg": payload["movedWeightKg"],
                "otc_reason": payload.get("otcNonComplianceReason"),
                "ots_reason": payload.get("otsNonComplianceReason"),
                "comment": payload.get("nonComplianceComment"),
                "changed_by": user_id,
                "correlation_id": correlation_id,
            },
        )

    async def checkout(self, appointment_id: int, checkout_at: datetime, user_id: int, correlation_id: str) -> None:
        await self.session.execute(
            text("EXEC dbo.usp_CheckoutAppointment :appointment_id, :checkout_at, :changed_by, :correlation_id"),
            {
                "appointment_id": appointment_id,
                "checkout_at": checkout_at,
                "changed_by": user_id,
                "correlation_id": correlation_id,
            },
        )

    async def cancel(self, appointment_id: int, cancellation_reason: str, user_id: int, correlation_id: str) -> None:
        await self.session.execute(
            text("EXEC dbo.usp_CancelAppointment :appointment_id, :reason, :changed_by, :correlation_id"),
            {
                "appointment_id": appointment_id,
                "reason": cancellation_reason,
                "changed_by": user_id,
                "correlation_id": correlation_id,
            },
        )
