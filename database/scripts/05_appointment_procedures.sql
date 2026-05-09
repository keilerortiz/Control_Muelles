-- Wrapper de procedimientos operativos de citas.
-- Ejecutar en SQLCMD mode o mediante database/run-init.ps1.

:r .\05_appointment_procedures\01_create_appointment.sql
:r .\05_appointment_procedures\02_update_appointment.sql
:r .\05_appointment_procedures\03_delete_appointment.sql
:r .\05_appointment_procedures\04_checkin_appointment.sql
:r .\05_appointment_procedures\05_assign_appointment_resource.sql
:r .\05_appointment_procedures\06_reassign_appointment_resource.sql
:r .\05_appointment_procedures\07_start_appointment_process.sql
:r .\05_appointment_procedures\08_move_appointment_to_sign.sql
:r .\05_appointment_procedures\09_finalize_appointment.sql
:r .\05_appointment_procedures\10_checkout_appointment.sql
:r .\05_appointment_procedures\11_cancel_appointment.sql