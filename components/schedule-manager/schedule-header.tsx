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
  onPublish
}: ScheduleHeaderProps) {
  
  return (
    <div className="border-b border-border bg-card">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-4">
          {/* Left side - Branding and Schedule Info */}
          <div className="flex items-center space-x-6">
            {/* Brand Logo and Title */}
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <div className="w-4 h-4 bg-white rounded-sm"></div>
              </div>
              <span className="text-xl font-semibold">Schedule Manager</span>
            </div>
            
            {/* Schedule Name */}
            <div className="text-lg font-medium text-foreground">
              {selectedSchedule.name}
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
            <Button 
              variant="outline" 
              onClick={onSaveDraft}
              disabled={isSaving}
            >
              {isSaving 
                ? 'Saving...' 
                : (selectedSchedule.status === 'published' ? 'Save as Draft' : 'Save Draft')
              }
            </Button>
            
            {/* Publish/Save Button */}
            <Button 
              className="bg-primary hover:bg-primary/90" 
              onClick={onPublish}
              disabled={isSaving}
            >
              {isSaving 
                ? 'Saving...' 
                : (selectedSchedule.status === 'published' ? 'Save Schedule' : 'Publish Schedule')
              }
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}