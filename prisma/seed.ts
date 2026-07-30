import "dotenv/config";
import bcrypt from "bcrypt";
import { PrismaClient } from "../generated/client";
import { PrismaPg } from "@prisma/adapter-pg";

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  const prisma = new PrismaClient({ adapter });

  const email = "admin@example.com";
  const password = "Admin123";

  // Check if admin already exists
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`ℹ️  Admin user already exists (id=${existing.id}). Skipping seed.`);
    await prisma.$disconnect();
    return;
  }

  const hashed = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      name: "Admin",
      email,
      password: hashed,
      role: "ADMIN",
    },
  });

  console.log(`✅ Admin user created — id=${user.id}, email=${user.email}`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error("Seed failed:", e);
  process.exit(1);
});
