"use client";

import { useEffect } from "react";
import { AuthClient } from "@/lib/auth-client";

export default function AuthInitializer() {
  useEffect(() => {
    // Initialize the auth client when the app starts
    AuthClient.initialize();
  }, []);

  // This component doesn't render anything visible
  return null;
}
