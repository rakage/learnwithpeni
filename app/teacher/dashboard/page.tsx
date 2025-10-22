"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { apiGet } from "@/lib/auth-client";
import toast from "react-hot-toast";
import {
  BookOpen,
  Users,
  DollarSign,
  TrendingUp,
  Plus,
  Eye,
  BarChart,
} from "lucide-react";
import AuthGuard from "@/components/AuthGuard";
import Navigation from "@/components/Navigation";

interface DashboardStats {
  totalCourses: number;
  publishedCourses: number;
  draftCourses: number;
  totalStudents: number;
  totalRevenue: number;
  pendingRevenue: number;
  totalPayments: number;
  completedPayments: number;
  pendingPayments: number;
}

interface Course {
  id: string;
  title: string;
  description: string;
  price: number;
  image: string | null;
  published: boolean;
  enrollments: number;
  modules: number;
}

interface RecentEnrollment {
  id: string;
  createdAt: string;
  user: {
    name: string;
    email: string;
  };
  course: {
    title: string;
  };
}

export default function TeacherDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [recentEnrollments, setRecentEnrollments] = useState<
    RecentEnrollment[]
  >([]);
  const router = useRouter();

  useEffect(() => {
    const initializeDashboard = async () => {
      try {
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();

        if (error || !user) {
          router.push("/auth/signin");
          return;
        }

        // Check if user is teacher
        const response = await apiGet("/api/teacher/check");

        if (!response.ok) {
          toast.error("Access denied. Teacher privileges required.");
          router.push("/dashboard");
          return;
        }

        await loadDashboardData();
      } catch (error) {
        console.error("Error initializing dashboard:", error);
        toast.error("Failed to load dashboard");
        router.push("/dashboard");
      } finally {
        setLoading(false);
      }
    };

    initializeDashboard();
  }, [router]);

  const loadDashboardData = async () => {
    try {
      const response = await apiGet("/api/teacher/dashboard");

      if (!response.ok) {
        throw new Error("Failed to load dashboard data");
      }

      const data = await response.json();
      setStats(data.stats);
      setCourses(data.courses);
      setRecentEnrollments(data.recentEnrollments);
    } catch (error) {
      console.error("Error loading dashboard:", error);
      toast.error("Failed to load dashboard data");
    }
  };

  if (loading) {
    return (
      <AuthGuard requireAuth={true}>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
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
            <h1 className="text-3xl font-bold text-gray-900">
              Teacher Dashboard
            </h1>
            <p className="text-gray-600">
              Manage your courses and track student progress
            </p>
          </div>

          {/* Quick Actions */}
          <div className="mb-8 bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Quick Actions
            </h2>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/teacher/courses/create"
                className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors flex items-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>Create Course</span>
              </Link>
              <Link
                href="/teacher/courses"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <BookOpen className="h-4 w-4" />
                <span>My Courses</span>
              </Link>
              <Link
                href="/teacher/students"
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
              >
                <Users className="h-4 w-4" />
                <span>View Students</span>
              </Link>
              <Link
                href="/teacher/analytics"
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2"
              >
                <BarChart className="h-4 w-4" />
                <span>Analytics</span>
              </Link>
            </div>
          </div>

          {/* Stats Cards */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <div className="flex items-center">
                  <BookOpen className="h-8 w-8 text-blue-500" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">
                      My Courses
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats.totalCourses}
                    </p>
                    <p className="text-xs text-gray-500">
                      {stats.publishedCourses} published
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm">
                <div className="flex items-center">
                  <Users className="h-8 w-8 text-green-500" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">
                      Total Students
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats.totalStudents}
                    </p>
                    <p className="text-xs text-gray-500">Enrolled students</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm">
                <div className="flex items-center">
                  <DollarSign className="h-8 w-8 text-yellow-500" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">
                      Total Revenue
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      Rp {stats.totalRevenue.toLocaleString("id-ID")}
                    </p>
                    <p className="text-xs text-gray-500">
                      Rp {stats.pendingRevenue.toLocaleString("id-ID")} pending
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm">
                <div className="flex items-center">
                  <TrendingUp className="h-8 w-8 text-purple-500" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">
                      Payments
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats.completedPayments}
                    </p>
                    <p className="text-xs text-gray-500">
                      {stats.pendingPayments} pending
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Courses Grid */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                My Courses
              </h2>
              <Link
                href="/teacher/courses"
                className="text-primary-600 hover:text-primary-700 text-sm font-medium"
              >
                View All →
              </Link>
            </div>

            {courses.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">
                  You haven't created any courses yet
                </p>
                <Link
                  href="/teacher/courses/create"
                  className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Course
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {courses.slice(0, 6).map((course) => (
                  <div
                    key={course.id}
                    className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow"
                  >
                    <div className="h-48 bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
                      {course.image ? (
                        <img
                          src={course.image}
                          alt={course.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <BookOpen className="h-16 w-16 text-white" />
                      )}
                    </div>
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            course.published
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {course.published ? "Published" : "Draft"}
                        </span>
                        <span className="text-sm font-medium text-gray-900">
                          Rp {course.price.toLocaleString("id-ID")}
                        </span>
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                        {course.title}
                      </h3>
                      <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                        {course.description}
                      </p>
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <span>{course.modules} modules</span>
                        <span>{course.enrollments} students</span>
                      </div>
                      <Link
                        href={`/teacher/courses/${course.id}/edit`}
                        className="mt-4 block w-full text-center bg-primary-50 text-primary-600 px-4 py-2 rounded-lg hover:bg-primary-100 transition-colors"
                      >
                        Manage Course
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Enrollments */}
          {recentEnrollments.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">
                  Recent Enrollments
                </h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {recentEnrollments.slice(0, 5).map((enrollment) => (
                    <div
                      key={enrollment.id}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <Users className="h-4 w-4 text-green-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-900">
                            <span className="font-medium">
                              {enrollment.user.name}
                            </span>{" "}
                            enrolled in{" "}
                            <span className="font-medium">
                              {enrollment.course.title}
                            </span>
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(enrollment.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AuthGuard>
  );
}
