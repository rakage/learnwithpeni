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

  // Authenticated fetch function
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

// Convenience function for authenticated API calls
export async function apiCall(url: string, options: RequestInit = {}) {
  return AuthClient.authenticatedFetch(url, options);
}

// Convenience function for authenticated GET requests
export async function apiGet(url: string) {
  return AuthClient.authenticatedFetch(url, { method: "GET" });
}

// Convenience function for authenticated POST requests
export async function apiPost(url: string, data: any) {
  return AuthClient.authenticatedFetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
}
