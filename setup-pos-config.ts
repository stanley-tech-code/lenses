
import { PrismaClient } from '@prisma/client';
import crypto from 'node:crypto';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Step 2: Database Configuration ---');

  const branch = await prisma.branch.findUnique({
    where: { id: 'default-branch-id' }
  });

  if (!branch) {
    console.error('❌ Default branch not found! Run seed first.');
    return;
  }

  console.log(`Found Branch: ${branch.name}`);

  // Upsert PosConfig
  const webhookSecret = 'whsec_' + crypto.randomBytes(16).toString('hex');

  const config = await prisma.posConfig.upsert({
    where: { branchId: branch.id },
    update: {}, // Don't overwrite if exists, but we want to know the secret
    create: {
      branchId: branch.id,
      webhookSecret,
      smsProvider: 'CUSTOM', // Defaulting to CUSTOM for now
      webhookEnabled: true,
      automationEnabled: true,
    }
  });

  console.log(`✅ PosConfig configured for branch.`);
  console.log(`Please use these details for the Test Console:`);
  console.log(`------------------------------------------------`);
  console.log(`Base URL:       http://localhost:3004`);
  console.log(`Branch ID:      ${branch.id}`);
  console.log(`Webhook Secret: ${config.webhookSecret}`);
  console.log(`------------------------------------------------`);
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
