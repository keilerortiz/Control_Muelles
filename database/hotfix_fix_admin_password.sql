SET NOCOUNT ON;

UPDATE dbo.tbl_User
SET PasswordHash = '$2b$12$u.Ulh7F8OSMAx0Obn8uV2uQoarvb9KOFUrkUGVtBXyhOUx.ysqKGa',
    UpdatedAt = GETUTCDATE()
WHERE Email = 'admin@muelles.local';
