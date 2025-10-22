import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-helpers";

// GET /api/teacher/courses - List teacher's courses
export async function GET(request: NextRequest) {
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

    const teacherId = authResult.user.id;

    const courses = await prisma.course.findMany({
      where: {
        teacherId,
      },
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

// POST /api/teacher/courses - Create new course
export async function POST(request: NextRequest) {
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

    const teacherId = authResult.user.id;
    const body = await request.json();
    const { title, description, price, imageUrl, modules } = body;

    if (!title || !description || !modules || modules.length === 0) {
      return NextResponse.json(
        { error: "Title, description, and at least one module are required" },
        { status: 400 }
      );
    }

    const course = await prisma.$transaction(async (tx) => {
      const newCourse = await tx.course.create({
        data: {
          title,
          description,
          price: price || 0,
          image: imageUrl,
          published: false,
          teacherId, // Assign to this teacher
        },
      });

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
