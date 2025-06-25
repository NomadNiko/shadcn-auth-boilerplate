"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import api from "@/lib/api";
import { AUTH_CONFIRM_EMAIL_URL } from "@/lib/config";
import { useAuthActions, useAuthTokens } from "@/hooks/use-auth";
import { useTranslation } from "@/src/services/i18n";
import { LanguageSwitcher } from "@/components/language-switcher";

function ConfirmEmailContent() {
  const [isLoading, setIsLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setUser } = useAuthActions();
  const { setTokensInfo } = useAuthTokens();
  const { t } = useTranslation("confirm-email");

  useEffect(() => {
    const confirmEmail = async () => {
      const hash = searchParams.get("hash");

      if (!hash) {
        setError(t("error.message"));
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
          setError(t("error.message"));
        }
      } catch (error: unknown) {
        console.error("Email confirmation error:", error);
        setError(t("error.message"));
      } finally {
        setIsLoading(false);
      }
    };

    confirmEmail();
  }, [searchParams, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
        <div className="absolute top-4 right-4">
          <LanguageSwitcher />
        </div>
        <Card className="w-full max-w-md border-slate-700 bg-card card-glow">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
              <Loader2 className="w-6 h-6 text-primary animate-spin" />
            </div>
            <CardTitle className="text-2xl font-bold">
              {t("confirming.title")}
            </CardTitle>
            <CardDescription>
              {t("confirming.message")}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
        <div className="absolute top-4 right-4">
          <LanguageSwitcher />
        </div>
        <Card className="w-full max-w-md border-slate-700 bg-card card-glow">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-500" />
            </div>
            <CardTitle className="text-2xl font-bold text-green-500">
              {t("success.title")}
            </CardTitle>
            <CardDescription>
              {t("success.message")}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button 
              onClick={() => router.push("/dashboard")}
              className="w-full"
            >
              {t("success.action")}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
      </div>
      <Card className="w-full max-w-md border-slate-700 bg-card card-glow">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center">
            <XCircle className="w-6 h-6 text-red-500" />
          </div>
          <CardTitle className="text-2xl font-bold text-red-500">
            {t("error.title")}
          </CardTitle>
          <CardDescription>
            {error || t("error.message")}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-sm text-muted-foreground">
            {t("error.description")}
          </p>
          <div className="space-y-2">
            <Button 
              onClick={() => router.push("/auth/signup")}
              className="w-full"
            >
              {t("error.actions.requestNew")}
            </Button>
            <Button 
              onClick={() => router.push("/auth/login")}
              variant="outline"
              className="w-full border-slate-600 hover:bg-slate-800"
            >
              {t("error.actions.signIn")}
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