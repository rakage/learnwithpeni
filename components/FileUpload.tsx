import { useState, useRef } from "react";
import { Upload, X, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import {
  validateFile,
  formatFileSize,
  MAX_VIDEO_SIZE,
  MAX_FILE_SIZE,
  ALLOWED_VIDEO_TYPES,
  ALLOWED_FILE_TYPES,
} from "@/lib/upload-config";

interface FileUploadProps {
  moduleType: "VIDEO" | "TEXT" | "FILE";
  onUploadComplete: (url: string, fileName: string) => void;
  onUploadError: (error: string) => void;
  existingUrl?: string;
  courseId?: string; // Optional course ID for organized file paths
}

export default function FileUpload({
  moduleType,
  onUploadComplete,
  onUploadError,
  existingUrl,
  courseId,
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isVideo = moduleType === "VIDEO";
  const maxSize = isVideo ? MAX_VIDEO_SIZE : MAX_FILE_SIZE;
  const allowedTypes = isVideo ? ALLOWED_VIDEO_TYPES : ALLOWED_FILE_TYPES;

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file
    const validation = validateFile(file, isVideo);
    if (!validation.valid) {
      onUploadError(validation.error!);
      return;
    }

    setSelectedFile(file);
    handleUpload(file);
  };

  const handleUpload = async (file: File) => {
    try {
      setUploading(true);
      setUploadProgress(0);

      // Get authentication token
      const token = localStorage.getItem("supabase_access_token");
      if (!token) {
        throw new Error(
          "You need to log in first. Please go to the login page and sign in with your account."
        );
      }

      // Step 1: Request a presigned POST from our API
      setUploadProgress(10);
      const presignedPostResponse = await fetch("/api/upload/s3", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          courseId: courseId,
        }),
      });

      if (!presignedPostResponse.ok) {
        const errorData = await presignedPostResponse.json();
        throw new Error(errorData.error || "Failed to get upload credentials");
      }

      const presignedData = await presignedPostResponse.json();
      
      if (!presignedData.success || !presignedData.presignedPost) {
        throw new Error(presignedData.error || "Failed to get upload credentials");
      }

      // Step 2: Upload the file directly to S3 using the presigned POST
      setUploadProgress(20);
      
      // Create a FormData object and append all the required fields
      const formData = new FormData();
      
      // Add all the fields from the presigned post
      Object.entries(presignedData.presignedPost.fields).forEach(([key, value]) => {
        formData.append(key, value as string);
      });
      
      // Append the actual file as the last field
      formData.append('file', file);
      
      // Set up progress monitoring
      const xhr = new XMLHttpRequest();
      
      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
          // Calculate progress percentage (20-90% range)
          const percentComplete = 20 + Math.round((event.loaded / event.total) * 70);
          setUploadProgress(percentComplete);
        }
      });

      // Create a promise to handle the XHR request
      const uploadPromise = new Promise((resolve, reject) => {
        xhr.open("POST", presignedData.presignedPost.url);
        
        xhr.onload = () => {
          // S3 returns 204 No Content on successful upload with POST
          if (xhr.status === 204 || xhr.status === 200) {
            resolve(xhr.response);
          } else {
            reject(new Error(`Upload failed with status: ${xhr.status}`));
          }
        };
        
        xhr.onerror = () => {
          reject(new Error("Network error during upload"));
        };
        
        xhr.send(formData);
      });
      
      // Wait for the upload to complete
      await uploadPromise;
      
      // Step 3: Confirm the upload with our API
      setUploadProgress(95);
      const confirmResponse = await fetch("/api/upload/s3", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          key: presignedData.key,
          fileName: file.name,
          size: file.size,
        }),
      });
      
      if (!confirmResponse.ok) {
        const errorData = await confirmResponse.json();
        throw new Error(errorData.error || "Failed to confirm upload");
      }
      
      const result = await confirmResponse.json();
      
      if (!result.success) {
        throw new Error(result.error || "Upload confirmation failed");
      }

      setUploadProgress(100);
      onUploadComplete(result.url || presignedData.publicUrl, result.fileName);
    } catch (error) {
      console.error("Upload error:", error);
      onUploadError(
        error instanceof Error ? error.message : "Failed to upload file"
      );
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    setSelectedFile(null);
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-4">
      {/* File Upload Info */}
      <div className="bg-blue-50 p-4 rounded-lg text-sm">
        <h4 className="font-medium text-blue-900 mb-2">Upload Requirements:</h4>
        <ul className="text-blue-800 space-y-1">
          <li>• Maximum size: {formatFileSize(maxSize)}</li>
          <li>
            • Allowed types:{" "}
            {isVideo
              ? "MP4, WebM, OGG"
              : "PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT, ZIP, RAR, 7Z"}
          </li>
          <li>• Files are stored securely on AWS S3</li>
        </ul>
      </div>

      {/* Upload Button */}
      <div className="flex items-center justify-center w-full">
        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            {uploading ? (
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary-600 mx-auto mb-2" />
                <p className="text-sm text-gray-600">
                  Uploading to AWS S3... {uploadProgress}%
                </p>
              </div>
            ) : selectedFile ? (
              <div className="text-center">
                <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <p className="text-sm text-gray-600">{selectedFile.name}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {formatFileSize(selectedFile.size)}
                </p>
                <button
                  onClick={handleRemove}
                  className="text-red-600 hover:text-red-700 text-sm mt-2 flex items-center mx-auto"
                >
                  <X className="h-4 w-4 mr-1" />
                  Remove
                </button>
              </div>
            ) : (
              <>
                <Upload className="w-8 h-8 mb-2 text-gray-500" />
                <p className="mb-2 text-sm text-gray-500">
                  <span className="font-semibold">Click to upload</span> or drag
                  and drop
                </p>
                <p className="text-xs text-gray-500">
                  {isVideo
                    ? "MP4, WebM, or OGG"
                    : "PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT, ZIP, RAR, 7Z"}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Stored securely on AWS S3
                </p>
              </>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept={allowedTypes.join(",")}
            onChange={handleFileSelect}
            disabled={uploading}
          />
        </label>
      </div>

      {/* Existing File Preview */}
      {existingUrl && !selectedFile && (
        <div className="mt-2 p-3 bg-gray-50 rounded-lg flex items-center justify-between">
          <div className="flex items-center">
            <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
            <span className="text-sm text-gray-600">
              Current file: {existingUrl.split("/").pop()}
            </span>
          </div>
          <a
            href={existingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary-600 hover:text-primary-700 text-sm"
          >
            View
          </a>
        </div>
      )}

      {/* Upload Progress Bar */}
      {uploading && (
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div
            className="bg-primary-600 h-2.5 rounded-full transition-all duration-300"
            style={{ width: `${uploadProgress}%` }}
          ></div>
        </div>
      )}
    </div>
  );
}
