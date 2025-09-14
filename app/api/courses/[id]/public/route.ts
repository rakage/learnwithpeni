import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  console.log("=== GET PUBLIC COURSE INFO ===");

  try {
    const courseId = params.id;

    if (!courseId) {
      return NextResponse.json(
        { error: "Course ID is required" },
        { status: 400 }
      );
    }

    // Get course details - only public information
    const course = await prisma.course.findUnique({
      where: {
        id: courseId,
        published: true, // Only return published courses
      },
      select: {
        id: true,
        title: true,
        description: true,
        price: true,
        image: true,
        published: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            modules: true,
            enrollments: true,
          },
        },
      },
    });

    if (!course) {
      return NextResponse.json(
        { error: "Course not found or not available" },
        { status: 404 }
      );
    }

    console.log(`📚 Public course info requested: ${course.title}`);

    return NextResponse.json({
      success: true,
      course: {
        id: course.id,
        title: course.title,
        description: course.description,
        price: course.price,
        image: course.image,
        published: course.published,
        moduleCount: course._count.modules,
        enrollmentCount: course._count.enrollments,
        createdAt: course.createdAt,
        updatedAt: course.updatedAt,
      },
    });
  } catch (error) {
    console.error("❌ Error fetching public course info:", error);
    return NextResponse.json(
      { error: "Failed to fetch course information" },
      { status: 500 }
    );
  }
}
