
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const rules = await prisma.automationRule.findMany({
        take: 10,
        include: { project: { select: { name: true } } }
    });
    console.log(`Found ${rules.length} rules.`);
    if (rules.length > 0) {
        console.log(JSON.stringify(rules, null, 2));
    } else {
        console.log("No rules found. Default automation is NOT active.");
    }
}

main()
    .catch((e) => console.error(e))
    .finally(async () => await prisma.$disconnect());
