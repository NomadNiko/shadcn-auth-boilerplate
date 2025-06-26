/**
 * DragDropProvider Component - Refactored
 * 
 * Simplified drag-and-drop provider using extracted components and handlers.
 * Much cleaner and more maintainable than the previous monolithic version.
 */

"use client";

import { useState } from "react";
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
import { 
  ShiftTypeDragOverlay, 
  ScheduleShiftDragOverlay, 
  EmployeeDragOverlay 
} from "./drag-overlays";

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

interface DraggedItem {
  type: 'shiftType' | 'shift' | 'employee';
  data: ShiftType | ScheduleShift | Employee;
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
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draggedItem, setDraggedItem] = useState<DraggedItem | null>(null);

  // Configure drag sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
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
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id as string);
    
    // Store the dragged item data
    if (active.data.current) {
      setDraggedItem({
        type: active.data.current.type,
        data: active.data.current.shiftType || active.data.current.shift || active.data.current.employee
      });
    }
  };

  /**
   * Handle drag end event with comprehensive drop logic
   */
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    setActiveId(null);
    setDraggedItem(null);

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
   * Render drag overlay based on dragged item type
   */
  const renderDragOverlay = () => {
    if (!activeId || !draggedItem) return null;

    switch (draggedItem.type) {
      case 'shiftType': {
        const shiftType = draggedItem.data as ShiftType;
        const isMultiSelect = selectedShiftTypes.has(shiftType.id) && selectedShiftTypes.size > 1;
        const quantity = shiftTypeQuantities.get(shiftType.id) || 1;
        const totalQuantity = isMultiSelect 
          ? Array.from(selectedShiftTypes).reduce((sum, id) => sum + (shiftTypeQuantities.get(id) || 1), 0)
          : quantity;
        
        return (
          <ShiftTypeDragOverlay
            shiftType={shiftType}
            isMultiSelect={isMultiSelect}
            selectedCount={selectedShiftTypes.size}
            quantity={quantity}
            totalQuantity={totalQuantity}
          />
        );
      }
      
      case 'shift': {
        const shift = draggedItem.data as ScheduleShift;
        return <ScheduleShiftDragOverlay shift={shift} />;
      }
      
      case 'employee': {
        const employee = draggedItem.data as Employee;
        return <EmployeeDragOverlay employee={employee} />;
      }
      
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