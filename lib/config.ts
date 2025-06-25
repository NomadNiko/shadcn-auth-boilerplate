"use client";

export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
export const AUTH_LOGIN_URL = API_URL + "/api/v1/auth/email/login";
export const AUTH_REFRESH_URL = API_URL + "/api/v1/auth/refresh";
export const AUTH_ME_URL = API_URL + "/api/v1/auth/me";
export const AUTH_LOGOUT_URL = API_URL + "/api/v1/auth/logout";
export const AUTH_REGISTER_URL = API_URL + "/api/v1/auth/email/register";
export const AUTH_FORGOT_PASSWORD_URL = API_URL + "/api/v1/auth/forgot/password";

export const AUTH_CONFIRM_EMAIL_URL = API_URL + "/api/v1/auth/email/confirm";
export const AUTH_RESET_PASSWORD_URL = API_URL + "/api/v1/auth/reset/password";
export const AUTH_INVITE_USER_URL = API_URL + "/api/v1/auth/invite";
export const AUTH_ACCEPT_INVITE_URL = API_URL + "/api/v1/auth/accept-invite";

export const AUTH_TOKEN_KEY = "hostelshifts-auth-token";