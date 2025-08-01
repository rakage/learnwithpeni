import { NextRequest, NextResponse } from "next/server";
import { checkAdminAuth } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

// PATCH /api/admin/courses/[id]/publish - Toggle course published status
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  console.log("=== TOGGLE COURSE PUBLISH STATUS ===");

  const { error, user } = await checkAdminAuth();
  if (error) return error;

  try {
    const courseId = params.id;
    const body = await request.json();
    const { published } = body;

    console.log(
      "📝 Toggling publish status for course:",
      courseId,
      "to:",
      published
    );

    // Validate published status
    if (typeof published !== "boolean") {
      return NextResponse.json(
        { error: "Published status must be a boolean" },
        { status: 400 }
      );
    }

    // Check if course exists
    const existingCourse = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        modules: true,
      },
    });

    if (!existingCourse) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    // If trying to publish, validate course has content
    if (published) {
      if (!existingCourse.title || !existingCourse.description) {
        return NextResponse.json(
          { error: "Course must have title and description to be published" },
          { status: 400 }
        );
      }

      if (existingCourse.modules.length === 0) {
        return NextResponse.json(
          { error: "Course must have at least one module to be published" },
          { status: 400 }
        );
      }

      // Check if all modules have required content
      for (const module of existingCourse.modules) {
        if (!module.title) {
          return NextResponse.json(
            { error: "All modules must have a title to publish course" },
            { status: 400 }
          );
        }

        if (module.type === "TEXT" && !module.content) {
          return NextResponse.json(
            { error: "All text modules must have content to publish course" },
            { status: 400 }
          );
        }

        if (module.type === "VIDEO" && !module.videoUrl) {
          return NextResponse.json(
            {
              error:
                "All video modules must have videos uploaded to publish course",
            },
            { status: 400 }
          );
        }

        if (module.type === "FILE" && !module.fileUrl) {
          return NextResponse.json(
            {
              error:
                "All file modules must have documents uploaded to publish course",
            },
            { status: 400 }
          );
        }
      }
    }

    // Update course published status
    const updatedCourse = await prisma.course.update({
      where: { id: courseId },
      data: { published },
      select: {
        id: true,
        title: true,
        published: true,
      },
    });

    console.log(
      "✅ Course publish status updated:",
      updatedCourse.title,
      "published:",
      updatedCourse.published
    );

    return NextResponse.json({
      success: true,
      message: `Course ${published ? "published" : "unpublished"} successfully`,
      course: updatedCourse,
    });
  } catch (error) {
    console.error("❌ Error updating course publish status:", error);
    return NextResponse.json(
      { error: "Failed to update course status" },
      { status: 500 }
    );
  }
}
