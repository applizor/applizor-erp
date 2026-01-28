-- Create Timesheet permissions for Admin role

DO $$
DECLARE
    admin_role_id UUID;
BEGIN
    -- Get Admin role ID
    SELECT id INTO admin_role_id FROM "Role" WHERE name = 'Admin' LIMIT 1;
    
    IF admin_role_id IS NULL THEN
        RAISE EXCEPTION 'Admin role not found!';
    END IF;
    
    -- Insert permission for Admin role
    INSERT INTO "RolePermission" (
        id, 
        "roleId", 
        module, 
        "createLevel", 
        "readLevel", 
        "updateLevel", 
        "deleteLevel", 
        "createdAt"
    )
    VALUES (
        gen_random_uuid(),
        admin_role_id,
        'Timesheet',  -- New Module Name
        'all',         -- Admin gets full access
        'all',
        'all',
        'all',
        NOW()
    )
    ON CONFLICT ("roleId", module) 
    DO UPDATE SET
        "createLevel" = 'all',
        "readLevel" = 'all',
        "updateLevel" = 'all',
        "deleteLevel" = 'all';
    
    RAISE NOTICE 'Timesheet permissions created/updated for Admin role';
END $$;
