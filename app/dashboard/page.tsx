"use client";

import { useAuth, useAuthActions } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { User, LogOut, Shield, Mail } from "lucide-react";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const { user, isLoaded } = useAuth();
  const { logOut } = useAuthActions();
  const router = useRouter();

  const handleLogout = async () => {
    await logOut();
    router.push("/auth/login");
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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-foreground">
            <span className="text-primary">HostelShifts</span> Dashboard
          </h1>
          <Button onClick={handleLogout} variant="outline" className="border-slate-600 hover:bg-slate-800">
            <LogOut className="mr-2 h-4 w-4" />
            Sign out
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-slate-700 bg-card card-glow">
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="mr-2 h-5 w-5" />
                User Information
              </CardTitle>
              <CardDescription>
                Your account details and profile information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4 text-slate-400" />
                <span className="text-sm font-medium">Email:</span>
                <span className="text-sm">{userEmail}</span>
              </div>
              {userFirstName && (
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-slate-400" />
                  <span className="text-sm font-medium">Name:</span>
                  <span className="text-sm">{userFirstName} {userLastName}</span>
                </div>
              )}
              <div className="flex items-center space-x-2">
                <Shield className="h-4 w-4 text-slate-400" />
                <span className="text-sm font-medium">Role:</span>
                <span className={`text-sm px-2 py-1 rounded-full ${
                  userRole._id === "1" 
                    ? "bg-red-950/30 text-red-300 border border-red-800/30" 
                    : "bg-blue-950/30 text-blue-300 border border-blue-800/30"
                }`}>
                  {userRole._id === "1" ? "Admin" : "User"}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium">Status:</span>
                <span className={`text-sm px-2 py-1 rounded-full ${
                  userStatus._id === "1" 
                    ? "bg-green-950/30 text-green-300 border border-green-800/30" 
                    : "bg-yellow-950/30 text-yellow-300 border border-yellow-800/30"
                }`}>
                  {userStatus._id === "1" ? "Active" : "Inactive"}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-700 bg-card card-glow">
            <CardHeader>
              <CardTitle>Welcome to <span className="text-primary">HostelShifts</span></CardTitle>
              <CardDescription>
                You are successfully authenticated and logged in
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                This is a demo dashboard showing your authentication status. The authentication system is working correctly with the NestJS backend.
              </p>
              <div className="space-y-2">
                <p className="text-xs text-slate-400">
                  <strong>User ID:</strong> {userId}
                </p>
                <p className="text-xs text-slate-400">
                  <strong>API Backend:</strong> http://localhost:3001
                </p>
                <p className="text-xs text-slate-400">
                  <strong>Authentication:</strong> JWT with refresh tokens
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}