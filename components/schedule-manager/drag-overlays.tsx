/**
 * DragOverlay Components
 * 
 * Collection of drag overlay components for different draggable items.
 * Shows preview during drag operations.
 */

"use client";

import type { ShiftType, ScheduleShift, Employee } from "@/types/schedule";
import { shiftTypeColors } from "@/types/schedule";

interface ShiftTypeDragOverlayProps {
  /** The shift type being dragged */
  shiftType: ShiftType;
  
  /** Whether this is part of a multi-selection */
  isMultiSelect: boolean;
  
  /** Total number of selected shift types */
  selectedCount: number;
  
  /** Quantity for this shift type */
  quantity: number;
  
  /** Total quantity across all selected shift types */
  totalQuantity?: number;
}

/**
 * Drag overlay for shift type components
 */
export function ShiftTypeDragOverlay({
  shiftType,
  isMultiSelect,
  selectedCount,
  quantity,
  totalQuantity
}: ShiftTypeDragOverlayProps) {
  if (isMultiSelect) {
    return (
      <div className="relative">
        <div className={`rounded-lg border p-2 ${shiftTypeColors[shiftType.colorIndex]}`}>
          <div className="text-sm font-medium">{selectedCount} shift types</div>
          <div className="text-xs opacity-90">{totalQuantity} total shifts</div>
        </div>
        <div className="absolute -top-1 -right-1 bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
          {selectedCount}
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className={`rounded-lg border p-2 ${shiftTypeColors[shiftType.colorIndex]}`}>
        <div className="text-sm font-medium">{shiftType.name}</div>
        <div className="text-xs opacity-90">{shiftType.startTime} - {shiftType.endTime}</div>
      </div>
      {quantity > 1 && (
        <div className="absolute -top-1 -right-1 bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
          {quantity}
        </div>
      )}
    </div>
  );
}

interface ScheduleShiftDragOverlayProps {
  /** The shift being dragged */
  shift: ScheduleShift;
}

/**
 * Drag overlay for schedule shift components
 */
export function ScheduleShiftDragOverlay({ shift }: ScheduleShiftDragOverlayProps) {
  return (
    <div className={`text-xs p-2 rounded border ${shiftTypeColors[shift.shiftType.colorIndex]}`}>
      <div className="font-medium">{shift.shiftType.name}</div>
      <div className="opacity-90">{shift.shiftType.startTime} - {shift.shiftType.endTime}</div>
      {shift.user && (
        <div className="opacity-80">{shift.user.firstName} {shift.user.lastName}</div>
      )}
    </div>
  );
}

interface EmployeeDragOverlayProps {
  /** The employee being dragged */
  employee: Employee;
}

/**
 * Drag overlay for employee components
 */
export function EmployeeDragOverlay({ employee }: EmployeeDragOverlayProps) {
  return (
    <div className="flex items-center space-x-2 p-2 bg-card border rounded-lg">
      <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white text-xs">
        {employee.firstName[0]}
      </div>
      <div className="text-sm">{employee.firstName} {employee.lastName}</div>
    </div>
  );
}