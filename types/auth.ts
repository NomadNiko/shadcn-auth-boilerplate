export interface User {
  _id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: {
    _id: string;
    id: string;
  };
  status: {
    _id: string;
    id: string;
  };
}

export interface TokensInfo {
  token: string;
  refreshToken: string;
  tokenExpires: number;
}

export interface LoginResponse {
  token: string;
  refreshToken: string;
  tokenExpires: number;
  user: User;
}

export interface LoginRequest {
  email: string;
  password: string;
}