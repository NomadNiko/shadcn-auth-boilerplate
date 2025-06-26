/**
 * FullScheduleGrid Component
 * 
 * Shows complete schedule with all employees and their shifts
 */

"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, User, ChevronDown, ChevronUp } from "lucide-react";
import { shiftTypeColors } from "@/types/schedule";
import { format, parseISO, addDays, isSameDay } from "date-fns";
import type { ScheduleShift, Employee } from "@/types/schedule";

interface FullScheduleGridProps {
  shifts: ScheduleShift[];
  employees: Employee[];
  startDate: string;
  endDate: string;
}

function FullScheduleGrid({ shifts, employees, startDate, endDate }: FullScheduleGridProps) {
  const start = parseISO(startDate);
  
  // Ensure we always show Monday-Sunday for the schedule week
  // Calculate Monday of the week containing the start date
  const monday = new Date(start);
  monday.setDate(start.getDate() - start.getDay() + 1);
  
  // Generate 7 days starting from Monday
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(monday, i));
  
  const getShiftsForEmployeeAndDay = (employeeId: string, date: Date) => {
    return shifts.filter(shift => 
      shift.userId === employeeId && 
      isSameDay(parseISO(shift.date), date)
    ).sort((a, b) => a.order - b.order);
  };
  
  const getUnassignedShiftsForDay = (date: Date) => {
    return shifts.filter(shift => 
      !shift.userId && 
      isSameDay(parseISO(shift.date), date)
    ).sort((a, b) => a.order - b.order);
  };

  // Get employees who have shifts in this schedule
  const employeesWithShifts = employees.filter(employee => 
    shifts.some(shift => shift.userId === employee.id)
  );

  return (
    <div className="border border-slate-700 rounded-lg overflow-hidden">
      {/* Header Row */}
      <div className="grid grid-cols-8 bg-slate-800">
        <div className="p-3 border-r border-slate-700">
          <div className="text-sm font-medium text-slate-300">Employees</div>
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

      {/* Employee Rows */}
      {employeesWithShifts.map((employee) => (
        <div key={employee.id} className="grid grid-cols-8 min-h-[80px] border-b border-slate-700/50 last:border-b-0">
          <div className="p-3 border-r border-slate-700 bg-slate-900 flex items-center">
            <div className="flex items-center text-sm">
              <User className="w-4 h-4 mr-2 text-slate-400" />
              <div>
                <div className="text-slate-300 font-medium">
                  {employee.firstName} {employee.lastName}
                </div>
                <div className="text-xs text-slate-500">{employee.role}</div>
              </div>
            </div>
          </div>
          {weekDays.map((day, dayIndex) => {
            const dayShifts = getShiftsForEmployeeAndDay(employee.id, day);
            
            return (
              <div 
                key={dayIndex} 
                className="p-2 border-r border-slate-700 last:border-r-0 space-y-1"
              >
                {dayShifts.map((shift) => {
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
                        {(shift.actualStartTime || shift.actualEndTime) && (
                          <span className="text-yellow-400">*</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      ))}

      {/* Unassigned Shifts Row */}
      <div className="grid grid-cols-8 min-h-[80px] border-t border-slate-700">
        <div className="p-3 border-r border-slate-700 bg-slate-900 flex items-center">
          <div className="text-sm text-slate-400">
            <div className="font-medium">Unassigned</div>
            <div className="text-xs">Need assignment</div>
          </div>
        </div>
        {weekDays.map((day, dayIndex) => {
          const unassignedShifts = getUnassignedShiftsForDay(day);
          
          return (
            <div 
              key={dayIndex} 
              className="p-2 border-r border-slate-700 last:border-r-0 space-y-1"
            >
              {unassignedShifts.map((shift) => {
                const actualStartTime = shift.actualStartTime || shift.shiftType.startTime;
                const actualEndTime = shift.actualEndTime || shift.shiftType.endTime;
                
                return (
                  <div 
                    key={shift.id}
                    className={`rounded-md p-2 text-xs border-2 border-dashed border-slate-600 ${shiftTypeColors[shift.shiftType.colorIndex]} opacity-75`}
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
  );
}

interface FullScheduleCardProps {
  schedule: {
    id: string;
    name: string;
    startDate: string;
    endDate: string;
    status: string;
  };
  employees: Employee[];
  getScheduleData: (scheduleId: string) => {
    assignedShifts: ScheduleShift[];
    unassignedShifts: ScheduleShift[];
  };
  isExpanded: boolean;
  onToggle: () => void;
}

function FullScheduleCard({ schedule, employees, getScheduleData, isExpanded, onToggle }: FullScheduleCardProps) {
  const { assignedShifts, unassignedShifts } = getScheduleData(schedule.id);
  const allShifts = [...assignedShifts, ...unassignedShifts];
  
  const totalEmployees = new Set(assignedShifts.map(s => s.userId).filter(Boolean)).size;
  const totalHours = allShifts.reduce((total, shift) => {
    const start = shift.actualStartTime || shift.shiftType.startTime;
    const end = shift.actualEndTime || shift.shiftType.endTime;
    
    const [startHour, startMin] = start.split(':').map(Number);
    const [endHour, endMin] = end.split(':').map(Number);
    
    const startMinutes = startHour * 60 + startMin;
    let endMinutes = endHour * 60 + endMin;
    
    if (endMinutes <= startMinutes) {
      endMinutes += 24 * 60;
    }
    
    return total + (endMinutes - startMinutes) / 60;
  }, 0);

  return (
    <Card className="border-slate-700 bg-card">
      <CardHeader className="cursor-pointer" onClick={onToggle}>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center">
              <Calendar className="mr-2 h-5 w-5" />
              {schedule.name}
            </CardTitle>
            <CardDescription className="mt-1">
              {format(parseISO(schedule.startDate), "MMM d")} - {format(parseISO(schedule.endDate), "MMM d, yyyy")}
            </CardDescription>
          </div>
          <div className="flex items-center space-x-3">
            <div className="text-right text-sm">
              <div className="text-slate-300">{totalEmployees} employees</div>
              <div className="text-slate-400">{allShifts.length} shifts • {totalHours.toFixed(1)}h</div>
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
          <FullScheduleGrid 
            shifts={allShifts}
            employees={employees}
            startDate={schedule.startDate}
            endDate={schedule.endDate}
          />
          
          {unassignedShifts.length > 0 && (
            <div className="mt-3 text-xs text-amber-400 flex items-center">
              <span className="mr-1">⚠️</span>
              {unassignedShifts.length} unassigned shift{unassignedShifts.length !== 1 ? 's' : ''} need attention
            </div>
          )}
          
          {allShifts.some(s => s.actualStartTime || s.actualEndTime) && (
            <div className="mt-2 text-xs text-slate-400 flex items-center">
              <span className="text-yellow-400 mr-1">*</span>
              Indicates adjusted shift times
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

export { FullScheduleGrid, FullScheduleCard };