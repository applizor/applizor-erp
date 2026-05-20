import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- CREATING STATIC STUDENT ROLE ---');

    // 1. Create/Update Student Role
    let studentRole = await prisma.role.findUnique({
        where: { name: 'Student' }
    });

    if (!studentRole) {
        studentRole = await prisma.role.create({
            data: {
                name: 'Student',
                description: 'Static Student Role (System Protected)',
                isSystem: true
            }
        });
        console.log('✅ Created Student role');
    } else {
        // Ensure it is system role
        studentRole = await prisma.role.update({
            where: { id: studentRole.id },
            data: { isSystem: true, description: 'Static Student Role (System Protected)' }
        });
        console.log('✅ Student role already existed, ensured isSystem: true');
    }

    // 2. Revert Teacher Role if it was marked as system
    const teacherRole = await prisma.role.findUnique({
        where: { name: 'Teacher' }
    });
    if (teacherRole && teacherRole.isSystem) {
        await prisma.role.update({
            where: { id: teacherRole.id },
            data: { isSystem: false }
        });
        console.log('✅ Updated Teacher role to isSystem: false');
    }

    // 3. Upsert Student Permissions
    const STUDENT_PERMISSIONS = [
        { module: 'Dashboard', readLevel: 'all' },
        { module: 'Student', readLevel: 'owned' },
        { module: 'Course', readLevel: 'all' },
        { module: 'CourseEnrollment', readLevel: 'owned' },
        { module: 'OnlineClass', readLevel: 'owned' },
        { module: 'Certificate', readLevel: 'owned' }
    ];

    for (const perm of STUDENT_PERMISSIONS) {
        await prisma.rolePermission.upsert({
            where: {
                roleId_module: {
                    roleId: studentRole.id,
                    module: perm.module
                }
            },
            update: {
                createLevel: 'none',
                readLevel: perm.readLevel || 'none',
                updateLevel: 'none',
                deleteLevel: 'none'
            },
            create: {
                roleId: studentRole.id,
                module: perm.module,
                createLevel: 'none',
                readLevel: perm.readLevel || 'none',
                updateLevel: 'none',
                deleteLevel: 'none'
            }
        });
    }
    console.log('✅ Sync\'d Student Permissions');

    console.log('🎉 Done! Student static role synced successfully.');
}

main()
    .catch(e => console.error('Error running script:', e))
    .finally(async () => await prisma.$disconnect());
