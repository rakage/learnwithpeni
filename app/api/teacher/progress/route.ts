import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { requireAuth } from "@/lib/auth-helpers";

const prisma = new PrismaClient();

// GET - Get progress data for teacher's students
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
    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get("courseId");

    // Get teacher's courses
    const whereClause: any = {
      teacherId,
    };

    if (courseId) {
      whereClause.id = courseId;
    }

    const teacherCourses = await prisma.course.findMany({
      where: whereClause,
      select: {
        id: true,
        title: true,
        modules: {
          select: {
            id: true,
            title: true,
            order: true,
          },
          orderBy: {
            order: "asc",
          },
        },
      },
    });

    const courseIds = teacherCourses.map((c) => c.id);

    // Get all enrollments for these courses
    const enrollments = await prisma.enrollment.findMany({
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
      },
    });

    // Get progress for each enrollment
    const progressData = await Promise.all(
      enrollments.map(async (enrollment) => {
        const course = teacherCourses.find((c) => c.id === enrollment.courseId);
        if (!course) return null;

        const moduleIds = course.modules.map((m) => m.id);

        const progress = await prisma.progress.findMany({
          where: {
            userId: enrollment.userId,
            moduleId: {
              in: moduleIds,
            },
          },
          select: {
            moduleId: true,
            completed: true,
            completedAt: true,
          },
        });

        const completedModules = progress.filter((p) => p.completed);
        const progressPercentage =
          course.modules.length > 0
            ? (completedModules.length / course.modules.length) * 100
            : 0;

        return {
          student: enrollment.user,
          course: {
            id: course.id,
            title: course.title,
          },
          enrolledAt: enrollment.createdAt,
          progress: {
            completed: completedModules.length,
            total: course.modules.length,
            percentage: progressPercentage,
            modules: course.modules.map((module) => {
              const moduleProgress = progress.find(
                (p) => p.moduleId === module.id
              );
              return {
                id: module.id,
                title: module.title,
                order: module.order,
                completed: moduleProgress?.completed || false,
                completedAt: moduleProgress?.completedAt || null,
              };
            }),
          },
        };
      })
    );

    const validProgressData = progressData.filter((p) => p !== null);

    // Calculate overall stats
    const stats = {
      totalStudents: enrollments.length,
      totalCourses: teacherCourses.length,
      averageProgress:
        validProgressData.length > 0
          ? validProgressData.reduce((sum, p) => sum + p!.progress.percentage, 0) /
            validProgressData.length
          : 0,
      completedStudents: validProgressData.filter(
        (p) => p!.progress.percentage === 100
      ).length,
    };

    return NextResponse.json({
      success: true,
      progressData: validProgressData,
      stats,
      courses: teacherCourses.map((c) => ({
        id: c.id,
        title: c.title,
      })),
    });
  } catch (error) {
    console.error("Error fetching progress:", error);
    return NextResponse.json(
      { error: "Failed to fetch progress data" },
      { status: 500 }
    );
  }
}
