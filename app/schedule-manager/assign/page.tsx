"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, ArrowRight, GripVertical } from "lucide-react";
import { 
  DndContext, 
  DragEndEvent, 
  DragStartEvent,
  DragOverlay,
  useSensor,
  useSensors,
  PointerSensor,
  KeyboardSensor,
  useDroppable,
  useDraggable
} from '@dnd-kit/core';
import { 
  mockShiftTypes, 
  mockEmployees,
  mockSchedule, 
  shiftTypeColors, 
  getWeekDates,
  type ShiftType, 
  type ScheduleShift,
  type Employee 
} from "@/types/schedule";

const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const dayNumbers = [15, 16, 17, 18, 19, 20, 21];

function DroppableEmployeeDay({ employeeId, dayIndex, children }: { employeeId: string; dayIndex: number; children: React.ReactNode }) {
  const { isOver, setNodeRef } = useDroppable({
    id: `employee-${employeeId}-day-${dayIndex}`,
  });

  return (
    <div 
      ref={setNodeRef}
      className={`min-h-[80px] p-1 border-r border-b border-border bg-card relative ${
        isOver ? 'bg-primary/10' : ''
      }`}
    >
      {children}
    </div>
  );
}

function DraggableShiftType({ shiftType }: { shiftType: ShiftType }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: `shifttype-${shiftType.id}`,
    data: { type: 'shiftType', shiftType }
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`p-2 rounded border cursor-move ${
        isDragging ? 'opacity-50' : ''
      } ${shiftTypeColors[shiftType.colorIndex]}`}
    >
      <div className="flex items-center mb-1">
        <GripVertical className="w-3 h-3 opacity-60 mr-1" />
        <div className="text-xs font-medium">{shiftType.name}</div>
      </div>
      <div className="text-xs opacity-90">
        {shiftType.startTime} - {shiftType.endTime}
      </div>
    </div>
  );
}

function DraggableEmployee({ employee }: { employee: Employee }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: `employee-${employee.id}`,
    data: { type: 'employee', employee }
  });

  const { isOver, setNodeRef: setDropRef } = useDroppable({
    id: `drop-employee-${employee.id}`,
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  // Combine drag and drop refs
  const combinedRef = (node: HTMLElement | null) => {
    setNodeRef(node);
    setDropRef(node);
  };

  return (
    <div
      ref={combinedRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`flex items-center space-x-3 p-2 rounded-lg hover:bg-muted cursor-move ${
        isDragging ? 'opacity-50' : ''
      } ${isOver ? 'ring-2 ring-primary bg-primary/5' : ''}`}
    >
      <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-sm font-medium">
        {employee.firstName[0]}
      </div>
      <div>
        <div className="text-sm font-medium">{employee.firstName} {employee.lastName}</div>
        <div className="text-xs text-muted-foreground">{employee.role}</div>
      </div>
    </div>
  );
}

function DraggableScheduleShift({ 
  shift, 
  isUnassigned = false, 
  isSelected = false, 
  onSelect, 
  selectedCount = 0 
}: { 
  shift: ScheduleShift; 
  isUnassigned?: boolean;
  isSelected?: boolean;
  onSelect?: (shift: ScheduleShift, selected: boolean) => void;
  selectedCount?: number;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: `shift-${shift.id}`,
    data: { type: 'shift', shift }
  });

  const { isOver, setNodeRef: setDropRef } = useDroppable({
    id: `drop-shift-${shift.id}`,
    disabled: !isUnassigned
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  // Combine drag and drop refs for unassigned shifts
  const combinedRef = (node: HTMLElement | null) => {
    setNodeRef(node);
    if (isUnassigned) setDropRef(node);
  };

  const handleSelectClick = (e: React.MouseEvent) => {
    if (!isUnassigned || !onSelect) return;
    e.preventDefault();
    e.stopPropagation();
    onSelect(shift, !isSelected);
  };

  return (
    <div
      ref={combinedRef}
      style={style}
      className={`mb-1 rounded text-xs relative ${
        isDragging ? 'opacity-50' : ''
      } ${isOver && isUnassigned ? 'ring-2 ring-primary' : ''} ${
        isSelected ? 'ring-2 ring-primary ring-offset-1' : ''
      } ${shiftTypeColors[shift.shiftType.colorIndex]}`}
    >
      {/* Drag area (left side) */}
      <div
        {...attributes}
        {...listeners}
        className="p-1 cursor-move"
        style={{ width: isUnassigned ? '85%' : '100%' }}
      >
        <div className="font-medium">{shift.shiftType.name}</div>
        <div className="opacity-90">{shift.shiftType.startTime}-{shift.shiftType.endTime}</div>
      </div>

      {/* Selection checkbox for unassigned shifts */}
      {isUnassigned && onSelect && (
        <div
          onClick={handleSelectClick}
          className="absolute top-1 right-1 cursor-pointer"
          style={{ width: '15%' }}
        >
          <div className={`w-3 h-3 border border-current rounded flex items-center justify-center text-xs font-bold ${
            isSelected ? 'bg-primary text-primary-foreground' : 'opacity-60 hover:opacity-100'
          }`}>
            {isSelected ? '✓' : ''}
          </div>
        </div>
      )}

      {/* Selection count badge */}
      {isSelected && selectedCount > 1 && (
        <div className="absolute -top-1 -right-1 bg-primary text-primary-foreground rounded-full w-4 h-4 flex items-center justify-center text-xs font-bold">
          {selectedCount}
        </div>
      )}
    </div>
  );
}

function DroppableUnassignedDay({ dayIndex, children }: { dayIndex: number; children: React.ReactNode }) {
  const { isOver, setNodeRef } = useDroppable({
    id: `unassigned-day-${dayIndex}`,
  });

  return (
    <div 
      ref={setNodeRef}
      className={`space-y-2 min-h-[80px] p-2 border-r border-b border-border bg-slate-800/50 ${
        isOver ? 'bg-primary/20 border-primary border-dashed' : ''
      }`}
    >
      {children}
    </div>
  );
}

export default function AssignShiftsPage() {
  // const router = useRouter(); // Not used in this mockup
  // Start with empty assigned shifts - users get added dynamically
  const [scheduleShifts, setScheduleShifts] = useState<ScheduleShift[]>([]);

  // All shifts start as unassigned - these come from Page 1
  const [unassignedShifts, setUnassignedShifts] = useState<ScheduleShift[]>([
    // Monday
    {
      id: 'unassigned-1',
      shiftTypeId: '1',
      shiftType: { ...mockShiftTypes[0], name: 'Front Desk', startTime: '06:00', endTime: '10:00' },
      date: getWeekDates(mockSchedule.startDate)[0],
      order: 1
    },
    {
      id: 'unassigned-2',
      shiftTypeId: '1',
      shiftType: { ...mockShiftTypes[0], name: 'Front Desk', startTime: '10:00', endTime: '13:00' },
      date: getWeekDates(mockSchedule.startDate)[0],
      order: 2
    },
    {
      id: 'unassigned-3',
      shiftTypeId: '4',
      shiftType: { ...mockShiftTypes[3], name: 'Cleaner', startTime: '10:00', endTime: '14:00' },
      date: getWeekDates(mockSchedule.startDate)[0],
      order: 3
    },
    {
      id: 'unassigned-4',
      shiftTypeId: '6',
      shiftType: { ...mockShiftTypes[5], name: 'Security', startTime: '17:00', endTime: '23:00' },
      date: getWeekDates(mockSchedule.startDate)[0],
      order: 4
    },
    // Tuesday
    {
      id: 'unassigned-5',
      shiftTypeId: '1',
      shiftType: { ...mockShiftTypes[0], name: 'Front Desk', startTime: '06:00', endTime: '10:00' },
      date: getWeekDates(mockSchedule.startDate)[1],
      order: 1
    },
    {
      id: 'unassigned-6',
      shiftTypeId: '5',
      shiftType: { ...mockShiftTypes[4], name: 'Manager', startTime: '09:00', endTime: '17:00' },
      date: getWeekDates(mockSchedule.startDate)[1],
      order: 2
    },
    {
      id: 'unassigned-7',
      shiftTypeId: '4',
      shiftType: { ...mockShiftTypes[3], name: 'Cleaner', startTime: '10:00', endTime: '14:00' },
      date: getWeekDates(mockSchedule.startDate)[1],
      order: 3
    },
    // Wednesday
    {
      id: 'unassigned-8',
      shiftTypeId: '1',
      shiftType: { ...mockShiftTypes[0], name: 'Front Desk', startTime: '06:00', endTime: '10:00' },
      date: getWeekDates(mockSchedule.startDate)[2],
      order: 1
    },
    {
      id: 'unassigned-9',
      shiftTypeId: '1',
      shiftType: { ...mockShiftTypes[0], name: 'Front Desk', startTime: '10:00', endTime: '13:00' },
      date: getWeekDates(mockSchedule.startDate)[2],
      order: 2
    },
    {
      id: 'unassigned-10',
      shiftTypeId: '1',
      shiftType: { ...mockShiftTypes[0], name: 'Front Desk', startTime: '13:00', endTime: '17:00' },
      date: getWeekDates(mockSchedule.startDate)[2],
      order: 3
    },
    // Thursday
    {
      id: 'unassigned-11',
      shiftTypeId: '5',
      shiftType: { ...mockShiftTypes[4], name: 'Manager', startTime: '09:00', endTime: '17:00' },
      date: getWeekDates(mockSchedule.startDate)[3],
      order: 1
    },
    {
      id: 'unassigned-12',
      shiftTypeId: '4',
      shiftType: { ...mockShiftTypes[3], name: 'Cleaner', startTime: '10:00', endTime: '14:00' },
      date: getWeekDates(mockSchedule.startDate)[3],
      order: 2
    },
    {
      id: 'unassigned-13',
      shiftTypeId: '6',
      shiftType: { ...mockShiftTypes[5], name: 'Security', startTime: '17:00', endTime: '23:00' },
      date: getWeekDates(mockSchedule.startDate)[3],
      order: 3
    },
    // Friday
    {
      id: 'unassigned-14',
      shiftTypeId: '1',
      shiftType: { ...mockShiftTypes[0], name: 'Front Desk', startTime: '06:00', endTime: '10:00' },
      date: getWeekDates(mockSchedule.startDate)[4],
      order: 1
    },
    {
      id: 'unassigned-15',
      shiftTypeId: '1',
      shiftType: { ...mockShiftTypes[0], name: 'Front Desk', startTime: '10:00', endTime: '17:00' },
      date: getWeekDates(mockSchedule.startDate)[4],
      order: 2
    },
    {
      id: 'unassigned-16',
      shiftTypeId: '4',
      shiftType: { ...mockShiftTypes[3], name: 'Cleaner', startTime: '10:00', endTime: '14:00' },
      date: getWeekDates(mockSchedule.startDate)[4],
      order: 3
    },
    // Saturday
    {
      id: 'unassigned-17',
      shiftTypeId: '1',
      shiftType: { ...mockShiftTypes[0], name: 'Front Desk', startTime: '10:00', endTime: '13:00' },
      date: getWeekDates(mockSchedule.startDate)[5],
      order: 1
    },
    {
      id: 'unassigned-18',
      shiftTypeId: '4',
      shiftType: { ...mockShiftTypes[3], name: 'Cleaner', startTime: '14:00', endTime: '18:00' },
      date: getWeekDates(mockSchedule.startDate)[5],
      order: 2
    },
    {
      id: 'unassigned-19',
      shiftTypeId: '6',
      shiftType: { ...mockShiftTypes[5], name: 'Security', startTime: '17:00', endTime: '23:00' },
      date: getWeekDates(mockSchedule.startDate)[5],
      order: 3
    },
    // Sunday
    {
      id: 'unassigned-20',
      shiftTypeId: '1',
      shiftType: { ...mockShiftTypes[0], name: 'Front Desk', startTime: '06:00', endTime: '10:00' },
      date: getWeekDates(mockSchedule.startDate)[6],
      order: 1
    },
    {
      id: 'unassigned-21',
      shiftTypeId: '4',
      shiftType: { ...mockShiftTypes[3], name: 'Cleaner', startTime: '10:00', endTime: '14:00' },
      date: getWeekDates(mockSchedule.startDate)[6],
      order: 2
    }
  ]);

  const [activeId, setActiveId] = useState<string | null>(null);
  const [draggedItem, setDraggedItem] = useState<{ type: string; data: ShiftType | Employee | ScheduleShift } | null>(null);
  const [selectedRequiredShifts, setSelectedRequiredShifts] = useState<Set<string>>(new Set());

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor)
  );

  const weekDates = getWeekDates(mockSchedule.startDate);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
    const data = event.active.data.current;
    setDraggedItem(data ? { type: data.type, data: data[data.type] } : null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { over } = event;
    
    if (!over || !draggedItem) {
      setActiveId(null);
      setDraggedItem(null);
      return;
    }

    const overId = over.id as string;

    // Handle dropping employee onto unassigned shift (first assignment)
    if (draggedItem.type === 'employee' && overId.startsWith('unassigned-day-')) {
      // Not implemented in this workflow - user should drag shift to employee or employee to specific shift
    }

    // Handle dropping shift type from sidebar onto employee day
    if (draggedItem.type === 'shiftType' && overId.startsWith('employee-')) {
      const parts = overId.split('-');
      const employeeId = parts[1];
      const dayIndex = parseInt(parts[3]);
      
      const employee = mockEmployees.find(e => e.id === employeeId);
      const shiftType = draggedItem.data as ShiftType;

      const newShift: ScheduleShift = {
        id: `shift-${Date.now()}`,
        shiftTypeId: shiftType.id,
        shiftType,
        date: weekDates[dayIndex],
        order: scheduleShifts.filter(s => s.date === weekDates[dayIndex] && s.userId === employeeId).length + 1,
        userId: employeeId,
        user: employee
      };

      setScheduleShifts(prev => [...prev, newShift]);

      // Check if there are unassigned required shifts of the same type on the same day
      const matchingUnassignedShift = unassignedShifts.find(s => 
        s.date === weekDates[dayIndex] && 
        s.shiftTypeId === shiftType.id
      );

      // If found, remove one matching unassigned shift
      if (matchingUnassignedShift) {
        setUnassignedShifts(prev => {
          const indexToRemove = prev.findIndex(s => s.id === matchingUnassignedShift.id);
          if (indexToRemove !== -1) {
            return prev.filter((_, index) => index !== indexToRemove);
          }
          return prev;
        });
      }
    }

    // Handle dropping shift onto employee day (assignment or reassignment)
    if (draggedItem.type === 'shift' && overId.startsWith('employee-')) {
      const parts = overId.split('-');
      const employeeId = parts[1];
      const employee = mockEmployees.find(e => e.id === employeeId);
      const shift = draggedItem.data as ScheduleShift;

      // Check if this is an unassigned shift or already assigned shift
      const isUnassigned = unassignedShifts.some(s => s.id === shift.id);
      
      if (isUnassigned) {
        // Check if multiple shifts are selected and the dragged shift is one of them
        const shiftsToAssign = selectedRequiredShifts.has(shift.id) && selectedRequiredShifts.size > 1
          ? unassignedShifts.filter(s => selectedRequiredShifts.has(s.id))
          : [shift];

        // Assign all selected shifts to the employee
        const newAssignedShifts = shiftsToAssign.map(s => ({
          ...s,
          userId: employeeId,
          user: employee
        }));

        setScheduleShifts(prev => [...prev, ...newAssignedShifts]);
        setUnassignedShifts(prev => prev.filter(s => !shiftsToAssign.some(as => as.id === s.id)));
        
        // Clear selections after assignment
        setSelectedRequiredShifts(new Set());
      } else {
        // Reassign existing shift to different employee
        const updatedShift = {
          ...shift,
          userId: employeeId,
          user: employee
        };
        
        setScheduleShifts(prev => 
          prev.map(s => s.id === shift.id ? updatedShift : s)
        );
      }
    }

    // Handle dropping employee onto specific unassigned shift (first assignment workflow)
    if (draggedItem.type === 'employee' && overId.startsWith('drop-shift-')) {
      const employee = draggedItem.data as Employee;
      const shiftId = overId.replace('drop-shift-', '');
      const shift = unassignedShifts.find(s => s.id === shiftId);
      
      if (shift) {
        const assignedShift = {
          ...shift,
          userId: employee.id,
          user: employee
        };
        
        setScheduleShifts(prev => [...prev, assignedShift]);
        setUnassignedShifts(prev => prev.filter(s => s.id !== shift.id));
      }
    }

    // Handle dropping shift onto employee in sidebar (assignment workflow)
    if (draggedItem.type === 'shift' && overId.startsWith('drop-employee-')) {
      const employeeId = overId.replace('drop-employee-', '');
      const employee = mockEmployees.find(e => e.id === employeeId);
      const shift = draggedItem.data as ScheduleShift;

      // Check if this is an unassigned shift or already assigned shift
      const isUnassigned = unassignedShifts.some(s => s.id === shift.id);
      
      if (isUnassigned) {
        // Check if multiple shifts are selected and the dragged shift is one of them
        const shiftsToAssign = selectedRequiredShifts.has(shift.id) && selectedRequiredShifts.size > 1
          ? unassignedShifts.filter(s => selectedRequiredShifts.has(s.id))
          : [shift];

        // Assign all selected shifts to the employee
        const newAssignedShifts = shiftsToAssign.map(s => ({
          ...s,
          userId: employeeId,
          user: employee
        }));

        setScheduleShifts(prev => [...prev, ...newAssignedShifts]);
        setUnassignedShifts(prev => prev.filter(s => !shiftsToAssign.some(as => as.id === s.id)));
        
        // Clear selections after assignment
        setSelectedRequiredShifts(new Set());
      } else {
        // Reassign existing shift to different employee
        const updatedShift = {
          ...shift,
          userId: employeeId,
          user: employee
        };
        
        setScheduleShifts(prev => 
          prev.map(s => s.id === shift.id ? updatedShift : s)
        );
      }
    }

    // Handle dropping shift type onto unassigned day (add new required shift)
    if (draggedItem.type === 'shiftType' && overId.startsWith('unassigned-day-')) {
      const dayIndex = parseInt(overId.replace('unassigned-day-', ''));
      const shiftType = draggedItem.data as ShiftType;

      // Always add new required shift when dropped on unassigned area
      const newShift: ScheduleShift = {
        id: `unassigned-${Date.now()}`,
        shiftTypeId: shiftType.id,
        shiftType,
        date: weekDates[dayIndex],
        order: unassignedShifts.filter(s => s.date === weekDates[dayIndex]).length + 1
      };

      setUnassignedShifts(prev => [...prev, newShift]);
    }

    setActiveId(null);
    setDraggedItem(null);
  };

  const getAssignedShiftsForEmployeeAndDay = (employeeId: string, dayIndex: number) => {
    return scheduleShifts
      .filter(shift => shift.userId === employeeId && shift.date === weekDates[dayIndex])
      .sort((a, b) => {
        const timeA = parseInt(a.shiftType.startTime.replace(':', ''));
        const timeB = parseInt(b.shiftType.startTime.replace(':', ''));
        return timeA - timeB;
      });
  };

  const getUnassignedShiftsForDay = (dayIndex: number) => {
    return unassignedShifts.filter(shift => shift.date === weekDates[dayIndex]);
  };

  const getAssignedEmployees = () => {
    const assignedEmployeeIds = new Set(scheduleShifts.map(shift => shift.userId).filter(Boolean));
    return mockEmployees.filter(employee => assignedEmployeeIds.has(employee.id));
  };

  const handleRequiredShiftSelect = (shift: ScheduleShift, selected: boolean) => {
    setSelectedRequiredShifts(prev => {
      const newSet = new Set(prev);
      if (selected) {
        newSet.add(shift.id);
      } else {
        newSet.delete(shift.id);
      }
      return newSet;
    });
  };

  const clearSelectedRequiredShifts = () => {
    setSelectedRequiredShifts(new Set());
  };

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="border-b border-border bg-card">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between py-4">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                    <div className="w-4 h-4 bg-white rounded-sm"></div>
                  </div>
                  <span className="text-xl font-semibold">Schedule Manager</span>
                </div>
                <nav className="flex space-x-6">
                  <Button variant="link" className="text-primary">Schedule</Button>
                  <Button variant="link" className="text-muted-foreground">Shifts</Button>
                  <Button variant="link" className="text-muted-foreground">Employees</Button>
                  <Button variant="link" className="text-muted-foreground">Reports</Button>
                </nav>
              </div>
              <div className="flex space-x-3">
                <Button variant="outline">Save Draft</Button>
                <Button className="bg-primary hover:bg-primary/90">
                  Publish Schedule
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-12 gap-6">
            {/* Employees List */}
            <div className="col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Employees</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {mockEmployees.map((employee) => (
                    <DraggableEmployee key={employee.id} employee={employee} />
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Calendar Grid */}
            <div className="col-span-8">
              <div className="mb-4 flex items-center justify-center space-x-4">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="w-4 h-4" />
                </Button>
                <h2 className="text-lg font-semibold">Week of January 15-21, 2024</h2>
                <Button variant="outline" size="sm">
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>

              <div className="grid grid-cols-8 gap-1 border border-border rounded-lg overflow-hidden">
                {/* Header */}
                <div className="bg-muted p-2"></div>
                {weekDays.map((day, index) => (
                  <div key={day} className="bg-muted p-2 text-center">
                    <div className="text-sm font-medium">{day}</div>
                    <div className="text-xs text-muted-foreground">{dayNumbers[index]}</div>
                  </div>
                ))}

                {/* Assigned Employee Rows - only show employees who have assignments */}
                {getAssignedEmployees().map((employee) => (
                  <div key={employee.id} className="contents">
                    {/* Employee Name */}
                    <div className="bg-muted/50 p-2 border-r border-border">
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white text-xs">
                          {employee.firstName[0]}
                        </div>
                        <div>
                          <div className="text-sm font-medium">{employee.firstName}</div>
                        </div>
                      </div>
                    </div>

                    {/* Day Cells */}
                    {weekDays.map((_, dayIndex) => (
                      <DroppableEmployeeDay
                        key={`${employee.id}-${dayIndex}`}
                        employeeId={employee.id}
                        dayIndex={dayIndex}
                      >
                        {getAssignedShiftsForEmployeeAndDay(employee.id, dayIndex).map((shift) => (
                          <DraggableScheduleShift key={shift.id} shift={shift} />
                        ))}
                      </DroppableEmployeeDay>
                    ))}
                  </div>
                ))}

                {/* Empty state when no users assigned */}
                {getAssignedEmployees().length === 0 && (
                  <div className="contents">
                    <div className="bg-slate-800/30 p-2 border-r border-border text-center">
                      <div className="text-sm text-blue-100">No users assigned shifts</div>
                    </div>
                    {weekDays.map((_, dayIndex) => (
                      <div key={dayIndex} className="bg-slate-800/10 p-2 border-r border-b border-border min-h-[80px]"></div>
                    ))}
                  </div>
                )}

                {/* Required Shifts Row - integrated into the calendar */}
                <div className="contents">
                  <div className="bg-slate-800 p-2 border-r border-border">
                    <div className="text-sm font-medium text-blue-50">Required Shifts</div>
                    <div className="text-xs text-blue-100">Drag to assign</div>
                    {selectedRequiredShifts.size > 0 && (
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-xs font-medium text-blue-100">
                          {selectedRequiredShifts.size} selected
                        </span>
                        <button
                          onClick={clearSelectedRequiredShifts}
                          className="text-xs bg-slate-700 hover:bg-slate-600 text-blue-50 px-2 py-1 rounded"
                        >
                          Clear
                        </button>
                      </div>
                    )}
                  </div>
                  {weekDays.map((_, dayIndex) => (
                    <DroppableUnassignedDay key={dayIndex} dayIndex={dayIndex}>
                      {getUnassignedShiftsForDay(dayIndex).map((shift) => (
                        <DraggableScheduleShift 
                          key={shift.id} 
                          shift={shift} 
                          isUnassigned={true}
                          isSelected={selectedRequiredShifts.has(shift.id)}
                          onSelect={handleRequiredShiftSelect}
                          selectedCount={selectedRequiredShifts.size}
                        />
                      ))}
                    </DroppableUnassignedDay>
                  ))}
                </div>
              </div>

            </div>

            {/* Available Shifts */}
            <div className="col-span-2">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Available Shifts</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {mockShiftTypes.map((shiftType) => (
                    <DraggableShiftType key={shiftType.id} shiftType={shiftType} />
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        <DragOverlay>
          {activeId && draggedItem ? (
            <div className="opacity-80">
              {draggedItem.type === 'shiftType' && (
                <div className={`p-3 rounded-lg border ${shiftTypeColors[(draggedItem.data as ShiftType).colorIndex]}`}>
                  <div className="text-sm font-medium">{(draggedItem.data as ShiftType).name}</div>
                  <div className="text-xs opacity-90">
                    {(draggedItem.data as ShiftType).startTime} - {(draggedItem.data as ShiftType).endTime}
                  </div>
                </div>
              )}
              {draggedItem.type === 'employee' && (
                <div className="flex items-center space-x-3 p-2 rounded-lg bg-card border">
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-sm font-medium">
                    {(draggedItem.data as Employee).firstName[0]}
                  </div>
                  <div>
                    <div className="text-sm font-medium">{(draggedItem.data as Employee).firstName} {(draggedItem.data as Employee).lastName}</div>
                    <div className="text-xs text-muted-foreground">{(draggedItem.data as Employee).role}</div>
                  </div>
                </div>
              )}
              {draggedItem.type === 'shift' && (
                <div className={`p-1 rounded text-xs ${shiftTypeColors[(draggedItem.data as ScheduleShift).shiftType.colorIndex]}`}>
                  <div className="font-medium">{(draggedItem.data as ScheduleShift).shiftType.name}</div>
                  <div className="opacity-90">{(draggedItem.data as ScheduleShift).shiftType.startTime}-{(draggedItem.data as ScheduleShift).shiftType.endTime}</div>
                </div>
              )}
            </div>
          ) : null}
        </DragOverlay>
      </div>
    </DndContext>
  );
}