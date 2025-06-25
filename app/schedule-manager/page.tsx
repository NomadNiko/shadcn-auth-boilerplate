"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ScheduleManagerPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the required shifts page (first step)
    router.replace("/schedule-manager/required-shifts");
  }, [router]);

  return null;
}