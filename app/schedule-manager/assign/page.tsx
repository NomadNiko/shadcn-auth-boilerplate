"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, ArrowRight, GripVertical, Copy, Trash2 } from "lucide-react";
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
import { CreateShiftTypeDialog } from "@/components/create-shift-type-dialog";

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

function DraggableShiftType({ 
  shiftType, 
  isSelected, 
  onSelect,
  selectedCount,
  quantity,
  onQuantityChange
}: { 
  shiftType: ShiftType; 
  isSelected: boolean;
  onSelect: (shiftType: ShiftType, selected: boolean) => void;
  selectedCount: number;
  quantity: number;
  onQuantityChange: (shiftTypeId: string, quantity: number) => void;
}) {
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

  const handleSelectClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onSelect(shiftType, !isSelected);
  };

  const handleQuantityChange = (delta: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const newQuantity = Math.max(1, Math.min(9, quantity + delta));
    onQuantityChange(shiftType.id, newQuantity);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded-lg border transition-all relative flex ${
        isDragging ? 'opacity-50' : ''
      } ${isSelected ? 'ring-2 ring-primary ring-offset-2' : ''} ${shiftTypeColors[shiftType.colorIndex]}`}
    >
      {/* Left 60% - Draggable area */}
      <div
        {...attributes}
        {...listeners}
        className="flex-1 p-2 cursor-move flex items-center space-x-2"
        style={{ width: '60%' }}
      >
        <GripVertical className="w-4 h-4 opacity-60 flex-shrink-0" />
        <div className="flex-1">
          <div className="text-sm font-medium">{shiftType.name}</div>
          <div className="text-xs opacity-90">
            {shiftType.startTime} - {shiftType.endTime}
          </div>
        </div>
      </div>

      {/* Middle 25% - Quantity selector */}
      <div className="flex items-center justify-center p-1 border-l border-current/20 space-x-1" style={{ width: '25%' }}>
        <button
          onClick={(e) => handleQuantityChange(-1, e)}
          className="w-4 h-4 text-xs font-bold hover:bg-current/20 rounded flex items-center justify-center"
        >
          −
        </button>
        <div className="text-xs font-bold px-1">{quantity}</div>
        <button
          onClick={(e) => handleQuantityChange(1, e)}
          className="w-4 h-4 text-xs font-bold hover:bg-current/20 rounded flex items-center justify-center"
        >
          +
        </button>
      </div>

      {/* Right 15% - Selection area */}
      <div
        onClick={handleSelectClick}
        className="flex items-center justify-center cursor-pointer p-2 border-l border-current/20"
        style={{ width: '15%' }}
      >
        <div className={`w-4 h-4 border border-current rounded flex items-center justify-center text-xs font-bold ${
          isSelected ? 'bg-primary text-primary-foreground' : 'opacity-60 hover:opacity-100'
        }`}>
          {isSelected ? '✓' : ''}
        </div>
      </div>

      {/* Selection count badge */}
      {isSelected && selectedCount > 1 && (
        <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
          {selectedCount}
        </div>
      )}
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
  const [availableShiftTypes, setAvailableShiftTypes] = useState<ShiftType[]>(mockShiftTypes);
  const [sidebarView, setSidebarView] = useState<'employees' | 'shifts'>('employees');
  const [selectedShiftTypes, setSelectedShiftTypes] = useState<Set<string>>(new Set());
  const [shiftQuantities, setShiftQuantities] = useState<Map<string, number>>(new Map());

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
      const draggedShiftType = draggedItem.data as ShiftType;

      // If there are selected shift types and the dragged one is selected, create shifts for all selected
      const shiftTypesToCreate = selectedShiftTypes.has(draggedShiftType.id) && selectedShiftTypes.size > 1
        ? availableShiftTypes.filter(st => selectedShiftTypes.has(st.id))
        : [draggedShiftType];

      const currentShiftsCount = unassignedShifts.filter(s => s.date === weekDates[dayIndex]).length;
      
      // Create multiple instances based on quantity settings
      const newShifts: ScheduleShift[] = [];
      let orderCounter = currentShiftsCount + 1;
      
      shiftTypesToCreate.forEach((shiftType) => {
        const quantity = getQuantityForShiftType(shiftType.id);
        for (let i = 0; i < quantity; i++) {
          newShifts.push({
            id: `unassigned-${Date.now()}-${shiftType.id}-${i}`,
            shiftTypeId: shiftType.id,
            shiftType: shiftType,
            date: weekDates[dayIndex],
            order: orderCounter++
          });
        }
      });

      setUnassignedShifts(prev => [...prev, ...newShifts]);
      
      // Keep selections so user can repeat the action on other days
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

  const handleCreateShiftType = (newShiftTypeData: Omit<ShiftType, 'id'>) => {
    const newShiftType: ShiftType = {
      ...newShiftTypeData,
      id: `custom-${Date.now()}`
    };
    setAvailableShiftTypes(prev => [...prev, newShiftType]);
  };

  const handleShiftTypeSelect = (shiftType: ShiftType, selected: boolean) => {
    setSelectedShiftTypes(prev => {
      const newSet = new Set(prev);
      if (selected) {
        newSet.add(shiftType.id);
      } else {
        newSet.delete(shiftType.id);
      }
      return newSet;
    });
  };

  const clearAllSelections = () => {
    setSelectedShiftTypes(new Set());
  };

  const handleQuantityChange = (shiftTypeId: string, quantity: number) => {
    setShiftQuantities(prev => new Map(prev.set(shiftTypeId, quantity)));
  };

  const getQuantityForShiftType = (shiftTypeId: string): number => {
    return shiftQuantities.get(shiftTypeId) || 1;
  };

  const copyPreviousWeek = () => {
    // Add some additional shifts when copying
    const additionalShifts: ScheduleShift[] = [
      {
        id: `copy-${Date.now()}-1`,
        shiftTypeId: '5',
        shiftType: mockShiftTypes[4],
        date: weekDates[2], // Wednesday
        order: 4
      },
      {
        id: `copy-${Date.now()}-2`,
        shiftTypeId: '6',
        shiftType: mockShiftTypes[5],
        date: weekDates[4], // Friday
        order: 4
      }
    ];
    
    setUnassignedShifts(prev => [...prev, ...additionalShifts]);
  };

  const clearAllShifts = () => {
    setScheduleShifts([]);
    setUnassignedShifts([]);
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
            {/* Calendar Grid */}
            <div className="col-span-9">
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

            {/* Sidebar */}
            <div className="col-span-3">
              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button 
                    variant="outline" 
                    onClick={copyPreviousWeek}
                    className="w-full justify-start"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Previous Week
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={clearAllShifts}
                    className="w-full justify-start"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Clear All Shifts
                  </Button>
                </CardContent>
              </Card>

              <Card className="mt-4">
                <CardHeader className="pb-3">
                  {/* Toggle Buttons */}
                  <div className="flex justify-center mb-4">
                    <div className="flex bg-muted rounded-lg p-1">
                      <Button
                        variant={sidebarView === 'employees' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setSidebarView('employees')}
                        className="rounded-md"
                      >
                        Employees
                      </Button>
                      <Button
                        variant={sidebarView === 'shifts' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setSidebarView('shifts')}
                        className="rounded-md"
                      >
                        Available Shifts
                      </Button>
                    </div>
                  </div>
                  
                  <CardTitle className="text-lg text-center">
                    {sidebarView === 'employees' ? 'Employees' : 'Available Shifts'}
                  </CardTitle>
                  {sidebarView === 'shifts' && (
                    <p className="text-xs text-muted-foreground text-center mt-2">
                      Set quantities with <strong>+/-</strong>, select with <strong>✓</strong>, then drag to add shifts
                    </p>
                  )}
                </CardHeader>
                
                <CardContent className="space-y-3">
                  {sidebarView === 'employees' ? (
                    // Employees List
                    <>
                      {mockEmployees.map((employee) => (
                        <DraggableEmployee key={employee.id} employee={employee} />
                      ))}
                    </>
                  ) : (
                    // Available Shifts
                    <>
                      {selectedShiftTypes.size > 0 && (
                        <div className="flex justify-between items-center p-2 bg-primary/10 rounded-lg border border-primary/20 mb-3">
                          <span className="text-sm font-medium">
                            {selectedShiftTypes.size} shift type{selectedShiftTypes.size > 1 ? 's' : ''} selected
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={clearAllSelections}
                            className="text-xs h-6"
                          >
                            Clear
                          </Button>
                        </div>
                      )}
                      
                      {availableShiftTypes.map((shiftType) => (
                        <DraggableShiftType 
                          key={shiftType.id} 
                          shiftType={shiftType}
                          isSelected={selectedShiftTypes.has(shiftType.id)}
                          onSelect={handleShiftTypeSelect}
                          selectedCount={selectedShiftTypes.size}
                          quantity={getQuantityForShiftType(shiftType.id)}
                          onQuantityChange={handleQuantityChange}
                        />
                      ))}
                      <CreateShiftTypeDialog onCreateShiftType={handleCreateShiftType} />
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        <DragOverlay>
          {activeId && draggedItem ? (
            <div className="opacity-80">
              {draggedItem.type === 'shiftType' && (
                <div className="relative">
                  {selectedShiftTypes.has((draggedItem.data as ShiftType).id) && selectedShiftTypes.size > 1 ? (
                    // Show clean preview for multiple selection with total count
                    (() => {
                      const totalShifts = Array.from(selectedShiftTypes).reduce((total, shiftTypeId) => {
                        return total + getQuantityForShiftType(shiftTypeId);
                      }, 0);
                      return (
                        <div className={`p-3 rounded-lg border shadow-lg ${shiftTypeColors[(draggedItem.data as ShiftType).colorIndex]}`}>
                          <div className="text-sm font-medium">
                            {selectedShiftTypes.size} shift types selected
                          </div>
                          <div className="text-xs opacity-90">
                            Dropping {totalShifts} shifts total
                          </div>
                          <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                            {totalShifts}
                          </div>
                        </div>
                      );
                    })()
                  ) : (
                    // Show single shift type with quantity
                    (() => {
                      const quantity = getQuantityForShiftType((draggedItem.data as ShiftType).id);
                      return (
                        <div className={`p-3 rounded-lg border shadow-lg ${shiftTypeColors[(draggedItem.data as ShiftType).colorIndex]}`}>
                          <div className="text-sm font-medium">{(draggedItem.data as ShiftType).name}</div>
                          <div className="text-xs opacity-90">
                            {(draggedItem.data as ShiftType).startTime} - {(draggedItem.data as ShiftType).endTime}
                          </div>
                          {quantity > 1 && (
                            <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                              {quantity}
                            </div>
                          )}
                        </div>
                      );
                    })()
                  )}
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