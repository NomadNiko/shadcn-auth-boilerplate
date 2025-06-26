/**
 * Drag Event Handlers
 * 
 * Centralized logic for handling different types of drag operations.
 * Separated from the main DragDropProvider for better maintainability.
 */

"use client";

import type { ShiftType, ScheduleShift, Employee } from "@/types/schedule";

interface DragHandlersProps {
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

/**
 * Custom hook for drag event handlers
 */
export function useDragHandlers({
  weekDates,
  scheduleShifts,
  setScheduleShifts,
  unassignedShifts,
  setUnassignedShifts,
  selectedShiftTypes,
  shiftTypeQuantities,
  employees,
  shiftTypes
}: DragHandlersProps) {

  /**
   * Generate unique ID for new shifts
   */
  const generateShiftId = (): string => {
    return `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
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
   * Handle dropping shift types to create new shifts
   */
  const handleShiftTypeDrop = (shiftType: ShiftType, overId: string) => {
    console.log('🎯 Handling shift type drop:', { shiftType: shiftType.name, overId });

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
      
      console.log(`✅ Created ${newShifts.length} new shifts`);
    }
  };

  /**
   * Reassign a shift to a different employee/date
   */
  const reassignShift = (shift: ScheduleShift, employee: Employee, date: string, dayIndex: number) => {
    console.log('🔄 Reassigning shift:', { 
      shiftId: shift.id, 
      fromUser: shift.user?.firstName, 
      toUser: employee.firstName 
    });

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
    console.log('📤 Unassigning shift:', { shiftId: shift.id, fromUser: shift.user?.firstName });

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
   * Handle dropping existing shifts (reassignment)
   */
  const handleShiftDrop = (shift: ScheduleShift, overId: string) => {
    console.log('🎯 Handling shift drop:', { shiftId: shift.id, overId });

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
    console.log('🎯 Handling employee drop:', { employeeId: employee.id, overId });
    // Implementation for employee drops if needed
    console.log('Employee drop not implemented yet:', employee, overId);
  };

  return {
    handleShiftTypeDrop,
    handleShiftDrop,
    handleEmployeeDrop
  };
}