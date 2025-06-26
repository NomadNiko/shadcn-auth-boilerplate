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
  DragOverlay,
  useSensor,
  useSensors,
  PointerSensor,
  KeyboardSensor,
} from '@dnd-kit/core';
import type { ShiftType, ScheduleShift, Employee } from "@/types/schedule";
import { useDragHandlers } from "./drag-handlers";

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
  shiftTypeQuantities,
  employees,
  shiftTypes
}: DragDropProviderProps) {

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
    shiftTypeQuantities,
    employees,
    shiftTypes
  });

  /**
   * Handle drag start event
   */
  const handleDragStart = () => {
    // Drag start event - overlay disabled
  };

  /**
   * Handle drag end event with comprehensive drop logic
   */
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

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

  // Drag overlay functionality disabled to remove visual shadow/copy effect

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      {children}
      
      <DragOverlay>
        {/* Disabled drag overlay to remove visual shadow/copy effect */}
        {null}
      </DragOverlay>
    </DndContext>
  );
}