import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkUserAuth } from "@/lib/auth-helpers";
import { getProxiedVideoUrl } from "@/lib/video-utils";

// GET /api/courses/[id] - Get course with access control
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  console.log("=== GET COURSE WITH ACCESS CONTROL ===");

  const { error, user } = await checkUserAuth();
  if (error) return error;

  try {
    const courseId = params.id;
    console.log("📚 Fetching course:", courseId, "for user:", user.email);

    // Fetch course with modules
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        modules: {
          orderBy: { order: "asc" },
        },
      },
      // Make sure to select teacherId for ownership check
    });

    if (!course) {
      console.log("❌ Course not found:", courseId);
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    // Check if course is published (unless user is admin or the teacher who owns it)
    const isTeacherOwner = user.role === "TEACHER" && course.teacherId === user.id;
    if (!course.published && user.role !== "ADMIN" && !isTeacherOwner) {
      console.log("❌ Course not published and user is not admin or owner");
      return NextResponse.json(
        { error: "Course not available" },
        { status: 403 }
      );
    }

    // Check enrollment status
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: user.id,
          courseId: courseId,
        },
      },
    });

    console.log("📋 Enrollment status:", !!enrollment);

    // Determine access
    const isAdmin = user.role === "ADMIN";
    const isEnrolled = !!enrollment;
    const hasAccess = isAdmin || isTeacherOwner || isEnrolled;

    if (!hasAccess) {
      // Return course info for purchase page but deny access
      console.log("❌ User does not have access to course");
      return NextResponse.json({
        success: true,
        course: {
          id: course.id,
          title: course.title,
          description: course.description,
          price: course.price,
          image: course.image,
          published: course.published,
          modules: [], // Don't expose module content
        },
        enrollment: null,
        progress: [],
        hasAccess: false,
      });
    }

    // Get user progress for this course
    const progress = await prisma.progress.findMany({
      where: {
        userId: user.id,
        module: {
          courseId: courseId,
        },
      },
      select: {
        moduleId: true,
        completed: true,
        completedAt: true,
      },
    });

    console.log(
      "✅ Course access granted - Progress:",
      progress.length,
      "modules"
    );

    return NextResponse.json({
      success: true,
      course: {
        id: course.id,
        title: course.title,
        description: course.description,
        price: course.price,
        image: course.image,
        published: course.published,
        modules: course.modules.map((module) => ({
          id: module.id,
          title: module.title,
          description: module.description,
          type: module.type,
          content: module.content,
          videoUrl: module.videoUrl
            ? getProxiedVideoUrl(module.videoUrl)
            : module.videoUrl,
          fileUrl: module.fileUrl,
          duration: module.duration,
          order: module.order,
        })),
      },
      enrollment,
      progress,
      hasAccess: true,
    });
  } catch (error) {
    console.error("❌ Error fetching course:", error);
    return NextResponse.json(
      { error: "Failed to fetch course" },
      { status: 500 }
    );
  }
}
