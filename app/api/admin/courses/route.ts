import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkAdminAuth } from "@/lib/auth-helpers";

// GET /api/admin/courses - List all courses
export async function GET(request: NextRequest) {
  try {
    // Check admin authentication
    const { error, user } = await checkAdminAuth();
    if (error) return error;

    const courses = await prisma.course.findMany({
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
      orderBy: { createdAt: "desc" },
    });

    // Format courses with enrollment count
    const formattedCourses = courses.map((course) => ({
      ...course,
      enrollmentCount: course._count.enrollments,
    }));

    return NextResponse.json({ courses: formattedCourses });
  } catch (error) {
    console.error("Error fetching courses:", error);
    return NextResponse.json(
      { error: "Failed to fetch courses" },
      { status: 500 }
    );
  }
}

// POST /api/admin/courses - Create new course
export async function POST(request: NextRequest) {
  try {
    // Check admin authentication
    const { error, user } = await checkAdminAuth();
    if (error) return error;

    const body = await request.json();
    const { title, description, price, imageUrl, modules } = body;

    // Validate required fields
    if (!title || !description || !modules || modules.length === 0) {
      return NextResponse.json(
        { error: "Title, description, and at least one module are required" },
        { status: 400 }
      );
    }

    // Create course with modules in a transaction
    const course = await prisma.$transaction(async (tx) => {
      // Create the course
      const newCourse = await tx.course.create({
        data: {
          title,
          description,
          price: price || 0,
          image: imageUrl, // Use 'image' field from schema
          published: false, // Default to unpublished
        },
      });

      // Create modules
      const moduleData = modules.map((module: any, index: number) => ({
        courseId: newCourse.id,
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

      // Return course with modules
      return await tx.course.findUnique({
        where: { id: newCourse.id },
        include: {
          modules: {
            orderBy: { order: "asc" },
          },
        },
      });
    });

    return NextResponse.json({
      success: true,
      course,
      message: "Course created successfully",
    });
  } catch (error) {
    console.error("Error creating course:", error);
    return NextResponse.json(
      { error: "Failed to create course" },
      { status: 500 }
    );
  }
}
