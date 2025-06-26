/**
 * Hook for fetching and managing user's assigned schedules and shifts
 */

"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { schedulesApi, scheduleShiftsApi } from "@/lib/api-services";
import type { Schedule, ScheduleShift } from "@/types/schedule";

// Convert backend DTOs to frontend types (same as in use-schedule-data.ts)
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

interface UserScheduleData {
  schedules: Schedule[];
  shifts: ScheduleShift[];
  loading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
}

interface ScheduleWithShifts extends Schedule {
  userShifts: ScheduleShift[];
}

export function useUserSchedule(): UserScheduleData {
  const { user } = useAuth();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [shifts, setShifts] = useState<ScheduleShift[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUserScheduleData = async () => {
    if (!user?._id) {
      setSchedules([]);
      setShifts([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log('[useUserSchedule] User ID:', user._id);
      
      // Get all published schedules
      const allSchedules = await schedulesApi.getAll();
      console.log('[useUserSchedule] All schedules:', allSchedules.length);
      
      const publishedSchedules = allSchedules
        .map(convertSchedule)
        .filter(schedule => schedule.status === 'published');
      console.log('[useUserSchedule] Published schedules:', publishedSchedules.length, publishedSchedules.map(s => ({ id: s.id, name: s.name, status: s.status })));

      const userShifts: ScheduleShift[] = [];
      const schedulesWithUserShifts: Schedule[] = [];

      // For each published schedule, get shifts and filter for current user
      for (const schedule of publishedSchedules) {
        try {
          console.log(`[useUserSchedule] Fetching shifts for schedule ${schedule.id} (${schedule.name})`);
          const shiftsData = await scheduleShiftsApi.getBySchedule(schedule.id);
          console.log(`[useUserSchedule] Raw shifts data for ${schedule.id}:`, shiftsData);
          
          const { shifts: scheduleShifts } = shiftsData;
          const convertedShifts = scheduleShifts.map(convertScheduleShift);
          console.log(`[useUserSchedule] Converted shifts for ${schedule.id}:`, convertedShifts.length, convertedShifts.map(s => ({ id: s.id, userId: s.userId, userName: s.user?.firstName })));
          
          const assignedToUser = convertedShifts.filter(shift => shift.userId === user._id);
          console.log(`[useUserSchedule] Assigned to user ${user._id}:`, assignedToUser.length);
          
          if (assignedToUser.length > 0) {
            userShifts.push(...assignedToUser);
            schedulesWithUserShifts.push(schedule);
          }
        } catch (err) {
          console.warn(`Failed to fetch shifts for schedule ${schedule.id}:`, err);
          // Continue with other schedules even if one fails
        }
      }

      console.log('[useUserSchedule] Final results:', {
        totalUserShifts: userShifts.length,
        schedulesWithShifts: schedulesWithUserShifts.length,
        userShifts: userShifts.map(s => ({ id: s.id, date: s.date, shiftType: s.shiftType.name }))
      });

      setSchedules(schedulesWithUserShifts);
      setShifts(userShifts);

    } catch (err) {
      console.error('Failed to fetch user schedule data:', err);
      setError('Failed to load your schedule data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchUserScheduleData();
  }, [user?._id]);

  return {
    schedules,
    shifts,
    loading,
    error,
    refreshData: fetchUserScheduleData
  };
}

/**
 * Hook for getting user's shifts grouped by schedule
 */
export function useUserScheduleGrouped() {
  const { schedules, shifts, loading, error, refreshData } = useUserSchedule();

  const schedulesWithShifts: ScheduleWithShifts[] = schedules.map(schedule => ({
    ...schedule,
    userShifts: shifts.filter(shift => shift.scheduleId === schedule.id)
  }));

  return {
    schedulesWithShifts,
    totalShifts: shifts.length,
    totalSchedules: schedules.length,
    loading,
    error,
    refreshData
  };
}

/**
 * Hook for getting user's upcoming shifts (next 7 days)
 */
export function useUpcomingShifts() {
  const { shifts, loading, error, refreshData } = useUserSchedule();

  const today = new Date();
  const todayDateString = today.toISOString().split('T')[0]; // Get YYYY-MM-DD format
  const nextWeekDate = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
  const nextWeekDateString = nextWeekDate.toISOString().split('T')[0];

  const upcomingShifts = shifts.filter(shift => {
    // shift.date is already in YYYY-MM-DD format, so we can compare strings directly
    return shift.date >= todayDateString && shift.date < nextWeekDateString;
  }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return {
    upcomingShifts,
    loading,
    error,
    refreshData
  };
}