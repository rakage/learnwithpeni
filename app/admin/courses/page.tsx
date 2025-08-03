"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import toast from "react-hot-toast";
import {
  BookOpen,
  Plus,
  Users,
  DollarSign,
  Eye,
  Edit,
  Trash2,
  Video,
  FileText,
  Upload,
} from "lucide-react";
import AuthGuard from "@/components/AuthGuard";
import Navigation from "@/components/Navigation";
import { smartGet, smartCall } from "@/lib/auth-client";

interface Module {
  id: string;
  title: string;
  type: "VIDEO" | "TEXT" | "FILE";
  order: number;
}

interface Course {
  id: string;
  title: string;
  description: string;
  price: number;
  image?: string;
  published: boolean;
  createdAt: string;
  modules: Module[];
  _count: {
    enrollments: number;
  };
}

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      console.log("📚 Fetching courses with Bearer token authentication...");
      const response = await smartGet("/api/admin/courses");

      if (!response.ok) {
        throw new Error("Failed to fetch courses");
      }

      const data = await response.json();
      console.log(
        "✅ Courses fetched successfully:",
        data.courses?.length || 0,
        "courses"
      );
      setCourses(data.courses);
    } catch (error) {
      console.error("❌ Error fetching courses:", error);
      toast.error("Failed to load courses");
    } finally {
      setLoading(false);
    }
  };

  // Delete course
  const deleteCourse = async (courseId: string, courseTitle: string) => {
    if (
      !confirm(
        `Are you sure you want to delete "${courseTitle}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      console.log("🗑️ Deleting course:", courseId);
      const response = await smartCall(`/api/admin/courses/${courseId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete course");
      }

      // Remove course from local state
      setCourses((prev) => prev.filter((course) => course.id !== courseId));
      toast.success("Course deleted successfully");
    } catch (error) {
      console.error("❌ Error deleting course:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to delete course"
      );
    }
  };

  const getModuleTypeIcon = (type: string) => {
    switch (type) {
      case "VIDEO":
        return <Video className="h-4 w-4 text-blue-600" />;
      case "TEXT":
        return <FileText className="h-4 w-4 text-green-600" />;
      case "FILE":
        return <Upload className="h-4 w-4 text-purple-600" />;
      default:
        return <BookOpen className="h-4 w-4 text-gray-600" />;
    }
  };

  const getModuleTypeCounts = (modules: Module[]) => {
    const counts = {
      VIDEO: modules.filter((m) => m.type === "VIDEO").length,
      TEXT: modules.filter((m) => m.type === "TEXT").length,
      FILE: modules.filter((m) => m.type === "FILE").length,
    };
    return counts;
  };

  if (loading) {
    return (
      <AuthGuard requireAuth={true}>
        <div className="min-h-screen bg-gray-50">
          <Navigation />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
            </div>
          </div>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard requireAuth={true}>
      <div className="min-h-screen bg-gray-50">
        <Navigation />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <BookOpen className="h-8 w-8 text-primary-600 mr-3" />
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    Course Management
                  </h1>
                  <p className="text-gray-600 mt-1">
                    Create and manage your courses
                  </p>
                </div>
              </div>
              <Link
                href="/admin/courses/create"
                className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors flex items-center space-x-2"
              >
                <Plus className="h-5 w-5" />
                <span>Create Course</span>
              </Link>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-center">
                <BookOpen className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    Total Courses
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {courses.length}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    Total Enrollments
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {courses.reduce(
                      (sum, course) => sum + course._count.enrollments,
                      0
                    )}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-center">
                <DollarSign className="h-8 w-8 text-yellow-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    Published Courses
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {courses.filter((course) => course.published).length}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-center">
                <Video className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    Total Modules
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {courses.reduce(
                      (sum, course) => sum + course.modules.length,
                      0
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Courses List */}
          {courses.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-12">
              <div className="text-center">
                <BookOpen className="h-24 w-24 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-gray-900 mb-2">
                  No courses yet
                </h3>
                <p className="text-gray-600 mb-6">
                  Create your first course to get started with your learning
                  platform.
                </p>
                <Link
                  href="/admin/courses/create"
                  className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors inline-flex items-center space-x-2"
                >
                  <Plus className="h-5 w-5" />
                  <span>Create Your First Course</span>
                </Link>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">
                  All Courses
                </h2>
              </div>
              <div className="divide-y divide-gray-200">
                {courses.map((course) => {
                  const moduleCounts = getModuleTypeCounts(course.modules);
                  return (
                    <div
                      key={course.id}
                      className="p-6 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4 flex-1">
                          {/* Course Image */}
                          <div className="w-24 h-16 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                            {course.image ? (
                              <Image
                                src={course.image}
                                alt={course.title}
                                width={96}
                                height={64}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <BookOpen className="h-8 w-8 text-gray-400" />
                              </div>
                            )}
                          </div>

                          {/* Course Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-3 mb-2">
                              <h3 className="text-lg font-semibold text-gray-900 truncate">
                                {course.title}
                              </h3>
                              <span
                                className={`px-2 py-1 text-xs font-medium rounded-full ${
                                  course.published
                                    ? "bg-green-100 text-green-800"
                                    : "bg-yellow-100 text-yellow-800"
                                }`}
                              >
                                {course.published ? "Published" : "Draft"}
                              </span>
                            </div>
                            <p className="text-gray-600 mb-3 line-clamp-2">
                              {course.description}
                            </p>

                            {/* Stats */}
                            <div className="flex items-center space-x-6 text-sm text-gray-500">
                              <div className="flex items-center space-x-1">
                                <span>{course.modules.length} modules</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                {moduleCounts.VIDEO > 0 && (
                                  <div className="flex items-center space-x-1">
                                    <Video className="h-4 w-4 text-blue-600" />
                                    <span>{moduleCounts.VIDEO}</span>
                                  </div>
                                )}
                                {moduleCounts.TEXT > 0 && (
                                  <div className="flex items-center space-x-1">
                                    <FileText className="h-4 w-4 text-green-600" />
                                    <span>{moduleCounts.TEXT}</span>
                                  </div>
                                )}
                                {moduleCounts.FILE > 0 && (
                                  <div className="flex items-center space-x-1">
                                    <Upload className="h-4 w-4 text-purple-600" />
                                    <span>{moduleCounts.FILE}</span>
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center space-x-1">
                                <Users className="h-4 w-4" />
                                <span>
                                  {course._count.enrollments} enrolled
                                </span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <DollarSign className="h-4 w-4" />
                                <span>${course.price}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center space-x-2 ml-4">
                          <button
                            onClick={() => router.push(`/course/${course.id}`)}
                            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                            title="View Course"
                          >
                            <Eye className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() =>
                              router.push(`/admin/courses/${course.id}/edit`)
                            }
                            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                            title="Edit Course"
                          >
                            <Edit className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() =>
                              deleteCourse(course.id, course.title)
                            }
                            className="p-2 text-red-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                            title="Delete Course"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </AuthGuard>
  );
}
