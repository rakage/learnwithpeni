"use client";

import { supabase } from "./supabase";

const TOKEN_KEY = "supabase_access_token";

export class AuthClient {
  // Store token in localStorage
  static setToken(token: string) {
    if (typeof window !== "undefined") {
      localStorage.setItem(TOKEN_KEY, token);
    }
  }

  // Get token from localStorage
  static getToken(): string | null {
    if (typeof window !== "undefined") {
      return localStorage.getItem(TOKEN_KEY);
    }
    return null;
  }

  // Remove token from localStorage
  static removeToken() {
    if (typeof window !== "undefined") {
      localStorage.removeItem(TOKEN_KEY);
    }
  }

  // Get fresh token from Supabase session and store it
  static async refreshToken(): Promise<string | null> {
    try {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error || !session?.access_token) {
        console.error("Failed to get session:", error);
        this.removeToken();
        return null;
      }

      this.setToken(session.access_token);
      return session.access_token;
    } catch (error) {
      console.error("Error refreshing token:", error);
      return null;
    }
  }

  // Get current token or refresh if needed
  static async getCurrentToken(): Promise<string | null> {
    let token = this.getToken();

    if (!token) {
      // Try to get fresh token from session
      token = await this.refreshToken();
    }

    return token;
  }

  // Check if user is authenticated (similar to admin courses page pattern)
  static async isAuthenticated(): Promise<boolean> {
    try {
      // First try to get token from localStorage
      const token = this.getToken();
      if (token) {
        // Verify token is still valid by making a simple authenticated request
        const response = await this.authenticatedFetch("/api/user/profile", {
          method: "GET",
        });
        if (response.ok) {
          return true;
        }
      }

      // If token fails, try to refresh from session
      const refreshedToken = await this.refreshToken();
      if (refreshedToken) {
        // Test the refreshed token
        const response = await this.authenticatedFetch("/api/user/profile", {
          method: "GET",
        });
        return response.ok;
      }

      return false;
    } catch (error) {
      console.error("Error checking authentication:", error);
      return false;
    }
  }

  // Authenticated fetch function with automatic retry
  static async authenticatedFetch(
    url: string,
    options: RequestInit = {}
  ): Promise<Response> {
    const token = await this.getCurrentToken();

    if (!token) {
      throw new Error("No authentication token available");
    }

    const headers = new Headers(options.headers);
    headers.set("Authorization", `Bearer ${token}`);

    const response = await fetch(url, {
      ...options,
      headers,
    });

    // If token is invalid, try to refresh once
    if (response.status === 401) {
      console.log("Token might be expired, trying to refresh...");
      const newToken = await this.refreshToken();

      if (newToken) {
        headers.set("Authorization", `Bearer ${newToken}`);
        return fetch(url, {
          ...options,
          headers,
        });
      }
    }

    return response;
  }

  // Session-based fetch (uses cookies, similar to admin courses page pattern)
  static async sessionFetch(
    url: string,
    options: RequestInit = {}
  ): Promise<Response> {
    // Add credentials to use session cookies
    const fetchOptions: RequestInit = {
      ...options,
      credentials: "include", // This ensures cookies are sent
    };

    const response = await fetch(url, fetchOptions);

    // If session-based auth fails, try Bearer token as fallback
    if (response.status === 401) {
      console.log("Session auth failed, trying Bearer token...");
      return this.authenticatedFetch(url, options);
    }

    return response;
  }

  // Smart fetch that tries both Bearer token and session cookies
  static async smartFetch(
    url: string,
    options: RequestInit = {}
  ): Promise<Response> {
    try {
      // First, try Bearer token authentication (faster for API calls)
      const token = this.getToken();
      if (token) {
        const headers = new Headers(options.headers);
        headers.set("Authorization", `Bearer ${token}`);

        const response = await fetch(url, {
          ...options,
          headers,
          credentials: "include", // Also include cookies as backup
        });

        // If Bearer token works, return the response
        if (response.ok || response.status !== 401) {
          return response;
        }
      }

      // If Bearer token fails or doesn't exist, try session-based
      console.log("Bearer token failed/missing, trying session auth...");
      return this.sessionFetch(url, options);
    } catch (error) {
      console.error("Smart fetch error:", error);
      throw error;
    }
  }

  // Initialize token on app start
  static async initialize() {
    try {
      // Check if user is logged in and store fresh token
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.access_token) {
        this.setToken(session.access_token);
      } else {
        this.removeToken();
      }

      // Listen for auth state changes
      supabase.auth.onAuthStateChange((event, session) => {
        if (session?.access_token) {
          this.setToken(session.access_token);
        } else {
          this.removeToken();
        }
      });
    } catch (error) {
      console.error("Error initializing auth client:", error);
    }
  }
}

// Convenience function for authenticated API calls (Bearer token)
export async function apiCall(url: string, options: RequestInit = {}) {
  return AuthClient.authenticatedFetch(url, options);
}

// Convenience function for authenticated GET requests (Bearer token)
export async function apiGet(url: string) {
  return AuthClient.authenticatedFetch(url, { method: "GET" });
}

// Convenience function for authenticated POST requests (Bearer token)
export async function apiPost(url: string, data: any) {
  return AuthClient.authenticatedFetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
}

// Session-based convenience functions
export async function sessionGet(url: string) {
  return AuthClient.sessionFetch(url, { method: "GET" });
}

export async function sessionPost(url: string, data: any) {
  return AuthClient.sessionFetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
}

// Smart convenience functions (tries both methods)
export async function smartGet(url: string) {
  return AuthClient.smartFetch(url, { method: "GET" });
}

export async function smartPost(url: string, data: any) {
  return AuthClient.smartFetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
}

export async function smartCall(url: string, options: RequestInit = {}) {
  return AuthClient.smartFetch(url, options);
}
