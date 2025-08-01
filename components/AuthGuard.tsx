"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

interface AuthGuardProps {
  children: React.ReactNode;
  redirectTo?: string;
  requireAuth?: boolean;
}

export default function AuthGuard({
  children,
  redirectTo = "/dashboard",
  requireAuth = false,
}: AuthGuardProps) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      try {
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();
        setUser(user);

        if (requireAuth && !user) {
          // Redirect to sign in if auth is required but user is not logged in
          router.push("/auth/signin");
          return;
        }

        if (!requireAuth && user) {
          // Redirect logged-in users away from auth pages
          router.push(redirectTo);
          return;
        }
      } catch (error) {
        console.error("Auth check error:", error);
      } finally {
        setLoading(false);
      }
    };

    checkUser();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if (requireAuth && !currentUser) {
        router.push("/auth/signin");
      } else if (!requireAuth && currentUser) {
        router.push(redirectTo);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router, redirectTo, requireAuth]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // For auth-required pages, only show if user is logged in
  if (requireAuth && !user) {
    return null;
  }

  // For non-auth pages (signin/signup), only show if user is not logged in
  if (!requireAuth && user) {
    return null;
  }

  return <>{children}</>;
}
