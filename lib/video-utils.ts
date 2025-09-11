// Utility functions for video URL protection

/**
 * Get direct video URL for streaming (bypassing proxy for better performance)
 * @param videoUrl - The original video URL
 * @returns Direct S3 URL for video streaming
 */
export function getDirectVideoUrl(s3Url: string): string {
  if (!s3Url) return "";

  try {
    // Check if it's already a proper S3 URL
    const s3Pattern = /https:\/\/([^.]+)\.s3\.([^.]+)\.amazonaws\.com\/(.+)/;
    const match = s3Url.match(s3Pattern);

    if (match) {
      // Return the direct S3 URL for better performance and reliability
      return s3Url;
    }

    // If not an S3 URL we recognize, return original (might be YouTube, etc.)
    return s3Url;
  } catch (error) {
    console.error("Error processing video URL:", error);
    return s3Url; // Fallback to original URL
  }
}

/**
 * Legacy function for backwards compatibility - now returns direct URLs
 * @deprecated Use getDirectVideoUrl instead
 */
export function getProxiedVideoUrl(s3Url: string): string {
  return getDirectVideoUrl(s3Url);
}

/**
 * Check if a URL is a video file based on extension
 * @param url - URL to check
 * @returns boolean indicating if it's likely a video file
 */
export function isVideoFile(url: string): boolean {
  const videoExtensions = [
    ".mp4",
    ".webm",
    ".ogg",
    ".avi",
    ".mov",
    ".wmv",
    ".flv",
    ".mkv",
  ];
  const urlLower = url.toLowerCase();
  return videoExtensions.some((ext) => urlLower.includes(ext));
}

/**
 * Get video file extension from URL
 * @param url - Video URL
 * @returns File extension or 'mp4' as default
 */
export function getVideoExtension(url: string): string {
  try {
    const urlPath = new URL(url).pathname;
    const extension = urlPath.split(".").pop()?.toLowerCase();

    const supportedExtensions = ["mp4", "webm", "ogg"];
    if (extension && supportedExtensions.includes(extension)) {
      return extension;
    }

    return "mp4"; // Default
  } catch {
    return "mp4";
  }
}

/**
 * Generate a secure token for video access (basic implementation)
 * In production, you might want to use JWT or similar
 * @param videoPath - Path to the video file
 * @param userId - User ID requesting access
 * @returns Security token
 */
export function generateVideoToken(videoPath: string, userId: string): string {
  const timestamp = Date.now();
  const tokenData = `${videoPath}:${userId}:${timestamp}`;

  // In production, use proper encryption/signing
  return Buffer.from(tokenData).toString("base64");
}

/**
 * Validate video access token
 * @param token - Token to validate
 * @param maxAge - Maximum age in milliseconds (default: 1 hour)
 * @returns Validation result with video path and user ID
 */
export function validateVideoToken(
  token: string,
  maxAge: number = 60 * 60 * 1000
): { valid: boolean; videoPath?: string; userId?: string } {
  try {
    const tokenData = Buffer.from(token, "base64").toString("utf-8");

    const [videoPath, userId, timestampStr] = tokenData.split(":");

    const timestamp = parseInt(timestampStr);
    const now = Date.now();
    const age = now - timestamp;

    if (now - timestamp > maxAge) {
      return { valid: false }; // Token expired
    }

    return { valid: true, videoPath, userId };
  } catch (error) {
    return { valid: false };
  }
}
