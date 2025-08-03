"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import toast from "react-hot-toast";
import {
  BookOpen,
  Upload,
  FileText,
  Video,
  Image as ImageIcon,
  X,
  Plus,
  Save,
  ArrowLeft,
} from "lucide-react";
import AuthGuard from "@/components/AuthGuard";
import Navigation from "@/components/Navigation";
import { apiPost } from "@/lib/auth-client";

interface Module {
  id: string;
  title: string;
  type: "VIDEO" | "TEXT" | "FILE";
  content?: string; // For text content
  videoUrl?: string; // For video URL
  fileUrl?: string; // For document URL
  fileName?: string; // For display purposes
  description?: string;
  duration?: number; // in minutes
  order: number;
}

interface CourseData {
  title: string;
  description: string;
  price: number;
  image?: File;
  imageUrl?: string;
  modules: Module[];
}

export default function CreateCoursePage() {
  const [courseData, setCourseData] = useState<CourseData>({
    title: "",
    description: "",
    price: 0,
    modules: [],
  });
  const [loading, setLoading] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState<string | null>(null);
  const [uploadingFile, setUploadingFile] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Generate unique ID for modules
  const generateId = () =>
    Date.now().toString() + Math.random().toString(36).substr(2, 9);

  // Add new module
  const addModule = (type: "VIDEO" | "TEXT" | "FILE") => {
    const newModule: Module = {
      id: generateId(),
      title: "",
      type,
      description: "",
      order: courseData.modules.length + 1,
    };

    setCourseData((prev) => ({
      ...prev,
      modules: [...prev.modules, newModule],
    }));
  };

  // Update module
  const updateModule = (moduleId: string, updates: Partial<Module>) => {
    setCourseData((prev) => ({
      ...prev,
      modules: prev.modules.map((module) =>
        module.id === moduleId ? { ...module, ...updates } : module
      ),
    }));
  };

  // Remove module
  const removeModule = (moduleId: string) => {
    setCourseData((prev) => ({
      ...prev,
      modules: prev.modules
        .filter((module) => module.id !== moduleId)
        .map((module, index) => ({ ...module, order: index + 1 })),
    }));
  };

  // Move module up/down
  const moveModule = (moduleId: string, direction: "up" | "down") => {
    setCourseData((prev) => {
      const modules = [...prev.modules];
      const currentIndex = modules.findIndex((m) => m.id === moduleId);

      if (direction === "up" && currentIndex > 0) {
        [modules[currentIndex], modules[currentIndex - 1]] = [
          modules[currentIndex - 1],
          modules[currentIndex],
        ];
      } else if (direction === "down" && currentIndex < modules.length - 1) {
        [modules[currentIndex], modules[currentIndex + 1]] = [
          modules[currentIndex + 1],
          modules[currentIndex],
        ];
      }

      // Update order numbers
      return {
        ...prev,
        modules: modules.map((module, index) => ({
          ...module,
          order: index + 1,
        })),
      };
    });
  };

  // Upload course image
  const uploadCourseImage = async (file: File) => {
    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const token = localStorage.getItem("supabase_access_token");
      if (!token) {
        throw new Error("Authentication required. Please log in again.");
      }

      const response = await fetch("/api/upload/s3", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Upload failed");
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to upload image");
      }

      setCourseData((prev) => ({ ...prev, imageUrl: result.url }));
      toast.success("Course image uploaded successfully!");
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error("Failed to upload course image");
    } finally {
      setUploadingImage(false);
    }
  };

  // Upload video
  const uploadVideo = async (file: File, moduleId: string) => {
    setUploadingVideo(moduleId);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const token = localStorage.getItem("supabase_access_token");
      if (!token) {
        throw new Error("Authentication required. Please log in again.");
      }

      const response = await fetch("/api/upload/s3", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Upload failed");
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to upload video");
      }

      updateModule(moduleId, { videoUrl: result.url });
      toast.success("Video uploaded successfully!");
    } catch (error) {
      console.error("Error uploading video:", error);
      toast.error("Failed to upload video");
    } finally {
      setUploadingVideo(null);
    }
  };

  // Upload file/document
  const uploadFile = async (file: File, moduleId: string) => {
    setUploadingFile(moduleId);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const token = localStorage.getItem("supabase_access_token");
      if (!token) {
        throw new Error("Authentication required. Please log in again.");
      }

      const response = await fetch("/api/upload/s3", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Upload failed");
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to upload document");
      }

      updateModule(moduleId, {
        fileUrl: result.url,
        fileName: result.fileName,
      });
      toast.success("Document uploaded successfully!");
    } catch (error) {
      console.error("Error uploading file:", error);
      toast.error("Failed to upload document");
    } finally {
      setUploadingFile(null);
    }
  };

  // Save course
  const saveCourse = async () => {
    if (
      !courseData.title ||
      !courseData.description ||
      courseData.modules.length === 0
    ) {
      toast.error(
        "Please fill in all required fields and add at least one module"
      );
      return;
    }

    // Validate modules have required content
    for (const module of courseData.modules) {
      if (!module.title) {
        toast.error("All modules must have a title");
        return;
      }
      if (module.type === "TEXT" && !module.content) {
        toast.error("Text modules must have content");
        return;
      }
      if (module.type === "VIDEO" && !module.videoUrl) {
        toast.error("Video modules must have a video uploaded");
        return;
      }
      if (module.type === "FILE" && !module.fileUrl) {
        toast.error("File modules must have a document uploaded");
        return;
      }
    }

    setLoading(true);
    try {
      // Use authenticated API call with Bearer token
      const response = await apiPost("/api/admin/courses", {
        title: courseData.title,
        description: courseData.description,
        price: courseData.price,
        imageUrl: courseData.imageUrl,
        modules: courseData.modules,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create course");
      }

      const result = await response.json();

      toast.success("Course created successfully!");
      router.push("/admin/courses");
    } catch (error) {
      console.error("❌ Error saving course:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to create course"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthGuard requireAuth={true}>
      <div className="min-h-screen bg-gray-50">
        <Navigation />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center mb-4">
              <button
                onClick={() => router.back()}
                className="mr-4 p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <BookOpen className="h-8 w-8 text-primary-600 mr-3" />
              <h1 className="text-3xl font-bold text-gray-900">
                Create New Course
              </h1>
            </div>
            <p className="text-gray-600">
              Create a comprehensive course with videos, documents, and text
              content.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Course Information */}
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Information */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Course Information
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Course Title *
                    </label>
                    <input
                      type="text"
                      value={courseData.title}
                      onChange={(e) =>
                        setCourseData((prev) => ({
                          ...prev,
                          title: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="Enter course title..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Course Description *
                    </label>
                    <textarea
                      value={courseData.description}
                      onChange={(e) =>
                        setCourseData((prev) => ({
                          ...prev,
                          description: e.target.value,
                        }))
                      }
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="Describe what students will learn..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Price ($)
                    </label>
                    <input
                      type="number"
                      value={courseData.price}
                      onChange={(e) =>
                        setCourseData((prev) => ({
                          ...prev,
                          price: Number(e.target.value),
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="0"
                      min="0"
                      step="0.01"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Course Image
                    </label>
                    <div className="flex items-center space-x-4">
                      {courseData.imageUrl ? (
                        <div className="relative">
                          <img
                            src={courseData.imageUrl}
                            alt="Course preview"
                            className="w-32 h-20 object-cover rounded-lg"
                          />
                          <button
                            onClick={() =>
                              setCourseData((prev) => ({
                                ...prev,
                                imageUrl: undefined,
                              }))
                            }
                            className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ) : (
                        <div className="w-32 h-20 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                          <ImageIcon className="h-8 w-8 text-gray-400" />
                        </div>
                      )}
                      <button
                        onClick={() => imageInputRef.current?.click()}
                        disabled={uploadingImage}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50"
                      >
                        {uploadingImage ? "Uploading..." : "Upload Image"}
                      </button>
                      <input
                        ref={imageInputRef}
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) uploadCourseImage(file);
                        }}
                        className="hidden"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Modules Section */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Course Modules
                  </h2>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => addModule("VIDEO")}
                      className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 flex items-center space-x-2"
                    >
                      <Video className="h-4 w-4" />
                      <span>Add Video</span>
                    </button>
                    <button
                      onClick={() => addModule("TEXT")}
                      className="px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 flex items-center space-x-2"
                    >
                      <FileText className="h-4 w-4" />
                      <span>Add Text</span>
                    </button>
                    <button
                      onClick={() => addModule("FILE")}
                      className="px-3 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 flex items-center space-x-2"
                    >
                      <Upload className="h-4 w-4" />
                      <span>Add File</span>
                    </button>
                  </div>
                </div>

                {courseData.modules.length === 0 ? (
                  <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
                    <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 mb-4">No modules added yet</p>
                    <p className="text-sm text-gray-400">
                      Add videos, text content, or documents to get started
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {courseData.modules.map((module, index) => (
                      <ModuleEditor
                        key={module.id}
                        module={module}
                        index={index}
                        totalModules={courseData.modules.length}
                        onUpdate={(updates) => updateModule(module.id, updates)}
                        onRemove={() => removeModule(module.id)}
                        onMove={(direction) => moveModule(module.id, direction)}
                        onUploadVideo={(file) => uploadVideo(file, module.id)}
                        onUploadFile={(file) => uploadFile(file, module.id)}
                        uploadingVideo={uploadingVideo === module.id}
                        uploadingFile={uploadingFile === module.id}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Actions */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Actions
                </h3>
                <div className="space-y-3">
                  <button
                    onClick={saveCourse}
                    disabled={loading}
                    className="w-full bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {loading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    {loading ? "Creating..." : "Create Course"}
                  </button>
                  <button
                    onClick={() => router.back()}
                    className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                </div>
              </div>

              {/* Course Summary */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Course Summary
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Modules:</span>
                    <span className="font-medium">
                      {courseData.modules.length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Video Modules:</span>
                    <span className="font-medium">
                      {
                        courseData.modules.filter((m) => m.type === "VIDEO")
                          .length
                      }
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Text Modules:</span>
                    <span className="font-medium">
                      {
                        courseData.modules.filter((m) => m.type === "TEXT")
                          .length
                      }
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">File Modules:</span>
                    <span className="font-medium">
                      {
                        courseData.modules.filter((m) => m.type === "FILE")
                          .length
                      }
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 border-t">
                    <span className="text-gray-600">Price:</span>
                    <span className="font-medium">${courseData.price}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Hidden file inputs */}
        <input
          ref={videoInputRef}
          type="file"
          accept="video/*"
          className="hidden"
        />
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.doc,.docx,.txt,.zip"
          className="hidden"
        />
      </div>
    </AuthGuard>
  );
}

// Module Editor Component
interface ModuleEditorProps {
  module: Module;
  index: number;
  totalModules: number;
  onUpdate: (updates: Partial<Module>) => void;
  onRemove: () => void;
  onMove: (direction: "up" | "down") => void;
  onUploadVideo: (file: File) => void;
  onUploadFile: (file: File) => void;
  uploadingVideo: boolean;
  uploadingFile: boolean;
}

function ModuleEditor({
  module,
  index,
  totalModules,
  onUpdate,
  onRemove,
  onMove,
  onUploadVideo,
  onUploadFile,
  uploadingVideo,
  uploadingFile,
}: ModuleEditorProps) {
  const videoInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getModuleIcon = () => {
    switch (module.type) {
      case "VIDEO":
        return <Video className="h-5 w-5 text-blue-600" />;
      case "TEXT":
        return <FileText className="h-5 w-5 text-green-600" />;
      case "FILE":
        return <Upload className="h-5 w-5 text-purple-600" />;
    }
  };

  const getModuleColor = () => {
    switch (module.type) {
      case "VIDEO":
        return "border-blue-200 bg-blue-50";
      case "TEXT":
        return "border-green-200 bg-green-50";
      case "FILE":
        return "border-purple-200 bg-purple-50";
    }
  };

  return (
    <div className={`border-2 rounded-lg p-4 ${getModuleColor()}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          {getModuleIcon()}
          <span className="font-medium text-gray-900">
            Module {index + 1} - {module.type}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onMove("up")}
            disabled={index === 0}
            className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
          >
            ▲
          </button>
          <button
            onClick={() => onMove("down")}
            disabled={index === totalModules - 1}
            className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
          >
            ▼
          </button>
          <button
            onClick={onRemove}
            className="p-1 text-red-400 hover:text-red-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Module Title *
          </label>
          <input
            type="text"
            value={module.title}
            onChange={(e) => onUpdate({ title: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            placeholder="Enter module title..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            value={module.description || ""}
            onChange={(e) => onUpdate({ description: e.target.value })}
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            placeholder="Optional description..."
          />
        </div>

        {module.type === "VIDEO" && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Video File
            </label>
            {module.videoUrl ? (
              <div className="space-y-2">
                <video
                  src={module.videoUrl}
                  controls
                  className="w-full h-48 rounded-lg"
                />
                <button
                  onClick={() => onUpdate({ videoUrl: undefined })}
                  className="text-red-600 hover:text-red-800 text-sm"
                >
                  Remove Video
                </button>
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                <div className="text-center">
                  <Video className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <button
                    onClick={() => videoInputRef.current?.click()}
                    disabled={uploadingVideo}
                    className="text-primary-600 hover:text-primary-800"
                  >
                    {uploadingVideo ? "Uploading..." : "Click to upload video"}
                  </button>
                  <p className="text-xs text-gray-500 mt-1">
                    MP4, WebM, or OGV
                  </p>
                </div>
              </div>
            )}
            <input
              ref={videoInputRef}
              type="file"
              accept="video/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onUploadVideo(file);
              }}
              className="hidden"
            />
          </div>
        )}

        {module.type === "TEXT" && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Text Content *
            </label>
            <textarea
              value={module.content || ""}
              onChange={(e) => onUpdate({ content: e.target.value })}
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Enter your lesson content here..."
            />
          </div>
        )}

        {module.type === "FILE" && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Document File
            </label>
            {module.fileUrl ? (
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <FileText className="h-5 w-5 text-gray-500" />
                  <span className="text-sm text-gray-700">
                    {module.fileName}
                  </span>
                </div>
                <button
                  onClick={() =>
                    onUpdate({ fileUrl: undefined, fileName: undefined })
                  }
                  className="text-red-600 hover:text-red-800 text-sm"
                >
                  Remove
                </button>
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                <div className="text-center">
                  <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingFile}
                    className="text-primary-600 hover:text-primary-800"
                  >
                    {uploadingFile
                      ? "Uploading..."
                      : "Click to upload document"}
                  </button>
                  <p className="text-xs text-gray-500 mt-1">
                    PDF, DOC, DOCX, TXT, ZIP
                  </p>
                </div>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx,.txt,.zip"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onUploadFile(file);
              }}
              className="hidden"
            />
          </div>
        )}

        {module.type === "VIDEO" && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Duration (minutes)
            </label>
            <input
              type="number"
              value={module.duration || ""}
              onChange={(e) => onUpdate({ duration: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="e.g., 15"
              min="0"
            />
          </div>
        )}
      </div>
    </div>
  );
}
