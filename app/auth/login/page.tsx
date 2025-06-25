"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useAuthActions, useAuthTokens } from "@/hooks/use-auth";
import api from "@/lib/api";
import { AUTH_LOGIN_URL } from "@/lib/config";
import { LoginResponse } from "@/types/auth";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import Link from "next/link";
import { useTranslation } from "@/src/services/i18n";
import { LanguageSwitcher } from "@/components/language-switcher";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { setUser } = useAuthActions();
  const { setTokensInfo } = useAuthTokens();
  const { t } = useTranslation("sign-in");

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.post<LoginResponse>(AUTH_LOGIN_URL, data);
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
      console.error("Login error:", error);
      
      const axiosError = error as { response?: { status: number; data: { errors?: { email?: string; password?: string } } } };
      if (axiosError.response?.status === 422) {
        const errorData = axiosError.response.data;
        if (errorData.errors?.email) {
          setError("Email not found");
        } else if (errorData.errors?.password) {
          setError("Incorrect password");
        } else {
          setError("Invalid credentials");
        }
      } else {
        setError("Login failed. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
      </div>
      <Card className="w-full max-w-md border-slate-700 bg-card card-glow">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            {t("title")}
          </CardTitle>
          <CardDescription className="text-center">
            {t("subtitle")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("inputs.email.label")}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="email"
                        placeholder={t("inputs.email.placeholder")}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
              
              <div className="text-right">
                <Link 
                  href="/auth/forgot-password"
                  className="text-sm text-primary hover:underline"
                >
                  {t("actions.forgotPassword")}
                </Link>
              </div>
              
              {error && (
                <div className="text-sm text-red-400 bg-red-950/20 p-3 rounded-md border border-red-800/30">
                  {error}
                </div>
              )}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("actions.submit")}...
                  </>
                ) : (
                  t("actions.submit")
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              <Link href="/auth/signup" className="text-primary hover:underline">
                {t("actions.createAccount")}
              </Link>
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-slate-400">
              Test credentials: admin@nomadsoft.us / secret
            </p>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}