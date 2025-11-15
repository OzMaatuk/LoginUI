import { NextRequest, NextResponse } from "next/server";

interface OTPRequest {
  recipient: string;
  channel: "email" | "sms";
}

export async function POST(request: NextRequest) {
  try {
    const body: OTPRequest = await request.json();
    const { recipient, channel } = body;

    if (!recipient || !channel) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Generate 6-digit OTP
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    const otpProvider = process.env.OTP_PROVIDER || "mock";

    if (otpProvider === "external") {
      const externalServiceUrl = process.env.OTP_EXTERNAL_SERVICE_URL;

      if (!externalServiceUrl) {
        return NextResponse.json(
          { error: "External OTP service not configured" },
          { status: 500 }
        );
      }

      // Send OTP via external service
      const response = await fetch(externalServiceUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          recipient,
          code,
          channel,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return NextResponse.json(
          {
            error: errorData.error || "Failed to send OTP",
            message: errorData.message || "External service error",
          },
          { status: response.status }
        );
      }

      const data = await response.json();
      
      // Store OTP in session/database for verification
      // For now, we'll return success
      return NextResponse.json({
        message: "OTP sent successfully",
        status: "sent",
        messageId: data.messageId,
      });
    } else {
      // Mock provider - log to console
      console.log(`[OTP Mock] Sending OTP to ${recipient} via ${channel}: ${code}`);
      
      return NextResponse.json({
        message: "OTP sent successfully (mock)",
        status: "sent",
        code: process.env.NODE_ENV === "development" ? code : undefined,
      });
    }
  } catch (error) {
    console.error("OTP send error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
