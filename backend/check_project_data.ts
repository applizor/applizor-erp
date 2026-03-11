
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const projectId = 'd19a9bd7-7edd-4fbf-90fc-5adb7be4205a';
    
    console.log('--- Checking Project ---');
    const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: {
            members: {
                include: {
                    employee: true
                }
            },
            sprints: true
        }
    });
    
    if (!project) {
        console.log('Project not found');
        return;
    }
    
    console.log('Project Name:', project.name);
    console.log('Member Count:', project.members.length);
    project.members.forEach(m => {
        console.log(`- Member: ${m.employee?.firstName} ${m.employee?.lastName} (ID: ${m.employee?.id})`);
    });
    
    console.log('Sprint Count:', project.sprints.length);
    project.sprints.forEach(s => {
        console.log(`- Sprint: ${s.name} (Status: ${s.status}, ID: ${s.id})`);
    });
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
