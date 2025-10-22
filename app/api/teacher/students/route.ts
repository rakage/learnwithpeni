import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { requireAuth } from "@/lib/auth-helpers";

const prisma = new PrismaClient();

// GET - Get all students enrolled in teacher's courses
export async function GET(req: NextRequest) {
  try {
    const authResult = await requireAuth(req);

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

    // Get all courses taught by this teacher
    const teacherCourses = await prisma.course.findMany({
      where: {
        teacherId,
      },
      select: {
        id: true,
        title: true,
      },
    });

    const courseIds = teacherCourses.map((c) => c.id);

    // Get all students enrolled in these courses
    const enrollments = await prisma.enrollment.findMany({
      where: {
        courseId: {
          in: courseIds,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            image: true,
            created_at: true,
          },
        },
        course: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Get payment and progress info for each enrollment
    const studentsWithDetails = await Promise.all(
      enrollments.map(async (enrollment) => {
        const [payment, progressCount, totalModules] = await Promise.all([
          prisma.payment.findFirst({
            where: {
              userId: enrollment.userId,
              courseId: enrollment.courseId,
            },
            select: {
              id: true,
              amount: true,
              status: true,
              createdAt: true,
            },
            orderBy: {
              createdAt: "desc",
            },
          }),
          prisma.progress.count({
            where: {
              userId: enrollment.userId,
              completed: true,
              module: {
                courseId: enrollment.courseId,
              },
            },
          }),
          prisma.module.count({
            where: {
              courseId: enrollment.courseId,
            },
          }),
        ]);

        return {
          enrollmentId: enrollment.id,
          enrolledAt: enrollment.createdAt,
          student: enrollment.user,
          course: enrollment.course,
          payment: payment || null,
          progress: {
            completed: progressCount,
            total: totalModules,
            percentage: totalModules > 0 ? (progressCount / totalModules) * 100 : 0,
          },
        };
      })
    );

    // Group by student
    const studentMap = new Map();
    studentsWithDetails.forEach((detail) => {
      const studentId = detail.student.id;
      if (!studentMap.has(studentId)) {
        studentMap.set(studentId, {
          ...detail.student,
          courses: [],
        });
      }
      studentMap.get(studentId).courses.push({
        enrollmentId: detail.enrollmentId,
        enrolledAt: detail.enrolledAt,
        course: detail.course,
        payment: detail.payment,
        progress: detail.progress,
      });
    });

    const students = Array.from(studentMap.values());

    return NextResponse.json({
      success: true,
      students,
      totalStudents: students.length,
    });
  } catch (error) {
    console.error("Error fetching students:", error);
    return NextResponse.json(
      { error: "Failed to fetch students" },
      { status: 500 }
    );
  }
}
