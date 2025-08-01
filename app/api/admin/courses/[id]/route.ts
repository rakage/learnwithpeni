import { NextRequest, NextResponse } from "next/server";
import { checkAdminAuth } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

// GET /api/admin/courses/[id] - Fetch single course for editing
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  console.log("=== GET SINGLE COURSE ===");

  const { error, user } = await checkAdminAuth();
  if (error) return error;

  try {
    const courseId = params.id;
    console.log("📚 Fetching course:", courseId);

    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        modules: {
          orderBy: { order: "asc" },
        },
        _count: {
          select: {
            enrollments: true,
          },
        },
      },
    });

    if (!course) {
      console.log("❌ Course not found:", courseId);
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    console.log(
      "✅ Course found:",
      course.title,
      "with",
      course.modules.length,
      "modules"
    );

    return NextResponse.json({
      success: true,
      course: {
        ...course,
        modules: course.modules.map((module) => ({
          id: module.id,
          title: module.title,
          description: module.description,
          type: module.type,
          content: module.content,
          videoUrl: module.videoUrl,
          fileUrl: module.fileUrl,
          duration: module.duration,
          order: module.order,
        })),
      },
    });
  } catch (error) {
    console.error("❌ Error fetching course:", error);
    return NextResponse.json(
      { error: "Failed to fetch course" },
      { status: 500 }
    );
  }
}

// PUT /api/admin/courses/[id] - Update course
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  console.log("=== UPDATE COURSE ===");

  const { error, user } = await checkAdminAuth();
  if (error) return error;

  try {
    const courseId = params.id;
    const body = await request.json();
    const { title, description, price, imageUrl, published, modules } = body;

    console.log("💾 Updating course:", courseId);
    console.log("📝 Course data:", {
      title,
      price,
      published,
      moduleCount: modules?.length,
    });

    // Validate required fields
    if (!title || !description) {
      return NextResponse.json(
        { error: "Title and description are required" },
        { status: 400 }
      );
    }

    if (!modules || modules.length === 0) {
      return NextResponse.json(
        { error: "At least one module is required" },
        { status: 400 }
      );
    }

    // Check if course exists
    const existingCourse = await prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!existingCourse) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    // Update course in transaction
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

      // Create new/updated modules
      const moduleData = modules.map((module: any, index: number) => ({
        courseId: courseId,
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

      // Return updated course with modules
      return await tx.course.findUnique({
        where: { id: courseId },
        include: {
          modules: {
            orderBy: { order: "asc" },
          },
        },
      });
    });

    console.log("✅ Course updated successfully:", updatedCourse?.title);

    return NextResponse.json({
      success: true,
      message: "Course updated successfully",
      course: updatedCourse,
    });
  } catch (error) {
    console.error("❌ Error updating course:", error);
    return NextResponse.json(
      { error: "Failed to update course" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/courses/[id] - Delete course
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  console.log("=== DELETE COURSE ===");

  const { error, user } = await checkAdminAuth();
  if (error) return error;

  try {
    const courseId = params.id;
    console.log("🗑️ Deleting course:", courseId);

    // Check if course exists
    const existingCourse = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        _count: {
          select: {
            enrollments: true,
          },
        },
      },
    });

    if (!existingCourse) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    // Check if course has enrollments
    if (existingCourse._count.enrollments > 0) {
      return NextResponse.json(
        { error: "Cannot delete course with existing enrollments" },
        { status: 400 }
      );
    }

    // Delete course (modules will be deleted due to cascade)
    await prisma.course.delete({
      where: { id: courseId },
    });

    console.log("✅ Course deleted successfully:", existingCourse.title);

    return NextResponse.json({
      success: true,
      message: "Course deleted successfully",
    });
  } catch (error) {
    console.error("❌ Error deleting course:", error);
    return NextResponse.json(
      { error: "Failed to delete course" },
      { status: 500 }
    );
  }
}
