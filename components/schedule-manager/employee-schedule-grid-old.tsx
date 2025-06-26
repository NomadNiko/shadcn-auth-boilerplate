/**
 * EmployeeScheduleGrid Component
 * 
 * Renders the main calendar grid showing employees and their assigned shifts for the week.
 * Includes droppable areas for drag-and-drop functionality and unassigned shifts section.
 */

"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useDroppable, useDraggable } from '@dnd-kit/core';
import type { Employee, ScheduleShift, Schedule } from "@/types/schedule";
import { shiftTypeColors } from "@/types/schedule";

interface EmployeeScheduleGridProps {
  /** The currently selected schedule */
  selectedSchedule: Schedule;
  
  /** Array of week dates in YYYY-MM-DD format */
  weekDates: string[];
  
  /** Array of employees who have assigned shifts */
  assignedEmployees: Employee[];
  
  /** All schedule shifts for the current schedule */
  scheduleShifts: ScheduleShift[];
  
  /** Set of selected required shifts */
  selectedRequiredShifts: Set<string>;
  
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
}

const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/**
 * Droppable area for employee day cells
 */
function DroppableEmployeeDay({ 
  employeeId, 
  dayIndex, 
  children 
}: { 
  employeeId: string; 
  dayIndex: number; 
  children: React.ReactNode 
}) {
  const { isOver, setNodeRef } = useDroppable({
    id: `employee-${employeeId}-day-${dayIndex}`,
  });

  return (
    <div 
      ref={setNodeRef}
      className={`min-h-[80px] p-1 border-r border-b border-border bg-card relative ${
        isOver ? 'bg-primary/10' : ''
      }`}
    >
      {children}
    </div>
  );
}

/**
 * Droppable area for unassigned day cells
 */
function DroppableUnassignedDay({ 
  dayIndex, 
  draggedItemType, 
  children 
}: { 
  dayIndex: number; 
  draggedItemType?: string; 
  children: React.ReactNode 
}) {
  const { isOver, setNodeRef } = useDroppable({
    id: `unassigned-day-${dayIndex}`,
  });

  return (
    <div 
      ref={setNodeRef}
      className={`min-h-[80px] p-1 border-r border-b border-border bg-card relative ${
        isOver ? 'bg-primary/10' : ''
      } ${draggedItemType === 'shiftType' ? 'bg-green-500/10 border-green-500/20' : ''}`}
    >
      {children}
    </div>
  );
}

/**
 * Draggable schedule shift component
 */
function DraggableScheduleShift({ 
  shift, 
  isUnassigned = false,
  isSelected = false,
  selectedCount = 0,
  onSelect
}: { 
  shift: ScheduleShift; 
  isUnassigned?: boolean;
  isSelected?: boolean;
  selectedCount?: number;
  onSelect?: (shift: ScheduleShift, selected: boolean) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: `shift-${shift.id}`,
    data: { type: 'shift', shift }
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  const handleSelectClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onSelect?.(shift, !isSelected);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`text-xs p-1 mb-1 rounded cursor-move transition-all ${
        isDragging ? 'opacity-50' : ''
      } ${isSelected ? 'ring-2 ring-primary ring-offset-1' : ''} ${
        isUnassigned 
          ? `${shiftTypeColors[shift.shiftType.colorIndex]} hover:opacity-80` 
          : `${shiftTypeColors[shift.shiftType.colorIndex]} hover:opacity-80`
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <div className="font-medium truncate">{shift.shiftType.name}</div>
          <div className="opacity-90 truncate">
            {shift.shiftType.startTime} - {shift.shiftType.endTime}
          </div>
          {shift.user && (
            <div className="opacity-80 truncate">
              {shift.user.firstName} {shift.user.lastName}
            </div>
          )}
        </div>
        
        {/* Selection checkbox for unassigned shifts */}
        {isUnassigned && onSelect && (
          <div
            onClick={handleSelectClick}
            className="flex-shrink-0 ml-1 cursor-pointer"
          >
            <div className={`w-4 h-4 border border-current rounded flex items-center justify-center text-xs font-bold ${
              isSelected ? 'bg-primary text-primary-foreground' : 'opacity-60 hover:opacity-100'
            }`}>
              {isSelected ? '✓' : ''}
            </div>
          </div>
        )}
      </div>
      
      {/* Selection count badge */}
      {isSelected && selectedCount > 1 && (
        <div className="absolute -top-1 -right-1 bg-primary text-primary-foreground rounded-full w-4 h-4 flex items-center justify-center text-xs font-bold">
          {selectedCount}
        </div>
      )}
    </div>
  );
}

export function EmployeeScheduleGrid({
  selectedSchedule,
  weekDates,
  assignedEmployees,
  selectedRequiredShifts,
  draggedItemType,
  getAssignedShiftsForEmployeeAndDay,
  getUnassignedShiftsForDay,
  onRequiredShiftSelect,
  onClearSelectedRequiredShifts
}: EmployeeScheduleGridProps) {
  return (
    <div className="col-span-9">
      {/* Schedule Navigation Header */}
      <div className="mb-4 flex items-center justify-center space-x-4">
        <Button variant="outline" size="sm">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <h2 className="text-lg font-semibold">{selectedSchedule.name}</h2>
        <Button variant="outline" size="sm">
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-8 gap-1 border border-border rounded-lg overflow-hidden">
        {/* Header Row */}
        <div className="bg-muted p-2"></div>
        {weekDays.map((day, index) => {
          const dateObj = weekDates[index] ? new Date(weekDates[index]) : new Date();
          const dayNumber = dateObj.getDate();
          return (
            <div key={day} className="bg-muted p-2 text-center">
              <div className="text-sm font-medium">{day}</div>
              <div className="text-xs text-muted-foreground">{dayNumber}</div>
            </div>
          );
        })}

        {/* Assigned Employee Rows */}
        {assignedEmployees.map((employee) => (
          <div key={employee.id} className="contents">
            {/* Employee Name Column */}
            <div className="bg-muted/50 p-2 border-r border-border">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white text-xs">
                  {employee.firstName[0]}
                </div>
                <div>
                  <div className="text-sm font-medium">{employee.firstName}</div>
                </div>
              </div>
            </div>

            {/* Day Cells for Employee */}
            {weekDays.map((_, dayIndex) => (
              <DroppableEmployeeDay
                key={`${employee.id}-${dayIndex}`}
                employeeId={employee.id}
                dayIndex={dayIndex}
              >
                {getAssignedShiftsForEmployeeAndDay(employee.id, dayIndex).map((shift) => (
                  <DraggableScheduleShift key={shift.id} shift={shift} />
                ))}
              </DroppableEmployeeDay>
            ))}
          </div>
        ))}

        {/* Empty State when no assigned employees */}
        {assignedEmployees.length === 0 && (
          <div className="contents">
            <div className="bg-slate-800/30 p-2 border-r border-border text-center">
              <div className="text-sm text-blue-100">No users assigned shifts</div>
            </div>
            {weekDays.map((_, dayIndex) => (
              <div key={dayIndex} className="bg-slate-800/10 p-2 border-r border-b border-border min-h-[80px]"></div>
            ))}
          </div>
        )}

        {/* Required Shifts Row (Unassigned) */}
        <div className="contents">
          <div className="bg-slate-800 p-2 border-r border-border">
            <div className="text-sm font-medium text-blue-50">Required Shifts</div>
            <div className="text-xs text-blue-100">Drag to assign</div>
            {selectedRequiredShifts.size > 0 && (
              <div className="mt-2 flex items-center justify-between">
                <span className="text-xs font-medium text-blue-100">
                  {selectedRequiredShifts.size} selected
                </span>
                <button
                  onClick={onClearSelectedRequiredShifts}
                  className="text-xs bg-slate-700 hover:bg-slate-600 text-blue-50 px-2 py-1 rounded"
                >
                  Clear
                </button>
              </div>
            )}
          </div>
          {weekDays.map((_, dayIndex) => (
            <DroppableUnassignedDay 
              key={dayIndex} 
              dayIndex={dayIndex} 
              draggedItemType={draggedItemType}
            >
              {getUnassignedShiftsForDay(dayIndex).map((shift) => (
                <DraggableScheduleShift 
                  key={shift.id} 
                  shift={shift} 
                  isUnassigned={true}
                  isSelected={selectedRequiredShifts.has(shift.id)}
                  onSelect={onRequiredShiftSelect}
                  selectedCount={selectedRequiredShifts.size}
                />
              ))}
            </DroppableUnassignedDay>
          ))}
        </div>
      </div>
    </div>
  );
}