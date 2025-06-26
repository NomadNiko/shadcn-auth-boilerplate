/**
 * My Schedule Widget Component
 * 
 * Shows user's upcoming shifts and provides quick access to their full schedule
 */

"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Eye, ArrowRight } from "lucide-react";
import { useUpcomingShifts } from "@/hooks/use-user-schedule";
import { shiftTypeColors } from "@/types/schedule";
import { format, parseISO, isToday, isTomorrow } from "date-fns";
import type { ScheduleShift } from "@/types/schedule";

interface ShiftCardProps {
  shift: ScheduleShift;
}

function ShiftCard({ shift }: ShiftCardProps) {
  const shiftDate = parseISO(shift.date);
  const actualStartTime = shift.actualStartTime || shift.shiftType.startTime;
  const actualEndTime = shift.actualEndTime || shift.shiftType.endTime;
  
  const getDateLabel = (date: Date) => {
    if (isToday(date)) return "Today";
    if (isTomorrow(date)) return "Tomorrow";
    return format(date, "MMM d");
  };

  return (
    <div className={`rounded border px-2 py-1.5 ${shiftTypeColors[shift.shiftType.colorIndex]} transition-colors hover:brightness-110`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 min-w-0 flex-1">
          <div className="font-medium text-xs truncate">{shift.shiftType.name}</div>
          <div className="flex items-center space-x-1 text-xs">
            <Clock className="w-2.5 h-2.5 flex-shrink-0" />
            <span className="whitespace-nowrap">{actualStartTime} - {actualEndTime}</span>
          </div>
        </div>
        <div className="text-xs opacity-90 ml-2 whitespace-nowrap">
          {getDateLabel(shiftDate)}
        </div>
      </div>
    </div>
  );
}

export function MyScheduleWidget() {
  const router = useRouter();
  const { upcomingShifts, loading, error } = useUpcomingShifts();

  if (loading) {
    return (
      <Card className="border-slate-700 bg-card card-glow">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="mr-2 h-5 w-5" />
            My Schedule
          </CardTitle>
          <CardDescription>Your upcoming shifts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-slate-700 bg-card card-glow">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="mr-2 h-5 w-5" />
            My Schedule
          </CardTitle>
          <CardDescription>Your upcoming shifts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="text-red-400 text-sm mb-2">Failed to load schedule</div>
            <div className="text-xs text-slate-400">{error}</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-slate-700 bg-card card-glow">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Calendar className="mr-2 h-5 w-5" />
          My Schedule
        </CardTitle>
        <CardDescription>
          {upcomingShifts.length > 0 
            ? `${upcomingShifts.length} upcoming shift${upcomingShifts.length !== 1 ? 's' : ''} this week`
            : "No upcoming shifts this week"
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {upcomingShifts.length > 0 ? (
          <>
            <div className="space-y-1">
              {upcomingShifts.slice(0, 10).map((shift) => (
                <ShiftCard key={shift.id} shift={shift} />
              ))}
              {upcomingShifts.length > 10 && (
                <div className="text-xs text-center text-slate-400 py-1">
                  +{upcomingShifts.length - 10} more shift{upcomingShifts.length - 10 !== 1 ? 's' : ''}
                </div>
              )}
            </div>
            
            <div className="pt-2 border-t border-slate-700">
              <Button 
                onClick={() => router.push("/my-schedule")}
                variant="outline"
                className="w-full"
              >
                <Eye className="mr-2 h-4 w-4" />
                View Full Schedule
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </>
        ) : (
          <div className="text-center py-8 space-y-4">
            <div className="mx-auto w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center">
              <Calendar className="w-8 h-8 text-slate-400" />
            </div>
            <div>
              <div className="text-sm text-slate-300 mb-1">No shifts scheduled</div>
              <div className="text-xs text-slate-500">You don&apos;t have any shifts in the next 7 days</div>
            </div>
            <Button 
              onClick={() => router.push("/my-schedule")}
              variant="outline"
              size="sm"
            >
              <Eye className="mr-2 h-4 w-4" />
              View All Schedules
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}