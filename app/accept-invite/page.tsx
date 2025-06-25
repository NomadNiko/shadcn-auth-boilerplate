"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import api from "@/lib/api";
import { AUTH_ACCEPT_INVITE_URL } from "@/lib/config";
import { useAuthActions, useAuthTokens } from "@/hooks/use-auth";
import { useTranslation } from "@/src/services/i18n";
import { LanguageSwitcher } from "@/components/language-switcher";
import { Eye, EyeOff, Loader2, AlertTriangle, UserPlus } from "lucide-react";

const acceptInviteSchema = z.object({
  password: z.string().min(6, "Password must be at least 6 characters"),
  passwordConfirmation: z.string().min(6, "Password confirmation is required"),
}).refine((data) => data.password === data.passwordConfirmation, {
  message: "Passwords don't match",
  path: ["passwordConfirmation"],
});

type AcceptInviteFormData = z.infer<typeof acceptInviteSchema>;

function AcceptInviteContent() {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setUser } = useAuthActions();
  const { setTokensInfo } = useAuthTokens();
  const { t } = useTranslation("accept-invite");

  const hash = searchParams.get("hash");

  const form = useForm<AcceptInviteFormData>({
    resolver: zodResolver(acceptInviteSchema),
    defaultValues: {
      password: "",
      passwordConfirmation: "",
    },
  });

  const onSubmit = async (data: AcceptInviteFormData) => {
    if (!hash) {
      setError("Invalid invite link");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await api.post(AUTH_ACCEPT_INVITE_URL, {
        password: data.password,
        hash,
      });

      const loginData = response.data;

      // Store tokens
      setTokensInfo({
        token: loginData.token,
        refreshToken: loginData.refreshToken,
        tokenExpires: loginData.tokenExpires,
      });

      // Set user data
      setUser(loginData.user);

      // Redirect to dashboard
      router.push("/dashboard");
    } catch (error: unknown) {
      console.error("Accept invite error:", error);
      
      const axiosError = error as { response?: { status: number; data: { errors?: { [key: string]: string } } } };
      if (axiosError.response?.status === 422) {
        const errorData = axiosError.response.data;
        if (errorData.errors?.hash) {
          setError(t("messages.invalidInvite"));
        } else if (errorData.errors?.password) {
          form.setError("password", { message: errorData.errors.password });
        } else {
          setError(t("messages.invalidInvite"));
        }
      } else if (axiosError.response?.status === 404) {
        setError("Invalid or expired invite link");
      } else {
        setError(t("messages.error"));
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!hash) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
        <div className="absolute top-4 right-4">
          <LanguageSwitcher />
        </div>
        <Card className="w-full max-w-md border-slate-700 bg-card card-glow">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-500" />
            </div>
            <CardTitle className="text-2xl font-bold text-red-500">
              Invalid Invite Link
            </CardTitle>
            <CardDescription>
              The invite link is invalid or missing required parameters.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Link href="/auth/login">
              <Button className="w-full">
                Go to Login
              </Button>
            </Link>
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
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mb-4">
            <UserPlus className="w-6 h-6 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">
            {t("title")}
          </CardTitle>
          <CardDescription>
            {t("subtitle")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("inputs.password.label")}</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          {...field}
                          type={showPassword ? "text" : "password"}
                          placeholder={t("inputs.password.placeholder")}
                          disabled={isLoading}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                          disabled={isLoading}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="passwordConfirmation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          {...field}
                          type={showPasswordConfirmation ? "text" : "password"}
                          placeholder="Confirm your password"
                          disabled={isLoading}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowPasswordConfirmation(!showPasswordConfirmation)}
                          disabled={isLoading}
                        >
                          {showPasswordConfirmation ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {error && (
                <div className="text-sm text-red-400 bg-red-950/20 p-3 rounded-md border border-red-800/30">
                  {error}
                </div>
              )}
              
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Completing sign-up...
                  </>
                ) : (
                  "Complete Sign-up"
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <p className="text-sm text-muted-foreground text-center">
            Already have an account?{" "}
            <Link href="/auth/login" className="text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}

export default function AcceptInvitePage() {
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
      <AcceptInviteContent />
    </Suspense>
  );
}