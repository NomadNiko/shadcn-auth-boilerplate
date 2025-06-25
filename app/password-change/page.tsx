"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import api from "@/lib/api";
import { AUTH_RESET_PASSWORD_URL } from "@/lib/config";
import { Eye, EyeOff, Loader2, ArrowLeft, AlertTriangle, Key } from "lucide-react";

const passwordChangeSchema = z.object({
  password: z.string().min(6, "Password must be at least 6 characters"),
  passwordConfirmation: z.string().min(6, "Password confirmation is required"),
}).refine((data) => data.password === data.passwordConfirmation, {
  message: "Passwords don't match",
  path: ["passwordConfirmation"],
});

type PasswordChangeFormData = z.infer<typeof passwordChangeSchema>;

function PasswordChangeContent() {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(() => Date.now());
  const router = useRouter();
  const searchParams = useSearchParams();

  const hash = searchParams.get("hash");
  const expires = useMemo(() => {
    const expiresParam = searchParams.get("expires");
    return expiresParam ? Number(expiresParam) * 1000 : null; // Convert to milliseconds
  }, [searchParams]);

  const form = useForm<PasswordChangeFormData>({
    resolver: zodResolver(passwordChangeSchema),
    defaultValues: {
      password: "",
      passwordConfirmation: "",
    },
  });

  // Update current time every second to check expiration
  useEffect(() => {
    if (!expires) return;

    const interval = setInterval(() => {
      const now = Date.now();
      setCurrentTime(now);

      if (expires < now) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [expires]);

  const isExpired = expires ? expires < currentTime : false;

  const onSubmit = async (data: PasswordChangeFormData) => {
    if (!hash) {
      setError("Invalid reset link");
      return;
    }

    if (isExpired) {
      setError("Reset link has expired");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await api.post(AUTH_RESET_PASSWORD_URL, {
        password: data.password,
        hash,
      });

      if (response.status === 204) {
        router.push("/auth/login?message=Password reset successfully! Please sign in with your new password.");
      } else {
        setError("Failed to reset password. Please try again.");
      }
    } catch (error: unknown) {
      console.error("Password reset error:", error);
      
      const axiosError = error as { response?: { status: number; data: { errors?: { [key: string]: string } } } };
      if (axiosError.response?.status === 422) {
        const errorData = axiosError.response.data;
        if (errorData.errors?.password) {
          form.setError("password", { message: errorData.errors.password });
        } else {
          setError("Invalid or expired reset link");
        }
      } else {
        setError("Failed to reset password. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!hash) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md border-slate-700 bg-card card-glow">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-500" />
            </div>
            <CardTitle className="text-2xl font-bold text-red-500">
              Invalid Reset Link
            </CardTitle>
            <CardDescription>
              The password reset link is invalid or missing required parameters.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Link href="/auth/forgot-password">
              <Button className="w-full">
                Request New Reset Link
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md border-slate-700 bg-card card-glow">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mb-4">
            <Key className="w-6 h-6 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">
            Reset Your Password
          </CardTitle>
          <CardDescription>
            Enter your new password below
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isExpired && (
            <Alert className="mb-4 border-red-800/30 bg-red-950/20">
              <AlertTriangle className="h-4 w-4 text-red-400" />
              <AlertDescription className="text-red-400">
                This password reset link has expired. Please request a new one.
              </AlertDescription>
            </Alert>
          )}
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          {...field}
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter your new password"
                          disabled={isLoading || isExpired}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                          disabled={isLoading || isExpired}
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
                    <FormLabel>Confirm New Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          {...field}
                          type={showPasswordConfirmation ? "text" : "password"}
                          placeholder="Confirm your new password"
                          disabled={isLoading || isExpired}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowPasswordConfirmation(!showPasswordConfirmation)}
                          disabled={isLoading || isExpired}
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
                disabled={isLoading || isExpired}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Resetting password...
                  </>
                ) : (
                  "Reset Password"
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <p className="text-sm text-muted-foreground text-center">
            Remember your password?{" "}
            <Link href="/auth/login" className="text-primary hover:underline">
              Sign in
            </Link>
          </p>
          <Link 
            href="/auth/forgot-password" 
            className="text-sm text-muted-foreground hover:text-foreground flex items-center"
          >
            <ArrowLeft className="mr-1 h-3 w-3" />
            Request new reset link
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}

export default function PasswordChangePage() {
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
      <PasswordChangeContent />
    </Suspense>
  );
}