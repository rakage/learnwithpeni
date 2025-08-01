const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function makeAdmin() {
  const email = process.argv[2];

  if (!email) {
    console.error("Usage: node scripts/make-admin.js <email>");
    process.exit(1);
  }

  try {
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      console.error(`User with email ${email} not found`);
      process.exit(1);
    }

    // Update user role to ADMIN
    const updatedUser = await prisma.user.update({
      where: { email },
      data: { role: "ADMIN" },
    });

    console.log(`Successfully promoted ${email} to ADMIN role`);
    console.log("User details:", {
      id: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name,
      role: updatedUser.role,
    });
  } catch (error) {
    console.error("Error promoting user to admin:", error);
  } finally {
    await prisma.$disconnect();
  }
}

makeAdmin();
