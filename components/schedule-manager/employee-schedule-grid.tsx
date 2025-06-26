/**
 * EmployeeScheduleGrid Component - Refactored
 * 
 * Renders the main calendar grid using smaller, focused components.
 * Much cleaner and more maintainable than the previous monolithic version.
 */

"use client";

import type { Employee, ScheduleShift, Schedule } from "@/types/schedule";
import { CalendarHeader } from "./calendar-header";
import { CalendarGridHeader } from "./calendar-grid-header";
import { EmployeeRow } from "./employee-row";
import { UnassignedShiftsRow } from "./unassigned-shifts-row";
import { EmptyEmployeeState } from "./empty-employee-state";

interface EmployeeScheduleGridProps {
  /** The currently selected schedule */
  selectedSchedule: Schedule;
  
  /** Array of week dates in YYYY-MM-DD format */
  weekDates: string[];
  
  /** Array of employees who have assigned shifts */
  assignedEmployees: Employee[];
  
  /** Set of selected required shifts */
  selectedRequiredShifts: Set<string>;
  
  /** Whether there are unsaved changes */
  hasChanges?: boolean;
  
  /** Type of currently dragged item */
  draggedItemType?: string;
  
  /** Callback to get assigned shifts for a specific employee and day */
  getAssignedShiftsForEmployeeAndDay: (employeeId: string, dayIndex: number) => ScheduleShift[];
  
  /** Callback to get unassigned shifts for a specific day */
  getUnassignedShiftsForDay: (dayIndex: number) => ScheduleShift[];
  
  /** Callback to handle required shift selection */
  onRequiredShiftSelect: (shift: ScheduleShift, selected: boolean) => void;
  
  /** Callback to clear selected required shifts */
  onClearSelectedRequiredShifts: () => void;
  
  // TEMPORARY: Click-to-move functionality
  selectedShiftForMove?: ScheduleShift | null;
  onShiftClickToMove?: (shift: ScheduleShift) => void;
  onClickToPlaceShift?: (employeeId: string, dayIndex: number) => void;
  onClickToUnassignShift?: (dayIndex: number) => void;
}

const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function EmployeeScheduleGrid({
  selectedSchedule,
  weekDates,
  assignedEmployees,
  selectedRequiredShifts,
  hasChanges = false,
  draggedItemType,
  getAssignedShiftsForEmployeeAndDay,
  getUnassignedShiftsForDay,
  onRequiredShiftSelect,
  onClearSelectedRequiredShifts,
  // TEMPORARY: Click-to-move functionality
  selectedShiftForMove,
  onShiftClickToMove,
  onClickToPlaceShift,
  onClickToUnassignShift
}: EmployeeScheduleGridProps) {
  
  /**
   * Get assigned shifts for a specific employee and day
   */
  const getShiftsForEmployeeDay = (employee: Employee) => 
    (dayIndex: number) => getAssignedShiftsForEmployeeAndDay(employee.id, dayIndex);

  return (
    <div className="col-span-9">
      {/* Calendar Navigation and Header */}
      <CalendarHeader
        scheduleName={selectedSchedule.name}
        scheduleStatus={selectedSchedule.status}
        hasChanges={hasChanges}
      />

      {/* Calendar Grid */}
      <div className="grid grid-cols-8 gap-1 border border-border rounded-lg overflow-hidden">
        {/* Grid Header Row */}
        <CalendarGridHeader weekDates={weekDates} />

        {/* Employee Rows */}
        {assignedEmployees.map((employee) => (
          <EmployeeRow
            key={employee.id}
            employee={employee}
            weekDays={weekDays}
            getAssignedShiftsForDay={getShiftsForEmployeeDay(employee)}
            selectedShiftForMove={selectedShiftForMove}
            onShiftClickToMove={onShiftClickToMove}
            onClickToPlaceShift={onClickToPlaceShift}
          />
        ))}

        {/* Empty State when no assigned employees */}
        {assignedEmployees.length === 0 && (
          <EmptyEmployeeState weekDays={weekDays} />
        )}

        {/* Unassigned Shifts Row */}
        <UnassignedShiftsRow
          weekDays={weekDays}
          selectedRequiredShifts={selectedRequiredShifts}
          draggedItemType={draggedItemType}
          getUnassignedShiftsForDay={getUnassignedShiftsForDay}
          onRequiredShiftSelect={onRequiredShiftSelect}
          onClearSelectedRequiredShifts={onClearSelectedRequiredShifts}
          selectedShiftForMove={selectedShiftForMove}
          onShiftClickToMove={onShiftClickToMove}
          onClickToUnassignShift={onClickToUnassignShift}
        />
      </div>
    </div>
  );
}