import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { requireAuth } from "@/lib/auth-helpers";

const prisma = new PrismaClient();

// GET - Get teacher dashboard stats
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

    // Get teacher's courses
    const courses = await prisma.course.findMany({
      where: {
        teacherId,
      },
      include: {
        _count: {
          select: {
            enrollments: true,
            modules: true,
          },
        },
      },
    });

    const courseIds = courses.map((c) => c.id);

    // Get stats
    const [totalStudents, payments, recentEnrollments] = await Promise.all([
      prisma.enrollment.count({
        where: {
          courseId: {
            in: courseIds,
          },
        },
      }),
      prisma.payment.findMany({
        where: {
          courseId: {
            in: courseIds,
          },
        },
        select: {
          amount: true,
          status: true,
        },
      }),
      prisma.enrollment.findMany({
        where: {
          courseId: {
            in: courseIds,
          },
        },
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
          course: {
            select: {
              title: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 10,
      }),
    ]);

    const totalRevenue = payments
      .filter((p) => p.status === "COMPLETED")
      .reduce((sum, p) => sum + p.amount, 0);

    const pendingRevenue = payments
      .filter((p) => p.status === "PENDING")
      .reduce((sum, p) => sum + p.amount, 0);

    const stats = {
      totalCourses: courses.length,
      publishedCourses: courses.filter((c) => c.published).length,
      draftCourses: courses.filter((c) => !c.published).length,
      totalStudents,
      totalRevenue,
      pendingRevenue,
      totalPayments: payments.length,
      completedPayments: payments.filter((p) => p.status === "COMPLETED").length,
      pendingPayments: payments.filter((p) => p.status === "PENDING").length,
    };

    return NextResponse.json({
      success: true,
      stats,
      courses: courses.map((c) => ({
        id: c.id,
        title: c.title,
        description: c.description,
        price: c.price,
        image: c.image,
        published: c.published,
        enrollments: c._count.enrollments,
        modules: c._count.modules,
      })),
      recentEnrollments,
    });
  } catch (error) {
    console.error("Error fetching teacher dashboard:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}
