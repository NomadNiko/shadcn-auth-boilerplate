/**
 * DragDropProvider Component
 * 
 * Centralized drag-and-drop logic provider for the schedule manager.
 * Handles all drag events, drop validation, and state updates.
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
import { shiftTypeColors } from "@/types/schedule";

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

  /**
   * Generate unique ID for new shifts
   */
  const generateShiftId = (): string => {
    return `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

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

    console.log('Drag ended:', { draggedType, overId, activeData: active.data.current });

    // Handle shift type drops
    if (draggedType === 'shiftType') {
      handleShiftTypeDrop(active.data.current.shiftType, overId);
    }
    // Handle shift drops (reassignment)
    else if (draggedType === 'shift') {
      handleShiftDrop(active.data.current.shift, overId);
    }
    // Handle employee drops
    else if (draggedType === 'employee') {
      handleEmployeeDrop(active.data.current.employee, overId);
    }
  };

  /**
   * Handle dropping shift types to create new shifts
   */
  const handleShiftTypeDrop = (shiftType: ShiftType, overId: string) => {
    // Determine if multiple shift types are selected
    const shiftTypesToProcess = selectedShiftTypes.has(shiftType.id) 
      ? Array.from(selectedShiftTypes)
          .map(id => shiftTypes.find(st => st.id === id))
          .filter(Boolean) as ShiftType[]
      : [shiftType];

    const newShifts: ScheduleShift[] = [];

    shiftTypesToProcess.forEach((st) => {
      const quantity = shiftTypeQuantities.get(st.id) || 1;
      
      for (let i = 0; i < quantity; i++) {
        // Parse drop target
        if (overId.startsWith('employee-') && overId.includes('-day-')) {
          // Drop on employee day cell
          const parts = overId.split('-');
          const employeeId = parts[1];
          const dayIndex = parseInt(parts[3]);
          const employee = employees.find(e => e.id === employeeId);
          
          if (employee && weekDates[dayIndex]) {
            const newShift: ScheduleShift = {
              id: generateShiftId(),
              shiftTypeId: st.id,
              shiftType: st,
              date: weekDates[dayIndex],
              order: getNextOrderForEmployeeDay(employeeId, dayIndex),
              userId: employee.id,
              user: employee
            };
            newShifts.push(newShift);
          }
        } else if (overId.startsWith('unassigned-day-')) {
          // Drop on unassigned day cell
          const dayIndex = parseInt(overId.split('-')[2]);
          
          if (weekDates[dayIndex]) {
            const newShift: ScheduleShift = {
              id: generateShiftId(),
              shiftTypeId: st.id,
              shiftType: st,
              date: weekDates[dayIndex],
              order: getNextOrderForUnassignedDay(dayIndex)
            };
            newShifts.push(newShift);
          }
        }
      }
    });

    // Add new shifts to appropriate arrays
    if (newShifts.length > 0) {
      const assignedShifts = newShifts.filter(s => s.userId);
      const unassigned = newShifts.filter(s => !s.userId);
      
      if (assignedShifts.length > 0) {
        setScheduleShifts(prev => [...prev, ...assignedShifts]);
      }
      if (unassigned.length > 0) {
        setUnassignedShifts(prev => [...prev, ...unassigned]);
      }
      
      console.log(`Created ${newShifts.length} new shifts`);
    }
  };

  /**
   * Handle dropping existing shifts (reassignment)
   */
  const handleShiftDrop = (shift: ScheduleShift, overId: string) => {
    // Parse drop target
    if (overId.startsWith('employee-') && overId.includes('-day-')) {
      // Assign to employee
      const parts = overId.split('-');
      const employeeId = parts[1];
      const dayIndex = parseInt(parts[3]);
      const employee = employees.find(e => e.id === employeeId);
      
      if (employee && weekDates[dayIndex]) {
        reassignShift(shift, employee, weekDates[dayIndex], dayIndex);
      }
    } else if (overId.startsWith('unassigned-day-')) {
      // Move to unassigned
      const dayIndex = parseInt(overId.split('-')[2]);
      
      if (weekDates[dayIndex]) {
        unassignShift(shift, weekDates[dayIndex], dayIndex);
      }
    } else if (overId.startsWith('drop-employee-')) {
      // Drop on employee in sidebar (remove assignment)
      const employeeId = overId.split('-')[2];
      const employee = employees.find(e => e.id === employeeId);
      
      if (employee) {
        reassignShift(shift, employee, shift.date, getDateIndex(shift.date));
      }
    }
  };

  /**
   * Handle dropping employees (for quick assignment)
   */
  const handleEmployeeDrop = (employee: Employee, overId: string) => {
    // Implementation for employee drops if needed
    console.log('Employee drop not implemented yet:', employee, overId);
  };

  /**
   * Reassign a shift to a different employee/date
   */
  const reassignShift = (shift: ScheduleShift, employee: Employee, date: string, dayIndex: number) => {
    const updatedShift: ScheduleShift = {
      ...shift,
      userId: employee.id,
      user: employee,
      date,
      order: getNextOrderForEmployeeDay(employee.id, dayIndex)
    };

    // Remove from current location and add to new location
    if (shift.userId) {
      // Was assigned, update in assigned shifts
      setScheduleShifts(prev => prev.map(s => s.id === shift.id ? updatedShift : s));
    } else {
      // Was unassigned, move to assigned
      setUnassignedShifts(prev => prev.filter(s => s.id !== shift.id));
      setScheduleShifts(prev => [...prev, updatedShift]);
    }
  };

  /**
   * Unassign a shift (move to unassigned)
   */
  const unassignShift = (shift: ScheduleShift, date: string, dayIndex: number) => {
    const updatedShift: ScheduleShift = {
      ...shift,
      userId: undefined,
      user: undefined,
      date,
      order: getNextOrderForUnassignedDay(dayIndex)
    };

    // Remove from assigned and add to unassigned
    setScheduleShifts(prev => prev.filter(s => s.id !== shift.id));
    setUnassignedShifts(prev => [...prev, updatedShift]);
  };

  /**
   * Get next order number for employee day
   */
  const getNextOrderForEmployeeDay = (employeeId: string, dayIndex: number): number => {
    const date = weekDates[dayIndex];
    const existingShifts = scheduleShifts.filter(s => 
      s.userId === employeeId && s.date === date
    );
    return Math.max(0, ...existingShifts.map(s => s.order)) + 1;
  };

  /**
   * Get next order number for unassigned day
   */
  const getNextOrderForUnassignedDay = (dayIndex: number): number => {
    const date = weekDates[dayIndex];
    const existingShifts = unassignedShifts.filter(s => s.date === date);
    return Math.max(0, ...existingShifts.map(s => s.order)) + 1;
  };

  /**
   * Get date index from date string
   */
  const getDateIndex = (date: string): number => {
    return weekDates.indexOf(date);
  };

  /**
   * Render drag overlay
   */
  const renderDragOverlay = () => {
    if (!activeId || !draggedItem) return null;

    if (draggedItem.type === 'shiftType') {
      const shiftType = draggedItem.data as ShiftType;
      const isMultiSelect = selectedShiftTypes.has(shiftType.id) && selectedShiftTypes.size > 1;
      
      if (isMultiSelect) {
        const totalQuantity = Array.from(selectedShiftTypes).reduce((sum, id) => {
          return sum + (shiftTypeQuantities.get(id) || 1);
        }, 0);
        
        return (
          <div className="relative">
            <div className={`rounded-lg border p-2 ${shiftTypeColors[shiftType.colorIndex]}`}>
              <div className="text-sm font-medium">{selectedShiftTypes.size} shift types</div>
              <div className="text-xs opacity-90">{totalQuantity} total shifts</div>
            </div>
            <div className="absolute -top-1 -right-1 bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
              {selectedShiftTypes.size}
            </div>
          </div>
        );
      } else {
        const quantity = shiftTypeQuantities.get(shiftType.id) || 1;
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
    }

    if (draggedItem.type === 'shift') {
      const shift = draggedItem.data as ScheduleShift;
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

    if (draggedItem.type === 'employee') {
      const employee = draggedItem.data as Employee;
      return (
        <div className="flex items-center space-x-2 p-2 bg-card border rounded-lg">
          <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white text-xs">
            {employee.firstName[0]}
          </div>
          <div className="text-sm">{employee.firstName} {employee.lastName}</div>
        </div>
      );
    }

    return null;
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