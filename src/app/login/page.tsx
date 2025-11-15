"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { OTPForm } from "./components/OTPForm";
import { config } from "@/lib/config";
import { signIn } from "next-auth/react";

export const dynamic = "force-dynamic";

interface LoginSession {
  appId: string;
  returnUrl: string;
  state: string;
}

export default function LoginPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [loginSession, setLoginSession] = useState<LoginSession | null>(null);

  useEffect(() => {
    // Check if this is external app login
    const checkSession = async () => {
      try {
        const response = await fetch('/api/auth/check-login-session');
        if (response.ok) {
          const data = await response.json();
          if (data && data.appId) {
            setLoginSession(data);
          }
        }
      } catch (error) {
        console.error('Failed to check login session:', error);
      }
    };
    checkSession();
  }, []);

  useEffect(() => {
    if (status === "authenticated") {
      // Redirect to external app if login session exists
      if (loginSession?.returnUrl) {
        window.location.href = loginSession.returnUrl;
      } else {
        router.push("/profile");
      }
    }
  }, [status, router, loginSession]);

  const handleAuthentikLogin = async () => {
    await signIn("authentik", { callbackUrl: "/profile" });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-slate-50 to-slate-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-center text-3xl">
            {config.appName}
          </CardTitle>
          <CardDescription className="text-center">
            {config.appDescription}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <OTPForm />

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>

          <div className="grid gap-2">
            <Button 
              variant="outline" 
              onClick={handleAuthentikLogin}
              disabled={status === "loading"}
            >
              {status === "loading" ? "Loading..." : "Login with Authentik"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
