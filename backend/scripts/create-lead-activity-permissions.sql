-- Create LeadActivity permissions in RolePermission table
-- This adds LeadActivity module with all access levels for Admin role

-- First, get the Admin role ID
DO $$
DECLARE
    admin_role_id UUID;
BEGIN
    -- Get Admin role ID
    SELECT id INTO admin_role_id FROM "Role" WHERE name = 'Admin' LIMIT 1;
    
    IF admin_role_id IS NULL THEN
        RAISE EXCEPTION 'Admin role not found!';
    END IF;
    
    -- Insert LeadActivity permission for Admin role
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
        'LeadActivity',
        'all',  -- Can create all activities
        'all',  -- Can read all activities
        'all',  -- Can update all activities
        'all',  -- Can delete all activities
        NOW()
    )
    ON CONFLICT ("roleId", module) 
    DO UPDATE SET
        "createLevel" = 'all',
        "readLevel" = 'all',
        "updateLevel" = 'all',
        "deleteLevel" = 'all';
    
    RAISE NOTICE 'LeadActivity permissions created/updated for Admin role';
END $$;

-- Verify the permission was created
SELECT 
    r.name as role_name,
    rp.module,
    rp."createLevel",
    rp."readLevel",
    rp."updateLevel",
    rp."deleteLevel"
FROM "RolePermission" rp
JOIN "Role" r ON r.id = rp."roleId"
WHERE rp.module = 'LeadActivity';
