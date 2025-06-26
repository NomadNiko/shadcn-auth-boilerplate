/**
 * My Schedule Page - View-only schedule for users
 * 
 * Shows user's complete schedule across all published schedules in a read-only format
 */

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, ArrowLeft, User, CalendarDays, ChevronDown, ChevronUp, Users } from "lucide-react";
import { useUserScheduleGrouped } from "@/hooks/use-user-schedule";
import { useFullSchedule } from "@/hooks/use-full-schedule";
import { useEmployees } from "@/hooks/use-employees";
import { FullScheduleCard } from "@/components/full-schedule-grid";
import { shiftTypeColors } from "@/types/schedule";
import { format, parseISO, addDays, isSameDay } from "date-fns";
import type { ScheduleShift } from "@/types/schedule";

interface ScheduleGridProps {
  shifts: ScheduleShift[];
  startDate: string;
  endDate: string;
}

function ScheduleGrid({ shifts, startDate, endDate }: ScheduleGridProps) {
  const start = parseISO(startDate);
  const end = parseISO(endDate);
  
  console.log('[ScheduleGrid] Date range:', { startDate, endDate, start, end });
  console.log('[ScheduleGrid] Shifts:', shifts.length, shifts.map(s => ({ id: s.id, date: s.date, name: s.shiftType.name })));
  
  // Ensure we always show Monday-Sunday for the schedule week
  // Calculate Monday of the week containing the start date
  const monday = new Date(start);
  monday.setDate(start.getDate() - start.getDay() + 1);
  
  // Generate 7 days starting from Monday
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(monday, i));
  
  console.log('[ScheduleGrid] Week days:', weekDays.map(d => format(d, 'yyyy-MM-dd')));
  
  const getShiftsForDay = (date: Date) => {
    const dayShifts = shifts.filter(shift => isSameDay(parseISO(shift.date), date))
      .sort((a, b) => a.order - b.order);
    console.log(`[ScheduleGrid] Shifts for ${format(date, 'yyyy-MM-dd')}:`, dayShifts.length);
    return dayShifts;
  };

  return (
    <div className="border border-slate-700 rounded-lg overflow-hidden">
      {/* Desktop View - Hidden on mobile */}
      <div className="hidden md:block">
        {/* Header Row */}
        <div className="grid grid-cols-8 bg-slate-800">
          <div className="p-3 border-r border-slate-700">
            <div className="text-sm font-medium text-slate-300">Week</div>
            <div className="text-xs text-slate-400">
              {format(monday, "MMM d")} - {format(addDays(monday, 6), "MMM d")}
            </div>
          </div>
          {weekDays.map((day, index) => (
            <div key={index} className="p-3 text-center border-r border-slate-700 last:border-r-0">
              <div className="text-sm font-medium text-slate-300">{format(day, "EEE")}</div>
              <div className="text-xs text-slate-400">{format(day, "d")}</div>
            </div>
          ))}
        </div>

        {/* Shifts Row */}
        <div className="grid grid-cols-8 min-h-[120px]">
          <div className="p-3 border-r border-slate-700 bg-slate-900 flex items-center">
            <div className="flex items-center text-sm text-slate-400">
              <User className="w-4 h-4 mr-2" />
              My Shifts
            </div>
          </div>
          {weekDays.map((day, dayIndex) => {
            const dayShifts = getShiftsForDay(day);
            const dayString = format(day, 'yyyy-MM-dd');
            const isInRange = dayString >= startDate && dayString <= endDate;
            
            console.log(`[ScheduleGrid] Day ${dayString}: isInRange=${isInRange}, shifts=${dayShifts.length}, range=${startDate} to ${endDate}`);
            
            return (
              <div 
                key={dayIndex} 
                className={`p-2 border-r border-slate-700 last:border-r-0 space-y-1 ${
                  !isInRange ? 'bg-slate-900/50' : ''
                }`}
              >
                {dayShifts.map((shift) => {
                  console.log(`[ScheduleGrid] Rendering shift:`, shift.shiftType.name, `on ${dayString}`);
                  const actualStartTime = shift.actualStartTime || shift.shiftType.startTime;
                  const actualEndTime = shift.actualEndTime || shift.shiftType.endTime;
                  
                  return (
                    <div 
                      key={shift.id}
                      className={`rounded-md p-2 text-xs ${shiftTypeColors[shift.shiftType.colorIndex]}`}
                    >
                      <div className="font-medium mb-1">{shift.shiftType.name}</div>
                      <div className="flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>{actualStartTime} - {actualEndTime}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* Mobile View - Stacked days */}
      <div className="md:hidden">
        {/* Week Header */}
        <div className="bg-slate-800 p-3 border-b border-slate-700">
          <div className="text-sm font-medium text-slate-300">My Schedule</div>
          <div className="text-xs text-slate-400">
            {format(monday, "MMM d")} - {format(addDays(monday, 6), "MMM d")}
          </div>
        </div>

        {/* Stacked Days */}
        <div className="space-y-0">
          {weekDays.map((day, dayIndex) => {
            const dayShifts = getShiftsForDay(day);
            const dayString = format(day, 'yyyy-MM-dd');
            const isInRange = dayString >= startDate && dayString <= endDate;
            const isToday = format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
            
            return (
              <div 
                key={dayIndex} 
                className={`border-b border-slate-700/50 last:border-b-0 ${
                  !isInRange ? 'bg-slate-900/50' : ''
                } ${isToday ? 'bg-slate-800/30' : ''}`}
              >
                {/* Day Header */}
                <div className="p-3 bg-slate-800/50 border-b border-slate-700/30">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-slate-300">
                        {format(day, "EEEE")} {/* Full day name */}
                      </div>
                      <div className="text-xs text-slate-400">
                        {format(day, "MMM d")}
                        {isToday && <span className="ml-2 text-yellow-400">Today</span>}
                      </div>
                    </div>
                    <div className="text-xs text-slate-500">
                      {dayShifts.length} shift{dayShifts.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                </div>

                {/* Day Shifts */}
                <div className="p-3">
                  {dayShifts.length > 0 ? (
                    <div className="space-y-2">
                      {dayShifts.map((shift) => {
                        const actualStartTime = shift.actualStartTime || shift.shiftType.startTime;
                        const actualEndTime = shift.actualEndTime || shift.shiftType.endTime;
                        
                        return (
                          <div 
                            key={shift.id}
                            className={`rounded-lg p-3 ${shiftTypeColors[shift.shiftType.colorIndex]}`}
                          >
                            <div className="font-medium text-sm mb-1">{shift.shiftType.name}</div>
                            <div className="flex items-center space-x-1 text-xs">
                              <Clock className="w-3 h-3" />
                              <span>{actualStartTime} - {actualEndTime}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-slate-500 text-sm">
                      No shifts scheduled
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

interface ScheduleCardProps {
  schedule: {
    id: string;
    name: string;
    startDate: string;
    endDate: string;
    status: string;
    userShifts: ScheduleShift[];
  };
  isExpanded: boolean;
  onToggle: () => void;
}

function ScheduleCard({ schedule, isExpanded, onToggle }: ScheduleCardProps) {
  const totalHours = schedule.userShifts.reduce((total, shift) => {
    const start = shift.actualStartTime || shift.shiftType.startTime;
    const end = shift.actualEndTime || shift.shiftType.endTime;
    
    // Parse time strings to calculate duration
    const [startHour, startMin] = start.split(':').map(Number);
    const [endHour, endMin] = end.split(':').map(Number);
    
    const startMinutes = startHour * 60 + startMin;
    let endMinutes = endHour * 60 + endMin;
    
    // Handle overnight shifts (e.g., 22:00 to 06:00)
    if (endMinutes <= startMinutes) {
      endMinutes += 24 * 60; // Add 24 hours
    }
    
    const durationMinutes = endMinutes - startMinutes;
    const durationHours = durationMinutes / 60;
    
    return total + durationHours;
  }, 0);

  return (
    <Card className="border-slate-700 bg-card">
      <CardHeader className="cursor-pointer" onClick={onToggle}>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center">
              <CalendarDays className="mr-2 h-5 w-5" />
              {schedule.name}
            </CardTitle>
            <CardDescription className="mt-1">
              {format(parseISO(schedule.startDate), "MMM d")} - {format(parseISO(schedule.endDate), "MMM d, yyyy")}
            </CardDescription>
          </div>
          <div className="flex items-center space-x-3">
            <div className="text-right">
              <div className="text-sm font-medium">{schedule.userShifts.length} shifts</div>
              <div className="text-xs text-slate-400">{totalHours.toFixed(1)} hours</div>
            </div>
            <Badge variant="outline" className="bg-green-950/30 text-green-300 border-green-800/30">
              Published
            </Badge>
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-slate-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-slate-400" />
            )}
          </div>
        </div>
      </CardHeader>
      
      {isExpanded && (
        <CardContent>
          <ScheduleGrid 
            shifts={schedule.userShifts}
            startDate={schedule.startDate}
            endDate={schedule.endDate}
          />
          
        </CardContent>
      )}
    </Card>
  );
}

export default function MySchedulePage() {
  const router = useRouter();
  const { schedulesWithShifts, totalShifts, loading, error } = useUserScheduleGrouped();
  const { schedules: allSchedules, loading: fullLoading, error: fullError, getScheduleData } = useFullSchedule();
  const { employees } = useEmployees();
  const [expandedSchedules, setExpandedSchedules] = useState<Set<string>>(new Set());
  const [expandedFullSchedules, setExpandedFullSchedules] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'my-schedule' | 'full-schedule'>('my-schedule');

  // Auto-expand most recent schedule when data loads
  useEffect(() => {
    if (schedulesWithShifts.length > 0 && expandedSchedules.size === 0) {
      const mostRecent = schedulesWithShifts
        .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())[0];
      setExpandedSchedules(new Set([mostRecent.id]));
    }
  }, [schedulesWithShifts.length > 0]);

  useEffect(() => {
    if (allSchedules.length > 0 && expandedFullSchedules.size === 0) {
      const mostRecent = allSchedules
        .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())[0];
      setExpandedFullSchedules(new Set([mostRecent.id]));
    }
  }, [allSchedules.length > 0]);

  const toggleSchedule = (scheduleId: string) => {
    setExpandedSchedules(prev => {
      const newSet = new Set(prev);
      if (newSet.has(scheduleId)) {
        newSet.delete(scheduleId);
      } else {
        newSet.add(scheduleId);
      }
      return newSet;
    });
  };

  const toggleFullSchedule = (scheduleId: string) => {
    setExpandedFullSchedules(prev => {
      const newSet = new Set(prev);
      if (newSet.has(scheduleId)) {
        newSet.delete(scheduleId);
      } else {
        newSet.add(scheduleId);
      }
      return newSet;
    });
  };

  const expandAll = () => {
    if (activeTab === 'my-schedule') {
      setExpandedSchedules(new Set(schedulesWithShifts.map(s => s.id)));
    } else {
      setExpandedFullSchedules(new Set(allSchedules.map(s => s.id)));
    }
  };

  const collapseAll = () => {
    if (activeTab === 'my-schedule') {
      setExpandedSchedules(new Set());
    } else {
      setExpandedFullSchedules(new Set());
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <div className="text-lg font-semibold mb-2">Loading Your Schedule...</div>
              <div className="text-sm text-muted-foreground">Please wait while we fetch your shifts</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Button 
              onClick={() => router.push("/dashboard")}
              variant="outline"
              size="sm"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Schedule Overview</h1>
              <p className="text-muted-foreground">
                View schedules and shift assignments
              </p>
            </div>
          </div>
          
          {((schedulesWithShifts.length > 0 && activeTab === 'my-schedule') || 
            (allSchedules.length > 0 && activeTab === 'full-schedule')) && (
            <div className="flex items-center space-x-2">
              <Button onClick={expandAll} variant="outline" size="sm">
                Expand All
              </Button>
              <Button onClick={collapseAll} variant="outline" size="sm">
                Collapse All
              </Button>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 mb-8">
          <button
            onClick={() => setActiveTab('my-schedule')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'my-schedule'
                ? 'bg-primary text-primary-foreground'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-300'
            }`}
          >
            <User className="w-4 h-4 mr-2 inline" />
            My Schedule
          </button>
          <button
            onClick={() => setActiveTab('full-schedule')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'full-schedule'
                ? 'bg-primary text-primary-foreground'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-300'
            }`}
          >
            <Users className="w-4 h-4 mr-2 inline" />
            Full Schedule
          </button>
        </div>

        {/* My Schedule Tab Content */}
        {activeTab === 'my-schedule' && (
          <>
            {/* Summary */}
            {schedulesWithShifts.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card className="border-slate-700 bg-card">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <CalendarDays className="w-5 h-5 text-blue-400" />
                  <div>
                    <div className="text-2xl font-bold">{schedulesWithShifts.length}</div>
                    <div className="text-sm text-slate-400">Active Schedules</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-slate-700 bg-card">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Clock className="w-5 h-5 text-green-400" />
                  <div>
                    <div className="text-2xl font-bold">{totalShifts}</div>
                    <div className="text-sm text-slate-400">Total Shifts</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-slate-700 bg-card">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <User className="w-5 h-5 text-purple-400" />
                  <div>
                    <div className="text-2xl font-bold">
                      {schedulesWithShifts.reduce((total, schedule) => {
                        return total + schedule.userShifts.reduce((scheduleTotal, shift) => {
                          const start = shift.actualStartTime || shift.shiftType.startTime;
                          const end = shift.actualEndTime || shift.shiftType.endTime;
                          
                          const [startHour, startMin] = start.split(':').map(Number);
                          const [endHour, endMin] = end.split(':').map(Number);
                          
                          const startMinutes = startHour * 60 + startMin;
                          let endMinutes = endHour * 60 + endMin;
                          
                          // Handle overnight shifts
                          if (endMinutes <= startMinutes) {
                            endMinutes += 24 * 60;
                          }
                          
                          const durationHours = (endMinutes - startMinutes) / 60;
                          return scheduleTotal + durationHours;
                        }, 0);
                      }, 0).toFixed(1)}h
                    </div>
                    <div className="text-sm text-slate-400">Total Hours</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Error State */}
        {error && (
          <Card className="border-red-800 bg-red-950/20">
            <CardContent className="p-6 text-center">
              <div className="text-red-400 text-lg mb-2">Failed to Load Schedule</div>
              <div className="text-sm text-slate-400 mb-4">{error}</div>
              <Button onClick={() => window.location.reload()} variant="outline">
                Try Again
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Schedules */}
        {schedulesWithShifts.length > 0 ? (
          <div className="space-y-6">
            {schedulesWithShifts
              .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
              .map((schedule) => (
                <ScheduleCard
                  key={schedule.id}
                  schedule={schedule}
                  isExpanded={expandedSchedules.has(schedule.id)}
                  onToggle={() => toggleSchedule(schedule.id)}
                />
              ))}
          </div>
        ) : !loading && !error && (
          <div className="text-center py-20">
            <div className="mx-auto w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mb-6">
              <Calendar className="w-10 h-10 text-slate-400" />
            </div>
            <h2 className="text-xl font-semibold text-slate-300 mb-2">No Schedules Found</h2>
            <p className="text-slate-500 mb-6">
              You don&apos;t have any assigned shifts in published schedules yet.
            </p>
            <Button onClick={() => router.push("/dashboard")} variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </div>
        )}
            </>
        )}

        {/* Full Schedule Tab Content */}
        {activeTab === 'full-schedule' && (
          <>
            {fullLoading ? (
              <div className="flex items-center justify-center py-20">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                  <div className="text-lg font-semibold mb-2">Loading Full Schedule...</div>
                  <div className="text-sm text-muted-foreground">Please wait while we fetch all schedule data</div>
                </div>
              </div>
            ) : fullError ? (
              <Card className="border-red-800 bg-red-950/20">
                <CardContent className="p-6 text-center">
                  <div className="text-red-400 text-lg mb-2">Failed to Load Full Schedule</div>
                  <div className="text-sm text-slate-400 mb-4">{fullError}</div>
                  <Button onClick={() => window.location.reload()} variant="outline">
                    Try Again
                  </Button>
                </CardContent>
              </Card>
            ) : allSchedules.length > 0 ? (
              <>
                {/* Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                  <Card className="border-slate-700 bg-card">
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-2">
                        <CalendarDays className="w-5 h-5 text-blue-400" />
                        <div>
                          <div className="text-2xl font-bold">{allSchedules.length}</div>
                          <div className="text-sm text-slate-400">Published Schedules</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="border-slate-700 bg-card">
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-2">
                        <Users className="w-5 h-5 text-green-400" />
                        <div>
                          <div className="text-2xl font-bold">{employees?.length || 0}</div>
                          <div className="text-sm text-slate-400">Total Employees</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="border-slate-700 bg-card">
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-2">
                        <Clock className="w-5 h-5 text-purple-400" />
                        <div>
                          <div className="text-2xl font-bold">
                            {allSchedules.reduce((total, schedule) => {
                              const { assignedShifts, unassignedShifts } = getScheduleData(schedule.id);
                              return total + assignedShifts.length + unassignedShifts.length;
                            }, 0)}
                          </div>
                          <div className="text-sm text-slate-400">Total Shifts</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Schedules */}
                <div className="space-y-6">
                  {allSchedules
                    .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
                    .map((schedule) => (
                      <FullScheduleCard
                        key={schedule.id}
                        schedule={schedule}
                        employees={employees || []}
                        getScheduleData={getScheduleData}
                        isExpanded={expandedFullSchedules.has(schedule.id)}
                        onToggle={() => toggleFullSchedule(schedule.id)}
                      />
                    ))}
                </div>
              </>
            ) : (
              <div className="text-center py-20">
                <div className="mx-auto w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mb-6">
                  <Users className="w-10 h-10 text-slate-400" />
                </div>
                <h2 className="text-xl font-semibold text-slate-300 mb-2">No Published Schedules</h2>
                <p className="text-slate-500 mb-6">
                  There are no published schedules available to view at this time.
                </p>
                <Button onClick={() => router.push("/dashboard")} variant="outline">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Dashboard
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}