import { TokensInfo } from "@/types/auth";
import Cookies from "js-cookie";
import { AUTH_TOKEN_KEY } from "./config";

export function getTokensInfo(): TokensInfo | null {
  try {
    const tokenData = Cookies.get(AUTH_TOKEN_KEY);
    return tokenData ? JSON.parse(tokenData) : null;
  } catch (error) {
    console.error("Error parsing token data:", error);
    return null;
  }
}

export function setTokensInfo(tokens: TokensInfo | null) {
  if (tokens) {
    Cookies.set(AUTH_TOKEN_KEY, JSON.stringify(tokens), {
      expires: 7, // 7 days
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });
  } else {
    Cookies.remove(AUTH_TOKEN_KEY);
  }
}