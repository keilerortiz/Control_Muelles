CREATE OR ALTER PROCEDURE dbo.usp_InsertRefreshToken
    @UserId INT,
    @TokenHash NVARCHAR(255),
    @ExpiresAt DATETIME2,
    @DeviceInfo NVARCHAR(255) = NULL
AS
BEGIN
    INSERT INTO dbo.tbl_RefreshToken(UserId, TokenHash, ExpiresAt, DeviceInfo)
    VALUES (@UserId, @TokenHash, @ExpiresAt, @DeviceInfo);
END;
GO

CREATE OR ALTER PROCEDURE dbo.usp_RevokeRefreshToken
    @TokenHash NVARCHAR(255)
AS
BEGIN
    UPDATE dbo.tbl_RefreshToken
    SET RevokedAt = GETUTCDATE()
    WHERE TokenHash = @TokenHash AND RevokedAt IS NULL;
END;
GO

CREATE OR ALTER PROCEDURE dbo.usp_RevokeUserRefreshTokens
    @UserId INT
AS
BEGIN
    UPDATE dbo.tbl_RefreshToken
    SET RevokedAt = GETUTCDATE()
    WHERE UserId = @UserId AND RevokedAt IS NULL;
END;
GO
