"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import api from "@/lib/api";
import { AUTH_FORGOT_PASSWORD_URL } from "@/lib/config";
import { Loader2, ArrowLeft, Mail, CheckCircle } from "lucide-react";
import { useTranslation } from "@/src/services/i18n";
import { LanguageSwitcher } from "@/components/language-switcher";

const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const { t } = useTranslation("forgot-password");

  const form = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      await api.post(AUTH_FORGOT_PASSWORD_URL, data);
      setSuccess(true);
    } catch (error: unknown) {
      console.error("Forgot password error:", error);
      
      const axiosError = error as { response?: { status: number; data: { errors?: { email?: string } } } };
      if (axiosError.response?.status === 422) {
        const errorData = axiosError.response.data;
        if (errorData.errors?.email) {
          setError("Email not found");
        } else {
          setError("Invalid email address");
        }
      } else {
        setError("Failed to send reset email. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
        <div className="absolute top-4 right-4">
          <LanguageSwitcher />
        </div>
        <Card className="w-full max-w-md border-slate-700 bg-card card-glow">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold">
              {t("messages.success")}
            </CardTitle>
            <CardDescription>
              {t("messages.success")}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-muted-foreground mb-4">
              Check your inbox and follow the link to reset your password. 
              The link will expire in 30 minutes.
            </p>
            <p className="text-xs text-slate-400">
              Didn&apos;t receive an email? Check your spam folder or try again.
            </p>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Link href="/auth/login">
              <Button variant="outline" className="border-slate-600 hover:bg-slate-800">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to login
              </Button>
            </Link>
          </CardFooter>
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
            <Mail className="w-6 h-6 text-primary" />
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
        <CardFooter className="flex flex-col space-y-2">
          <p className="text-sm text-muted-foreground text-center">
            <Link href="/auth/login" className="text-primary hover:underline">
              {t("actions.back")}
            </Link>
          </p>
          <Link 
            href="/auth/login" 
            className="text-sm text-muted-foreground hover:text-foreground flex items-center"
          >
            <ArrowLeft className="mr-1 h-3 w-3" />
            {t("actions.back")}
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}