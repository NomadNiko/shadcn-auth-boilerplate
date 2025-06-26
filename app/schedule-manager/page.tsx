"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ScheduleManagerPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the assign page
    router.replace("/schedule-manager/assign");
  }, [router]);

  return null;
}