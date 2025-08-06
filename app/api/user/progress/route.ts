import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    // Get the current user from Supabase auth
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json(
        { error: "No authorization header" },
        { status: 401 }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's enrollments
    const enrollments = await prisma.enrollment.findMany({
      where: {
        userId: user.id,
      },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            modules: {
              select: {
                id: true,
              },
            },
          },
        },
      },
    });

    // Calculate progress for each enrolled course
    const progressData = await Promise.all(
      enrollments.map(async (enrollment) => {
        const totalModules = enrollment.course.modules.length;

        // Get completed modules for this course
        const completedProgress = await prisma.progress.findMany({
          where: {
            userId: user.id,
            moduleId: {
              in: enrollment.course.modules.map((module) => module.id),
            },
            completed: true,
          },
        });

        const completedModules = completedProgress.length;
        const progressPercentage =
          totalModules > 0
            ? Math.round((completedModules / totalModules) * 100)
            : 0;

        return {
          courseId: enrollment.course.id,
          courseTitle: enrollment.course.title,
          totalModules,
          completedModules,
          progressPercentage,
        };
      })
    );

    return NextResponse.json({
      success: true,
      progress: progressData,
    });
  } catch (error) {
    console.error("Error fetching user progress:", error);
    return NextResponse.json(
      { error: "Failed to fetch progress" },
      { status: 500 }
    );
  }
}
