import { PrismaClient, Role } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL || 'admin@kartini.sch.id';
  const password = process.env.SEED_ADMIN_PASSWORD || 'admin12345';
  const fullName = process.env.SEED_ADMIN_NAME || 'Administrator';

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    // eslint-disable-next-line no-console
    console.log(`Admin sudah ada: ${email}`);
    return;
  }

  const passwordHash = await argon2.hash(password);
  await prisma.user.create({
    data: { role: Role.ADMIN, fullName, email, passwordHash },
  });
  // eslint-disable-next-line no-console
  console.log(`Admin dibuat: ${email} (password: ${password})`);
}

main()
  .catch((e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
