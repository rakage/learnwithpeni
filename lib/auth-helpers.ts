import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies, headers } from "next/headers";
import { prisma } from "./prisma";
import { NextResponse } from "next/server";
import { supabase as supabaseAdmin } from "./supabase";

export async function checkAdminAuth() {
  try {
    console.log("=== CHECKING ADMIN AUTH ===");

    // Get Authorization header first (preferred method)
    const headersList = headers();
    const authorization = headersList.get("authorization");

    console.log("Authorization header exists:", !!authorization);
    console.log(
      "Authorization header (first 50 chars):",
      authorization?.substring(0, 50)
    );

    let user = null;

    if (authorization?.startsWith("Bearer ")) {
      // Extract token from Bearer header
      const token = authorization.substring(7);
      console.log("Extracted token (first 20 chars):", token.substring(0, 20));

      // Validate token with Supabase
      const { data: userData, error: userError } =
        await supabaseAdmin.auth.getUser(token);
      console.log("User from token:", userData.user?.email);
      console.log("Token validation error:", userError?.message);

      if (userData?.user && !userError) {
        user = userData.user;
        console.log("✅ Token validation successful");
      } else {
        console.log("❌ Token validation failed");
      }
    }

    // Fallback to cookie-based auth if no Bearer token
    if (!user) {
      console.log("No valid Bearer token, trying cookie fallback...");
      const supabase = createRouteHandlerClient({ cookies });

      const { data: sessionData, error: sessionError } =
        await supabase.auth.getSession();
      console.log("Session from cookies:", !!sessionData.session);

      if (sessionData.session?.user && !sessionError) {
        user = sessionData.session.user;
        console.log("✅ Cookie session found");
      } else {
        // Try getUser as final fallback
        const { data: userData, error: userError } =
          await supabase.auth.getUser();
        if (userData?.user && !userError) {
          user = userData.user;
          console.log("✅ User found via getUser fallback");
        }
      }
    }

    if (!user) {
      console.log("❌ No user found via any method");
      return {
        error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
        user: null,
        session: null,
      };
    }

    // Get user from database to check role
    console.log("Looking up user role in database for ID:", user.id);
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    console.log("Database user:", dbUser);

    if (!dbUser) {
      console.log("❌ User not found in database");
      return {
        error: NextResponse.json(
          { error: "User not found in database" },
          { status: 404 }
        ),
        user: null,
        session: null,
      };
    }

    if (dbUser.role !== "ADMIN") {
      console.log("❌ User is not admin:", dbUser.role);
      return {
        error: NextResponse.json(
          { error: "Admin access required" },
          { status: 403 }
        ),
        user: null,
        session: null,
      };
    }

    return {
      error: null,
      user: dbUser,
      session: { user },
    };
  } catch (error) {
    console.error("❌ Auth check error:", error);
    return {
      error: NextResponse.json(
        { error: "Authentication failed" },
        { status: 500 }
      ),
      user: null,
      session: null,
    };
  }
}

export async function checkUserAuth() {
  try {
    console.log("=== CHECKING USER AUTH ===");

    // Get Authorization header first (preferred method)
    const headersList = headers();
    const authorization = headersList.get("authorization");

    console.log("Authorization header exists:", !!authorization);

    let user = null;

    if (authorization?.startsWith("Bearer ")) {
      // Extract token from Bearer header
      const token = authorization.substring(7);

      // Validate token with Supabase
      const { data: userData, error: userError } =
        await supabaseAdmin.auth.getUser(token);
      console.log("User from token:", userData.user?.email);

      if (userData?.user && !userError) {
        user = userData.user;
      }
    }

    // Fallback to cookie-based auth if no Bearer token
    if (!user) {
      console.log("No Bearer token, trying cookie fallback...");
      const supabase = createRouteHandlerClient({ cookies });

      const { data: sessionData, error: sessionError } =
        await supabase.auth.getSession();

      if (sessionData.session?.user && !sessionError) {
        user = sessionData.session.user;
      } else {
        const { data: userData, error: userError } =
          await supabase.auth.getUser();
        if (userData?.user && !userError) {
          user = userData.user;
        }
      }
    }

    if (!user) {
      return {
        error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
        user: null,
        session: null,
      };
    }

    // Get user from database
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        created_at: true,
      },
    });

    if (!dbUser) {
      return {
        error: NextResponse.json({ error: "User not found" }, { status: 404 }),
        user: null,
        session: null,
      };
    }

    return {
      error: null,
      user: dbUser,
      session: { user },
    };
  } catch (error) {
    console.error("User auth check error:", error);
    return {
      error: NextResponse.json(
        { error: "Authentication failed" },
        { status: 500 }
      ),
      user: null,
      session: null,
    };
  }
}
