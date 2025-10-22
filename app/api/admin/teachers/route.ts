import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { requireAuth } from "@/lib/auth-helpers";

const prisma = new PrismaClient();

// GET - Get all teachers
export async function GET(req: NextRequest) {
  try {
    const authResult = await requireAuth(req);
    if (!authResult.authorized || !authResult.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    if (authResult.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Access denied. Admin privileges required." },
        { status: 403 }
      );
    }

    const teachers = await prisma.user.findMany({
      where: {
        role: "TEACHER",
      },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        created_at: true,
        teacherCourses: {
          select: {
            id: true,
            title: true,
            published: true,
            _count: {
              select: {
                enrollments: true,
              },
            },
          },
        },
      },
      orderBy: {
        created_at: "desc",
      },
    });

    // Calculate stats for each teacher
    const teachersWithStats = await Promise.all(
      teachers.map(async (teacher) => {
        const courseIds = teacher.teacherCourses.map((c) => c.id);
        
        const [totalStudents, totalRevenue] = await Promise.all([
          prisma.enrollment.count({
            where: {
              courseId: {
                in: courseIds,
              },
            },
          }),
          prisma.payment.aggregate({
            where: {
              courseId: {
                in: courseIds,
              },
              status: "COMPLETED",
            },
            _sum: {
              amount: true,
            },
          }),
        ]);

        return {
          id: teacher.id,
          email: teacher.email,
          name: teacher.name,
          image: teacher.image,
          createdAt: teacher.created_at,
          stats: {
            totalCourses: teacher.teacherCourses.length,
            publishedCourses: teacher.teacherCourses.filter((c) => c.published).length,
            totalStudents,
            totalRevenue: totalRevenue._sum.amount || 0,
          },
        };
      })
    );

    return NextResponse.json({
      success: true,
      teachers: teachersWithStats,
    });
  } catch (error) {
    console.error("Error fetching teachers:", error);
    return NextResponse.json(
      { error: "Failed to fetch teachers" },
      { status: 500 }
    );
  }
}

// POST - Create a new teacher
export async function POST(req: NextRequest) {
  try {
    const authResult = await requireAuth(req);
    if (!authResult.authorized || !authResult.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    if (authResult.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Access denied. Admin privileges required." },
        { status: 403 }
      );
    }

    const { email, name, password } = await req.json();

    if (!email || !name || !password) {
      return NextResponse.json(
        { error: "Email, name, and password are required" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "A user with this email already exists" },
        { status: 400 }
      );
    }

    // Create teacher account in Supabase Auth
    const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

    if (!supabaseServiceRole || !supabaseUrl) {
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    // Create user in Supabase Auth
    const authResponse = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${supabaseServiceRole}`,
        apikey: supabaseServiceRole,
      },
      body: JSON.stringify({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          name,
        },
      }),
    });

    if (!authResponse.ok) {
      const errorData = await authResponse.json();
      console.error("Supabase auth error:", errorData);
      return NextResponse.json(
        { error: errorData.message || "Failed to create teacher account" },
        { status: 400 }
      );
    }

    const authData = await authResponse.json();
    const userId = authData.id;

    // Update user role to TEACHER in database
    const teacher = await prisma.user.update({
      where: { id: userId },
      data: {
        role: "TEACHER",
        name,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        created_at: true,
      },
    });

    return NextResponse.json({
      success: true,
      teacher,
      message: "Teacher created successfully",
    });
  } catch (error) {
    console.error("Error creating teacher:", error);
    return NextResponse.json(
      { error: "Failed to create teacher" },
      { status: 500 }
    );
  }
}
