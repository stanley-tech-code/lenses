
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const branches = await prisma.branch.findMany({
    include: { posConfig: true }
  });

  console.log('--- Database Config Verification ---');
  if (branches.length === 0) {
    console.error('❌ No branches found!');
  } else {
    branches.forEach(b => {
      console.log(`Branch: ${b.name} (ID: ${b.id})`);
      if (b.posConfig) {
        console.log(`  ✅ PosConfig found`);
        console.log(`  Webhook Secret: ${b.posConfig.webhookSecret}`);
        console.log(`  SMS Provider: ${b.posConfig.smsProvider}`);
      } else {
        console.error(`  ❌ Missing PosConfig`);
      }
    });
  }
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
