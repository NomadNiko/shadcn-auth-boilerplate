/**
 * ScheduleHeader Component
 *
 * Handles the top navigation and header for the schedule manager.
 * Includes branding, navigation tabs, and action buttons for saving and publishing schedules.
 */

"use client";

import type { Schedule } from "@/types/schedule";

interface ScheduleHeaderProps {
  /** The currently selected schedule */
  selectedSchedule: Schedule;
}

export function ScheduleHeader({
  selectedSchedule
}: ScheduleHeaderProps) {
  return (
    <div className="border-b border-border bg-card">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center py-4">
          {/* Schedule Info */}
          <div className="text-center">
            <h2 className="text-xl font-semibold text-foreground">
              {selectedSchedule.name}
            </h2>
            <p className="text-sm text-muted-foreground">
              {new Date(selectedSchedule.startDate).toLocaleDateString()} - {new Date(selectedSchedule.endDate).toLocaleDateString()}
            </p>
            <span className={`inline-block px-2 py-1 text-xs rounded-full mt-1 ${
              selectedSchedule.status === 'published' 
                ? 'bg-green-900/30 text-green-300 border border-green-700/30'
                : 'bg-yellow-900/30 text-yellow-300 border border-yellow-700/30'
            }`}>
              {selectedSchedule.status.toUpperCase()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
