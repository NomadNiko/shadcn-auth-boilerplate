"use client";

import { useState, useEffect } from 'react';
import { shiftTypesApi, schedulesApi, scheduleShiftsApi, BulkOperationsDto, BulkOperationType } from '@/lib/api-services';
import type { ShiftType, Schedule, ScheduleShift, Employee } from '@/types/schedule';

// Convert backend DTOs to frontend types
const convertShiftType = (dto: any): ShiftType => ({
  id: dto.id,
  name: dto.name,
  startTime: dto.startTime,
  endTime: dto.endTime,
  colorIndex: dto.colorIndex,
  isActive: dto.isActive
});

const convertSchedule = (dto: any): Schedule => ({
  id: dto.id,
  name: dto.name,
  startDate: typeof dto.startDate === 'string' ? dto.startDate : new Date(dto.startDate).toISOString().split('T')[0],
  endDate: typeof dto.endDate === 'string' ? dto.endDate : new Date(dto.endDate).toISOString().split('T')[0],
  status: dto.status,
  totalShifts: dto.totalShifts || undefined,
  assignedShifts: dto.assignedShifts || undefined
});

const convertScheduleShift = (dto: any): ScheduleShift => ({
  id: dto.id,
  scheduleId: dto.scheduleId,
  shiftTypeId: dto.shiftType?.id || dto.shiftTypeId, // Backend returns populated shiftType
  shiftType: convertShiftType(dto.shiftType),
  date: new Date(dto.date).toISOString().split('T')[0], // Always convert to YYYY-MM-DD format
  order: dto.order,
  userId: dto.user?.id || undefined, // Only set if user exists
  user: dto.user ? {
    id: dto.user._id || dto.user.id,
    _id: dto.user._id,
    firstName: dto.user.firstName || '',
    lastName: dto.user.lastName || '',
    role: typeof dto.user.role === 'string' ? dto.user.role : (dto.user.role?.name || 'Employee'),
    email: dto.user.email
  } : undefined
});

export const useScheduleData = (scheduleId?: string) => {
  const [shiftTypes, setShiftTypes] = useState<ShiftType[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [currentSchedule, setCurrentSchedule] = useState<Schedule | null>(null);
  const [scheduleShifts, setScheduleShifts] = useState<ScheduleShift[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load shift types
  const loadShiftTypes = async () => {
    try {
      const data = await shiftTypesApi.getAll();
      console.log('[useScheduleData] Loaded shift types:', data.length);
      setShiftTypes(data.map(convertShiftType));
    } catch (err) {
      console.error('Failed to load shift types:', err);
      setError('Failed to load shift types');
    }
  };

  // Load schedules
  const loadSchedules = async () => {
    try {
      // Load all schedules (drafts and published)
      const allSchedules = await schedulesApi.getAll();
      setSchedules(allSchedules.map(convertSchedule));
      
      if (scheduleId) {
        // Load specific schedule by ID
        const schedule = await schedulesApi.getById(scheduleId);
        const converted = convertSchedule(schedule);
        setCurrentSchedule(converted);
        return scheduleId;
      } else {
        // Don't auto-create schedules - user must explicitly choose
        setCurrentSchedule(null);
        return null;
      }
    } catch (err) {
      console.error('Failed to load schedules:', err);
      setError('Failed to load schedules');
      return null;
    }
  };

  // Load schedule shifts
  const loadScheduleShifts = async (schedId: string) => {
    try {
      const data = await scheduleShiftsApi.getBySchedule(schedId);
      // API returns {shifts: [], unassignedShifts: []}
      const allShifts = [...data.shifts, ...data.unassignedShifts];
      console.log('[useScheduleData] Loaded schedule shifts:', {
        assigned: data.shifts.length,
        unassigned: data.unassignedShifts.length,
        total: allShifts.length
      });
      setScheduleShifts(allShifts.map(convertScheduleShift));
    } catch (err) {
      console.error('Failed to load schedule shifts:', err);
      setError('Failed to load schedule shifts');
    }
  };

  // Create new shift type
  const createShiftType = async (shiftTypeData: Omit<ShiftType, 'id' | 'isActive'>) => {
    try {
      const newShiftType = await shiftTypesApi.create(shiftTypeData);
      const converted = convertShiftType(newShiftType);
      setShiftTypes(prev => [...prev, converted]);
      return converted;
    } catch (err) {
      console.error('Failed to create shift type:', err);
      throw new Error('Failed to create shift type');
    }
  };

  // Create schedule shifts one by one (no bulk endpoint in current API)
  const createScheduleShifts = async (shifts: Omit<ScheduleShift, 'id'>[]) => {
    if (!currentSchedule) return [];

    try {
      const created: ScheduleShift[] = [];
      for (const shift of shifts) {
        const newShift = await scheduleShiftsApi.create(currentSchedule.id, {
          shiftTypeId: shift.shiftTypeId,
          date: shift.date,
          order: shift.order,
          userId: shift.userId
        });
        created.push(convertScheduleShift(newShift));
      }
      
      setScheduleShifts(prev => [...prev, ...created]);
      return created;
    } catch (err) {
      console.error('Failed to create schedule shifts:', err);
      throw new Error('Failed to create schedule shifts');
    }
  };

  // Update schedule shift (for assignment/reassignment)
  const updateScheduleShift = async (shiftId: string, updates: { userId?: string; order?: number }) => {
    if (!currentSchedule) throw new Error('No current schedule');

    try {
      const updatedShift = await scheduleShiftsApi.update(currentSchedule.id, shiftId, updates);
      const converted = convertScheduleShift(updatedShift);
      
      setScheduleShifts(prev => 
        prev.map(shift => shift.id === shiftId ? converted : shift)
      );
      return converted;
    } catch (err) {
      console.error('Failed to update schedule shift:', err);
      throw new Error('Failed to update schedule shift');
    }
  };

  // Delete schedule shifts
  const deleteScheduleShifts = async (shiftIds: string[]) => {
    if (!currentSchedule) return;

    try {
      // Delete shifts one by one (no bulk delete endpoint)
      for (const shiftId of shiftIds) {
        await scheduleShiftsApi.delete(currentSchedule.id, shiftId);
      }
      setScheduleShifts(prev => prev.filter(shift => !shiftIds.includes(shift.id)));
    } catch (err) {
      console.error('Failed to delete schedule shifts:', err);
      throw new Error('Failed to delete schedule shifts');
    }
  };

  // Copy previous week
  const copyPreviousWeek = async () => {
    if (!currentSchedule) return;

    try {
      const result = await scheduleShiftsApi.copyPrevious(currentSchedule.id);
      // Reload schedule shifts to get the copied data
      await loadScheduleShifts(currentSchedule.id);
      return result;
    } catch (err) {
      console.error('Failed to copy previous week:', err);
      throw new Error('Failed to copy previous week');
    }
  };

  // Publish schedule
  const publishSchedule = async () => {
    if (!currentSchedule) return null;

    try {
      const publishedSchedule = await schedulesApi.publish(currentSchedule.id);
      const converted = convertSchedule(publishedSchedule);
      setCurrentSchedule(converted);
      return converted;
    } catch (err) {
      console.error('Failed to publish schedule:', err);
      throw new Error('Failed to publish schedule');
    }
  };

  // Unpublish schedule (convert back to draft)
  const unpublishSchedule = async () => {
    if (!currentSchedule) return null;

    try {
      const unpublishedSchedule = await schedulesApi.unpublish(currentSchedule.id);
      const converted = convertSchedule(unpublishedSchedule);
      setCurrentSchedule(converted);
      return converted;
    } catch (err) {
      console.error('Failed to unpublish schedule:', err);
      throw new Error('Failed to unpublish schedule');
    }
  };

  // Single bulk operation save - NO individual API calls
  const saveScheduleChanges = async (
    newShifts: ScheduleShift[],
    shiftsToUpdate: ScheduleShift[],
    shiftsToDelete: ScheduleShift[]
  ) => {
    if (!currentSchedule) throw new Error('No current schedule');

    try {
      console.log('🔥 BULK SAVE: Preparing single API call for all changes...', {
        newShifts: newShifts.length,
        shiftsToUpdate: shiftsToUpdate.length,
        shiftsToDelete: shiftsToDelete.length
      });

      const operations: BulkOperationsDto['operations'] = [];

      // Add create operations with user assignment if needed
      newShifts.forEach((shift, index) => {
        operations.push({
          type: BulkOperationType.CREATE,
          clientId: `create-${index}`,
          data: {
            shiftTypeId: shift.shiftTypeId,
            date: shift.date,
            order: shift.order,
            userId: shift.userId // Include user assignment in create operation
          }
        });
      });

      // Add update operations
      shiftsToUpdate.forEach((shift, index) => {
        operations.push({
          type: BulkOperationType.UPDATE,
          id: shift.id,
          clientId: `update-${index}`,
          data: {
            userId: shift.userId,
            order: shift.order
          }
        });
      });

      // Add delete operations
      shiftsToDelete.forEach((shift, index) => {
        operations.push({
          type: BulkOperationType.DELETE,
          id: shift.id,
          clientId: `delete-${index}`
        });
      });

      if (operations.length === 0) {
        console.log('No changes to save');
        return true;
      }

      console.log(`🚀 MAKING SINGLE BULK API CALL with ${operations.length} operations`);
      
      // Execute single bulk operation API call
      const result = await scheduleShiftsApi.bulkOperations(currentSchedule.id, { operations });

      console.log('🎉 BULK SAVE RESULT:', result);

      if (!result.allSuccessful) {
        const failedOps = result.results.filter(r => !r.success);
        console.error('Some operations failed:', failedOps);
        throw new Error(`${result.failedOperations} operations failed`);
      }

      // Refresh data to get latest state
      await loadScheduleShifts(currentSchedule.id);

      console.log('✅ ALL CHANGES SAVED IN SINGLE API CALL');
      return true;
    } catch (err) {
      console.error('💥 Bulk save failed:', err);
      // Re-load data to reset to server state
      await loadScheduleShifts(currentSchedule.id);
      throw err;
    }
  };

  // Initial data loading
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);

      try {
        console.log('[useScheduleData] Loading data for scheduleId:', scheduleId);
        
        // Load shift types first
        await loadShiftTypes();
        
        // Load schedules and get current schedule ID
        const currentScheduleId = await loadSchedules();
        
        // Load schedule shifts if we have a schedule
        if (currentScheduleId) {
          await loadScheduleShifts(currentScheduleId);
        } else {
          console.log('[useScheduleData] No schedule ID, skipping shift load');
        }
      } catch (err) {
        console.error('Failed to load initial data:', err);
        setError('Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [scheduleId]);

  return {
    // Data
    shiftTypes,
    schedules,
    currentSchedule,
    scheduleShifts,
    
    // State
    loading,
    error,
    
    // Actions
    createShiftType,
    createScheduleShifts,
    updateScheduleShift,
    deleteScheduleShifts,
    saveScheduleChanges,
    copyPreviousWeek,
    publishSchedule,
    unpublishSchedule,
    
    // Refresh functions
    refreshShiftTypes: loadShiftTypes,
    refreshSchedules: loadSchedules,
    refreshScheduleShifts: () => currentSchedule ? loadScheduleShifts(currentSchedule.id) : Promise.resolve()
  };
};