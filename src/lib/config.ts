export const config = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
  apiVersion: process.env.NEXT_PUBLIC_API_VERSION || "v1",
  appName: process.env.NEXT_PUBLIC_APP_NAME || "SSO Login",
  appDescription:
    process.env.NEXT_PUBLIC_APP_DESCRIPTION ||
    "Secure Single Sign-On Authentication",
  tokenStorage: process.env.NEXT_PUBLIC_TOKEN_STORAGE || "cookie",
  sessionTimeout:
    parseInt(process.env.NEXT_PUBLIC_SESSION_TIMEOUT || "3600000", 10) ||
    3600000,
} as const;

export const getApiUrl = (path: string) => {
  const baseUrl = `${config.apiUrl}/api/${config.apiVersion}`;
  return `${baseUrl}${path}`;
};
