import { NextRequest, NextResponse } from "next/server";
import { checkUserAuth } from "@/lib/auth-helpers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { validateVideoToken } from "@/lib/video-utils";
import { prisma } from "@/lib/prisma";

// Cache for authenticated users to avoid repeated database queries
const userCache = new Map<string, { user: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Handle CORS preflight requests
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": request.headers.get("origin") || "*",
      "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, Range",
      "Access-Control-Allow-Credentials": "true",
    },
  });
}

// Handle HEAD requests for video metadata
export async function HEAD(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  // Reuse the same logic as GET but return only headers
  return GET(request, { params });
}

// Helper function to get cached user or fetch from database
async function getCachedUser(userId: string) {
  const cached = userCache.get(userId);
  const now = Date.now();

  if (cached && now - cached.timestamp < CACHE_TTL) {
    return cached.user;
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, role: true },
    });

    if (user) {
      userCache.set(userId, { user, timestamp: now });
    }

    return user;
  } catch (error) {
    return null;
  }
}

// Clean expired cache entries periodically
setInterval(() => {
  const now = Date.now();
  const entries = Array.from(userCache.entries());
  for (const [key, value] of entries) {
    if (now - value.timestamp > CACHE_TTL) {
      userCache.delete(key);
    }
  }
}, CACHE_TTL);

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const videoPath = params.path.join("/");
    const url = new URL(request.url);
    let user = null;

    // Method 1: Token-based authentication (fastest)
    const token = url.searchParams.get("token");
    if (token) {
      const tokenValidation = validateVideoToken(token);
      if (
        tokenValidation.valid &&
        tokenValidation.videoPath === videoPath &&
        tokenValidation.userId
      ) {
        user = await getCachedUser(tokenValidation.userId);
        if (!user) {
          return new NextResponse("Unauthorized - User not found", {
            status: 401,
          });
        }
      }
    }

    // Method 2: Access token from URL parameter
    if (!user) {
      const accessToken = url.searchParams.get("access_token");
      if (accessToken) {
        try {
          const { supabase } = await import("@/lib/supabase");
          const { data: userData, error } = await supabase.auth.getUser(
            accessToken
          );

          if (userData?.user && !error) {
            user = await getCachedUser(userData.user.id);
          }
        } catch (error) {
          // Silently fail and try next method
        }
      }
    }

    // Method 3: Bearer token authentication
    if (!user) {
      const authHeader = request.headers.get("authorization");
      if (authHeader?.startsWith("Bearer ")) {
        const authResult = await checkUserAuth();
        if (!authResult.error) {
          user = authResult.user;
        }
      }
    }

    // Method 4: Cookie-based authentication (slowest, try last)
    if (!user) {
      try {
        const supabase = createRouteHandlerClient({ cookies });
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (session?.user && !error) {
          user = await getCachedUser(session.user.id);
        }
      } catch (error) {
        // Silently fail
      }
    }

    // Deny access if no valid user found
    if (!user) {
      return new NextResponse("Unauthorized", {
        status: 401,
        headers: {
          "Access-Control-Allow-Origin": request.headers.get("origin") || "*",
          "Access-Control-Allow-Credentials": "true",
        },
      });
    }

    // Construct S3 URL and fetch video
    const s3BaseUrl = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com`;
    const actualVideoUrl = `${s3BaseUrl}/${videoPath}`;

    // Prepare headers for S3 request
    const s3Headers: Record<string, string> = {};
    const rangeHeader = request.headers.get("range");
    if (rangeHeader) {
      s3Headers.Range = rangeHeader;
    }

    // Fetch video from S3
    const videoResponse = await fetch(actualVideoUrl, {
      headers: s3Headers,
    });

    if (!videoResponse.ok) {
      return new NextResponse("Video not found", {
        status: videoResponse.status,
      });
    }

    // Prepare response headers
    const responseHeaders: Record<string, string> = {
      "Content-Type": videoResponse.headers.get("Content-Type") || "video/mp4",
      "Accept-Ranges": "bytes",
      "Cache-Control": "private, max-age=3600",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "strict-origin-when-cross-origin",
      "Access-Control-Allow-Origin": request.headers.get("origin") || "*",
      "Access-Control-Allow-Credentials": "true",
    };

    // Forward relevant headers from S3 response
    const contentRange = videoResponse.headers.get("Content-Range");
    if (contentRange) {
      responseHeaders["Content-Range"] = contentRange;
    }

    const contentLength = videoResponse.headers.get("Content-Length");
    if (contentLength) {
      responseHeaders["Content-Length"] = contentLength;
    }

    // Stream the response directly
    return new NextResponse(videoResponse.body, {
      status: videoResponse.status,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error("Video proxy error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
