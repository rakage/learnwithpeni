import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-helpers";

// GET /api/teacher/courses/[id] - Get single course for editing
export async function GET(
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

    const course = await prisma.course.findUnique({
      where: {
        id: courseId,
        teacherId, // Only allow teacher to edit their own courses
      },
      include: {
        modules: {
          orderBy: { order: "asc" },
        },
      },
    });

    if (!course) {
      return NextResponse.json(
        { error: "Course not found or access denied" },
        { status: 404 }
      );
    }

    return NextResponse.json({ course });
  } catch (error) {
    console.error("Error fetching course:", error);
    return NextResponse.json(
      { error: "Failed to fetch course" },
      { status: 500 }
    );
  }
}

// PUT /api/teacher/courses/[id] - Update course
export async function PUT(
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
    const { title, description, price, imageUrl, modules, published } = body;

    // Verify ownership
    const existingCourse = await prisma.course.findUnique({
      where: { id: courseId },
      select: { teacherId: true },
    });

    if (!existingCourse || existingCourse.teacherId !== teacherId) {
      return NextResponse.json(
        { error: "Course not found or access denied" },
        { status: 404 }
      );
    }

    // Update course in a transaction
    const updatedCourse = await prisma.$transaction(async (tx) => {
      // Update course basic info
      const course = await tx.course.update({
        where: { id: courseId },
        data: {
          title,
          description,
          price: price || 0,
          image: imageUrl,
          published: published || false,
        },
      });

      // Delete existing modules
      await tx.module.deleteMany({
        where: { courseId },
      });

      // Create new modules
      if (modules && modules.length > 0) {
        const moduleData = modules.map((module: any, index: number) => ({
          courseId: course.id,
          title: module.title,
          description: module.description,
          type: module.type,
          content: module.content,
          videoUrl: module.videoUrl,
          fileUrl: module.fileUrl,
          duration: module.duration,
          order: index + 1,
        }));

        await tx.module.createMany({
          data: moduleData,
        });
      }

      // Return updated course with modules
      return await tx.course.findUnique({
        where: { id: course.id },
        include: {
          modules: {
            orderBy: { order: "asc" },
          },
        },
      });
    });

    return NextResponse.json({
      success: true,
      course: updatedCourse,
      message: "Course updated successfully",
    });
  } catch (error) {
    console.error("Error updating course:", error);
    return NextResponse.json(
      { error: "Failed to update course" },
      { status: 500 }
    );
  }
}

// DELETE /api/teacher/courses/[id] - Delete course
export async function DELETE(
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

    // Verify ownership before deleting
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { teacherId: true },
    });

    if (!course || course.teacherId !== teacherId) {
      return NextResponse.json(
        { error: "Course not found or access denied" },
        { status: 404 }
      );
    }

    // Delete course (modules will be cascade deleted)
    await prisma.course.delete({
      where: { id: courseId },
    });

    return NextResponse.json({
      success: true,
      message: "Course deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting course:", error);
    return NextResponse.json(
      { error: "Failed to delete course" },
      { status: 500 }
    );
  }
}
