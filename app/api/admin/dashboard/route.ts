import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { requireAuth } from "@/lib/auth-helpers";

const prisma = new PrismaClient();

// GET - Get admin dashboard stats
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

    // Fetch all stats in parallel
    const [
      totalUsers,
      totalCourses,
      totalEnrollments,
      payments,
      courses,
      users,
      recentEnrollments,
    ] = await Promise.all([
      // Total users
      prisma.user.count(),

      // Total courses
      prisma.course.count(),

      // Total enrollments
      prisma.enrollment.count(),

      // All payments for revenue calculation
      prisma.payment.findMany({
        select: {
          amount: true,
          status: true,
        },
      }),

      // Courses with enrollment counts
      prisma.course.findMany({
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
              amount: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 10,
      }),

      // Recent users with enrollment counts
      prisma.user.findMany({
        where: {
          role: "STUDENT",
        },
        include: {
          _count: {
            select: {
              enrollments: true,
            },
          },
        },
        orderBy: {
          created_at: "desc",
        },
        take: 10,
      }),

      // Recent enrollments
      prisma.enrollment.findMany({
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

    // Calculate total revenue (completed payments only)
    const totalRevenue = payments
      .filter((p) => p.status === "COMPLETED")
      .reduce((sum, p) => sum + p.amount, 0);

    // Format courses data
    const formattedCourses = courses.map((course) => ({
      id: course.id,
      title: course.title,
      description: course.description,
      price: course.price,
      published: course.published,
      enrollments: course._count.enrollments,
      revenue: course.payments.reduce((sum, p) => sum + p.amount, 0),
    }));

    // Format users data
    const formattedUsers = users.map((user) => ({
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.created_at.toISOString(),
      enrollments: user._count.enrollments,
    }));

    const stats = {
      totalUsers,
      totalCourses,
      totalRevenue,
      totalEnrollments,
    };

    return NextResponse.json({
      success: true,
      stats,
      courses: formattedCourses,
      users: formattedUsers,
      recentEnrollments,
    });
  } catch (error) {
    console.error("Error fetching admin dashboard:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}
