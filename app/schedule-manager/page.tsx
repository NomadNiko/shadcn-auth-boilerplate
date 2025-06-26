"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Plus } from "lucide-react";
import { schedulesApi } from "@/lib/api-services";
import type { Schedule } from "@/types/schedule";

export default function ScheduleManagerPage() {
  const router = useRouter();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedWeek, setSelectedWeek] = useState<Date>(new Date());

  // Load schedules on component mount
  useEffect(() => {
    loadSchedules();
  }, []);

  // Initialize selected week when create dialog opens
  useEffect(() => {
    if (showCreateDialog) {
      const today = new Date();
      const currentMonday = new Date(today);
      currentMonday.setDate(today.getDate() - today.getDay() + 1); // Current week Monday
      setSelectedWeek(currentMonday);
    }
  }, [showCreateDialog]);

  const loadSchedules = async () => {
    setLoading(true);
    try {
      const data = await schedulesApi.getAll();
      console.log('📅 Loaded schedules from API:', data);
      // Convert DTOs to frontend format
      const converted = data.map(dto => ({
        id: dto.id,
        name: dto.name,
        startDate: typeof dto.startDate === 'string' ? dto.startDate : new Date(dto.startDate).toISOString().split('T')[0],
        endDate: typeof dto.endDate === 'string' ? dto.endDate : new Date(dto.endDate).toISOString().split('T')[0],
        status: dto.status,
        totalShifts: dto.totalShifts,
        assignedShifts: dto.assignedShifts
      }));
      // Sort by start date, most recent first
      const sorted = converted.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
      setSchedules(sorted);
    } catch (err) {
      console.error('Failed to load schedules:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleScheduleSelect = (schedule: Schedule) => {
    // Navigate to assign page with selected schedule
    router.push(`/schedule-manager/assign?scheduleId=${schedule.id}`);
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newWeek = new Date(selectedWeek);
    newWeek.setDate(selectedWeek.getDate() + (direction === 'next' ? 7 : -7));
    setSelectedWeek(newWeek);
  };

  const formatWeekRange = (startDate: Date) => {
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);
    
    const startStr = startDate.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric' 
    });
    const endStr = endDate.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric',
      year: 'numeric'
    });
    
    return `Week of ${startStr}-${endStr.split(' ')[1]}, ${endDate.getFullYear()}`;
  };

  const createNewSchedule = async () => {
    setLoading(true);
    try {
      const monday = new Date(selectedWeek);
      monday.setDate(selectedWeek.getDate() - selectedWeek.getDay() + 1);
      
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      
      const startDate = monday.toISOString().split('T')[0];
      const endDate = sunday.toISOString().split('T')[0];
      const name = formatWeekRange(monday);
      
      const newScheduleDto = await schedulesApi.create({
        name,
        startDate,
        endDate
      });
      
      // Convert DTO to frontend format
      const newSchedule = {
        id: newScheduleDto.id,
        name: newScheduleDto.name,
        startDate: typeof newScheduleDto.startDate === 'string' ? newScheduleDto.startDate : new Date(newScheduleDto.startDate).toISOString().split('T')[0],
        endDate: typeof newScheduleDto.endDate === 'string' ? newScheduleDto.endDate : new Date(newScheduleDto.endDate).toISOString().split('T')[0],
        status: newScheduleDto.status
      };
      
      handleScheduleSelect(newSchedule);
    } catch (err) {
      console.error('Failed to create schedule:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatScheduleStatus = (status: string) => {
    return status === 'draft' ? 'Draft' : 'Published';
  };

  const getStatusColor = (status: string) => {
    return status === 'draft' 
      ? 'bg-yellow-100 text-yellow-800 border-yellow-200' 
      : 'bg-green-100 text-green-800 border-green-200';
  };

  // Create dialog
  if (showCreateDialog) {
    const monday = new Date(selectedWeek);
    monday.setDate(selectedWeek.getDate() - selectedWeek.getDay() + 1);
    
    const startDate = monday.toISOString().split('T')[0];
    const existingSchedule = schedules.find(schedule => schedule.startDate === startDate);

    const handleAction = () => {
      if (existingSchedule) {
        // Edit existing schedule
        handleScheduleSelect(existingSchedule);
      } else {
        // Create new schedule
        createNewSchedule();
      }
    };

    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold">Create New Schedule</h1>
              <p className="text-muted-foreground">Select the week for your new schedule</p>
            </div>
            <Button 
              variant="outline" 
              onClick={() => setShowCreateDialog(false)}
            >
              Back
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-center">Select Week</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-center space-x-4">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => navigateWeek('prev')}
                >
                  ←
                </Button>
                
                <div className={`text-center transition-opacity ${existingSchedule ? 'opacity-60' : ''}`}>
                  <div className="text-lg font-medium">
                    {formatWeekRange(monday)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {monday.toLocaleDateString('en-US', { weekday: 'long' })} - {
                      new Date(monday.getTime() + 6 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { weekday: 'long' })
                    }
                  </div>
                  {existingSchedule && (
                    <div className="mt-2 text-sm text-blue-600 font-medium">
                      Schedule exists: {existingSchedule.name}
                    </div>
                  )}
                </div>
                
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => navigateWeek('next')}
                >
                  →
                </Button>
              </div>

              {existingSchedule && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                  <p className="text-blue-800 font-medium">Schedule found for this week</p>
                  <p className="text-blue-700 text-sm">You can edit the existing schedule instead</p>
                </div>
              )}

              <div className="flex justify-center">
                <Button 
                  onClick={handleAction}
                  disabled={loading}
                  className={`w-full max-w-xs ${existingSchedule ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
                >
                  {loading ? 'Processing...' : existingSchedule ? 'Edit Schedule' : 'Create Schedule'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Main schedules list
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Schedule Manager</h1>
            <p className="text-muted-foreground">Manage your weekly schedules</p>
          </div>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create New Schedule
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="text-lg">Loading schedules...</div>
          </div>
        ) : schedules.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No schedules found</h3>
              <p className="text-muted-foreground mb-4">Create your first schedule to get started</p>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create New Schedule
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {schedules.map((schedule) => (
              <Card 
                key={schedule.id} 
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => handleScheduleSelect(schedule)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">{schedule.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {new Date(schedule.startDate).toLocaleDateString()} - {new Date(schedule.endDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center space-x-3">
                      {schedule.totalShifts !== undefined && (
                        <div className="text-sm text-muted-foreground">
                          {schedule.assignedShifts || 0}/{schedule.totalShifts} assigned
                        </div>
                      )}
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(schedule.status)}`}>
                        {formatScheduleStatus(schedule.status)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}