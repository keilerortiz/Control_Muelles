from __future__ import annotations

from datetime import datetime

from sqlalchemy import text


class AppointmentRepositoryCommandsMixin:
    async def create_appointment(self, payload: dict, user_id: int, correlation_id: str) -> int:
        result = await self.session.execute(
            text(
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
            ),
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
        appointment_id = int(result.mappings().first()["AppointmentId"])
        await self._update_driver_fields(appointment_id, payload)
        return appointment_id

    async def update_appointment(self, appointment_id: int, payload: dict, user_id: int, correlation_id: str) -> None:
        await self.session.execute(
            text("EXEC dbo.usp_UpdateAppointment :appointment_id, :client_id, :operation_type_id, :vehicle_type_id, :estimated_tons, :scheduled_at, :updated_by, :correlation_id"),
            {"appointment_id": appointment_id, "client_id": payload["clientId"], "operation_type_id": payload["operationTypeId"], "vehicle_type_id": payload["vehicleTypeId"], "estimated_tons": payload["estimatedTons"], "scheduled_at": payload["scheduledAt"], "updated_by": user_id, "correlation_id": correlation_id},
        )
        await self._update_driver_fields(appointment_id, payload)

    async def delete_appointment(self, appointment_id: int, user_id: int, correlation_id: str) -> None:
        await self.session.execute(text("EXEC dbo.usp_DeleteAppointment :appointment_id, :deleted_by, :correlation_id"), {"appointment_id": appointment_id, "deleted_by": user_id, "correlation_id": correlation_id})

    async def checkin(self, appointment_id: int, payload: dict, user_id: int, correlation_id: str) -> None:
        await self.session.execute(
            text("EXEC dbo.usp_CheckInAppointment :appointment_id, :driver_name, :driver_document, :vehicle_plate, :changed_by, :correlation_id"),
            {"appointment_id": appointment_id, "driver_name": payload["driverName"], "driver_document": payload["driverDocument"], "vehicle_plate": payload["vehiclePlate"], "changed_by": user_id, "correlation_id": correlation_id},
        )

    async def assign(self, appointment_id: int, dock_id: int, operator_ids: list[int], candidates_version: int, user_id: int, correlation_id: str) -> None:
        await self._execute_resource_command("dbo.usp_AssignAppointmentResource", appointment_id, dock_id, operator_ids, candidates_version, user_id, correlation_id)

    async def reassign(self, appointment_id: int, dock_id: int, operator_ids: list[int], candidates_version: int, user_id: int, correlation_id: str) -> None:
        await self._execute_resource_command("dbo.usp_ReassignAppointmentResource", appointment_id, dock_id, operator_ids, candidates_version, user_id, correlation_id)

    async def start_process(self, appointment_id: int, document_delivery_at: datetime, process_start_at: datetime, remissions: str, precincts: str, user_id: int, correlation_id: str) -> None:
        await self.session.execute(
            text("EXEC dbo.usp_StartAppointmentProcess :appointment_id, :document_delivery_at, :process_start_at, :remissions, :precincts, :changed_by, :correlation_id"),
            {"appointment_id": appointment_id, "document_delivery_at": document_delivery_at, "process_start_at": process_start_at, "remissions": remissions, "precincts": precincts, "changed_by": user_id, "correlation_id": correlation_id},
        )

    async def to_sign(self, appointment_id: int, process_end_at: datetime, user_id: int, correlation_id: str) -> None:
        await self.session.execute(text("EXEC dbo.usp_MoveAppointmentToSign :appointment_id, :process_end_at, :changed_by, :correlation_id"), {"appointment_id": appointment_id, "process_end_at": process_end_at, "changed_by": user_id, "correlation_id": correlation_id})

    async def finalize(self, appointment_id: int, payload: dict, user_id: int, correlation_id: str) -> None:
        await self.session.execute(
            text("EXEC dbo.usp_FinalizeAppointment :appointment_id, :finalized_at, :moved_weight_kg, :otc_reason, :ots_reason, :comment, :changed_by, :correlation_id"),
            {"appointment_id": appointment_id, "finalized_at": payload["finalizedAt"], "moved_weight_kg": payload["movedWeightKg"], "otc_reason": payload.get("otcNonComplianceReason"), "ots_reason": payload.get("otsNonComplianceReason"), "comment": payload.get("nonComplianceComment"), "changed_by": user_id, "correlation_id": correlation_id},
        )

    async def checkout(self, appointment_id: int, checkout_at: datetime, user_id: int, correlation_id: str) -> None:
        await self.session.execute(text("EXEC dbo.usp_CheckoutAppointment :appointment_id, :checkout_at, :changed_by, :correlation_id"), {"appointment_id": appointment_id, "checkout_at": checkout_at, "changed_by": user_id, "correlation_id": correlation_id})

    async def cancel(self, appointment_id: int, cancellation_reason: str, user_id: int, correlation_id: str) -> None:
        await self.session.execute(text("EXEC dbo.usp_CancelAppointment :appointment_id, :reason, :changed_by, :correlation_id"), {"appointment_id": appointment_id, "reason": cancellation_reason, "changed_by": user_id, "correlation_id": correlation_id})

    async def _execute_resource_command(self, procedure: str, appointment_id: int, dock_id: int, operator_ids: list[int], candidates_version: int, user_id: int, correlation_id: str) -> None:
        await self.session.execute(
            text(f"EXEC {procedure} :appointment_id, :dock_id, :operator_ids, :candidates_version, :changed_by, :correlation_id"),
            {"appointment_id": appointment_id, "dock_id": dock_id, "operator_ids": ",".join(str(operator_id) for operator_id in operator_ids), "candidates_version": candidates_version, "changed_by": user_id, "correlation_id": correlation_id},
        )

    async def _update_driver_fields(self, appointment_id: int, payload: dict) -> None:
        await self.session.execute(
            text(
                """
                UPDATE dbo.tbl_Appointment
                SET
                    DriverName = :driver_name,
                    DriverDocument = :driver_document,
                    VehiclePlate = :vehicle_plate,
                    NonComplianceComment = :observation
                WHERE Id = :appointment_id AND IsDeleted = 0
                """
            ),
            {
                "appointment_id": appointment_id,
                "driver_name": payload.get("driverName"),
                "driver_document": payload.get("driverDocument"),
                "vehicle_plate": payload.get("vehiclePlate"),
                "observation": payload.get("nonComplianceComment"),
            },
        )
