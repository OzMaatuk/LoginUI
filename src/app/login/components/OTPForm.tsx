"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { useRequestOTP, useVerifyOTP } from "@/hooks/useOTP";
import { useRouter } from "next/navigation";

const emailSchema = z.object({
  email: z.string().email("Invalid email address"),
});

const otpSchema = z.object({
  otp: z.string().length(6, "OTP must be 6 digits"),
});

type EmailFormData = z.infer<typeof emailSchema>;
type OTPFormData = z.infer<typeof otpSchema>;

export function OTPForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [step, setStep] = useState<"email" | "otp">("email");

  const { mutate: requestOTP, isPending: isRequesting } = useRequestOTP();
  const { mutate: verifyOTP, isPending: isVerifying } = useVerifyOTP();

  const emailForm = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
  });

  const otpForm = useForm<OTPFormData>({
    resolver: zodResolver(otpSchema),
  });

  const onEmailSubmit = (data: EmailFormData) => {
    requestOTP(data, {
      onSuccess: () => {
        setEmail(data.email);
        setStep("otp");
      },
    });
  };

  const onOTPSubmit = (data: OTPFormData) => {
    verifyOTP(
      { email, otp: data.otp },
      {
        onSuccess: () => {
          router.push("/profile");
        },
      }
    );
  };

  if (step === "email") {
    return (
      <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="otp-email">Email</Label>
          <Input
            id="otp-email"
            type="email"
            placeholder="you@example.com"
            error={emailForm.formState.errors.email?.message}
            {...emailForm.register("email")}
          />
        </div>

        <Button type="submit" className="w-full" isLoading={isRequesting}>
          Send OTP
        </Button>
      </form>
    );
  }

  return (
    <form onSubmit={otpForm.handleSubmit(onOTPSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="otp-code">OTP Code</Label>
        <Input
          id="otp-code"
          type="text"
          placeholder="123456"
          maxLength={6}
          error={otpForm.formState.errors.otp?.message}
          {...otpForm.register("otp")}
        />
        <p className="text-xs text-muted-foreground">
          OTP sent to {email}
        </p>
      </div>

      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={() => setStep("email")}
        >
          Back
        </Button>
        <Button type="submit" className="w-full" isLoading={isVerifying}>
          Verify OTP
        </Button>
      </div>
    </form>
  );
}
