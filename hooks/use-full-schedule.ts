/**
 * Hook for fetching complete schedule data with all employees and shifts
 */

"use client";

import { useState, useEffect } from "react";
import { schedulesApi, scheduleShiftsApi } from "@/lib/api-services";
import { useEmployees } from "@/hooks/use-employees";
import type { Schedule, ScheduleShift } from "@/types/schedule";

// Same conversion functions as in use-user-schedule.ts
const convertShiftType = (dto: any) => ({
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
  shiftTypeId: dto.shiftType?.id || dto.shiftTypeId,
  shiftType: convertShiftType(dto.shiftType),
  date: new Date(dto.date).toISOString().split('T')[0],
  order: dto.order,
  userId: dto.user?.id || undefined,
  user: dto.user ? {
    id: dto.user._id || dto.user.id,
    _id: dto.user._id,
    firstName: dto.user.firstName || '',
    lastName: dto.user.lastName || '',
    role: typeof dto.user.role === 'string' ? dto.user.role : (dto.user.role?.name || 'Employee'),
    email: dto.user.email
  } : undefined,
  actualStartTime: dto.actualStartTime || undefined,
  actualEndTime: dto.actualEndTime || undefined
});

interface FullScheduleData {
  schedules: Schedule[];
  loading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
  getScheduleData: (scheduleId: string) => {
    assignedShifts: ScheduleShift[];
    unassignedShifts: ScheduleShift[];
  };
}

export function useFullSchedule(): FullScheduleData {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [scheduleShiftsMap, setScheduleShiftsMap] = useState<Map<string, { assigned: ScheduleShift[], unassigned: ScheduleShift[] }>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { employees } = useEmployees();

  const fetchFullScheduleData = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('[useFullSchedule] Loading all schedules...');
      
      // Get all published schedules
      const allSchedules = await schedulesApi.getAll();
      const publishedSchedules = allSchedules
        .map(convertSchedule)
        .filter(schedule => schedule.status === 'published');

      console.log('[useFullSchedule] Found published schedules:', publishedSchedules.length);

      const shiftsMap = new Map();

      // For each published schedule, get all shifts
      for (const schedule of publishedSchedules) {
        try {
          console.log(`[useFullSchedule] Loading shifts for ${schedule.name}...`);
          const shiftsData = await scheduleShiftsApi.getBySchedule(schedule.id);
          
          const assignedShifts = shiftsData.shifts.map(convertScheduleShift);
          const unassignedShifts = shiftsData.unassignedShifts.map(convertScheduleShift);
          
          shiftsMap.set(schedule.id, {
            assigned: assignedShifts,
            unassigned: unassignedShifts
          });
          
          console.log(`[useFullSchedule] Loaded ${assignedShifts.length} assigned, ${unassignedShifts.length} unassigned shifts for ${schedule.name}`);
        } catch (err) {
          console.warn(`Failed to fetch shifts for schedule ${schedule.id}:`, err);
        }
      }

      setSchedules(publishedSchedules);
      setScheduleShiftsMap(shiftsMap);

    } catch (err) {
      console.error('Failed to fetch full schedule data:', err);
      setError('Failed to load schedule data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchFullScheduleData();
  }, []);

  const getScheduleData = (scheduleId: string) => {
    const data = scheduleShiftsMap.get(scheduleId);
    return {
      assignedShifts: data?.assigned || [],
      unassignedShifts: data?.unassigned || []
    };
  };

  return {
    schedules,
    loading,
    error,
    refreshData: fetchFullScheduleData,
    getScheduleData
  };
}