import { NextRequest, NextResponse } from "next/server";
import { checkUserAuth } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

// POST /api/progress/complete - Mark module as complete
export async function POST(request: NextRequest) {
  console.log("=== MARK MODULE COMPLETE ===");

  const { error, user } = await checkUserAuth();
  if (error) return error;

  try {
    const body = await request.json();
    const { courseId, moduleId } = body;

    console.log(
      "✅ Marking module complete:",
      moduleId,
      "for user:",
      user.email
    );

    if (!courseId || !moduleId) {
      return NextResponse.json(
        { error: "Course ID and Module ID are required" },
        { status: 400 }
      );
    }

    // Verify user has access to this course
    const isAdmin = user.role === "ADMIN";
    let hasAccess = isAdmin;

    if (!isAdmin) {
      const enrollment = await prisma.enrollment.findUnique({
        where: {
          userId_courseId: {
            userId: user.id,
            courseId: courseId,
          },
        },
      });
      hasAccess = !!enrollment;
    }

    if (!hasAccess) {
      return NextResponse.json(
        { error: "Access denied to this course" },
        { status: 403 }
      );
    }

    // Verify module belongs to the course
    const module = await prisma.module.findFirst({
      where: {
        id: moduleId,
        courseId: courseId,
      },
    });

    if (!module) {
      return NextResponse.json(
        { error: "Module not found in this course" },
        { status: 404 }
      );
    }

    // Create or update progress record
    const progress = await prisma.progress.upsert({
      where: {
        userId_moduleId: {
          userId: user.id,
          moduleId: moduleId,
        },
      },
      update: {
        completed: true,
        completedAt: new Date(),
      },
      create: {
        userId: user.id,
        moduleId: moduleId,
        completed: true,
        completedAt: new Date(),
      },
      select: {
        id: true,
        completed: true,
        completedAt: true,
        module: {
          select: {
            title: true,
          },
        },
      },
    });

    console.log(
      "✅ Module marked complete successfully:",
      progress.module.title
    );

    return NextResponse.json({
      success: true,
      message: "Module marked as complete",
      progress,
    });
  } catch (error) {
    console.error("❌ Error marking module complete:", error);
    return NextResponse.json(
      { error: "Failed to update progress" },
      { status: 500 }
    );
  }
}
