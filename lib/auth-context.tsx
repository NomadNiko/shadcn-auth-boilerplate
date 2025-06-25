"use client";

import { User, TokensInfo } from "@/types/auth";
import { createContext } from "react";

export interface AuthContextType {
  user: User | null;
  isLoaded: boolean;
}

export interface AuthActionsContextType {
  setUser: (user: User | null) => void;
  logOut: () => Promise<void>;
}

export interface AuthTokensContextType {
  setTokensInfo: (tokens: TokensInfo | null) => void;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoaded: false,
});

export const AuthActionsContext = createContext<AuthActionsContextType>({
  setUser: () => {},
  logOut: async () => {},
});

export const AuthTokensContext = createContext<AuthTokensContextType>({
  setTokensInfo: () => {},
});