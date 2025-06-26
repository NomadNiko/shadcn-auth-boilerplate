"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth, useAuthActions } from "@/hooks/use-auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { LogOut, LayoutDashboard, Calendar, CalendarDays } from "lucide-react";

export function GlobalNav() {
  const { user, isLoaded } = useAuth();
  const { logOut } = useAuthActions();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await logOut();
    router.push("/auth/login");
  };

  // Don't render nav if auth is not loaded or user is not authenticated
  if (!isLoaded || !user) {
    return null;
  }

  const userInitials = user.firstName && user.lastName 
    ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
    : user.email?.[0]?.toUpperCase() || "U";

  return (
    <nav className="border-b border-border bg-card">
      <div className="mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left - Logo */}
          <div className="flex-shrink-0">
            <Link href="/dashboard">
              <Image
                src="/hostel-shifts.svg"
                alt="HostelShifts"
                width={160}
                height={40}
                className="h-8 w-auto"
              />
            </Link>
          </div>

          {/* Center - Site Title */}
          <div className="absolute left-1/2 transform -translate-x-1/2">
            <h1 className="text-xl font-semibold text-foreground">
              HostelShifts
            </h1>
          </div>

          {/* Right - User Menu */}
          <div className="flex items-center">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-10 w-10 rounded-full bg-primary hover:bg-primary/90"
                >
                  <span className="text-sm font-medium text-white">
                    {userInitials}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard" className="cursor-pointer">
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    <span>Dashboard</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/my-schedule" className="cursor-pointer">
                    <CalendarDays className="mr-2 h-4 w-4" />
                    <span>My Schedule</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/schedule-manager" className="cursor-pointer">
                    <Calendar className="mr-2 h-4 w-4" />
                    <span>Schedule Manager</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="cursor-pointer"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>{isLoggingOut ? "Logging out..." : "Log out"}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  );
}