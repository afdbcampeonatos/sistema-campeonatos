import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Updating user...');
  await prisma.user.update({
    where: { email: 'afdb@teste.com' },
    data: { mustChangePassword: true },
  });
  console.log('✅ User updated to force password change.');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
