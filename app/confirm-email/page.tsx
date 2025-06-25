"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import api from "@/lib/api";
import { AUTH_CONFIRM_EMAIL_URL } from "@/lib/config";
import { useAuthActions, useAuthTokens } from "@/hooks/use-auth";

function ConfirmEmailContent() {
  const [isLoading, setIsLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setUser } = useAuthActions();
  const { setTokensInfo } = useAuthTokens();

  useEffect(() => {
    const confirmEmail = async () => {
      const hash = searchParams.get("hash");

      if (!hash) {
        setError("Invalid confirmation link");
        setIsLoading(false);
        return;
      }

      try {
        const response = await api.post(AUTH_CONFIRM_EMAIL_URL, { hash });
        
        if (response.status === 200 && response.data) {
          const loginData = response.data;

          // Store tokens
          setTokensInfo({
            token: loginData.token,
            refreshToken: loginData.refreshToken,
            tokenExpires: loginData.tokenExpires,
          });

          // Set user data
          setUser(loginData.user);

          setSuccess(true);
          // Redirect to dashboard after 3 seconds
          setTimeout(() => {
            router.push("/dashboard");
          }, 3000);
        } else {
          setError("Email confirmation failed");
        }
      } catch (error: unknown) {
        console.error("Email confirmation error:", error);
        setError("Email confirmation failed. The link may be expired or invalid.");
      } finally {
        setIsLoading(false);
      }
    };

    confirmEmail();
  }, [searchParams, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md border-slate-700 bg-card card-glow">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
              <Loader2 className="w-6 h-6 text-primary animate-spin" />
            </div>
            <CardTitle className="text-2xl font-bold">
              Confirming Email
            </CardTitle>
            <CardDescription>
              Please wait while we verify your email address...
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md border-slate-700 bg-card card-glow">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-500" />
            </div>
            <CardTitle className="text-2xl font-bold text-green-500">
              Email Confirmed!
            </CardTitle>
            <CardDescription>
              Your email address has been successfully verified and you have been logged in. 
              You will be redirected to your dashboard shortly.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button 
              onClick={() => router.push("/dashboard")}
              className="w-full"
            >
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md border-slate-700 bg-card card-glow">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center">
            <XCircle className="w-6 h-6 text-red-500" />
          </div>
          <CardTitle className="text-2xl font-bold text-red-500">
            Confirmation Failed
          </CardTitle>
          <CardDescription>
            {error || "We couldn't verify your email address."}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-sm text-muted-foreground">
            The confirmation link may be expired or invalid. Please try requesting a new confirmation email.
          </p>
          <div className="space-y-2">
            <Button 
              onClick={() => router.push("/auth/signup")}
              className="w-full"
            >
              Request New Confirmation
            </Button>
            <Button 
              onClick={() => router.push("/auth/login")}
              variant="outline"
              className="w-full border-slate-600 hover:bg-slate-800"
            >
              Go to Login
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ConfirmEmailPage() {
  return (
    <Suspense 
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
          <Card className="w-full max-w-md border-slate-700 bg-card card-glow">
            <CardHeader className="text-center space-y-4">
              <div className="mx-auto w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-primary animate-spin" />
              </div>
              <CardTitle className="text-2xl font-bold">
                Loading...
              </CardTitle>
            </CardHeader>
          </Card>
        </div>
      }
    >
      <ConfirmEmailContent />
    </Suspense>
  );
}