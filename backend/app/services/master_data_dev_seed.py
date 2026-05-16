def build_master_data_seed(timestamp: str) -> dict:
    return {
        "next_ids": {
            "clients": 3,
            "vehicle_types": 3,
            "operation_types": 3,
            "docks": 3,
            "non_compliance_reasons": 11,
            "operators": 3,
            "standards": 3,
            "business_rules": 3,
            "users": 3,
        },
        "clients": {
            1: {"Id": 1, "Name": "Cliente A", "IsActive": True, "CreatedAt": timestamp},
            2: {"Id": 2, "Name": "Cliente B", "IsActive": True, "CreatedAt": timestamp},
        },
        "vehicle_types": {
            1: {"Id": 1, "Name": "Camion Sencillo", "IsActive": True, "CreatedAt": timestamp},
            2: {"Id": 2, "Name": "Tractomula", "IsActive": True, "CreatedAt": timestamp},
        },
        "operation_types": {
            1: {"Id": 1, "Name": "Descargue", "StandardTimeMinutes": 120, "IsActive": True, "CreatedAt": timestamp},
            2: {"Id": 2, "Name": "Cargue", "StandardTimeMinutes": 90, "IsActive": True, "CreatedAt": timestamp},
        },
        "docks": {
            1: {"Id": 1, "Name": "Muelle 1", "IsActive": True, "CreatedAt": timestamp},
            2: {"Id": 2, "Name": "Muelle 2", "IsActive": True, "CreatedAt": timestamp},
        },
        "non_compliance_reasons": {
            1: {"Id": 1, "Name": "Documentación incompleta en portería", "ReasonType": "OTC", "IsActive": True, "CreatedAt": timestamp, "UpdatedAt": None},
            2: {"Id": 2, "Name": "Validación documental demorada", "ReasonType": "OTC", "IsActive": True, "CreatedAt": timestamp, "UpdatedAt": None},
            3: {"Id": 3, "Name": "Congestión en portería", "ReasonType": "OTC", "IsActive": True, "CreatedAt": timestamp, "UpdatedAt": None},
            4: {"Id": 4, "Name": "Novedad de seguridad en acceso", "ReasonType": "OTC", "IsActive": True, "CreatedAt": timestamp, "UpdatedAt": None},
            5: {"Id": 5, "Name": "Falla de sistema en registro de ingreso", "ReasonType": "OTC", "IsActive": True, "CreatedAt": timestamp, "UpdatedAt": None},
            6: {"Id": 6, "Name": "Demora por disponibilidad de muelle", "ReasonType": "OTS", "IsActive": True, "CreatedAt": timestamp, "UpdatedAt": None},
            7: {"Id": 7, "Name": "Demora por disponibilidad de operarios", "ReasonType": "OTS", "IsActive": True, "CreatedAt": timestamp, "UpdatedAt": None},
            8: {"Id": 8, "Name": "Novedad operativa durante el proceso", "ReasonType": "OTS", "IsActive": True, "CreatedAt": timestamp, "UpdatedAt": None},
            9: {"Id": 9, "Name": "Equipos o recursos no disponibles", "ReasonType": "OTS", "IsActive": True, "CreatedAt": timestamp, "UpdatedAt": None},
            10: {"Id": 10, "Name": "Retraso por re-trabajo de operación", "ReasonType": "OTS", "IsActive": True, "CreatedAt": timestamp, "UpdatedAt": None},
        },
        "operators": {
            1: {"Id": 1, "Name": "Operario Senior 1", "OperatorLevel": "SENIOR", "MaxConcurrentOperations": 1, "IsActive": True, "CreatedAt": timestamp},
            2: {"Id": 2, "Name": "Operario Junior 1", "OperatorLevel": "JUNIOR", "MaxConcurrentOperations": 1, "IsActive": True, "CreatedAt": timestamp},
        },
        "standards": {
            1: {"Id": 1, "Name": "Descargue estándar", "StandardTimeMinutes": 120, "ToleranceMinutes": 15, "Description": "Operación base de descargue", "IsActive": True, "CreatedAt": timestamp, "UpdatedAt": None},
            2: {"Id": 2, "Name": "Cargue estándar", "StandardTimeMinutes": 90, "ToleranceMinutes": 10, "Description": "Operación base de cargue", "IsActive": True, "CreatedAt": timestamp, "UpdatedAt": None},
        },
        "business_rules": {
            1: {"Id": 1, "ClientId": 1, "VehicleTypeId": 1, "OperationTypeId": 1, "StandardId": 1, "IsActive": True, "CreatedAt": timestamp, "UpdatedAt": None},
            2: {"Id": 2, "ClientId": 2, "VehicleTypeId": 2, "OperationTypeId": 2, "StandardId": 2, "IsActive": True, "CreatedAt": timestamp, "UpdatedAt": None},
        },
        "users": {
            1: {"Id": 1, "Name": "Admin Control Muelles", "Email": "admin@muelles.local", "IsActive": True, "CreatedAt": timestamp, "UpdatedAt": None, "Roles": ["ADMIN"]},
            2: {"Id": 2, "Name": "Supervisor Patio", "Email": "supervisor@muelles.local", "IsActive": True, "CreatedAt": timestamp, "UpdatedAt": None, "Roles": ["SUPERVISOR"]},
        },
    }
