/**
 * DragDropProvider Component - Refactored
 * 
 * Simplified drag-and-drop provider using extracted components and handlers.
 * Much cleaner and more maintainable than the previous monolithic version.
 */

"use client";

import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  useSensor,
  useSensors,
  PointerSensor,
  KeyboardSensor,
} from '@dnd-kit/core';
import type { ShiftType, ScheduleShift, Employee } from "@/types/schedule";
import { useDragHandlers } from "./drag-handlers";
import { DraggableScheduleShift } from "./draggable-schedule-shift";
import { shiftTypeColors } from "@/types/schedule";
import { useState } from "react";

interface DragDropProviderProps {
  /** Child components */
  children: React.ReactNode;
  
  /** Array of week dates */
  weekDates: string[];
  
  /** Current schedule shifts */
  scheduleShifts: ScheduleShift[];
  
  /** Set current schedule shifts */
  setScheduleShifts: React.Dispatch<React.SetStateAction<ScheduleShift[]>>;
  
  /** Array of unassigned shifts */
  unassignedShifts: ScheduleShift[];
  
  /** Set unassigned shifts */
  setUnassignedShifts: React.Dispatch<React.SetStateAction<ScheduleShift[]>>;
  
  /** Selected shift types */
  selectedShiftTypes: Set<string>;
  
  /** Selected required (unassigned) shifts */
  selectedRequiredShifts: Set<string>;
  
  /** Callback to clear selected required shifts */
  onClearSelectedRequiredShifts: () => void;
  
  /** Shift type quantities */
  shiftTypeQuantities: Map<string, number>;
  
  /** Array of employees */
  employees: Employee[];
  
  /** Array of shift types */
  shiftTypes: ShiftType[];
}


export function DragDropProvider({
  children,
  weekDates,
  scheduleShifts,
  setScheduleShifts,
  unassignedShifts,
  setUnassignedShifts,
  selectedShiftTypes,
  selectedRequiredShifts,
  onClearSelectedRequiredShifts,
  shiftTypeQuantities,
  employees,
  shiftTypes
}: DragDropProviderProps) {
  
  // State for drag overlay
  const [activeDragData, setActiveDragData] = useState<{
    type: 'shift' | 'shiftType' | 'employee';
    shift?: ScheduleShift;
    shiftType?: ShiftType;
    employee?: Employee;
  } | null>(null);

  // Configure drag sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 2,
      },
    }),
    useSensor(KeyboardSensor)
  );

  // Get drag event handlers
  const {
    handleShiftTypeDrop,
    handleShiftDrop,
    handleEmployeeDrop
  } = useDragHandlers({
    weekDates,
    scheduleShifts,
    setScheduleShifts,
    unassignedShifts,
    setUnassignedShifts,
    selectedShiftTypes,
    selectedRequiredShifts,
    onClearSelectedRequiredShifts,
    shiftTypeQuantities,
    employees,
    shiftTypes
  });

  /**
   * Handle drag start event
   */
  const handleDragStart = (event: DragStartEvent) => {
    // Store active drag data for overlay
    const data = event.active.data.current;
    if (data && data.type) {
      setActiveDragData(data as {
        type: 'shift' | 'shiftType' | 'employee';
        shift?: ScheduleShift;
        shiftType?: ShiftType;
        employee?: Employee;
      });
    }
  };

  /**
   * Handle drag end event with comprehensive drop logic
   */
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    // Clear drag overlay data
    setActiveDragData(null);

    if (!over || !active.data.current) return;

    const draggedType = active.data.current.type;
    const overId = over.id as string;

    console.log('🎯 Drag ended:', { draggedType, overId, activeData: active.data.current });

    // Handle different types of drops
    switch (draggedType) {
      case 'shiftType':
        handleShiftTypeDrop(active.data.current.shiftType, overId);
        break;
      case 'shift':
        handleShiftDrop(active.data.current.shift, overId);
        break;
      case 'employee':
        handleEmployeeDrop(active.data.current.employee, overId);
        break;
    }
  };

  /**
   * Render drag overlay content based on what's being dragged
   */
  const renderDragOverlay = () => {
    if (!activeDragData) return null;

    switch (activeDragData.type) {
      case 'shift':
        return activeDragData.shift ? (
          <div className="cursor-grabbing">
            <DraggableScheduleShift 
              shift={activeDragData.shift}
              isUnassigned={!activeDragData.shift.userId}
            />
          </div>
        ) : null;
      case 'shiftType':
        const shiftType = activeDragData.shiftType;
        return shiftType ? (
          <div className={`cursor-grabbing rounded-lg border p-2 flex items-center space-x-2 ${shiftTypeColors[shiftType.colorIndex]}`}>
            <div>
              <div className="text-sm font-medium">{shiftType.name}</div>
              <div className="text-xs opacity-90">
                {shiftType.startTime} - {shiftType.endTime}
              </div>
            </div>
          </div>
        ) : null;
      case 'employee':
        const employee = activeDragData.employee;
        return employee ? (
          <div className="cursor-grabbing flex items-center space-x-3 p-2 rounded-lg bg-card border">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-sm font-medium">
              {employee.firstName[0]}
            </div>
            <div>
              <div className="text-sm font-medium">
                {employee.firstName} {employee.lastName}
              </div>
              <div className="text-xs text-muted-foreground">
                {employee.role}
              </div>
            </div>
          </div>
        ) : null;
      default:
        return null;
    }
  };

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      {children}
      
      <DragOverlay>
        {renderDragOverlay()}
      </DragOverlay>
    </DndContext>
  );
}