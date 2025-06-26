/**
 * ScheduleHeader Component
 *
 * Handles the top navigation and header for the schedule manager.
 * Includes branding, navigation tabs, and action buttons for saving and publishing schedules.
 */

"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import type { Schedule } from "@/types/schedule";
import Image from "next/image";

interface ScheduleHeaderProps {
  /** The currently selected schedule */
  selectedSchedule: Schedule;

  /** Whether a save operation is in progress */
  isSaving: boolean;

  /** Callback to handle back navigation */
  onBack: () => void;

  /** Callback to save the schedule as draft */
  onSaveDraft: () => void;

  /** Callback to publish the schedule */
  onPublish: () => void;
}

export function ScheduleHeader({
  selectedSchedule,
  isSaving,
  onBack,
  onSaveDraft,
  onPublish,
}: ScheduleHeaderProps) {
  return (
    <div className="border-b border-border bg-card">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-4">
          {/* Left side - Branding and Schedule Info */}
          <div className="flex items-center space-x-6">
            {/* Brand Logo */}
            <Image 
              src="/hostel-shifts.svg" 
              alt="HostelShifts" 
              width={160} 
              height={40}
              className="h-8 w-auto"
            />

            {/* Schedule Name */}
            <div className="text-lg font-medium text-foreground">
              Schedule Manager
            </div>
          </div>

          {/* Right side - Action Buttons */}
          <div className="flex space-x-3">
            {/* Back Button */}
            <Button variant="outline" onClick={onBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Schedules
            </Button>

            {/* Save Draft Button */}
            <Button variant="outline" onClick={onSaveDraft} disabled={isSaving}>
              {isSaving
                ? "Saving..."
                : selectedSchedule.status === "published"
                ? "Save as Draft"
                : "Save Draft"}
            </Button>

            {/* Publish/Save Button */}
            <Button
              className="bg-primary hover:bg-primary/90"
              onClick={onPublish}
              disabled={isSaving}
            >
              {isSaving
                ? "Saving..."
                : selectedSchedule.status === "published"
                ? "Save Schedule"
                : "Publish Schedule"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
