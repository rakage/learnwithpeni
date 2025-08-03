// File size limits
export const MAX_VIDEO_SIZE = 1000 * 1024 * 1024; // 1000MB in bytes
export const MAX_FILE_SIZE = 1000 * 1024 * 1024; // 1000MB for other files

// Allowed file types
export const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/webm", "video/ogg"];
export const ALLOWED_FILE_TYPES = [
  // Documents
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation", // .pptx
  "text/plain",
  // Archives
  "application/zip",
  "application/x-rar-compressed",
  "application/x-7z-compressed",
];

// Helper function to format file size
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

// Validation function
export const validateFile = (
  file: File,
  isVideo: boolean = false
): { valid: boolean; error?: string } => {
  // Check file size
  const maxSize = isVideo ? MAX_VIDEO_SIZE : MAX_FILE_SIZE;
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File size (${formatFileSize(
        file.size
      )}) exceeds the maximum limit of ${formatFileSize(maxSize)}`,
    };
  }

  // Check file type
  const allowedTypes = isVideo ? ALLOWED_VIDEO_TYPES : ALLOWED_FILE_TYPES;
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `File type ${file.type} is not allowed. Allowed types: ${
        isVideo
          ? "MP4, WebM, OGG"
          : "PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT, ZIP, RAR, 7Z"
      }`,
    };
  }

  return { valid: true };
};

// Get file type category
export const getFileCategory = (
  fileType: string
): "video" | "document" | "archive" | "unknown" => {
  if (ALLOWED_VIDEO_TYPES.includes(fileType)) return "video";
  if (
    fileType.includes("pdf") ||
    fileType.includes("word") ||
    fileType.includes("excel") ||
    fileType.includes("powerpoint") ||
    fileType.includes("text")
  )
    return "document";
  if (
    fileType.includes("zip") ||
    fileType.includes("rar") ||
    fileType.includes("7z")
  )
    return "archive";
  return "unknown";
};

// Generate unique file name
export const generateFileName = (originalName: string): string => {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 8);
  const extension = originalName.split(".").pop();
  return `${timestamp}-${randomString}.${extension}`;
};

// Get storage path based on file type
export const getStoragePath = (file: File): string => {
  const category = getFileCategory(file.type);
  const fileName = generateFileName(file.name);

  switch (category) {
    case "video":
      return `course-content/videos/${fileName}`;
    case "document":
      return `course-content/documents/${fileName}`;
    case "archive":
      return `course-content/archives/${fileName}`;
    default:
      return `course-content/other/${fileName}`;
  }
};
