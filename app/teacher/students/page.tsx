"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { apiGet } from "@/lib/auth-client";
import toast from "react-hot-toast";
import {
  Users,
  BookOpen,
  DollarSign,
  CheckCircle,
  Clock,
  TrendingUp,
  Search,
  Filter,
} from "lucide-react";
import AuthGuard from "@/components/AuthGuard";
import Navigation from "@/components/Navigation";

interface Student {
  id: string;
  email: string;
  name: string;
  image: string | null;
  created_at: string;
  courses: {
    enrollmentId: string;
    enrolledAt: string;
    course: {
      id: string;
      title: string;
    };
    payment: {
      id: string;
      amount: number;
      status: string;
      createdAt: string;
    } | null;
    progress: {
      completed: number;
      total: number;
      percentage: number;
    };
  }[];
}

export default function TeacherStudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "paid" | "unpaid">(
    "all"
  );
  const router = useRouter();

  useEffect(() => {
    const initializePage = async () => {
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

        await loadStudents();
      } catch (error) {
        console.error("Error initializing page:", error);
        toast.error("Failed to load page");
        router.push("/dashboard");
      } finally {
        setLoading(false);
      }
    };

    initializePage();
  }, [router]);

  const loadStudents = async () => {
    try {
      const response = await apiGet("/api/teacher/students");

      if (!response.ok) {
        throw new Error("Failed to load students");
      }

      const data = await response.json();
      setStudents(data.students);
    } catch (error) {
      console.error("Error loading students:", error);
      toast.error("Failed to load students");
    }
  };

  // Filter students
  const filteredStudents = students.filter((student) => {
    const matchesSearch =
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.email.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (filterStatus === "all") return true;

    const hasPaidCourse = student.courses.some(
      (c) => c.payment?.status === "COMPLETED"
    );
    const hasUnpaidCourse = student.courses.some(
      (c) => !c.payment || c.payment.status !== "COMPLETED"
    );

    if (filterStatus === "paid") return hasPaidCourse;
    if (filterStatus === "unpaid") return hasUnpaidCourse;

    return true;
  });

  // Calculate stats
  const stats = {
    totalStudents: students.length,
    totalEnrollments: students.reduce((sum, s) => sum + s.courses.length, 0),
    paidStudents: students.filter((s) =>
      s.courses.some((c) => c.payment?.status === "COMPLETED")
    ).length,
    unpaidStudents: students.filter((s) =>
      s.courses.some((c) => !c.payment || c.payment.status !== "COMPLETED")
    ).length,
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
            <h1 className="text-3xl font-bold text-gray-900">My Students</h1>
            <p className="text-gray-600">
              View and manage students enrolled in your courses
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-blue-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    Total Students
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.totalStudents}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-center">
                <BookOpen className="h-8 w-8 text-purple-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    Enrollments
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.totalEnrollments}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-green-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    Paid Students
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.paidStudents}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-yellow-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    Unpaid Students
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.unpaidStudents}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search students by name or email..."
                  className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              {/* Filter */}
              <div className="flex items-center space-x-2">
                <Filter className="h-5 w-5 text-gray-400" />
                <select
                  value={filterStatus}
                  onChange={(e) =>
                    setFilterStatus(e.target.value as "all" | "paid" | "unpaid")
                  }
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="all">All Students</option>
                  <option value="paid">Paid</option>
                  <option value="unpaid">Unpaid</option>
                </select>
              </div>
            </div>
          </div>

          {/* Students List */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                Students ({filteredStudents.length})
              </h2>
            </div>

            {filteredStudents.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">
                  {searchQuery || filterStatus !== "all"
                    ? "No students match your filters"
                    : "No students enrolled yet"}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {filteredStudents.map((student) => (
                  <div key={student.id} className="p-6 hover:bg-gray-50">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          <div className="h-12 w-12 rounded-full bg-primary-100 flex items-center justify-center">
                            <span className="text-primary-600 font-medium text-lg">
                              {student.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div>
                          <h3 className="text-lg font-medium text-gray-900">
                            {student.name}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {student.email}
                          </p>
                          <p className="text-xs text-gray-400">
                            Joined{" "}
                            {new Date(student.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Enrolled Courses */}
                    <div className="ml-16 space-y-3">
                      {student.courses.map((courseEnrollment) => (
                        <div
                          key={courseEnrollment.enrollmentId}
                          className="bg-gray-50 rounded-lg p-4"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900">
                                {courseEnrollment.course.title}
                              </h4>
                              <p className="text-xs text-gray-500">
                                Enrolled{" "}
                                {new Date(
                                  courseEnrollment.enrolledAt
                                ).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="text-right">
                              {courseEnrollment.payment ? (
                                <div>
                                  <span
                                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                      courseEnrollment.payment.status ===
                                      "COMPLETED"
                                        ? "bg-green-100 text-green-800"
                                        : courseEnrollment.payment.status ===
                                          "PENDING"
                                        ? "bg-yellow-100 text-yellow-800"
                                        : "bg-red-100 text-red-800"
                                    }`}
                                  >
                                    {courseEnrollment.payment.status}
                                  </span>
                                  <p className="text-sm font-medium text-gray-900 mt-1">
                                    Rp {courseEnrollment.payment.amount.toLocaleString("id-ID")}
                                  </p>
                                </div>
                              ) : (
                                <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                                  NO PAYMENT
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Progress Bar */}
                          <div className="mt-3">
                            <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                              <span>Progress</span>
                              <span>
                                {courseEnrollment.progress.completed} /{" "}
                                {courseEnrollment.progress.total} modules
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-primary-600 h-2 rounded-full transition-all"
                                style={{
                                  width: `${courseEnrollment.progress.percentage}%`,
                                }}
                              />
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              {courseEnrollment.progress.percentage.toFixed(1)}%
                              complete
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
