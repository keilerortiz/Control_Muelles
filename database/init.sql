-- Entrypoint modular para SQLCMD.
-- Ejecutar en SQLCMD mode o con una herramienta compatible con directivas :r.

:r .\scripts\00_preamble_and_drop.sql
:r .\scripts\01_tables.sql
:r .\scripts\02_indexes.sql
:r .\scripts\03_views.sql
:r .\scripts\04_support_procedures.sql
:r .\scripts\05_appointment_procedures.sql
:r .\scripts\06_auth_procedures.sql
:r .\scripts\07_seed.sql