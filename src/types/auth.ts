export interface LoginSession {
  appId: string;
  returnUrl: string;
  state: string;
}

export interface SessionUser {
  id: string;
  email: string;
  name?: string;
}

export interface SessionResponse {
  user: SessionUser | null;
}

export interface LogoutResponse {
  success: boolean;
}
