"use client";

import { useState } from "react";
import { apiGet, AuthClient } from "@/lib/auth-client";
import { supabase } from "@/lib/supabase";
import toast from "react-hot-toast";

interface TestResults {
  cookie?: any;
  bearer?: any;
  admin?: any;
  session?: any;
}

export default function TestAuthPage() {
  const [results, setResults] = useState<TestResults>({});
  const [loading, setLoading] = useState(false);

  const testCookieAuth = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/debug/auth");
      const data = await response.json();
      setResults((prev: TestResults) => ({ ...prev, cookie: data }));
      console.log("Cookie auth result:", data);
    } catch (error) {
      console.error("Cookie auth error:", error);
      toast.error("Cookie auth failed");
    } finally {
      setLoading(false);
    }
  };

  const testBearerAuth = async () => {
    setLoading(true);
    try {
      const response = await apiGet("/api/debug/auth");
      const data = await response.json();
      setResults((prev: TestResults) => ({ ...prev, bearer: data }));
      console.log("Bearer auth result:", data);
      toast.success("Bearer auth successful!");
    } catch (error) {
      console.error("Bearer auth error:", error);
      toast.error("Bearer auth failed");
    } finally {
      setLoading(false);
    }
  };

  const testAdminAccess = async () => {
    setLoading(true);
    try {
      const response = await apiGet("/api/admin/check");
      const data = await response.json();
      setResults((prev: TestResults) => ({ ...prev, admin: data }));
      console.log("Admin access result:", data);
      toast.success("Admin access granted!");
    } catch (error) {
      console.error("Admin access error:", error);
      toast.error("Admin access denied");
    } finally {
      setLoading(false);
    }
  };

  const showCurrentToken = () => {
    const token = AuthClient.getToken();
    console.log("Current token:", token?.substring(0, 50) + "...");
    toast.success("Token logged to console");
  };

  const refreshToken = async () => {
    const newToken = await AuthClient.refreshToken();
    console.log("Refreshed token:", newToken?.substring(0, 50) + "...");
    toast.success("Token refreshed!");
  };

  const checkSupabaseSession = async () => {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();
    console.log("Supabase session:", session);
    console.log("Session error:", error);
    setResults((prev: TestResults) => ({
      ...prev,
      session: { hasSession: !!session, error: error?.message },
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8">Authentication Testing</h1>

        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">
            Test Authentication Methods
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button
              onClick={testCookieAuth}
              disabled={loading}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
            >
              Test Cookie Auth
            </button>
            <button
              onClick={testBearerAuth}
              disabled={loading}
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50"
            >
              Test Bearer Auth
            </button>
            <button
              onClick={testAdminAccess}
              disabled={loading}
              className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 disabled:opacity-50"
            >
              Test Admin Access
            </button>
            <button
              onClick={checkSupabaseSession}
              disabled={loading}
              className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600 disabled:opacity-50"
            >
              Check Session
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Token Management</h2>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={showCurrentToken}
              className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
            >
              Show Current Token
            </button>
            <button
              onClick={refreshToken}
              className="bg-indigo-500 text-white px-4 py-2 rounded hover:bg-indigo-600"
            >
              Refresh Token
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Test Results</h2>
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
            {JSON.stringify(results, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}
