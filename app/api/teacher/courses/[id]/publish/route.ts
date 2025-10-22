import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-helpers";

// PATCH /api/teacher/courses/[id]/publish - Toggle course published status
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireAuth(request);
    if (!authResult.authorized || !authResult.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (authResult.user.role !== "TEACHER") {
      return NextResponse.json(
        { error: "Access denied. Teacher role required." },
        { status: 403 }
      );
    }

    const courseId = params.id;
    const teacherId = authResult.user.id;
    const body = await request.json();
    const { published } = body;

    // Verify ownership
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { teacherId: true, published: true },
    });

    if (!course || course.teacherId !== teacherId) {
      return NextResponse.json(
        { error: "Course not found or access denied" },
        { status: 404 }
      );
    }

    // Update published status (use provided value or toggle)
    const newPublishedStatus = published !== undefined ? published : !course.published;
    const updatedCourse = await prisma.course.update({
      where: { id: courseId },
      data: {
        published: newPublishedStatus,
      },
    });

    return NextResponse.json({
      success: true,
      published: updatedCourse.published,
      message: updatedCourse.published
        ? "Course published successfully"
        : "Course unpublished successfully",
    });
  } catch (error) {
    console.error("Error toggling course published status:", error);
    return NextResponse.json(
      { error: "Failed to update course status" },
      { status: 500 }
    );
  }
}
