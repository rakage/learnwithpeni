"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { apiGet } from "@/lib/auth-client";
import Link from "next/link";
import Image from "next/image";
import toast from "react-hot-toast";
import {
  BookOpen,
  Play,
  FileText,
  LogOut,
  User,
  Shield,
  Settings,
  TrendingUp,
  Users,
  DollarSign,
} from "lucide-react";
import { calculateProgress } from "@/lib/utils";
import AuthGuard from "@/components/AuthGuard";
import Navigation from "@/components/Navigation";

interface Course {
  id: string;
  title: string;
  description: string;
  price: number;
  image?: string;
  published: boolean;
  modules: Module[];
  progress?: number;
  isEnrolled?: boolean;
  enrollmentCount?: number;
}

interface Module {
  id: string;
  title: string;
  type: "VIDEO" | "TEXT" | "FILE";
  completed: boolean;
  order: number;
}

interface UserProfile {
  id: string;
  email: string;
  name?: string;
  role: "ADMIN" | "STUDENT";
  image?: string;
}

interface DashboardStats {
  totalCourses: number;
  enrolledCourses: number;
  completedCourses: number;
  totalProgress: number;
}

export default function DashboardPage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const initializeDashboard = async () => {
      try {
        // Get current user
        const {
          data: { user: authUser },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError || !authUser) {
          router.push("/auth/signin");
          return;
        }

        // Fetch user profile from database to get role
        const userResponse = await apiGet("/api/user/profile");
        if (!userResponse.ok) {
          toast.error("Failed to load user profile");
          router.push("/auth/signin");
          return;
        }

        const userData = await userResponse.json();
        const userProfile: UserProfile = {
          id: userData.user.id,
          email: userData.user.email,
          name:
            userData.user.name ||
            authUser.user_metadata?.name ||
            userData.user.email,
          role: userData.user.role,
          image: authUser.user_metadata?.avatar_url,
        };

        setUser(userProfile);

        // Fetch courses based on user role
        if (userProfile.role === "ADMIN") {
          await fetchAllCoursesForAdmin();
        } else {
          await fetchEnrolledCourses();
        }
      } catch (error) {
        console.error("Error initializing dashboard:", error);
        toast.error("Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    };

    initializeDashboard();
  }, [router]);

  const fetchEnrolledCourses = async () => {
    try {
      const response = await apiGet("/api/user/courses");

      if (!response.ok) {
        throw new Error("Failed to fetch enrolled courses");
      }

      const data = await response.json();

      // Process courses with progress calculation
      const coursesWithProgress = data.courses.map((course: any) => {
        const completedModules =
          course.progress?.filter((p: any) => p.completed).length || 0;
        const totalModules = course.modules?.length || 0;
        const progress =
          totalModules > 0
            ? calculateProgress(completedModules, totalModules)
            : 0;

        return {
          id: course.id,
          title: course.title,
          description: course.description,
          price: course.price,
          image: course.image || "/api/placeholder/300/200",
          published: course.published,
          progress,
          isEnrolled: true,
          modules:
            course.modules?.map((module: any, index: number) => ({
              id: module.id,
              title: module.title,
              type: module.type,
              order: module.order,
              completed:
                course.progress?.find((p: any) => p.moduleId === module.id)
                  ?.completed || false,
            })) || [],
        };
      });

      setCourses(coursesWithProgress);

      // Calculate stats for student
      const enrolledCount = coursesWithProgress.length;
      const completedCount = coursesWithProgress.filter(
        (c: Course) => c.progress === 100
      ).length;
      const totalProgress =
        enrolledCount > 0
          ? coursesWithProgress.reduce(
              (sum: number, c: Course) => sum + (c.progress || 0),
              0
            ) / enrolledCount
          : 0;

      setStats({
        totalCourses: enrolledCount,
        enrolledCourses: enrolledCount,
        completedCourses: completedCount,
        totalProgress: Math.round(totalProgress),
      });
    } catch (error) {
      console.error("Error fetching enrolled courses:", error);
      toast.error("Failed to load your courses");
    }
  };

  const fetchAllCoursesForAdmin = async () => {
    try {
      const response = await apiGet("/api/admin/courses");

      if (!response.ok) {
        throw new Error("Failed to fetch courses");
      }

      const data = await response.json();

      // Process courses for admin view
      const processedCourses = data.courses.map((course: any) => ({
        id: course.id,
        title: course.title,
        description: course.description,
        price: course.price,
        image: course.image || "/api/placeholder/300/200",
        published: course.published,
        progress: 100, // Admins have full access
        isEnrolled: false, // Admin access, not enrollment
        enrollmentCount: course.enrollmentCount || 0,
        modules:
          course.modules?.map((module: any) => ({
            id: module.id,
            title: module.title,
            type: module.type,
            order: module.order,
            completed: false, // Admin view doesn't track personal progress
          })) || [],
      }));

      setCourses(processedCourses);

      // Calculate admin stats
      const totalCourses = processedCourses.length;
      const publishedCourses = processedCourses.filter(
        (c: Course) => c.published
      ).length;
      const totalEnrollments = processedCourses.reduce(
        (sum: number, c: Course) => sum + (c.enrollmentCount || 0),
        0
      );

      setStats({
        totalCourses,
        enrolledCourses: publishedCourses,
        completedCourses: totalEnrollments,
        totalProgress:
          totalCourses > 0
            ? Math.round((publishedCourses / totalCourses) * 100)
            : 0,
      });
    } catch (error) {
      console.error("Error fetching courses for admin:", error);
      toast.error("Failed to load courses");
    }
  };

  const getModuleIcon = (type: string) => {
    switch (type) {
      case "VIDEO":
        return <Play className="h-4 w-4" />;
      case "TEXT":
        return <FileText className="h-4 w-4" />;
      case "FILE":
        return <FileText className="h-4 w-4" />;
      default:
        return <BookOpen className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (course: Course) => {
    if (user?.role === "ADMIN") {
      return course.published ? (
        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
          Published
        </span>
      ) : (
        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
          Draft
        </span>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthGuard requireAuth={true}>
      <div className="min-h-screen bg-gray-50">
        {/* Navigation */}
        <Navigation />

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Welcome Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-3 mb-2">
                  <h1 className="text-3xl font-bold text-gray-900">
                    Welcome back, {user?.name}!
                  </h1>
                  {user?.role === "ADMIN" && (
                    <div className="flex items-center space-x-2">
                      <div className="relative group">
                        <Shield className="h-6 w-6 text-blue-600" />
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                          Administrator
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <p className="text-xl text-gray-600">
                  {user?.role === "ADMIN"
                    ? "Manage your learning platform"
                    : "Continue your learning journey"}
                </p>
              </div>

              {user?.role === "ADMIN" && (
                <div className="flex space-x-3">
                  <Link
                    href="/admin"
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center space-x-2"
                  >
                    <Settings className="h-5 w-5" />
                    <span>Admin Dashboard</span>
                  </Link>
                  <Link
                    href="/admin/courses/create"
                    className="bg-primary-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-700 transition-colors flex items-center space-x-2"
                  >
                    <BookOpen className="h-5 w-5" />
                    <span>Create Course</span>
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Stats Cards */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center">
                  <BookOpen className="h-8 w-8 text-blue-500" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">
                      {user?.role === "ADMIN"
                        ? "Total Courses"
                        : "Enrolled Courses"}
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats.totalCourses}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center">
                  <TrendingUp className="h-8 w-8 text-green-500" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">
                      {user?.role === "ADMIN" ? "Published" : "Completed"}
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats.enrolledCourses}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center">
                  <Users className="h-8 w-8 text-purple-500" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">
                      {user?.role === "ADMIN"
                        ? "Total Enrollments"
                        : "Completed Courses"}
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats.completedCourses}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center">
                  <DollarSign className="h-8 w-8 text-yellow-500" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">
                      {user?.role === "ADMIN"
                        ? "Published Rate"
                        : "Overall Progress"}
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats.totalProgress}%
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Section Title */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {user?.role === "ADMIN" ? "All Courses" : "Your Courses"}
            </h2>
            <p className="text-gray-600">
              {user?.role === "ADMIN"
                ? "Manage and monitor all courses on the platform"
                : "Continue learning from where you left off"}
            </p>
          </div>

          {/* Courses Grid */}
          <div className="grid lg:grid-cols-2 gap-8">
            {courses.map((course) => (
              <div
                key={course.id}
                className="bg-white rounded-lg shadow-sm overflow-hidden"
              >
                <div className="relative h-48">
                  <Image
                    src={course.image || "/api/placeholder/300/200"}
                    alt={course.title}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-20"></div>

                  {/* Status Badge for Admin */}
                  {user?.role === "ADMIN" && (
                    <div className="absolute top-4 right-4">
                      {getStatusBadge(course)}
                    </div>
                  )}

                  <div className="absolute bottom-4 left-4 right-4">
                    <h3 className="text-xl font-bold text-white mb-2">
                      {course.title}
                    </h3>

                    {user?.role === "ADMIN" ? (
                      <div className="bg-white bg-opacity-90 rounded-lg px-3 py-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-700">Enrollments</span>
                          <span className="font-semibold text-primary-600">
                            {course.enrollmentCount || 0}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm mt-1">
                          <span className="text-gray-700">Price</span>
                          <span className="font-semibold text-green-600">
                            ${course.price}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-white bg-opacity-90 rounded-lg px-3 py-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-700">Progress</span>
                          <span className="font-semibold text-primary-600">
                            {course.progress}%
                          </span>
                        </div>
                        <div className="mt-1 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-primary-600 h-2 rounded-full transition-all"
                            style={{ width: `${course.progress}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-6">
                  <p className="text-gray-600 mb-4">{course.description}</p>

                  <div className="space-y-2 mb-6">
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <span>
                        {user?.role === "ADMIN"
                          ? "Total modules"
                          : "Modules completed"}
                      </span>
                      <span>
                        {user?.role === "ADMIN"
                          ? course.modules.length
                          : `${
                              course.modules.filter((m) => m.completed).length
                            } of ${course.modules.length}`}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2 mb-6">
                    <h4 className="text-sm font-medium text-gray-900">
                      {user?.role === "ADMIN"
                        ? "Course Modules"
                        : "Recent Modules"}
                    </h4>
                    {course.modules.slice(0, 3).map((module) => (
                      <div
                        key={module.id}
                        className="flex items-center space-x-3 text-sm"
                      >
                        <div
                          className={`p-1 rounded ${
                            module.completed && user?.role !== "ADMIN"
                              ? "bg-green-100 text-green-600"
                              : "bg-gray-100 text-gray-400"
                          }`}
                        >
                          {getModuleIcon(module.type)}
                        </div>
                        <span
                          className={
                            module.completed && user?.role !== "ADMIN"
                              ? "text-gray-900"
                              : "text-gray-600"
                          }
                        >
                          {module.title}
                        </span>
                        {module.completed && user?.role !== "ADMIN" && (
                          <span className="text-green-600 text-xs">✓</span>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="flex space-x-3">
                    <Link
                      href={`/course/${course.id}`}
                      className="flex-1 bg-primary-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-primary-700 transition-colors text-center"
                    >
                      {user?.role === "ADMIN"
                        ? "View Course"
                        : "Continue Learning"}
                    </Link>

                    {user?.role === "ADMIN" && (
                      <Link
                        href={`/admin/courses/${course.id}/edit`}
                        className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-200 transition-colors flex items-center space-x-2"
                      >
                        <Settings className="h-4 w-4" />
                        <span>Edit</span>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Empty State */}
          {courses.length === 0 && (
            <div className="text-center py-12">
              <BookOpen className="h-24 w-24 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-900 mb-2">
                {user?.role === "ADMIN"
                  ? "No courses created yet"
                  : "No courses yet"}
              </h3>
              <p className="text-gray-600 mb-6">
                {user?.role === "ADMIN"
                  ? "Start by creating your first course for students."
                  : "You haven't enrolled in any courses yet. Start learning today!"}
              </p>
              {user?.role === "ADMIN" ? (
                <Link
                  href="/admin/courses/create"
                  className="bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors"
                >
                  Create First Course
                </Link>
              ) : (
                <Link
                  href="/"
                  className="bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors"
                >
                  Browse Courses
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </AuthGuard>
  );
}
