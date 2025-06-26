/**
 * useScheduleEdit Hook
 * 
 * Centralized state management for schedule editing functionality.
 * Handles local state, selections, and change tracking for the schedule manager.
 */

"use client";

import { useState, useCallback, useMemo, useEffect } from 'react';
import type { ScheduleShift, ShiftType, Employee, Schedule } from '@/types/schedule';
import { getWeekDates } from '@/types/schedule';

interface UseScheduleEditProps {
  /** The current schedule being edited */
  currentSchedule: Schedule | null;
  
  /** Original schedule shifts from the server */
  originalScheduleShifts: ScheduleShift[];
  
  /** Array of available shift types */
  shiftTypes: ShiftType[];
  
  /** Array of available employees */
  employees: Employee[];
}

interface UseScheduleEditReturn {
  // Local state
  scheduleShifts: ScheduleShift[];
  unassignedShifts: ScheduleShift[];
  selectedShiftTypes: Set<string>;
  selectedRequiredShifts: Set<string>;
  shiftTypeQuantities: Map<string, number>;
  isSaving: boolean;
  
  // Computed values
  weekDates: string[];
  assignedEmployees: Employee[];
  hasChanges: boolean;
  
  // State setters
  setScheduleShifts: React.Dispatch<React.SetStateAction<ScheduleShift[]>>;
  setUnassignedShifts: React.Dispatch<React.SetStateAction<ScheduleShift[]>>;
  setIsSaving: (saving: boolean) => void;
  
  // Selection handlers
  handleShiftTypeSelect: (shiftType: ShiftType, selected: boolean) => void;
  handleRequiredShiftSelect: (shift: ScheduleShift, selected: boolean) => void;
  handleQuantityChange: (shiftTypeId: string, quantity: number) => void;
  clearAllSelections: () => void;
  clearSelectedRequiredShifts: () => void;
  
  // Data getters
  getAssignedShiftsForEmployeeAndDay: (employeeId: string, dayIndex: number) => ScheduleShift[];
  getUnassignedShiftsForDay: (dayIndex: number) => ScheduleShift[];
  getQuantityForShiftType: (shiftTypeId: string) => number;
  
  // Change detection
  getChangeSummary: () => {
    newShifts: ScheduleShift[];
    shiftsToUpdate: ScheduleShift[];
    shiftsToDelete: ScheduleShift[];
  };
  
  // Bulk operations
  clearAllShifts: () => void;
  resetToOriginalState: () => void;
  
  // TEMPORARY: Click-to-move functionality
  selectedShiftForMove: ScheduleShift | null;
  handleShiftClickToMove: (shift: ScheduleShift) => void;
  handleClickToPlaceShift: (employeeId: string, dayIndex: number) => void;
  handleClickToUnassignShift: (dayIndex: number) => void;
  clearSelectedShiftForMove: () => void;
}

export function useScheduleEdit({
  currentSchedule,
  originalScheduleShifts,
  shiftTypes,
  employees
}: UseScheduleEditProps): UseScheduleEditReturn {
  
  // Local state for schedule shifts (separated from server state)
  const [scheduleShifts, setScheduleShifts] = useState<ScheduleShift[]>([]);
  const [unassignedShifts, setUnassignedShifts] = useState<ScheduleShift[]>([]);
  
  // Selection state
  const [selectedShiftTypes, setSelectedShiftTypes] = useState<Set<string>>(new Set());
  const [selectedRequiredShifts, setSelectedRequiredShifts] = useState<Set<string>>(new Set());
  const [shiftTypeQuantities, setShiftTypeQuantities] = useState<Map<string, number>>(new Map());
  
  // UI state
  const [isSaving, setIsSaving] = useState(false);
  const [hasBeenInitialized, setHasBeenInitialized] = useState(false);
  
  // TEMPORARY: Click-to-move state
  const [selectedShiftForMove, setSelectedShiftForMove] = useState<ScheduleShift | null>(null);
  
  // Computed values
  const weekDates = useMemo(() => {
    return currentSchedule ? getWeekDates(currentSchedule.startDate) : [];
  }, [currentSchedule]);
  
  const assignedEmployees = useMemo(() => {
    const employeeIds = new Set(scheduleShifts.map(shift => shift.userId).filter(Boolean));
    // Check both id and _id fields for compatibility
    return employees.filter(emp => employeeIds.has(emp.id) || employeeIds.has(emp._id));
  }, [scheduleShifts, employees]);
  
  // Initialize local state when original data changes
  const initializeLocalState = useCallback(() => {
    const assigned = originalScheduleShifts.filter(shift => shift.userId);
    const unassigned = originalScheduleShifts.filter(shift => !shift.userId);
    
    setScheduleShifts(assigned);
    setUnassignedShifts(unassigned);
    setHasBeenInitialized(true);
  }, [originalScheduleShifts]);
  
  // Reset to original state
  const resetToOriginalState = useCallback(() => {
    initializeLocalState();
    setSelectedShiftTypes(new Set());
    setSelectedRequiredShifts(new Set());
    setShiftTypeQuantities(new Map());
  }, [initializeLocalState]);
  
  // Change detection
  const hasChanges = useMemo(() => {
    const currentAllShifts = [...scheduleShifts, ...unassignedShifts];
    
    // Compare lengths first
    if (currentAllShifts.length !== originalScheduleShifts.length) {
      return true;
    }
    
    // Check for modifications in existing shifts
    for (const originalShift of originalScheduleShifts) {
      const currentShift = currentAllShifts.find(s => s.id === originalShift.id);
      if (!currentShift) {
        return true; // Shift was deleted
      }
      
      // Check if assignment changed
      if (currentShift.userId !== originalShift.userId ||
          currentShift.date !== originalShift.date ||
          currentShift.order !== originalShift.order) {
        return true;
      }
    }
    
    // Check for new shifts (those with temp IDs)
    for (const currentShift of currentAllShifts) {
      if (currentShift.id.startsWith('temp-')) {
        return true; // New shift
      }
    }
    
    return false;
  }, [scheduleShifts, unassignedShifts, originalScheduleShifts]);
  
  // Get change summary for bulk operations
  const getChangeSummary = useCallback(() => {
    const currentAllShifts = [...scheduleShifts, ...unassignedShifts];
    const originalShiftIds = new Set(originalScheduleShifts.map(s => s.id));
    
    // New shifts (those with temp IDs)
    const newShifts = currentAllShifts.filter(shift => shift.id.startsWith('temp-'));
    
    // Updated shifts (existing shifts that have changed)
    const shiftsToUpdate = currentAllShifts.filter(shift => {
      if (shift.id.startsWith('temp-')) return false; // Skip new shifts
      
      const originalShift = originalScheduleShifts.find(s => s.id === shift.id);
      if (!originalShift) return false;
      
      return (
        shift.userId !== originalShift.userId ||
        shift.date !== originalShift.date ||
        shift.order !== originalShift.order
      );
    });
    
    // Deleted shifts (original shifts not in current state)
    const currentShiftIds = new Set(currentAllShifts.map(s => s.id));
    const shiftsToDelete = originalScheduleShifts.filter(shift => 
      !currentShiftIds.has(shift.id)
    );
    
    return {
      newShifts,
      shiftsToUpdate,
      shiftsToDelete
    };
  }, [scheduleShifts, unassignedShifts, originalScheduleShifts]);
  
  // Selection handlers
  const handleShiftTypeSelect = useCallback((shiftType: ShiftType, selected: boolean) => {
    setSelectedShiftTypes(prev => {
      const newSet = new Set(prev);
      if (selected) {
        newSet.add(shiftType.id);
      } else {
        newSet.delete(shiftType.id);
      }
      return newSet;
    });
  }, []);
  
  const handleRequiredShiftSelect = useCallback((shift: ScheduleShift, selected: boolean) => {
    setSelectedRequiredShifts(prev => {
      const newSet = new Set(prev);
      if (selected) {
        newSet.add(shift.id);
      } else {
        newSet.delete(shift.id);
      }
      return newSet;
    });
  }, []);
  
  const handleQuantityChange = useCallback((shiftTypeId: string, quantity: number) => {
    setShiftTypeQuantities(prev => {
      const newMap = new Map(prev);
      newMap.set(shiftTypeId, quantity);
      return newMap;
    });
  }, []);
  
  const clearAllSelections = useCallback(() => {
    setSelectedShiftTypes(new Set());
  }, []);
  
  const clearSelectedRequiredShifts = useCallback(() => {
    setSelectedRequiredShifts(new Set());
  }, []);
  
  // Data getters
  const getAssignedShiftsForEmployeeAndDay = useCallback((employeeId: string, dayIndex: number) => {
    const targetDate = weekDates[dayIndex];
    if (!targetDate) return [];
    
    return scheduleShifts
      .filter(shift => shift.userId === employeeId && shift.date === targetDate)
      .sort((a, b) => {
        // Sort by start time first, then by order as secondary sort
        const aStartTime = a.shiftType?.startTime || '00:00';
        const bStartTime = b.shiftType?.startTime || '00:00';
        
        if (aStartTime !== bStartTime) {
          return aStartTime.localeCompare(bStartTime);
        }
        
        // If start times are the same, sort by order
        return a.order - b.order;
      });
  }, [scheduleShifts, weekDates]);
  
  const getUnassignedShiftsForDay = useCallback((dayIndex: number) => {
    const targetDate = weekDates[dayIndex];
    if (!targetDate) return [];
    
    return unassignedShifts
      .filter(shift => shift.date === targetDate)
      .sort((a, b) => {
        // Sort by start time first, then by order as secondary sort
        const aStartTime = a.shiftType?.startTime || '00:00';
        const bStartTime = b.shiftType?.startTime || '00:00';
        
        if (aStartTime !== bStartTime) {
          return aStartTime.localeCompare(bStartTime);
        }
        
        // If start times are the same, sort by order
        return a.order - b.order;
      });
  }, [unassignedShifts, weekDates]);
  
  const getQuantityForShiftType = useCallback((shiftTypeId: string): number => {
    return shiftTypeQuantities.get(shiftTypeId) || 1;
  }, [shiftTypeQuantities]);
  
  // Bulk operations
  const clearAllShifts = useCallback(() => {
    setScheduleShifts([]);
    setUnassignedShifts([]);
    setSelectedRequiredShifts(new Set());
  }, []);

  // TEMPORARY: Click-to-move handlers
  const handleShiftClickToMove = useCallback((shift: ScheduleShift) => {
    setSelectedShiftForMove(selectedShiftForMove?.id === shift.id ? null : shift);
  }, [selectedShiftForMove]);

  const handleClickToPlaceShift = useCallback((employeeId: string, dayIndex: number) => {
    if (!selectedShiftForMove) return;
    
    const targetDate = weekDates[dayIndex];
    if (!targetDate) return;

    // Find the employee for the assignment
    const targetEmployee = employees.find(emp => emp.id === employeeId || emp._id === employeeId);
    if (!targetEmployee) return;

    // Calculate order for the target location
    const targetOrder = Math.max(0, ...scheduleShifts
      .filter(s => s.userId === targetEmployee.id && s.date === targetDate)
      .map(s => s.order)) + 1;

    // Update the shift with new assignment
    const updatedShift = {
      ...selectedShiftForMove,
      userId: targetEmployee.id,
      user: targetEmployee,
      date: targetDate,
      order: targetOrder
    };

    // Handle movement based on current location
    if (selectedShiftForMove.userId) {
      // Was assigned, update in assigned shifts
      setScheduleShifts(prev => prev.map(s => s.id === selectedShiftForMove.id ? updatedShift : s));
    } else {
      // Was unassigned, move to assigned
      setUnassignedShifts(prev => prev.filter(s => s.id !== selectedShiftForMove.id));
      setScheduleShifts(prev => [...prev, updatedShift]);
    }

    setSelectedShiftForMove(null);
  }, [selectedShiftForMove, weekDates, employees, scheduleShifts]);

  const handleClickToUnassignShift = useCallback((dayIndex: number) => {
    if (!selectedShiftForMove) return;
    
    const targetDate = weekDates[dayIndex];
    if (!targetDate) return;

    // Calculate order for the target unassigned location
    const targetOrder = Math.max(0, ...unassignedShifts
      .filter(s => s.date === targetDate)
      .map(s => s.order)) + 1;

    // Update the shift to be unassigned
    const updatedShift = {
      ...selectedShiftForMove,
      userId: undefined,
      user: undefined,
      date: targetDate,
      order: targetOrder
    };

    // Handle movement based on current location
    if (selectedShiftForMove.userId) {
      // Was assigned, move to unassigned
      setScheduleShifts(prev => prev.filter(s => s.id !== selectedShiftForMove.id));
      setUnassignedShifts(prev => [...prev, updatedShift]);
    } else {
      // Was unassigned, update in unassigned shifts
      setUnassignedShifts(prev => prev.map(s => s.id === selectedShiftForMove.id ? updatedShift : s));
    }

    setSelectedShiftForMove(null);
  }, [selectedShiftForMove, weekDates, unassignedShifts]);

  const clearSelectedShiftForMove = useCallback(() => {
    setSelectedShiftForMove(null);
  }, []);
  
  // Reset initialization flag when schedule changes
  useEffect(() => {
    setHasBeenInitialized(false);
  }, [currentSchedule?.id]);

  // Initialize local state when schedule changes or original data changes
  useEffect(() => {
    // Initialize whenever we have a schedule, regardless of previous initialization
    if (currentSchedule) {
      initializeLocalState();
    }
  }, [initializeLocalState, currentSchedule, originalScheduleShifts]);
  
  return {
    // Local state
    scheduleShifts,
    unassignedShifts,
    selectedShiftTypes,
    selectedRequiredShifts,
    shiftTypeQuantities,
    isSaving,
    
    // Computed values
    weekDates,
    assignedEmployees,
    hasChanges,
    
    // State setters
    setScheduleShifts,
    setUnassignedShifts,
    setIsSaving,
    
    // Selection handlers
    handleShiftTypeSelect,
    handleRequiredShiftSelect,
    handleQuantityChange,
    clearAllSelections,
    clearSelectedRequiredShifts,
    
    // Data getters
    getAssignedShiftsForEmployeeAndDay,
    getUnassignedShiftsForDay,
    getQuantityForShiftType,
    
    // Change detection
    getChangeSummary,
    
    // Bulk operations
    clearAllShifts,
    resetToOriginalState,
    
    // TEMPORARY: Click-to-move functionality
    selectedShiftForMove,
    handleShiftClickToMove,
    handleClickToPlaceShift,
    handleClickToUnassignShift,
    clearSelectedShiftForMove
  };
}