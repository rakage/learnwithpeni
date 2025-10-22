import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { requireAuth } from "@/lib/auth-helpers";

const prisma = new PrismaClient();

// GET - Get users with pagination and search
export async function GET(req: NextRequest) {
  try {
    const authResult = await requireAuth(req);
    if (!authResult.authorized || !authResult.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    if (authResult.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Access denied. Admin privileges required." },
        { status: 403 }
      );
    }

    // Get query parameters
    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";

    // Build search conditions
    const searchCondition = search
      ? {
          OR: [
            { customerEmail: { contains: search, mode: "insensitive" as const } },
            { customerName: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {};

    const userSearchCondition = search
      ? {
          OR: [
            { email: { contains: search, mode: "insensitive" as const } },
            { name: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {};

    // Get all registered users (from users table)
    const registeredUsers = await prisma.user.findMany({
      where: userSearchCondition,
      include: {
        _count: {
          select: {
            enrollments: true,
          },
        },
        payments: {
          where: {
            status: "COMPLETED",
          },
          select: {
            stripePaymentId: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 1,
        },
      },
      orderBy: {
        created_at: "desc",
      },
    });

    // Get all pending payments with COMPLETED status (unregistered users)
    const pendingPayments = await prisma.pendingPayment.findMany({
      where: {
        status: "COMPLETED",
        ...searchCondition,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Create a map to track all users (registered + unregistered)
    const userMap = new Map<string, any>();

    // Add registered users to the map
    for (const user of registeredUsers) {
      // Check if user has a COMPLETED pending payment
      const pendingPayment = pendingPayments.find(
        (pp) => pp.customerEmail.toLowerCase() === user.email.toLowerCase()
      );

      userMap.set(user.email.toLowerCase(), {
        id: user.id,
        email: user.email,
        name: user.name || "-",
        phone: user.phone || pendingPayment?.customerPhone || "-", // Prioritize user.phone
        registered: pendingPayment ? "No" : "Yes", // If has pending payment, not registered
        paymentReference:
          user.payments.length > 0
            ? user.payments[0].stripePaymentId
            : (pendingPayment?.stripePaymentId || "-"),
        createdAt: user.created_at.toISOString(),
        enrollments: user._count.enrollments,
      });
    }

    // Add unregistered users (those only in pending_payments, not in users table)
    for (const pp of pendingPayments) {
      const emailKey = pp.customerEmail.toLowerCase();
      if (!userMap.has(emailKey)) {
        // This user paid but never registered
        userMap.set(emailKey, {
          id: pp.id,
          email: pp.customerEmail,
          name: pp.customerName || "-",
          phone: pp.customerPhone || "-",
          registered: "No",
          paymentReference: pp.stripePaymentId,
          createdAt: pp.createdAt.toISOString(),
          enrollments: 0,
        });
      }
    }

    // Convert map to array and sort by creation date
    let allUsers = Array.from(userMap.values()).sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    // Apply pagination
    const totalCount = allUsers.length;
    const totalPages = Math.ceil(totalCount / limit);
    const skip = (page - 1) * limit;
    const paginatedUsers = allUsers.slice(skip, skip + limit);

    return NextResponse.json({
      success: true,
      users: paginatedUsers,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        limit,
      },
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
