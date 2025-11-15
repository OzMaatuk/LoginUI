export interface AppConfig {
  appId: string;
  name: string;
  allowedRedirectUrls: string[];
  allowedOrigins: string[];
}

const apps: Record<string, AppConfig> = {
  app1: {
    appId: 'app1',
    name: 'Application 1',
    allowedRedirectUrls: [
      'https://app1.company.com/auth/callback',
      'http://localhost:3001/auth/callback',
    ],
    allowedOrigins: ['https://app1.company.com', 'http://localhost:3001'],
  },
};

export function getApp(appId: string): AppConfig | null {
  return apps[appId] || null;
}

export function validateRedirectUrl(appId: string, url: string): boolean {
  const app = getApp(appId);
  if (!app) return false;
  return app.allowedRedirectUrls.includes(url);
}

export function validateOrigin(appId: string, origin: string): boolean {
  const app = getApp(appId);
  if (!app) return false;
  return app.allowedOrigins.includes(origin);
}
