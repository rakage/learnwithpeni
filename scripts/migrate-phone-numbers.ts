/**
 * Script to migrate phone numbers from pending_payments to users table
 * Run this script to update existing users with their phone numbers
 * 
 * Usage: npx ts-node scripts/migrate-phone-numbers.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function migratePhoneNumbers() {
  console.log("Starting phone number migration...");

  try {
    // Get all users without phone numbers
    const usersWithoutPhone = await prisma.user.findMany({
      where: {
        OR: [
          { phone: null },
          { phone: "" },
        ],
      },
      select: {
        id: true,
        email: true,
        phone: true,
      },
    });

    console.log(`Found ${usersWithoutPhone.length} users without phone numbers`);

    let updatedCount = 0;

    for (const user of usersWithoutPhone) {
      // Find corresponding pending payment
      const pendingPayment = await prisma.pendingPayment.findFirst({
        where: {
          customerEmail: {
            equals: user.email,
            mode: "insensitive",
          },
          customerPhone: {
            not: null,
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        select: {
          customerPhone: true,
        },
      });

      if (pendingPayment?.customerPhone) {
        // Update user with phone number
        await prisma.user.update({
          where: { id: user.id },
          data: { phone: pendingPayment.customerPhone },
        });

        console.log(`Updated user ${user.email} with phone: ${pendingPayment.customerPhone}`);
        updatedCount++;
      }
    }

    console.log(`\nMigration completed!`);
    console.log(`Total users updated: ${updatedCount}`);
    console.log(`Users without matching phone: ${usersWithoutPhone.length - updatedCount}`);

  } catch (error) {
    console.error("Error during migration:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
migratePhoneNumbers()
  .then(() => {
    console.log("\nPhone number migration finished successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\nPhone number migration failed:", error);
    process.exit(1);
  });
