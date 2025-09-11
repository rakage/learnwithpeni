"use client";

import { useState, useEffect } from "react";
import ReactPlayer from "react-player";
import { getDirectVideoUrl } from "@/lib/video-utils";

interface ProtectedVideoPlayerProps {
  videoUrl: string;
  courseTitle: string;
  width?: string;
  height?: string;
}

export default function ProtectedVideoPlayer({
  videoUrl,
  courseTitle,
  width = "100%",
  height = "100%",
}: ProtectedVideoPlayerProps) {
  const [directVideoUrl, setDirectVideoUrl] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const setupDirectVideo = async () => {
      try {
        setLoading(true);
        setError("");

        if (!videoUrl) {
          throw new Error("No video URL provided");
        }

        // Get direct S3 URL for better performance and reliability
        const directUrl = getDirectVideoUrl(videoUrl);
        
        // Add cache-busting parameter to avoid stale content
        const finalUrl = `${directUrl}${directUrl.includes('?') ? '&' : '?'}t=${Date.now()}`;
        
        setDirectVideoUrl(finalUrl);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load video");
      } finally {
        setLoading(false);
      }
    };

    if (videoUrl) {
      setupDirectVideo();
    }
  }, [videoUrl]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-100 rounded-lg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading video...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 bg-red-50 rounded-lg">
        <div className="text-center">
          <div className="text-red-600 mb-2">⚠️</div>
          <p className="text-red-700 font-medium">Video Error</p>
          <p className="text-red-600 text-sm">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded text-sm hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full relative" style={{ aspectRatio: "16/9" }}>
      <div
        className="absolute inset-0 video-container rounded-lg overflow-hidden shadow-lg select-none"
        onContextMenu={(e) => e.preventDefault()}
        onDragStart={(e) => e.preventDefault()}
        style={{
          userSelect: "none",
          WebkitUserSelect: "none",
          MozUserSelect: "none",
          msUserSelect: "none",
        }}
      >
        {/* Anti-screen recording overlay */}
        <div className="absolute inset-0 pointer-events-none z-10">
          <div className="absolute top-4 right-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded text-sm">
            © Learn with Peni
          </div>
        </div>

        <ReactPlayer
          url={directVideoUrl}
          width="100%"
          height="100%"
          style={{ position: "absolute", top: 0, left: 0 }}
          controls
          playing={false}
          config={{
            file: {
              attributes: {
                controlsList: "nodownload nofullscreen noremoteplaybook",
                disablePictureInPicture: true,
                onContextMenu: (e: Event) => e.preventDefault(),
                crossOrigin: "anonymous", // Allow anonymous access for public S3 videos
              },
              forceHLS: false,
              forceVideo: true,
            },
            youtube: {
              playerVars: {
                showinfo: 1,
                rel: 0,
                modestbranding: 1,
                disablekb: 1,
              },
            },
          }}
          onReady={() => {
            // Additional protection when video loads
            const videoElements = document.querySelectorAll("video");
            videoElements.forEach((video) => {
              video.setAttribute(
                "controlsList",
                "nodownload nofullscreen noremoteplaybook"
              );
              video.setAttribute("disablePictureInPicture", "true");
              video.addEventListener("contextmenu", (e) => e.preventDefault());
            });
          }}
          onError={(error) => {
            console.error("❌ Video player error:", error);
            setError("Failed to load video from S3. Please check your connection and try again.");
          }}
        />

        {/* Invisible overlay to prevent right-click on video */}
        <div
          className="absolute inset-0 z-5"
          onContextMenu={(e) => e.preventDefault()}
          onDragStart={(e) => e.preventDefault()}
          style={{
            background: "transparent",
            pointerEvents: "none",
          }}
        />
      </div>
    </div>
  );
}
