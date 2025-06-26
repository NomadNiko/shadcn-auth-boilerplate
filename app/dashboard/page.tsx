"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { User, Shield, Mail, UserPlus, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import api from "@/lib/api";
import { AUTH_INVITE_USER_URL } from "@/lib/config";
import { useTranslation } from "@/src/services/i18n";
import { LanguageSwitcher } from "@/components/language-switcher";
import { MyScheduleWidget } from "@/components/my-schedule-widget";

const inviteSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Please enter a valid email address"),
});

type InviteFormData = z.infer<typeof inviteSchema>;

export default function DashboardPage() {
  const { user, isLoaded } = useAuth();
  const router = useRouter();
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [isInviting, setIsInviting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);
  const { t } = useTranslation("dashboard");

  const inviteForm = useForm<InviteFormData>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
    },
  });


  const onInviteSubmit = async (data: InviteFormData) => {
    setIsInviting(true);
    setInviteError(null);
    setInviteSuccess(null);

    try {
      await api.post(AUTH_INVITE_USER_URL, data);
      setInviteSuccess(t("inviteDialog.messages.success"));
      inviteForm.reset();
      
      // Close dialog after 2 seconds
      setTimeout(() => {
        setIsInviteDialogOpen(false);
        setInviteSuccess(null);
      }, 2000);
    } catch (error: unknown) {
      console.error("Invite error:", error);
      
      const axiosError = error as { response?: { status: number; data: { errors?: { [key: string]: string } } } };
      if (axiosError.response?.status === 422) {
        const errorData = axiosError.response.data;
        if (errorData.errors?.email) {
          setInviteError(t("inviteDialog.messages.error"));
        } else {
          setInviteError("Please check the form data");
        }
      } else {
        setInviteError(t("inviteDialog.messages.error"));
      }
    } finally {
      setIsInviting(false);
    }
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    router.push("/auth/login");
    return null;
  }

  // User data should now be clean JSON from backend
  const userEmail = user.email || "N/A";
  const userFirstName = user.firstName || "";
  const userLastName = user.lastName || "";
  const userId = user._id || "N/A";
  const userRole = user.role || { _id: "unknown", id: "unknown" };
  const userStatus = user.status || { _id: "unknown", id: "unknown" };

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-foreground">
            {t("title")}
          </h1>
          <div className="flex space-x-3">
            <LanguageSwitcher />
            <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90">
                  <UserPlus className="mr-2 h-4 w-4" />
                  {t("actions.inviteUser")}
                </Button>
              </DialogTrigger>
              <DialogContent className="border-slate-700 bg-card">
                <DialogHeader>
                  <DialogTitle>{t("inviteDialog.title")}</DialogTitle>
                  <DialogDescription>
                    {t("inviteDialog.subtitle")}
                  </DialogDescription>
                </DialogHeader>
                <Form {...inviteForm}>
                  <form onSubmit={inviteForm.handleSubmit(onInviteSubmit)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={inviteForm.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("inviteDialog.inputs.firstName.label")}</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder={t("inviteDialog.inputs.firstName.placeholder")}
                                disabled={isInviting}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={inviteForm.control}
                        name="lastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("inviteDialog.inputs.lastName.label")}</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder={t("inviteDialog.inputs.lastName.placeholder")}
                                disabled={isInviting}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={inviteForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("inviteDialog.inputs.email.label")}</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="email"
                              placeholder={t("inviteDialog.inputs.email.placeholder")}
                              disabled={isInviting}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    {inviteError && (
                      <div className="text-sm text-red-400 bg-red-950/20 p-3 rounded-md border border-red-800/30">
                        {inviteError}
                      </div>
                    )}
                    
                    {inviteSuccess && (
                      <div className="text-sm text-green-400 bg-green-950/20 p-3 rounded-md border border-green-800/30">
                        {inviteSuccess}
                      </div>
                    )}
                    
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setIsInviteDialogOpen(false)} disabled={isInviting}>
                        {t("inviteDialog.actions.cancel")}
                      </Button>
                      <Button type="submit" disabled={isInviting}>
                        {isInviting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            {t("inviteDialog.actions.send")}...
                          </>
                        ) : (
                          t("inviteDialog.actions.send")
                        )}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="border-slate-700 bg-card card-glow">
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="mr-2 h-5 w-5" />
                {t("userInfo.title")}
              </CardTitle>
              <CardDescription>
                {t("userInfo.subtitle")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4 text-slate-400" />
                <span className="text-sm font-medium">{t("userInfo.email")}</span>
                <span className="text-sm">{userEmail}</span>
              </div>
              {userFirstName && (
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-slate-400" />
                  <span className="text-sm font-medium">{t("userInfo.name")}</span>
                  <span className="text-sm">{userFirstName} {userLastName}</span>
                </div>
              )}
              <div className="flex items-center space-x-2">
                <Shield className="h-4 w-4 text-slate-400" />
                <span className="text-sm font-medium">{t("userInfo.role")}</span>
                <span className={`text-sm px-2 py-1 rounded-full ${
                  userRole._id === "1" 
                    ? "bg-red-950/30 text-red-300 border border-red-800/30" 
                    : "bg-blue-950/30 text-blue-300 border border-blue-800/30"
                }`}>
                  {userRole._id === "1" ? t("userInfo.roles.admin") : t("userInfo.roles.user")}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium">{t("userInfo.status")}</span>
                <span className={`text-sm px-2 py-1 rounded-full ${
                  userStatus._id === "1" 
                    ? "bg-green-950/30 text-green-300 border border-green-800/30" 
                    : "bg-yellow-950/30 text-yellow-300 border border-yellow-800/30"
                }`}>
                  {userStatus._id === "1" ? t("userInfo.statuses.active") : t("userInfo.statuses.inactive")}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-700 bg-card card-glow">
            <CardHeader>
              <CardTitle>{t("welcomeCard.title")}</CardTitle>
              <CardDescription>
                {t("welcomeCard.subtitle")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                {t("welcomeCard.description")}
              </p>
              <div className="space-y-3 mb-4">
                <p className="text-xs text-slate-400">
                  <strong>{t("welcomeCard.userId")}</strong> {userId}
                </p>
                <p className="text-xs text-slate-400">
                  <strong>{t("welcomeCard.apiBackend")}</strong> http://localhost:3001
                </p>
                <p className="text-xs text-slate-400">
                  <strong>{t("welcomeCard.authentication")}</strong> {t("welcomeCard.authMethod")}
                </p>
              </div>
              <Button 
                onClick={() => router.push("/schedule-manager/assign")}
                className="w-full bg-primary hover:bg-primary/90"
              >
                Open Schedule Manager
              </Button>
            </CardContent>
          </Card>

          {/* My Schedule Widget */}
          <MyScheduleWidget />
        </div>
      </div>
    </div>
  );
}