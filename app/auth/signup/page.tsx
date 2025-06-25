"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import api from "@/lib/api";
import { AUTH_REGISTER_URL } from "@/lib/config";
import { Eye, EyeOff, Loader2, ArrowLeft } from "lucide-react";
import { useTranslation } from "@/src/services/i18n";
import { LanguageSwitcher } from "@/components/language-switcher";

const signupSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type SignupFormData = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const { t } = useTranslation("sign-up");

  const form = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: SignupFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      // First register the user
      await api.post(AUTH_REGISTER_URL, data);
      
      // Show success message
      setSuccess(true);
      
      // Optionally auto-login after successful registration
      // For now, just redirect to login
      setTimeout(() => {
        router.push("/auth/login?message=Registration successful! Please sign in.");
      }, 2000);

    } catch (error: unknown) {
      console.error("Signup error:", error);
      
      const axiosError = error as { response?: { status: number; data: { errors?: { [key: string]: string } } } };
      if (axiosError.response?.status === 422) {
        const errorData = axiosError.response.data;
        if (errorData.errors?.email) {
          setError("Email already exists");
        } else {
          setError("Registration failed. Please check your information.");
        }
      } else {
        setError("Registration failed. Please try again.");
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
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-primary">
              {t("messages.success")}
            </CardTitle>
            <CardDescription>
              {t("messages.success")}
            </CardDescription>
          </CardHeader>
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
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("inputs.firstName.label")}</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder={t("inputs.firstName.placeholder")}
                          disabled={isLoading}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("inputs.lastName.label")}</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder={t("inputs.lastName.placeholder")}
                          disabled={isLoading}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
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
              {t("actions.signIn")}
            </Link>
          </p>
          <Link 
            href="/auth/login" 
            className="text-sm text-muted-foreground hover:text-foreground flex items-center"
          >
            <ArrowLeft className="mr-1 h-3 w-3" />
            Back to login
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}