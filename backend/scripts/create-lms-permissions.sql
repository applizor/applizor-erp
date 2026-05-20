-- Create Student, Course, CourseEnrollment, & OnlineClass permissions for Admin role
-- Run: docker exec -i applizor-postgres psql -U applizor -d applizor_erp < backend/scripts/create-lms-permissions.sql

DO $$
DECLARE
    admin_role_id UUID;
BEGIN
    -- Get Admin role ID
    SELECT id INTO admin_role_id FROM "Role" WHERE name = 'Admin' LIMIT 1;

    IF admin_role_id IS NULL THEN
        RAISE EXCEPTION 'Admin role not found! Run seeder first.';
    END IF;

    -- LMS permissions
    INSERT INTO "RolePermission" (
        id, "roleId", module,
        "createLevel", "readLevel", "updateLevel", "deleteLevel",
        "createdAt"
    )
    VALUES
    (
        gen_random_uuid(), admin_role_id, 'Student',
        'all', 'all', 'all', 'all', NOW()
    ),
    (
        gen_random_uuid(), admin_role_id, 'Course',
        'all', 'all', 'all', 'all', NOW()
    ),
    (
        gen_random_uuid(), admin_role_id, 'CourseEnrollment',
        'all', 'all', 'all', 'all', NOW()
    ),
    (
        gen_random_uuid(), admin_role_id, 'OnlineClass',
        'all', 'all', 'all', 'all', NOW()
    )
    ON CONFLICT ("roleId", module)
    DO UPDATE SET
        "createLevel" = 'all',
        "readLevel"   = 'all',
        "updateLevel" = 'all',
        "deleteLevel" = 'all';

    RAISE NOTICE '✅ LMS permissions created/updated for Admin role';
END $$;

-- Verify
SELECT
    r.name AS role_name,
    rp.module,
    rp."createLevel",
    rp."readLevel",
    rp."updateLevel",
    rp."deleteLevel"
FROM "RolePermission" rp
JOIN "Role" r ON r.id = rp."roleId"
WHERE rp.module IN ('Student', 'Course', 'CourseEnrollment', 'OnlineClass')
ORDER BY r.name, rp.module;
