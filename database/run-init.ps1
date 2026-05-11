param(
    [string]$Server = "localhost\\PRUEBAS1",
    [string]$Database = "ControlOperacionDb",
    [string]$User = "sa",
    [string]$Password = "Enero2026*"
)

$ErrorActionPreference = "Stop"

$scriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$scriptFiles = @(
    "scripts\\00_preamble_and_drop.sql",
    "scripts\\01_tables.sql",
    "scripts\\02_indexes.sql",
    "scripts\\03_views.sql",
    "scripts\\04_support_procedures.sql",
    "scripts\\05_appointment_procedures\\01_create_appointment.sql",
    "scripts\\05_appointment_procedures\\02_update_appointment.sql",
    "scripts\\05_appointment_procedures\\03_delete_appointment.sql",
    "scripts\\05_appointment_procedures\\04_checkin_appointment.sql",
    "scripts\\05_appointment_procedures\\05_assign_appointment_resource.sql",
    "scripts\\05_appointment_procedures\\06_reassign_appointment_resource.sql",
    "scripts\\05_appointment_procedures\\07_start_appointment_process.sql",
    "scripts\\05_appointment_procedures\\08_move_appointment_to_sign.sql",
    "scripts\\05_appointment_procedures\\09_finalize_appointment.sql",
    "scripts\\05_appointment_procedures\\10_checkout_appointment.sql",
    "scripts\\05_appointment_procedures\\11_cancel_appointment.sql",
    "scripts\\06_auth_procedures.sql",
    "scripts\\07_seed.sql"
)

$connectionString = "Server=$Server;Database=$Database;User ID=$User;Password=$Password;Encrypt=False;TrustServerCertificate=True;"

function Invoke-SqlBatchFile {
    param(
        [System.Data.SqlClient.SqlConnection]$Connection,
        [string]$Path
    )

    $sqlContent = Get-Content $Path -Raw
    $batches = @(
        [System.Text.RegularExpressions.Regex]::Split($sqlContent, '(?im)^\s*GO\s*$') |
            Where-Object { $_.Trim() -ne "" }
    )

    $command = $Connection.CreateCommand()
    $command.CommandTimeout = 120

    for ($i = 0; $i -lt $batches.Count; $i++) {
        $command.CommandText = $batches[$i]
        try {
            [void]$command.ExecuteNonQuery()
        }
        catch {
            $snippet = ($batches[$i] -split "`r?`n" | Select-Object -First 12) -join "`n"
            throw "Failed file '$Path' batch $($i + 1): $($_.Exception.Message)`n---`n$snippet"
        }
    }
}

$connection = New-Object System.Data.SqlClient.SqlConnection $connectionString

try {
    $connection.Open()
    foreach ($scriptFile in $scriptFiles) {
        $fullPath = Join-Path $scriptRoot $scriptFile
        Invoke-SqlBatchFile -Connection $connection -Path $fullPath
    }
}
finally {
    if ($connection.State -ne "Closed") {
        $connection.Close()
    }
}

Write-Output "database_init_completed:$Database"
