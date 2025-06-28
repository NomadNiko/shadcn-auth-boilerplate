/**
 * Schedule Manager Widget Component
 * 
 * Displays recent schedules with edit buttons and create new schedule action
 */

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar, 
  CalendarPlus, 
  Edit, 
  Clock, 
  Users,
  Loader2
} from "lucide-react";
import { schedulesApi, type ScheduleDto } from "@/lib/api-services";
import { format } from "date-fns";

export function ScheduleManagerWidget() {
  const router = useRouter();
  const [schedules, setSchedules] = useState<ScheduleDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadRecentSchedules();
  }, []);

  const loadRecentSchedules = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get all schedules, API will return them sorted by creation date
      const allSchedules = await schedulesApi.getAll({ limit: 10 });
      
      // Take the 3 most recent schedules
      setSchedules(allSchedules.slice(0, 3));
    } catch (err) {
      console.error("Failed to load schedules:", err);
      setError("Failed to load schedules");
    } finally {
      setLoading(false);
    }
  };

  const handleEditSchedule = (scheduleId: string) => {
    router.push(`/schedule-manager/assign?scheduleId=${scheduleId}`);
  };

  const handleCreateSchedule = () => {
    router.push("/schedule-manager");
  };

  const getStatusBadgeVariant = (status: string) => {
    return status === 'published' ? 'default' : 'secondary';
  };

  const formatDateRange = (startDate: string, endDate: string) => {
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);
      return `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`;
    } catch {
      return 'Invalid date range';
    }
  };

  if (loading) {
    return (
      <Card className="border-slate-700 bg-card card-glow">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="mr-2 h-5 w-5" />
            Schedule Manager
          </CardTitle>
          <CardDescription>
            Recent schedules and quick actions
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
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
            Schedule Manager
          </CardTitle>
          <CardDescription>
            Recent schedules and quick actions
          </CardDescription>
        </CardHeader>
        <CardContent className="py-8">
          <div className="text-center text-red-400">
            <p className="text-sm">{error}</p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={loadRecentSchedules}
              className="mt-2"
            >
              Try Again
            </Button>
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
          Schedule Manager
        </CardTitle>
        <CardDescription>
          Recent schedules and quick actions
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {schedules.length === 0 ? (
          <div className="text-center py-6">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-sm text-muted-foreground mb-4">
              No schedules created yet
            </p>
            <Button onClick={handleCreateSchedule} className="w-full">
              <CalendarPlus className="mr-2 h-4 w-4" />
              Create Your First Schedule
            </Button>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {schedules.map((schedule) => (
                <div
                  key={schedule.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-slate-700 bg-slate-800/50 hover:bg-slate-800/70 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-sm truncate">
                        {schedule.name}
                      </h4>
                      <Badge variant={getStatusBadgeVariant(schedule.status)} className="text-xs">
                        {schedule.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDateRange(schedule.startDate, schedule.endDate)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {schedule.assignedShifts || 0}/{schedule.totalShifts || 0}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditSchedule(schedule.id)}
                    className="ml-2 px-2"
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
            
            <div className="pt-2 border-t border-slate-700">
              <Button 
                onClick={handleCreateSchedule} 
                variant="outline" 
                className="w-full"
              >
                <CalendarPlus className="mr-2 h-4 w-4" />
                Create New Schedule
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}