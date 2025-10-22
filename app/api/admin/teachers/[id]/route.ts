import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { requireAuth } from "@/lib/auth-helpers";

const prisma = new PrismaClient();

// GET - Get single teacher details
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireAuth(req);
    if (!authResult.authorized || !authResult.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (authResult.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Access denied. Admin privileges required." },
        { status: 403 }
      );
    }

    const teacherId = params.id;

    const teacher = await prisma.user.findUnique({
      where: {
        id: teacherId,
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
            description: true,
            price: true,
            published: true,
            enrollments: {
              select: {
                userId: true,
                user: {
                  select: {
                    email: true,
                    name: true,
                  },
                },
              },
            },
            payments: {
              where: {
                status: "COMPLETED",
              },
              select: {
                amount: true,
              },
            },
          },
        },
      },
    });

    if (!teacher) {
      return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      teacher,
    });
  } catch (error) {
    console.error("Error fetching teacher:", error);
    return NextResponse.json(
      { error: "Failed to fetch teacher" },
      { status: 500 }
    );
  }
}

// PUT - Update teacher
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireAuth(req);
    if (!authResult.authorized || !authResult.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (authResult.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Access denied. Admin privileges required." },
        { status: 403 }
      );
    }

    const teacherId = params.id;
    const { name, email } = await req.json();

    const teacher = await prisma.user.update({
      where: {
        id: teacherId,
        role: "TEACHER",
      },
      data: {
        name,
        email,
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
      message: "Teacher updated successfully",
    });
  } catch (error) {
    console.error("Error updating teacher:", error);
    return NextResponse.json(
      { error: "Failed to update teacher" },
      { status: 500 }
    );
  }
}

// DELETE - Delete teacher
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireAuth(req);
    if (!authResult.authorized || !authResult.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (authResult.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Access denied. Admin privileges required." },
        { status: 403 }
      );
    }

    const teacherId = params.id;

    // Check if teacher exists
    const teacher = await prisma.user.findUnique({
      where: {
        id: teacherId,
        role: "TEACHER",
      },
      include: {
        teacherCourses: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!teacher) {
      return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
    }

    // Delete teacher (courses will have teacherId set to null due to onDelete: SetNull)
    await prisma.user.delete({
      where: {
        id: teacherId,
      },
    });

    // Also delete from Supabase Auth
    const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

    if (supabaseServiceRole && supabaseUrl) {
      await fetch(`${supabaseUrl}/auth/v1/admin/users/${teacherId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${supabaseServiceRole}`,
          apikey: supabaseServiceRole,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: "Teacher deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting teacher:", error);
    return NextResponse.json(
      { error: "Failed to delete teacher" },
      { status: 500 }
    );
  }
}
