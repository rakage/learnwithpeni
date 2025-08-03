"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { apiGet, apiPost } from "@/lib/auth-client";
import ProtectedVideoPlayer from "@/components/ProtectedVideoPlayer";
import Link from "next/link";
import toast from "react-hot-toast";
import {
  BookOpen,
  Play,
  FileText,
  Download,
  CheckCircle,
  Lock,
  ArrowLeft,
  ArrowRight,
  Menu,
  X,
  Shield,
  CreditCard,
} from "lucide-react";
import { calculateProgress } from "@/lib/utils";

// Video protection styles
const videoProtectionStyles = `
  .video-container video {
    -webkit-user-select: none !important;
    -moz-user-select: none !important;
    -ms-user-select: none !important;
    user-select: none !important;
    -webkit-touch-callout: none !important;
    -webkit-tap-highlight-color: transparent !important;
  }
  
  .video-container video::-webkit-media-controls-download-button {
    display: none !important;
  }
  
  .video-container video::-webkit-media-controls-fullscreen-button {
    display: none !important;
  }
  
  .protected-content {
    -webkit-user-select: none !important;
    -moz-user-select: none !important;
    -ms-user-select: none !important;
    user-select: none !important;
    -webkit-touch-callout: none !important;
    pointer-events: none;
  }
  
  .protected-content * {
    -webkit-user-select: none !important;
    -moz-user-select: none !important;
    -ms-user-select: none !important;
    user-select: none !important;
  }
  
  /* Disable print screen and screenshots */
  @media print {
    .video-container {
      display: none !important;
    }
  }
  
  /* Hide dev tools hints */
  .video-container {
    -webkit-transform: translate3d(0, 0, 0);
    transform: translate3d(0, 0, 0);
  }
`;

interface Module {
  id: string;
  title: string;
  description: string;
  content?: string;
  videoUrl?: string;
  fileUrl?: string;
  type: "VIDEO" | "TEXT" | "FILE";
  order: number;
  duration?: number;
  completed: boolean;
}

interface Course {
  id: string;
  title: string;
  description: string;
  price: number;
  image?: string;
  published: boolean;
  modules: Module[];
  progress: number;
  isEnrolled: boolean;
  hasAccess: boolean;
}

interface User {
  id: string;
  email: string;
  role: "USER" | "ADMIN";
}

export default function CoursePage() {
  const params = useParams();
  const router = useRouter();
  const [course, setCourse] = useState<Course | null>(null);
  const [currentModule, setCurrentModule] = useState<Module | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [accessDenied, setAccessDenied] = useState(false);

  // Inject video protection styles
  useEffect(() => {
    const styleElement = document.createElement("style");
    styleElement.innerHTML = videoProtectionStyles;
    document.head.appendChild(styleElement);

    // Anti-debugging measures
    const protectContent = () => {
      // Disable common shortcuts
      const preventShortcuts = (e: KeyboardEvent) => {
        // Disable F12, Ctrl+Shift+I, Ctrl+U, Ctrl+S, Print Screen
        if (
          e.key === "F12" ||
          (e.ctrlKey && e.shiftKey && e.key === "I") ||
          (e.ctrlKey && e.key === "u") ||
          (e.ctrlKey && e.key === "s") ||
          e.key === "PrintScreen"
        ) {
          e.preventDefault();
          toast.error("Content is protected from downloading");
          return false;
        }
      };

      document.addEventListener("keydown", preventShortcuts);

      // Console warning for content protection
      console.warn("🔒 Content protection active - Downloading is prohibited");

      return () => {
        document.removeEventListener("keydown", preventShortcuts);
        document.head.removeChild(styleElement);
      };
    };

    const cleanup = protectContent();

    return cleanup;
  }, []);

  useEffect(() => {
    const initializeCourse = async () => {
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
        setUser(userData.user);

        // Fetch course data with access control
        await fetchCourse(params.id as string, userData.user);
      } catch (error) {
        console.error("Error initializing course:", error);
        toast.error("Failed to load course");
        router.push("/dashboard");
      } finally {
        setLoading(false);
      }
    };

    initializeCourse();
  }, [params.id, router]);

  const fetchCourse = async (courseId: string, user: User) => {
    try {
      console.log("📚 Fetching course:", courseId, "for user:", user.email);

      // Fetch course data with enrollment/access info
      const response = await apiGet(`/api/courses/${courseId}`);

      if (!response.ok) {
        if (response.status === 404) {
          toast.error("Course not found");
          router.push("/dashboard");
          return;
        } else if (response.status === 403) {
          setAccessDenied(true);
          return;
        }
        throw new Error("Failed to fetch course");
      }

      const data = await response.json();
      console.log("✅ Course data received:", data);

      // Check access permissions
      const isAdmin = user.role === "ADMIN";
      const isEnrolled = data.enrollment !== null;
      const hasAccess = isAdmin || isEnrolled;

      if (!hasAccess) {
        setAccessDenied(true);
        return;
      }

      // Process modules with completion status
      const modulesWithCompletion = data.course.modules.map((module: any) => ({
        ...module,
        completed:
          data.progress?.find((p: any) => p.moduleId === module.id)
            ?.completed || false,
      }));

      // Calculate progress
      const completedModules = modulesWithCompletion.filter(
        (m: Module) => m.completed
      ).length;
      const progressPercentage = calculateProgress(
        completedModules,
        modulesWithCompletion.length
      );

      const courseData: Course = {
        id: data.course.id,
        title: data.course.title,
        description: data.course.description,
        price: data.course.price,
        image: data.course.image,
        published: data.course.published,
        modules: modulesWithCompletion,
        progress: progressPercentage,
        isEnrolled,
        hasAccess,
      };

      setCourse(courseData);

      // Set first module as current if none selected
      if (modulesWithCompletion.length > 0) {
        setCurrentModule(modulesWithCompletion[0]);
      }
    } catch (error) {
      console.error("Error fetching course:", error);
      toast.error("Failed to load course data");
      throw error;
    }
  };

  const markModuleComplete = async (moduleId: string) => {
    if (!course || !user) return;

    try {
      console.log("✅ Marking module complete:", moduleId);

      const response = await apiPost("/api/progress/complete", {
        courseId: course.id,
        moduleId: moduleId,
      });

      if (!response.ok) {
        throw new Error("Failed to update progress");
      }

      // Update local state
      const updatedModules = course.modules.map((module) =>
        module.id === moduleId ? { ...module, completed: true } : module
      );

      const completedCount = updatedModules.filter((m) => m.completed).length;
      const newProgress = calculateProgress(
        completedCount,
        updatedModules.length
      );

      setCourse({
        ...course,
        modules: updatedModules,
        progress: newProgress,
      });

      // Update current module if it's the one being completed
      if (currentModule?.id === moduleId) {
        setCurrentModule({ ...currentModule, completed: true });
      }

      toast.success("Module marked as complete!");

      // Auto-advance to next incomplete module
      const currentIndex = updatedModules.findIndex((m) => m.id === moduleId);
      const nextModule = updatedModules.find(
        (module, index) => index > currentIndex && !module.completed
      );

      if (nextModule) {
        setTimeout(() => {
          setCurrentModule(nextModule);
        }, 1000);
      }
    } catch (error) {
      console.error("Error marking module complete:", error);
      toast.error("Failed to update progress");
    }
  };

  const goToNextModule = () => {
    if (!course || !currentModule) return;

    const currentIndex = course.modules.findIndex(
      (m) => m.id === currentModule.id
    );
    if (currentIndex < course.modules.length - 1) {
      setCurrentModule(course.modules[currentIndex + 1]);
    }
  };

  const goToPreviousModule = () => {
    if (!course || !currentModule) return;

    const currentIndex = course.modules.findIndex(
      (m) => m.id === currentModule.id
    );
    if (currentIndex > 0) {
      setCurrentModule(course.modules[currentIndex - 1]);
    }
  };

  const handleEnrollNow = () => {
    if (!course) return;
    router.push(`/payment?course=${course.id}`);
  };

  const getModuleIcon = (type: string) => {
    switch (type) {
      case "VIDEO":
        return <Play className="h-4 w-4" />;
      case "TEXT":
        return <FileText className="h-4 w-4" />;
      case "FILE":
        return <Download className="h-4 w-4" />;
      default:
        return <BookOpen className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading course...</p>
        </div>
      </div>
    );
  }

  // Access denied state
  if (accessDenied || !course) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center p-8">
          <div className="mb-6">
            {course ? (
              <CreditCard className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            ) : (
              <Lock className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            )}
          </div>

          {course ? (
            <>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Enrollment Required
              </h2>
              <p className="text-gray-600 mb-6">
                You need to purchase this course to access the content.
              </p>
              <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {course.title}
                </h3>
                <p className="text-gray-600 mb-4">{course.description}</p>
                <div className="text-2xl font-bold text-primary-600 mb-4">
                  ${course.price}
                </div>
                <button
                  onClick={handleEnrollNow}
                  className="w-full bg-primary-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-primary-700 transition-colors"
                >
                  Enroll Now
                </button>
              </div>
            </>
          ) : (
            <>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Course Not Found
              </h2>
              <p className="text-gray-600 mb-6">
                The course you're looking for doesn't exist or has been removed.
              </p>
            </>
          )}

          <Link
            href="/dashboard"
            className="text-primary-600 hover:text-primary-700 font-medium"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 lg:static absolute inset-y-0 left-0 z-40 w-80 bg-white shadow-lg transform transition-transform duration-300 ease-in-out`}
      >
        <div className="flex items-center justify-between p-4 border-b">
          <Link href="/dashboard" className="flex items-center space-x-2">
            <BookOpen className="h-6 w-6 text-primary-600" />
            <span className="font-semibold text-gray-900">
              Back to Dashboard
            </span>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1"
          >
            <X className="h-6 w-6 text-gray-400" />
          </button>
        </div>

        <div className="p-4">
          <div className="flex items-center space-x-2 mb-2">
            <h2 className="text-lg font-bold text-gray-900">{course.title}</h2>
            {user?.role === "ADMIN" && (
              <div className="relative group">
                <Shield className="h-5 w-5 text-blue-600" />
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  Admin Access
                </div>
              </div>
            )}
          </div>

          <div className="mb-4">
            <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
              <span>Progress</span>
              <span>{course.progress}%</span>
            </div>
            <div className="bg-gray-200 rounded-full h-2">
              <div
                className="bg-primary-600 h-2 rounded-full transition-all"
                style={{ width: `${course.progress}%` }}
              ></div>
            </div>
          </div>

          {course.isEnrolled && (
            <div className="mb-4 p-3 bg-green-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium text-green-800">
                  Enrolled Student
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="px-4 pb-4">
          <h3 className="text-sm font-medium text-gray-900 mb-3">
            Course Modules
          </h3>
          <div className="space-y-2">
            {course.modules.map((module, index) => (
              <button
                key={module.id}
                onClick={() => setCurrentModule(module)}
                className={`w-full text-left p-3 rounded-lg transition-colors ${
                  currentModule?.id === module.id
                    ? "bg-primary-50 border border-primary-200"
                    : "bg-gray-50 hover:bg-gray-100"
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div
                    className={`p-1 rounded ${
                      module.completed
                        ? "bg-green-100 text-green-600"
                        : currentModule?.id === module.id
                        ? "bg-primary-100 text-primary-600"
                        : "bg-gray-100 text-gray-400"
                    }`}
                  >
                    {module.completed ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      getModuleIcon(module.type)
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {index + 1}. {module.title}
                    </div>
                    <div className="text-xs text-gray-500">
                      {module.duration && `${module.duration} min • `}
                      {module.type}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white shadow-sm border-b px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 -ml-2"
            >
              <Menu className="h-6 w-6 text-gray-600" />
            </button>
            <h1 className="text-xl font-semibold text-gray-900">
              {currentModule?.title}
            </h1>
            <div className="flex items-center space-x-4">
              {user?.role === "ADMIN" && (
                <Link
                  href={`/admin/courses/${course.id}/edit`}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center space-x-2"
                >
                  <Shield className="h-4 w-4" />
                  <span>Edit Course</span>
                </Link>
              )}
              {currentModule && !currentModule.completed && (
                <button
                  onClick={() => markModuleComplete(currentModule.id)}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                >
                  Mark Complete
                </button>
              )}
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 p-6">
          <div className="max-w-4xl mx-auto">
            {currentModule && (
              <>
                {/* Module Content */}
                {currentModule.type === "VIDEO" && currentModule.videoUrl && (
                  <div className="mb-6">
                    <ProtectedVideoPlayer
                      videoUrl={currentModule.videoUrl}
                      courseTitle={course.title}
                    />
                  </div>
                )}

                {currentModule.type === "TEXT" && currentModule.content && (
                  <div className="bg-white rounded-lg shadow-sm p-8 mb-6">
                    <div
                      className="prose prose-lg max-w-none"
                      dangerouslySetInnerHTML={{
                        __html: currentModule.content,
                      }}
                    />
                  </div>
                )}

                {currentModule.type === "FILE" && currentModule.fileUrl && (
                  <div className="bg-white rounded-lg shadow-sm p-8 mb-6 text-center">
                    <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      {currentModule.title}
                    </h3>
                    <p className="text-gray-600 mb-6">
                      {currentModule.description}
                    </p>
                    <a
                      href={currentModule.fileUrl}
                      download
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center bg-primary-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-700 transition-colors"
                    >
                      <Download className="h-5 w-5 mr-2" />
                      Download File
                    </a>
                  </div>
                )}

                {/* Module Description */}
                {currentModule.description && (
                  <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      About this module
                    </h3>
                    <p className="text-gray-600">{currentModule.description}</p>
                  </div>
                )}

                {/* Navigation */}
                <div className="flex items-center justify-between">
                  <button
                    onClick={goToPreviousModule}
                    disabled={
                      course.modules.findIndex(
                        (m) => m.id === currentModule.id
                      ) === 0
                    }
                    className="flex items-center space-x-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    <span>Previous</span>
                  </button>

                  <span className="text-sm text-gray-500">
                    Module{" "}
                    {course.modules.findIndex(
                      (m) => m.id === currentModule.id
                    ) + 1}{" "}
                    of {course.modules.length}
                  </span>

                  <button
                    onClick={goToNextModule}
                    disabled={
                      course.modules.findIndex(
                        (m) => m.id === currentModule.id
                      ) ===
                      course.modules.length - 1
                    }
                    className="flex items-center space-x-2 bg-primary-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span>Next</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </>
            )}
          </div>
        </main>
      </div>

      {/* Overlay for mobile sidebar */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
