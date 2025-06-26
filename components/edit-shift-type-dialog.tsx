"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { shiftTypeColors } from "@/types/schedule";
import type { ShiftType } from "@/types/schedule";

interface EditShiftTypeDialogProps {
  /** The shift type to edit */
  shiftType: ShiftType | null;
  /** Whether the dialog is open */
  open: boolean;
  /** Callback to close the dialog */
  onClose: () => void;
  /** Callback to update the shift type */
  onUpdateShiftType: (id: string, shiftType: Omit<ShiftType, 'id' | 'isActive'>) => Promise<void>;
}

export function EditShiftTypeDialog({ 
  shiftType, 
  open, 
  onClose, 
  onUpdateShiftType 
}: EditShiftTypeDialogProps) {
  const [name, setName] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");
  const [colorIndex, setColorIndex] = useState(0);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pre-populate form when shift type changes
  useEffect(() => {
    if (shiftType) {
      setName(shiftType.name);
      setStartTime(shiftType.startTime);
      setEndTime(shiftType.endTime);
      setColorIndex(shiftType.colorIndex);
      setErrors({});
    }
  }, [shiftType]);

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};
    
    if (!name.trim()) {
      newErrors.name = "Name is required";
    }
    
    if (!startTime) {
      newErrors.startTime = "Start time is required";
    }
    
    if (!endTime) {
      newErrors.endTime = "End time is required";
    }
    
    // Time format validation (HH:MM)
    const timePattern = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (startTime && !timePattern.test(startTime)) {
      newErrors.startTime = "Invalid time format (HH:MM)";
    }
    
    if (endTime && !timePattern.test(endTime)) {
      newErrors.endTime = "Invalid time format (HH:MM)";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!shiftType || !validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const updatedShiftType: Omit<ShiftType, 'id' | 'isActive'> = {
        name: name.trim(),
        startTime,
        endTime,
        colorIndex
      };

      await onUpdateShiftType(shiftType.id, updatedShiftType);
      onClose();
    } catch (error) {
      console.error('Failed to update shift type:', error);
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

  const nextColor = () => {
    setColorIndex((prev) => (prev + 1) % 10);
  };

  const prevColor = () => {
    setColorIndex((prev) => (prev - 1 + 10) % 10);
  };

  const calculateDuration = () => {
    if (!startTime || !endTime) return "";
    
    const start = new Date(`1970-01-01T${startTime}:00`);
    let end = new Date(`1970-01-01T${endTime}:00`);
    
    // Handle overnight shifts
    if (end <= start) {
      end = new Date(`1970-01-02T${endTime}:00`);
    }
    
    const diffMs = end.getTime() - start.getTime();
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (minutes === 0) {
      return `${hours}h`;
    }
    return `${hours}h ${minutes}m`;
  };

  if (!shiftType) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Shift Type</DialogTitle>
          <DialogDescription>
            Update the shift type template. Existing scheduled shifts will keep their current values.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {/* Name Field */}
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Front Desk Morning"
                className={errors.name ? "border-red-500" : ""}
                disabled={isSubmitting}
              />
              {errors.name && (
                <span className="text-sm text-red-500">{errors.name}</span>
              )}
            </div>

            {/* Time Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-startTime">Start Time</Label>
                <Input
                  id="edit-startTime"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className={errors.startTime ? "border-red-500" : ""}
                  disabled={isSubmitting}
                />
                {errors.startTime && (
                  <span className="text-sm text-red-500">{errors.startTime}</span>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-endTime">End Time</Label>
                <Input
                  id="edit-endTime"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className={errors.endTime ? "border-red-500" : ""}
                  disabled={isSubmitting}
                />
                {errors.endTime && (
                  <span className="text-sm text-red-500">{errors.endTime}</span>
                )}
              </div>
            </div>

            {/* Duration Display */}
            {startTime && endTime && (
              <div className="text-sm text-muted-foreground">
                Duration: {calculateDuration()}
                {endTime <= startTime && (
                  <span className="text-blue-400 ml-2">(overnight shift)</span>
                )}
              </div>
            )}

            {/* Color Picker */}
            <div className="grid gap-2">
              <Label>Color</Label>
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={prevColor}
                  className="h-8 w-8 p-0"
                  disabled={isSubmitting}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                
                <div className={`flex-1 p-3 rounded-lg border text-center ${shiftTypeColors[colorIndex]}`}>
                  <div className="text-sm font-medium">{name || 'Sample Shift'}</div>
                  <div className="text-xs opacity-90">{startTime} - {endTime}</div>
                </div>
                
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={nextColor}
                  className="h-8 w-8 p-0"
                  disabled={isSubmitting}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <div className="text-xs text-muted-foreground text-center">
                Color {colorIndex + 1} of 10
              </div>
            </div>
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
              {isSubmitting ? 'Updating...' : 'Update Shift Type'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}