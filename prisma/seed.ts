
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // 1. Create Default Branch
  const branch = await prisma.branch.upsert({
    where: { id: 'default-branch-id' },
    update: {},
    create: {
      id: 'default-branch-id',
      name: 'Main Branch',
      location: 'Nairobi, Kenya',
      phone: '+254700000000',
      timezone: 'Africa/Nairobi',
    },
  });
  console.log('Created branch:', branch.name);

  // 2. Create Super Admin User
  const salt = bcrypt.genSaltSync(10);
  const passwordHash = bcrypt.hashSync('Secret1', salt);

  const user = await prisma.user.upsert({
    where: { email: 'sofia@devias.io' },
    update: {
      passwordHash, // Update password if exists
      role: 'SUPER_ADMIN',
      branchId: branch.id,
    },
    create: {
      email: 'sofia@devias.io',
      firstName: 'Sofia',
      lastName: 'Rivers',
      passwordHash,
      role: 'SUPER_ADMIN',
      branchId: branch.id,
    },
  });
  console.log('Created user:', user.email);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
