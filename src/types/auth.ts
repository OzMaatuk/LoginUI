export interface SessionUser {
  id: string;
  email: string;
  name?: string;
  [key: string]: unknown;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  user?: SessionUser;
}

export interface LoginSession {
  appId: string;
  returnUrl: string;
  state: string;
}

export interface SessionResponse {
  user: SessionUser | null;
}

export interface LogoutResponse {
  success: boolean;
}

export interface OTPRequestPayload {
  email: string;
  appId?: string;
}

export interface OTPVerifyPayload {
  email: string;
  otp: string;
  appId?: string;
}

export interface OTPResponse {
  message?: string;
  access_token?: string;
  user?: SessionUser;
}
