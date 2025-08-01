import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkAdminAuth } from "@/lib/auth-helpers";
import { ModuleType } from "@prisma/client";

export async function POST(request: NextRequest) {
  console.log("=== SEEDING COURSES ===");

  try {
    // Check admin authentication
    const authResult = await checkAdminAuth();
    if (authResult.error) {
      return authResult.error;
    }

    console.log("👑 Admin authenticated, proceeding with course seeding...");

    // Course data that matches the landing page
    const coursesToCreate = [
      {
        id: "remote-work-basic",
        title: "Remote Work Basics",
        description:
          "Master the fundamentals of remote work including time management, communication, productivity tools, and work-life balance. Perfect for beginners starting their remote work journey.",
        price: 299000, // IDR 299,000
        image: "/api/placeholder/400/300",
        featured: false,
        published: true,
        modules: [
          {
            title: "Introduction to Remote Work",
            description:
              "Understanding the remote work landscape and opportunities",
            content:
              "Welcome to the world of remote work! In this module, you'll learn about the growing trend of remote work, its benefits, and challenges.",
            type: ModuleType.TEXT,
            order: 1,
            duration: 30,
          },
          {
            title: "Setting Up Your Home Office",
            description: "Creating an effective workspace at home",
            content:
              "Learn how to create a productive and comfortable workspace that will help you stay focused and motivated.",
            type: ModuleType.VIDEO,
            order: 2,
            duration: 45,
          },
          {
            title: "Time Management Basics",
            description:
              "Essential time management techniques for remote workers",
            content:
              "Discover proven time management strategies that work specifically for remote professionals.",
            type: ModuleType.TEXT,
            order: 3,
            duration: 35,
          },
          {
            title: "Communication Tools",
            description: "Master the essential communication tools",
            content:
              "Learn to use Slack, Zoom, Microsoft Teams, and other essential communication platforms.",
            type: ModuleType.VIDEO,
            order: 4,
            duration: 50,
          },
          {
            title: "Work-Life Balance",
            description:
              "Maintaining healthy boundaries while working from home",
            content:
              "Strategies to separate work and personal life when your office is at home.",
            type: ModuleType.TEXT,
            order: 5,
            duration: 40,
          },
        ],
      },
      {
        id: "remote-work-premium",
        title: "Remote Work Mastery",
        description:
          "Comprehensive remote work mastery course covering advanced techniques, leadership skills, digital nomad lifestyle, and career advancement strategies. Includes 1-on-1 coaching and certification.",
        price: 599000, // IDR 599,000
        image: "/api/placeholder/400/300",
        featured: true,
        published: true,
        modules: [
          {
            title: "Remote Work Fundamentals",
            description: "Master the basics of remote work",
            content:
              "Advanced fundamentals covering productivity, communication, and professional presence in remote environments.",
            type: ModuleType.VIDEO,
            order: 1,
            duration: 60,
          },
          {
            title: "Advanced Productivity Techniques",
            description: "Boost your productivity with proven methods",
            content:
              "Learn advanced productivity techniques including the Pomodoro Technique, Getting Things Done (GTD), and more.",
            type: ModuleType.TEXT,
            order: 2,
            duration: 45,
          },
          {
            title: "Remote Team Leadership",
            description: "Leading and managing remote teams effectively",
            content:
              "Essential leadership skills for managing distributed teams and fostering collaboration.",
            type: ModuleType.VIDEO,
            order: 3,
            duration: 55,
          },
          {
            title: "Digital Nomad Lifestyle",
            description: "Work from anywhere in the world",
            content:
              "Complete guide to becoming a digital nomad - from visa requirements to reliable internet setups.",
            type: ModuleType.TEXT,
            order: 4,
            duration: 70,
          },
          {
            title: "Career Advancement",
            description: "Growing your remote career",
            content:
              "Strategies for getting promoted, switching jobs, and building a successful remote career.",
            type: ModuleType.VIDEO,
            order: 5,
            duration: 50,
          },
          {
            title: "Building Your Personal Brand",
            description: "Establish yourself as a remote work expert",
            content:
              "Learn to build your online presence and establish thought leadership in remote work.",
            type: ModuleType.TEXT,
            order: 6,
            duration: 40,
          },
          {
            title: "Advanced Tools & Technology",
            description: "Master professional remote work tools",
            content:
              "Deep dive into project management, automation, and advanced productivity tools.",
            type: ModuleType.VIDEO,
            order: 7,
            duration: 65,
          },
          {
            title: "Remote Work Security",
            description: "Keeping your work secure while remote",
            content:
              "Essential cybersecurity practices for remote workers and protecting company data.",
            type: ModuleType.TEXT,
            order: 8,
            duration: 35,
          },
        ],
      },
    ];

    const results = [];

    for (const courseData of coursesToCreate) {
      try {
        // Check if course already exists
        const existingCourse = await prisma.course.findUnique({
          where: { id: courseData.id },
        });

        if (existingCourse) {
          console.log(
            `📚 Course ${courseData.title} already exists, skipping...`
          );
          results.push({
            courseId: courseData.id,
            status: "skipped",
            message: "Course already exists",
          });
          continue;
        }

        // Create course with modules in a transaction
        const course = await prisma.$transaction(async (tx) => {
          // Create the course
          const newCourse = await tx.course.create({
            data: {
              id: courseData.id,
              title: courseData.title,
              description: courseData.description,
              price: courseData.price,
              image: courseData.image,
              featured: courseData.featured,
              published: courseData.published,
            },
          });

          // Create modules
          const modules = await Promise.all(
            courseData.modules.map((moduleData) =>
              tx.module.create({
                data: {
                  ...moduleData,
                  courseId: newCourse.id,
                },
              })
            )
          );

          return { course: newCourse, modules };
        });

        console.log(
          `✅ Created course: ${course.course.title} with ${course.modules.length} modules`
        );
        results.push({
          courseId: courseData.id,
          status: "created",
          message: `Course created with ${course.modules.length} modules`,
          course: {
            id: course.course.id,
            title: course.course.title,
            moduleCount: course.modules.length,
          },
        });
      } catch (error) {
        console.error(`❌ Error creating course ${courseData.title}:`, error);
        results.push({
          courseId: courseData.id,
          status: "error",
          message: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    console.log("🎉 Course seeding completed!");

    return NextResponse.json({
      success: true,
      message: "Course seeding completed",
      results,
      summary: {
        total: coursesToCreate.length,
        created: results.filter((r) => r.status === "created").length,
        skipped: results.filter((r) => r.status === "skipped").length,
        errors: results.filter((r) => r.status === "error").length,
      },
    });
  } catch (error) {
    console.error("❌ Course seeding error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to seed courses",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// GET endpoint to check what courses exist
export async function GET(request: NextRequest) {
  try {
    const courses = await prisma.course.findMany({
      include: {
        modules: {
          select: {
            id: true,
            title: true,
            order: true,
            type: true,
            duration: true,
          },
          orderBy: { order: "asc" },
        },
        _count: {
          select: {
            enrollments: true,
            modules: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      courses: courses.map((course) => ({
        id: course.id,
        title: course.title,
        description: course.description,
        price: course.price,
        published: course.published,
        featured: course.featured,
        moduleCount: course._count.modules,
        enrollmentCount: course._count.enrollments,
        modules: course.modules,
      })),
    });
  } catch (error) {
    console.error("❌ Error fetching courses:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch courses",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
