"use client";

import { User, TokensInfo } from "@/types/auth";
import {
  PropsWithChildren,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  AuthActionsContext,
  AuthContext,
  AuthTokensContext,
} from "@/lib/auth-context";
import api from "@/lib/api";
import { AUTH_LOGOUT_URL, AUTH_ME_URL } from "@/lib/config";
import {
  getTokensInfo,
  setTokensInfo as setTokensInfoToStorage,
} from "@/lib/auth-tokens";

function AuthProvider(props: PropsWithChildren<{}>) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  const setTokensInfo = useCallback((tokensInfo: TokensInfo | null) => {
    setTokensInfoToStorage(tokensInfo);

    if (!tokensInfo) {
      setUser(null);
    }
  }, []);

  const logOut = useCallback(async () => {
    const tokens = getTokensInfo();

    if (tokens?.token) {
      try {
        await api.post(AUTH_LOGOUT_URL);
      } catch (error) {
        console.error("Logout error:", error);
      }
    }
    setTokensInfo(null);
  }, [setTokensInfo]);

  const loadUserData = useCallback(async () => {
    const tokens = getTokensInfo();

    try {
      if (tokens?.token) {
        const response = await api.get(AUTH_ME_URL);
        setUser(response.data);
      }
    } catch (error: any) {
      if (error.response?.status === 401) {
        logOut();
      } else {
        console.error("Failed to load user data:", error);
      }
    } finally {
      setIsLoaded(true);
    }
  }, [logOut]);

  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

  const contextValue = useMemo(
    () => ({
      isLoaded,
      user,
    }),
    [isLoaded, user]
  );

  const contextActionsValue = useMemo(
    () => ({
      setUser,
      logOut,
    }),
    [logOut]
  );

  const contextTokensValue = useMemo(
    () => ({
      setTokensInfo,
    }),
    [setTokensInfo]
  );

  return (
    <AuthContext.Provider value={contextValue}>
      <AuthActionsContext.Provider value={contextActionsValue}>
        <AuthTokensContext.Provider value={contextTokensValue}>
          {props.children}
        </AuthTokensContext.Provider>
      </AuthActionsContext.Provider>
    </AuthContext.Provider>
  );
}

export default AuthProvider;