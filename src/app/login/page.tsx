"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
// import { LoginForm } from "./components/LoginForm";
import { OTPForm } from "./components/OTPForm";
import { isAuthenticated } from "@/lib/auth";
import { getApiUrl, config } from "@/lib/config";

export const dynamic = "force-dynamic";

// type LoginMode = "password" | "otp";

export default function LoginPage() {
  const router = useRouter();
  // const [mode, setMode] = useState<LoginMode>("password");

  useEffect(() => {
    if (isAuthenticated()) {
      router.push("/profile");
    }
  }, [router]);

  const handleSSOLogin = () => {
    window.location.href = getApiUrl("/auth/sso");
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
            {/* <Button
              variant="outline"
              onClick={() => setMode(mode === "password" ? "otp" : "password")}
            >
              {mode === "password" ? "Login with OTP" : "Login with Password"}
            </Button> */}

            <Button variant="outline" onClick={handleSSOLogin}>
              Login with SSO
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
