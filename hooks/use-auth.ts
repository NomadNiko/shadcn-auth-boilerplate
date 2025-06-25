"use client";

import { useContext } from "react";
import { AuthContext, AuthActionsContext, AuthTokensContext } from "@/lib/auth-context";

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export function useAuthActions() {
  const context = useContext(AuthActionsContext);
  if (!context) {
    throw new Error("useAuthActions must be used within an AuthProvider");
  }
  return context;
}

export function useAuthTokens() {
  const context = useContext(AuthTokensContext);
  if (!context) {
    throw new Error("useAuthTokens must be used within an AuthProvider");
  }
  return context;
}