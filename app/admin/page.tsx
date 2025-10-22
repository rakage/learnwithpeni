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
  Edit,
  Trash2,
  Eye,
  Loader2,
} from "lucide-react";
import AuthGuard from "@/components/AuthGuard";
import Navigation from "@/components/Navigation";

interface AdminStats {
  totalUsers: number;
  totalCourses: number;
  totalRevenue: number;
  totalEnrollments: number;
}

interface Course {
  id: string;
  title: string;
  description: string;
  price: number;
  published: boolean;
  enrollments: number;
  revenue: number;
}

interface User {
  id: string;
  email: string;
  name: string;
  phone: string;
  registered: string;
  paymentReference: string;
  createdAt: string;
  enrollments: number;
}

interface UserPagination {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  limit: number;
}

export default function AdminPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [userPagination, setUserPagination] = useState<UserPagination>({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    limit: 10,
  });
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [userSearchInput, setUserSearchInput] = useState("");
  const [usersLoading, setUsersLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "courses" | "users">(
    "overview"
  );
  const router = useRouter();

  useEffect(() => {
    const initializeAdmin = async () => {
      try {
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();

        if (error || !user) {
          router.push("/auth/signin");
          return;
        }

        // Check if user is admin using Bearer token authentication
        const response = await apiGet("/api/admin/check");

        if (!response.ok) {
          toast.error("Access denied. Admin privileges required.");
          router.push("/dashboard");
          return;
        }

        const userData = await response.json();
        setUser(userData.user);
        await loadAdminData();
      } catch (error) {
        toast.error("Failed to load admin panel");
        router.push("/dashboard");
      } finally {
        setLoading(false);
      }
    };

    initializeAdmin();
  }, [router]);

  const loadUsers = async (page: number = 1, search: string = "") => {
    try {
      setUsersLoading(true);
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: "10",
      });

      if (search) {
        queryParams.append("search", search);
      }

      const response = await apiGet(`/api/admin/users?${queryParams.toString()}`);

      if (!response.ok) {
        throw new Error("Failed to load users");
      }

      const data = await response.json();
      setUsers(data.users);
      setUserPagination(data.pagination);
    } catch (error) {
      console.error("Error loading users:", error);
      toast.error("Failed to load users");
    } finally {
      setUsersLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "users") {
      loadUsers(userPagination.currentPage, userSearchTerm);
    }
  }, [activeTab, userPagination.currentPage, userSearchTerm]);

  const handleUserSearch = () => {
    setUserSearchTerm(userSearchInput);
    setUserPagination({ ...userPagination, currentPage: 1 });
  };

  const handleUserPageChange = (newPage: number) => {
    setUserPagination({ ...userPagination, currentPage: newPage });
  };

  const loadAdminData = async () => {
    try {
      const response = await apiGet("/api/admin/dashboard");

      if (!response.ok) {
        throw new Error("Failed to load dashboard data");
      }

      const data = await response.json();
      setStats(data.stats);
      setCourses(data.courses);
      // Don't load users here, load them separately with pagination
    } catch (error) {
      console.error("Error loading admin data:", error);
      toast.error("Failed to load admin data");
    }
  };

  const deleteCourse = async (courseId: string) => {
    if (!confirm("Are you sure you want to delete this course?")) return;

    try {
      // Mock deletion - replace with actual API call using apiCall
      setCourses(courses.filter((c) => c.id !== courseId));
      toast.success("Course deleted successfully");
    } catch (error) {
      console.error("Error deleting course:", error);
      toast.error("Failed to delete course");
    }
  };

  const toggleCoursePublished = async (courseId: string) => {
    try {
      // Mock toggle - replace with actual API call using apiPost
      setCourses(
        courses.map((c) =>
          c.id === courseId ? { ...c, published: !c.published } : c
        )
      );
      toast.success("Course status updated");
    } catch (error) {
      console.error("Error updating course:", error);
      toast.error("Failed to update course");
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
              Admin Dashboard
            </h1>
            <p className="text-gray-600">Manage your LMS platform</p>
          </div>

          {/* Quick Actions */}
          <div className="mb-8">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Quick Actions
              </h2>
              <div className="flex flex-wrap gap-4">
                <Link
                  href="/admin/courses/create"
                  className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors flex items-center space-x-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>Create Course</span>
                </Link>
                <Link
                  href="/admin/courses"
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                >
                  <BookOpen className="h-4 w-4" />
                  <span>Manage Courses</span>
                </Link>
                <Link
                  href="/admin/teachers"
                  className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2"
                >
                  <Users className="h-4 w-4" />
                  <span>Manage Teachers</span>
                </Link>
                <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2">
                  <Users className="h-4 w-4" />
                  <span>View Users</span>
                </button>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="mb-8">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                {[
                  { id: "overview", label: "Overview" },
                  { id: "courses", label: "Courses" },
                  { id: "users", label: "Users" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? "border-primary-500 text-primary-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Overview Tab */}
          {activeTab === "overview" && stats && (
            <div className="space-y-8">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <div className="flex items-center">
                    <Users className="h-8 w-8 text-blue-500" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">
                        Total Users
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {stats.totalUsers}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <div className="flex items-center">
                    <BookOpen className="h-8 w-8 text-green-500" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">
                        Total Courses
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {stats.totalCourses}
                      </p>
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
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <div className="flex items-center">
                    <TrendingUp className="h-8 w-8 text-purple-500" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">
                        Total Enrollments
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {stats.totalEnrollments}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-white rounded-lg shadow-sm">
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">
                    Recent Activity
                  </h3>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    {users.length > 0 ? (
                      users.slice(0, 3).map((user, index) => (
                        <div key={user.id} className="flex items-center space-x-3">
                          <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                            <Users className="h-4 w-4 text-green-600" />
                          </div>
                          <div>
                            <p className="text-sm text-gray-900">
                              New user: {user.email}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(user.createdAt).toLocaleDateString("id-ID")}
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500">No recent activity</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Courses Tab */}
          {activeTab === "courses" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">
                  Course Management
                </h2>
                <Link
                  href="/admin/courses/new"
                  className="bg-primary-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-700 transition-colors flex items-center space-x-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Course</span>
                </Link>
              </div>

              <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Course
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Price
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Enrollments
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Revenue
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {courses.map((course) => (
                      <tr key={course.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {course.title}
                            </div>
                            <div className="text-sm text-gray-500">
                              {course.description}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          Rp {course.price.toLocaleString("id-ID")}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              course.published
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {course.published ? "Published" : "Draft"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {course.enrollments}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          Rp {course.revenue.toLocaleString("id-ID")}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                          <button
                            onClick={() => toggleCoursePublished(course.id)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <Link
                            href={`/admin/courses/${course.id}/edit`}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            <Edit className="h-4 w-4" />
                          </Link>
                          <button
                            onClick={() => deleteCourse(course.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Users Tab */}
          {activeTab === "users" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">
                  User Management
                </h2>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    placeholder="Search by name or email..."
                    value={userSearchInput}
                    onChange={(e) => setUserSearchInput(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && !usersLoading && handleUserSearch()}
                    disabled={usersLoading}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <button
                    onClick={handleUserSearch}
                    disabled={usersLoading}
                    className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {usersLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Searching...
                      </>
                    ) : (
                      "Search"
                    )}
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          User
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Email
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Phone
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Registered
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Payment Ref
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Joined
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Enrollments
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {usersLoading ? (
                        // Loading skeleton
                        Array.from({ length: 5 }).map((_, index) => (
                          <tr key={`skeleton-${index}`}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="h-4 bg-gray-200 rounded animate-pulse w-24"></div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="h-4 bg-gray-200 rounded animate-pulse w-40"></div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="h-4 bg-gray-200 rounded animate-pulse w-28"></div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="h-6 bg-gray-200 rounded-full animate-pulse w-16"></div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="h-4 bg-gray-200 rounded animate-pulse w-32"></div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="h-4 bg-gray-200 rounded animate-pulse w-24"></div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="h-4 bg-gray-200 rounded animate-pulse w-8"></div>
                            </td>
                          </tr>
                        ))
                      ) : users.length > 0 ? (
                        users.map((user) => (
                          <tr key={user.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">
                                {user.name || "-"}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {user.email}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {user.phone}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                  user.registered === "Yes"
                                    ? "bg-green-100 text-green-800"
                                    : "bg-red-100 text-red-800"
                                }`}
                              >
                                {user.registered}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">
                              {user.paymentReference !== "-" ? (
                                <span className="text-xs">{user.paymentReference}</span>
                              ) : (
                                "-"
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {new Date(user.createdAt).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {user.enrollments}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan={7}
                            className="px-6 py-4 text-center text-sm text-gray-500"
                          >
                            No users found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {userPagination.totalPages > 1 && (
                  <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                    <div className="flex-1 flex justify-between sm:hidden">
                      <button
                        onClick={() => handleUserPageChange(userPagination.currentPage - 1)}
                        disabled={userPagination.currentPage === 1 || usersLoading}
                        className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => handleUserPageChange(userPagination.currentPage + 1)}
                        disabled={userPagination.currentPage === userPagination.totalPages || usersLoading}
                        className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </div>
                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm text-gray-700">
                          Showing{" "}
                          <span className="font-medium">
                            {(userPagination.currentPage - 1) * userPagination.limit + 1}
                          </span>{" "}
                          to{" "}
                          <span className="font-medium">
                            {Math.min(
                              userPagination.currentPage * userPagination.limit,
                              userPagination.totalCount
                            )}
                          </span>{" "}
                          of{" "}
                          <span className="font-medium">{userPagination.totalCount}</span>{" "}
                          results
                        </p>
                      </div>
                      <div>
                        <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                          <button
                            onClick={() => handleUserPageChange(userPagination.currentPage - 1)}
                            disabled={userPagination.currentPage === 1 || usersLoading}
                            className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <span className="sr-only">Previous</span>
                            <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </button>
                          {Array.from({ length: userPagination.totalPages }, (_, i) => i + 1)
                            .filter((page) => {
                              return (
                                page === 1 ||
                                page === userPagination.totalPages ||
                                (page >= userPagination.currentPage - 1 &&
                                  page <= userPagination.currentPage + 1)
                              );
                            })
                            .map((page, index, array) => (
                              <div key={page}>
                                {index > 0 && array[index - 1] !== page - 1 && (
                                  <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                                    ...
                                  </span>
                                )}
                                <button
                                  onClick={() => handleUserPageChange(page)}
                                  disabled={usersLoading}
                                  className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed ${
                                    page === userPagination.currentPage
                                      ? "z-10 bg-primary-50 border-primary-500 text-primary-600"
                                      : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                                  }`}
                                >
                                  {page}
                                </button>
                              </div>
                            ))}
                          <button
                            onClick={() => handleUserPageChange(userPagination.currentPage + 1)}
                            disabled={userPagination.currentPage === userPagination.totalPages || usersLoading}
                            className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <span className="sr-only">Next</span>
                            <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </nav>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </AuthGuard>
  );
}
