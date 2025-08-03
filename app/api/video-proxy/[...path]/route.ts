import { NextRequest, NextResponse } from "next/server";
import { checkUserAuth } from "@/lib/auth-helpers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { validateVideoToken } from "@/lib/video-utils";
import { prisma } from "@/lib/prisma";

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

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    console.log("🎥 Video proxy request received");

    // Get the video path from params
    const videoPath = params.path.join("/");
    let user = null;

    // Method 1: Try token-based authentication (from query parameter)
    const url = new URL(request.url);
    const token = url.searchParams.get("token");

    if (token) {
      console.log("Trying token-based authentication...");
      console.log("🔍 Token received:", token.substring(0, 20) + "...");
      console.log("🔍 Video path from URL:", videoPath);

      const tokenValidation = validateVideoToken(token);

      console.log("🔍 Token validation result:", {
        valid: tokenValidation.valid,
        tokenVideoPath: tokenValidation.videoPath,
        tokenUserId: tokenValidation.userId,
        pathMatch: tokenValidation.videoPath === videoPath,
      });

      if (tokenValidation.valid && tokenValidation.videoPath === videoPath) {
        // Get user from database using the token's user ID
        const userData = await prisma.user.findUnique({
          where: { id: tokenValidation.userId },
        });

        if (!userData) {
          console.error("❌ User not found in database");
          return new NextResponse("Unauthorized - User not found", {
            status: 401,
          });
        }

        user = userData;
        console.log("✅ Token authentication successful for user:", user.email);
      } else {
        console.log("❌ Invalid or expired token");
        if (!tokenValidation.valid) {
          console.log("❌ Token validation failed");
        }
        if (tokenValidation.videoPath !== videoPath) {
          console.log(
            "❌ Path mismatch - Token path:",
            tokenValidation.videoPath,
            "Request path:",
            videoPath
          );
        }
      }
    }

    // Method 2: Try Bearer token authentication (for authenticated API calls)
    if (!user) {
      const authHeader = request.headers.get("authorization");
      const url = new URL(request.url);
      const accessToken = url.searchParams.get("access_token");

      if (authHeader && authHeader.startsWith("Bearer ")) {
        console.log("Found Authorization header, trying Bearer token auth...");
        const authResult = await checkUserAuth();
        if (!authResult.error) {
          user = authResult.user;
          console.log(
            "✅ Bearer token authentication successful for user:",
            user.email
          );
        } else {
          console.log("Bearer token auth failed:", authResult.error);
        }
      } else if (accessToken) {
        console.log("Found access_token parameter, trying token-based auth...");
        try {
          // Validate token directly with Supabase
          const { supabase } = await import("@/lib/supabase");
          const { data: userData, error: userError } =
            await supabase.auth.getUser(accessToken);

          if (userData?.user && !userError) {
            // Get user data from database
            const dbUser = await prisma.user.findUnique({
              where: { id: userData.user.id },
              select: {
                id: true,
                email: true,
                name: true,
                role: true,
              },
            });

            if (dbUser) {
              user = dbUser;
              console.log(
                "✅ URL token authentication successful for user:",
                user.email
              );
            } else {
              console.log("❌ User not found in database");
            }
          } else {
            console.log("URL token validation failed:", userError?.message);
          }
        } catch (error) {
          console.log("URL token auth error:", error);
        }
      } else {
        console.log(
          "No Authorization header or access_token found, skipping Bearer token auth"
        );
      }
    }

    // Method 3: Try cookie-based authentication (for direct video player requests)
    if (!user) {
      try {
        console.log("Trying cookie-based authentication...");
        const supabase = createRouteHandlerClient({ cookies });
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError || !session?.user) {
          console.log(
            "❌ Cookie authentication failed:",
            sessionError?.message || "No session"
          );
        } else {
          // Get user from database
          const { data: userData, error: userError } = await supabase
            .from("users")
            .select("id, email, name, role")
            .eq("id", session.user.id)
            .single();

          if (userError || !userData) {
            console.error("❌ Failed to get user data:", userError);
          } else {
            user = userData;
            console.log(
              "✅ Cookie authentication successful for user:",
              user.email
            );
          }
        }
      } catch (cookieError) {
        console.error("❌ Cookie authentication error:", cookieError);
      }
    }

    // If still no user, deny access
    if (!user) {
      console.error("❌ All authentication methods failed");
      console.log("Request details:", {
        hasAuthHeader: !!request.headers.get("authorization"),
        hasCookies: !!request.headers.get("cookie"),
        userAgent: request.headers.get("user-agent"),
        referer: request.headers.get("referer"),
      });
      return new NextResponse("Unauthorized - Please log in to view videos", {
        status: 401,
        headers: {
          "Access-Control-Allow-Origin": request.headers.get("origin") || "*",
          "Access-Control-Allow-Credentials": "true",
        },
      });
    }

    // Construct the actual S3 URL
    const s3BaseUrl = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com`;
    const actualVideoUrl = `${s3BaseUrl}/${videoPath}`;

    console.log(
      `🎥 Proxying video request for user ${user.email}: ${videoPath}`
    );

    // Fetch the video from S3
    const videoResponse = await fetch(actualVideoUrl, {
      headers: {
        // Forward range headers for video streaming
        ...(request.headers.get("range") && {
          Range: request.headers.get("range")!,
        }),
      },
    });

    if (!videoResponse.ok) {
      console.error(
        `❌ Failed to fetch video from S3: ${videoResponse.status} ${videoResponse.statusText}`
      );
      return new NextResponse(`Video not found: ${videoResponse.statusText}`, {
        status: videoResponse.status,
      });
    }

    console.log(
      `✅ S3 video response: ${
        videoResponse.status
      }, Content-Length: ${videoResponse.headers.get("Content-Length")}`
    );

    // Always stream the response - never buffer large videos in memory
    const isRangeRequest = request.headers.get("range");

    if (isRangeRequest) {
      console.log(
        `📺 Streaming range request: ${request.headers.get("range")}`
      );
    } else {
      console.log(
        `📺 Streaming full video (no buffering): ${videoResponse.headers.get(
          "Content-Length"
        )} bytes`
      );
    }

    // Stream the response directly without buffering
    return new NextResponse(videoResponse.body, {
      status: videoResponse.status,
      headers: {
        "Content-Type":
          videoResponse.headers.get("Content-Type") || "video/mp4",
        "Accept-Ranges": "bytes",
        "Cache-Control": "private, max-age=3600",
        "X-Content-Type-Options": "nosniff",
        "Referrer-Policy": "strict-origin-when-cross-origin",
        "Access-Control-Allow-Origin": request.headers.get("origin") || "*",
        "Access-Control-Allow-Credentials": "true",
        // Forward all relevant headers
        ...(videoResponse.headers.get("Content-Range") && {
          "Content-Range": videoResponse.headers.get("Content-Range")!,
        }),
        ...(videoResponse.headers.get("Content-Length") && {
          "Content-Length": videoResponse.headers.get("Content-Length")!,
        }),
      },
    });
  } catch (error) {
    console.error("❌ Video proxy error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
