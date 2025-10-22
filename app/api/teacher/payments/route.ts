import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { requireAuth } from "@/lib/auth-helpers";

const prisma = new PrismaClient();

// GET - Get all payments for teacher's courses
export async function GET(req: NextRequest) {
  try {
    const authResult = await requireAuth(req);

    if (!authResult.authorized || !authResult.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (authResult.user.role !== "TEACHER") {
      return NextResponse.json(
        { error: "Access denied. Teacher role required." },
        { status: 403 }
      );
    }

    const teacherId = authResult.user.id;

    // Get all courses taught by this teacher
    const teacherCourses = await prisma.course.findMany({
      where: {
        teacherId,
      },
      select: {
        id: true,
      },
    });

    const courseIds = teacherCourses.map((c) => c.id);

    // Get all payments for these courses
    const payments = await prisma.payment.findMany({
      where: {
        courseId: {
          in: courseIds,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        course: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Calculate stats
    const stats = {
      totalPayments: payments.length,
      completedPayments: payments.filter((p) => p.status === "COMPLETED").length,
      pendingPayments: payments.filter((p) => p.status === "PENDING").length,
      failedPayments: payments.filter((p) => p.status === "FAILED").length,
      totalRevenue: payments
        .filter((p) => p.status === "COMPLETED")
        .reduce((sum, p) => sum + p.amount, 0),
      pendingRevenue: payments
        .filter((p) => p.status === "PENDING")
        .reduce((sum, p) => sum + p.amount, 0),
    };

    return NextResponse.json({
      success: true,
      payments,
      stats,
    });
  } catch (error) {
    console.error("Error fetching payments:", error);
    return NextResponse.json(
      { error: "Failed to fetch payments" },
      { status: 500 }
    );
  }
}
