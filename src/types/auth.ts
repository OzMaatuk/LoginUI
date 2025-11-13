export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user?: {
    id: string;
    email: string;
    name?: string;
    role?: string;
  };
}

export interface OTPRequestPayload {
  email: string;
}

export interface OTPVerifyPayload {
  email: string;
  otp: string;
}

export interface OTPResponse {
  message: string;
  access_token?: string;
  token_type?: string;
}
