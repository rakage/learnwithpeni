"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import { BookOpen, User, LogOut } from "lucide-react";

interface NavigationProps {
  showUserMenu?: boolean;
}

export default function Navigation({ showUserMenu = true }: NavigationProps) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getUser = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        setUser(user);
      } catch (error) {
        console.error("Error getting user:", error);
      } finally {
        setLoading(false);
      }
    };

    getUser();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      // User state will be updated automatically by the auth state change listener
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  if (loading) {
    return (
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="flex items-center space-x-2">
                <BookOpen className="h-8 w-8 text-primary-600" />
                <span className="text-xl font-bold text-gray-900">
                  Learn with Peni
                </span>
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <div className="animate-pulse bg-gray-200 h-8 w-20 rounded"></div>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link
              href={user ? "/dashboard" : "/"}
              className="flex items-center space-x-2"
            >
              <BookOpen className="h-8 w-8 text-primary-600" />
              <span className="text-xl font-bold text-gray-900">
                Learn with Peni
              </span>
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            {user ? (
              // Logged in user menu
              showUserMenu && (
                <>
                  <Link
                    href="/dashboard"
                    className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Dashboard
                  </Link>
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      {user.user_metadata?.avatar_url ? (
                        <Image
                          src={user.user_metadata.avatar_url}
                          alt={user.user_metadata?.name || user.email}
                          width={32}
                          height={32}
                          className="rounded-full"
                        />
                      ) : (
                        <User className="h-8 w-8 text-gray-400" />
                      )}
                      <span className="text-gray-700 text-sm">
                        {user.user_metadata?.name || user.email}
                      </span>
                    </div>
                    <button
                      onClick={handleSignOut}
                      className="text-gray-600 hover:text-gray-900 flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </>
              )
            ) : (
              // Not logged in menu
              <>
                <Link
                  href="/auth/signin"
                  className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/signup"
                  className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
