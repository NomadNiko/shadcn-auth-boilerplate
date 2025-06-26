/**
 * CalendarHeader Component
 * 
 * Renders the calendar header showing week days and dates.
 * Includes navigation controls for switching weeks.
 */

"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight } from "lucide-react";

interface CalendarHeaderProps {
  /** Name of the current schedule */
  scheduleName: string;
  
  /** Callback for previous week navigation */
  onPreviousWeek?: () => void;
  
  /** Callback for next week navigation */
  onNextWeek?: () => void;
}

export function CalendarHeader({
  scheduleName,
  onPreviousWeek,
  onNextWeek
}: CalendarHeaderProps) {
  return (
    <div className="mb-4 flex items-center justify-center space-x-4">
      <Button 
        variant="outline" 
        size="sm"
        onClick={onPreviousWeek}
        disabled={!onPreviousWeek}
      >
        <ArrowLeft className="w-4 h-4" />
      </Button>
      <h2 className="text-lg font-semibold">{scheduleName}</h2>
      <Button 
        variant="outline" 
        size="sm"
        onClick={onNextWeek}
        disabled={!onNextWeek}
      >
        <ArrowRight className="w-4 h-4" />
      </Button>
    </div>
  );
}