import { NextRequest, NextResponse } from "next/server";
import { checkUserAuth } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

// GET /api/user/courses - Get enrolled courses for current user
export async function GET(request: NextRequest) {
  console.log("=== GET USER COURSES ===");

  const { error, user } = await checkUserAuth();
  if (error) return error;

  try {
    console.log("📚 Fetching enrolled courses for user:", user.email);

    // Get user enrollments with course and module data
    const enrollments = await prisma.enrollment.findMany({
      where: {
        userId: user.id,
      },
      include: {
        course: {
          include: {
            modules: {
              orderBy: { order: "asc" },
            },
          },
        },
      },
    });

    console.log("📋 Found enrollments:", enrollments.length);

    // Get progress for all enrolled courses
    const courseIds = enrollments.map((e) => e.course.id);
    const progress = await prisma.progress.findMany({
      where: {
        userId: user.id,
        module: {
          courseId: {
            in: courseIds,
          },
        },
      },
      select: {
        moduleId: true,
        completed: true,
        completedAt: true,
        module: {
          select: {
            courseId: true,
          },
        },
      },
    });

    console.log("📊 Found progress records:", progress.length);

    // Process courses with progress data
    const coursesWithProgress = enrollments.map((enrollment) => {
      const course = enrollment.course;
      const courseProgress = progress.filter(
        (p) => p.module.courseId === course.id
      );

      return {
        id: course.id,
        title: course.title,
        description: course.description,
        price: course.price,
        image: course.image,
        published: course.published,
        createdAt: course.createdAt,
        enrolledAt: enrollment.createdAt,
        modules: course.modules.map((module) => ({
          id: module.id,
          title: module.title,
          description: module.description,
          type: module.type,
          order: module.order,
          duration: module.duration,
        })),
        progress: courseProgress.map((p) => ({
          moduleId: p.moduleId,
          completed: p.completed,
          completedAt: p.completedAt,
        })),
      };
    });

    console.log(
      "✅ Processed courses with progress:",
      coursesWithProgress.length
    );

    return NextResponse.json({
      success: true,
      courses: coursesWithProgress,
    });
  } catch (error) {
    console.error("❌ Error fetching user courses:", error);
    return NextResponse.json(
      { error: "Failed to fetch your courses" },
      { status: 500 }
    );
  }
}
