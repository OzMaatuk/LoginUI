import { NextRequest, NextResponse } from "next/server";
import { verifyOTP } from "@/lib/otp";
import { signIn } from "@/auth";

interface OTPVerifyRequest {
  recipient: string;
  code: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: OTPVerifyRequest = await request.json();
    const { recipient, code } = body;

    if (!recipient || !code) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Verify OTP
    const result = await verifyOTP(recipient, code);

    if (!result.valid) {
      return NextResponse.json(
        { error: result.error || "Invalid OTP" },
        { status: 400 }
      );
    }

    // OTP is valid - create session
    // For OTP login, we'll create a credentials-based session
    try {
      await signIn("credentials", {
        email: recipient,
        redirect: false,
      });

      return NextResponse.json({
        message: "OTP verified successfully",
        status: "verified",
        user: {
          email: recipient,
        },
      });
    } catch (signInError) {
      console.error("Session creation error:", signInError);
      
      // Fallback: return success but let client handle redirect
      return NextResponse.json({
        message: "OTP verified successfully",
        status: "verified",
        user: {
          email: recipient,
        },
      });
    }
  } catch (error) {
    console.error("OTP verify error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
