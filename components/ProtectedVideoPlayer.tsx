"use client";

import { useState, useEffect } from "react";
import ReactPlayer from "react-player";
import { getProxiedVideoUrl } from "@/lib/video-utils";
import { AuthClient, smartGet } from "@/lib/auth-client";

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
  const [authenticatedUrl, setAuthenticatedUrl] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const setupAuthenticatedVideo = async () => {
      try {
        setLoading(true);
        setError("");

        // First check if user is authenticated (similar to admin courses page)
        const isAuth = await AuthClient.isAuthenticated();
        if (!isAuth) {
          throw new Error("Please log in to view videos");
        }

        // Get the proxied URL without token (rely on smart authentication)
        const proxiedUrl = getProxiedVideoUrl(videoUrl);

        const testResponse = await AuthClient.smartFetch(proxiedUrl, {
          method: "HEAD", // Use HEAD to test accessibility without downloading
        });

        if (!testResponse.ok) {
          throw new Error(
            `Video not accessible: ${testResponse.status} ${testResponse.statusText}`
          );
        }

        // Create an authenticated URL with session info
        // Add the access token as a URL parameter for ReactPlayer requests
        const token = AuthClient.getToken();
        const authenticatedVideoUrl = token
          ? `${proxiedUrl}?access_token=${encodeURIComponent(
              token
            )}&t=${Date.now()}`
          : `${proxiedUrl}?t=${Date.now()}`;

        setAuthenticatedUrl(authenticatedVideoUrl);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load video");
      } finally {
        setLoading(false);
      }
    };

    if (videoUrl) {
      setupAuthenticatedVideo();
    }
  }, [videoUrl]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-100 rounded-lg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading video...</p>
          <p className="text-gray-500 text-sm">Authenticating access...</p>
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
    <div
      className="video-container rounded-lg overflow-hidden shadow-lg relative select-none"
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
        <div className="absolute top-4 left-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded text-sm">
          🔒 Protected Content
        </div>
        <div className="absolute bottom-4 right-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded text-sm">
          © Learn with Peni
        </div>
      </div>

      <ReactPlayer
        url={authenticatedUrl}
        width={width}
        height={height}
        controls
        config={{
          file: {
            attributes: {
              controlsList: "nodownload nofullscreen noremoteplayback",
              disablePictureInPicture: true,
              onContextMenu: (e: Event) => e.preventDefault(),
              crossOrigin: "use-credentials", // Important for cookie-based auth
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
              "nodownload nofullscreen noremoteplayback"
            );
            video.setAttribute("disablePictureInPicture", "true");
            video.addEventListener("contextmenu", (e) => e.preventDefault());

            // Set credentials for all video requests
            video.crossOrigin = "use-credentials";
          });
        }}
        onError={(error) => {
          console.error("❌ Video player error:", error);
          setError("Failed to load video. Please refresh and try again.");
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
  );
}
