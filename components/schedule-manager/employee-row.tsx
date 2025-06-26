/**
 * EmployeeRow Component
 * 
 * Renders a single employee row in the calendar grid with their assigned shifts.
 * Includes the employee name cell and droppable day cells for shift assignment.
 */

"use client";

import type { Employee, ScheduleShift } from "@/types/schedule";
import { DroppableEmployeeDay } from "./droppable-day-cell";
import { DraggableScheduleShift } from "./draggable-schedule-shift";

interface EmployeeRowProps {
  /** The employee for this row */
  employee: Employee;
  
  /** Array of week day labels */
  weekDays: string[];
  
  /** Callback to get assigned shifts for a specific day */
  getAssignedShiftsForDay: (dayIndex: number) => ScheduleShift[];
  
  // TEMPORARY: Click-to-move functionality
  selectedShiftForMove?: ScheduleShift | null;
  onShiftClickToMove?: (shift: ScheduleShift) => void;
  onClickToPlaceShift?: (employeeId: string, dayIndex: number) => void;
}

/**
 * Employee name cell component
 */
function EmployeeNameCell({ employee }: { employee: Employee }) {
  return (
    <div className="bg-muted/50 p-2 border-r border-border">
      <div className="flex items-center space-x-2">
        <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white text-xs flex-shrink-0">
          {employee.firstName[0]}
        </div>
        <div className="min-w-0">
          <div className="text-sm font-medium truncate">{employee.firstName}</div>
          <div className="text-xs text-muted-foreground truncate">{employee.lastName}</div>
        </div>
      </div>
    </div>
  );
}

export function EmployeeRow({
  employee,
  weekDays,
  getAssignedShiftsForDay,
  selectedShiftForMove,
  onShiftClickToMove,
  onClickToPlaceShift
}: EmployeeRowProps) {
  return (
    <div className="contents">
      {/* Employee Name Column */}
      <EmployeeNameCell employee={employee} />

      {/* Day Cells for Employee */}
      {weekDays.map((_, dayIndex) => (
        <DroppableEmployeeDay
          key={`${employee.id}-${dayIndex}`}
          employeeId={employee.id}
          dayIndex={dayIndex}
          onClickToPlace={onClickToPlaceShift}
          hasSelectedShift={!!selectedShiftForMove}
        >
          {getAssignedShiftsForDay(dayIndex).map((shift) => (
            <DraggableScheduleShift 
              key={shift.id} 
              shift={shift}
              isClickSelected={selectedShiftForMove?.id === shift.id}
              onClickSelect={onShiftClickToMove}
            />
          ))}
        </DroppableEmployeeDay>
      ))}
    </div>
  );
}