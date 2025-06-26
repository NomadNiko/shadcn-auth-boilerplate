"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { ScheduleShift } from "@/types/schedule";

interface EditShiftTimesDialogProps {
  /** The scheduled shift to edit */
  shift: ScheduleShift | null;
  /** Whether the dialog is open */
  open: boolean;
  /** Callback to close the dialog */
  onClose: () => void;
  /** Callback to update the shift times */
  onUpdateShiftTimes: (shiftId: string, times: { actualStartTime?: string; actualEndTime?: string }) => Promise<void>;
}

export function EditShiftTimesDialog({ 
  shift, 
  open, 
  onClose, 
  onUpdateShiftTimes 
}: EditShiftTimesDialogProps) {
  const [actualStartTime, setActualStartTime] = useState("");
  const [actualEndTime, setActualEndTime] = useState("");
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pre-populate form when shift changes
  useEffect(() => {
    if (shift) {
      // Use actual times if available, otherwise fall back to shift type template times
      setActualStartTime(shift.actualStartTime || shift.shiftType.startTime);
      setActualEndTime(shift.actualEndTime || shift.shiftType.endTime);
      setErrors({});
    }
  }, [shift]);

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};
    
    if (!actualStartTime) {
      newErrors.actualStartTime = "Start time is required";
    }
    
    if (!actualEndTime) {
      newErrors.actualEndTime = "End time is required";
    }
    
    // Time format validation (HH:MM)
    const timePattern = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (actualStartTime && !timePattern.test(actualStartTime)) {
      newErrors.actualStartTime = "Invalid time format (HH:MM)";
    }
    
    if (actualEndTime && !timePattern.test(actualEndTime)) {
      newErrors.actualEndTime = "Invalid time format (HH:MM)";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!shift || !validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Only send times that are different from the template
      const times: { actualStartTime?: string; actualEndTime?: string } = {};
      
      if (actualStartTime !== shift.shiftType.startTime) {
        times.actualStartTime = actualStartTime;
      }
      
      if (actualEndTime !== shift.shiftType.endTime) {
        times.actualEndTime = actualEndTime;
      }

      await onUpdateShiftTimes(shift.id, times);
      onClose();
    } catch (error) {
      console.error('Failed to update shift times:', error);
      // You could add error handling here if needed
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
      setErrors({});
    }
  };

  const calculateDuration = () => {
    if (!actualStartTime || !actualEndTime) return "";
    
    const start = new Date(`1970-01-01T${actualStartTime}:00`);
    let end = new Date(`1970-01-01T${actualEndTime}:00`);
    
    // Handle overnight shifts
    if (end <= start) {
      end = new Date(`1970-01-02T${actualEndTime}:00`);
    }
    
    const diffMs = end.getTime() - start.getTime();
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (minutes === 0) {
      return `${hours}h`;
    }
    return `${hours}h ${minutes}m`;
  };

  const isTimesChanged = () => {
    if (!shift) return false;
    return actualStartTime !== shift.shiftType.startTime || actualEndTime !== shift.shiftType.endTime;
  };

  if (!shift) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Shift Times</DialogTitle>
          <DialogDescription>
            Adjust the actual start and end times for this shift. Changes only apply to this specific shift instance.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {/* Shift Info */}
            <div className="grid gap-2">
              <div className="text-sm text-muted-foreground">
                <div className="font-medium">{shift.shiftType.name}</div>
                <div>{new Date(shift.date).toLocaleDateString()}</div>
                {shift.user && (
                  <div>{shift.user.firstName} {shift.user.lastName}</div>
                )}
              </div>
            </div>

            {/* Template Times Display */}
            <div className="grid gap-2">
              <div className="text-sm">
                <span className="font-medium">Template Times: </span>
                <span className="text-muted-foreground">
                  {shift.shiftType.startTime} - {shift.shiftType.endTime}
                </span>
              </div>
            </div>

            {/* Time Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-actualStartTime">Actual Start Time</Label>
                <Input
                  id="edit-actualStartTime"
                  type="time"
                  value={actualStartTime}
                  onChange={(e) => setActualStartTime(e.target.value)}
                  className={errors.actualStartTime ? "border-red-500" : ""}
                  disabled={isSubmitting}
                />
                {errors.actualStartTime && (
                  <span className="text-sm text-red-500">{errors.actualStartTime}</span>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-actualEndTime">Actual End Time</Label>
                <Input
                  id="edit-actualEndTime"
                  type="time"
                  value={actualEndTime}
                  onChange={(e) => setActualEndTime(e.target.value)}
                  className={errors.actualEndTime ? "border-red-500" : ""}
                  disabled={isSubmitting}
                />
                {errors.actualEndTime && (
                  <span className="text-sm text-red-500">{errors.actualEndTime}</span>
                )}
              </div>
            </div>

            {/* Duration Display */}
            {actualStartTime && actualEndTime && (
              <div className="text-sm text-muted-foreground">
                Duration: {calculateDuration()}
                {actualEndTime <= actualStartTime && (
                  <span className="text-blue-400 ml-2">(overnight shift)</span>
                )}
              </div>
            )}

            {/* Changes Indicator */}
            {isTimesChanged() && (
              <div className="text-sm text-blue-600 dark:text-blue-400">
                ✓ Times differ from template
              </div>
            )}
          </div>

          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="bg-blue-800 hover:bg-blue-700 text-blue-50 border-blue-700"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Updating...' : 'Update Times'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}