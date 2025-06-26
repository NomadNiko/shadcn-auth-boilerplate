"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, ArrowRight, GripVertical, Copy, Trash2 } from "lucide-react";
import { ScheduleSelector } from "@/components/schedule-selector";
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
  shiftTypeColors, 
  getWeekDates,
  type ShiftType, 
  type ScheduleShift,
  type Employee,
  type Schedule
} from "@/types/schedule";
import { useScheduleData } from "@/hooks/use-schedule-data";
import { useEmployees } from "@/hooks/use-employees";
import { CreateShiftTypeDialog } from "@/components/create-shift-type-dialog";
import { useAuth } from "@/hooks/use-auth";

const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

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
    disabled: false  // Allow dropping on both assigned and unassigned shifts
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  // Combine drag and drop refs for all shifts
  const combinedRef = (node: HTMLElement | null) => {
    setNodeRef(node);
    setDropRef(node);  // All shifts can now receive drops
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
      } ${isOver ? 'ring-2 ring-primary' : ''} ${
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

function DroppableUnassignedDay({ dayIndex, children, draggedItemType }: { dayIndex: number; children: React.ReactNode; draggedItemType?: string }) {
  // Only accept shift types, not employees (employees should only drop on specific shifts)
  const { isOver, setNodeRef } = useDroppable({
    id: `unassigned-day-${dayIndex}`,
    disabled: draggedItemType === 'employee', // Disable drop zone when dragging employees
  });

  // Don't highlight when disabled or when dragging employees
  const shouldHighlight = isOver && draggedItemType !== 'employee';

  return (
    <div 
      ref={setNodeRef}
      className={`space-y-2 min-h-[80px] p-2 border-r border-b border-border bg-slate-800/50 ${
        shouldHighlight ? 'bg-primary/20 border-primary border-dashed' : ''
      }`}
    >
      {children}
    </div>
  );
}

export default function AssignShiftsPage() {
  const router = useRouter();
  const { isLoaded, user } = useAuth();
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Use real data hooks - pass selected schedule ID
  const {
    shiftTypes: availableShiftTypes,
    scheduleShifts: allScheduleShifts,
    loading: scheduleLoading,
    error: scheduleError,
    createShiftType: handleCreateShiftTypeAPI,
    saveScheduleChanges,
    copyPreviousWeek: copyPreviousWeekAPI,
    publishSchedule,
    unpublishSchedule
  } = useScheduleData(selectedSchedule?.id);

  const {
    employees,
    loading: employeesLoading,
    error: employeesError
  } = useEmployees();

  // Local state for UI
  const [scheduleShifts, setScheduleShifts] = useState<ScheduleShift[]>([]);
  const [unassignedShifts, setUnassignedShifts] = useState<ScheduleShift[]>([]);

  const [activeId, setActiveId] = useState<string | null>(null);
  const [draggedItem, setDraggedItem] = useState<{ type: string; data: ShiftType | Employee | ScheduleShift } | null>(null);
  const [selectedRequiredShifts, setSelectedRequiredShifts] = useState<Set<string>>(new Set());
  // availableShiftTypes now comes from useScheduleData hook
  const [sidebarView, setSidebarView] = useState<'employees' | 'shifts'>('employees');
  const [selectedShiftTypes, setSelectedShiftTypes] = useState<Set<string>>(new Set());
  const [shiftQuantities, setShiftQuantities] = useState<Map<string, number>>(new Map());

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor)
  );

  const weekDates = selectedSchedule ? getWeekDates(selectedSchedule.startDate) : [];

  // Redirect to login if not authenticated
  useEffect(() => {
    if (isLoaded && !user) {
      router.push('/auth/login');
    }
  }, [isLoaded, user, router]);

  // Don't auto-sync currentSchedule - let user explicitly choose schedule
  // useEffect(() => {
  //   if (currentSchedule && selectedSchedule?.id !== currentSchedule.id) {
  //     setSelectedSchedule(currentSchedule);
  //   }
  // }, [currentSchedule, selectedSchedule]);

  // Initialize local state with real data when schedule is selected
  useEffect(() => {
    if (selectedSchedule && allScheduleShifts && allScheduleShifts.length > 0) {
      // Only update if we don't already have the same data
      const totalLocalShifts = scheduleShifts.length + unassignedShifts.length;
      if (totalLocalShifts !== allScheduleShifts.length) {
        const assigned = allScheduleShifts.filter(shift => shift.userId);
        const unassigned = allScheduleShifts.filter(shift => !shift.userId);
        setScheduleShifts(assigned);
        setUnassignedShifts(unassigned);
      }
    }
  }, [selectedSchedule, allScheduleShifts, scheduleShifts.length, unassignedShifts.length]);

  // Show schedule selector if no schedule is selected
  if (!selectedSchedule) {
    return (
      <ScheduleSelector 
        onScheduleSelect={(schedule) => setSelectedSchedule(schedule)}
      />
    );
  }

  // Show loading state
  if (!isLoaded || scheduleLoading || employeesLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg font-semibold mb-2">Loading Schedule...</div>
          <div className="text-sm text-muted-foreground">
            {!isLoaded ? "Authenticating..." : "Please wait while we load your data"}
          </div>
        </div>
      </div>
    );
  }

  // Return early if not authenticated (before redirect completes)
  if (!user) {
    return null;
  }

  // Show error state
  if (scheduleError || employeesError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg font-semibold mb-2 text-red-500">Error Loading Data</div>
          <div className="text-sm text-muted-foreground mb-4">
            {scheduleError || employeesError}
          </div>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    );
  }

  if (!selectedSchedule) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg font-semibold mb-2">No Schedule Selected</div>
          <div className="text-sm text-muted-foreground">Please select a schedule first</div>
        </div>
      </div>
    );
  }

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
    const data = event.active.data.current;
    setDraggedItem(data ? { type: data.type, data: data[data.type] } : null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { over } = event;
    
    if (!over || !draggedItem) {
      setActiveId(null);
      setDraggedItem(null);
      return;
    }

    const overId = over.id as string;

    // Handle dropping employee onto specific shift (PRIORITY - handle this first)
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
      
      setActiveId(null);
      setDraggedItem(null);
      return; // Exit early to prevent other handlers from running
    }

    // Handle dropping employee onto unassigned day (DISABLED - only allow drops on specific shifts)
    if (draggedItem.type === 'employee' && overId.startsWith('unassigned-day-')) {
      // Do nothing - employees can only be dropped on specific shifts, not on empty day areas
      setActiveId(null);
      setDraggedItem(null);
      return;
    }

    // Handle dropping shift type from sidebar onto employee day
    if (draggedItem.type === 'shiftType' && overId.startsWith('employee-')) {
      const parts = overId.split('-');
      const employeeId = parts[1];
      const dayIndex = parseInt(parts[3]);
      
      const employee = employees.find(e => e.id === employeeId);
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
      const employee = employees.find(e => e.id === employeeId);
      const shift = draggedItem.data as ScheduleShift;

      // Check if this is an unassigned shift or already assigned shift
      const isUnassigned = unassignedShifts.some(s => s.id === shift.id);
      
      if (isUnassigned) {
        // Check if multiple shifts are selected and the dragged shift is one of them
        const shiftsToAssign = selectedRequiredShifts.has(shift.id) && selectedRequiredShifts.size > 1
          ? unassignedShifts.filter(s => selectedRequiredShifts.has(s.id))
          : [shift];

        // Assign each shift to the employee (local state only)
        const newAssignedShifts: ScheduleShift[] = [];
        for (const shiftToAssign of shiftsToAssign) {
          const assignedShift = {
            ...shiftToAssign,
            userId: employeeId,
            user: employee
          };
          newAssignedShifts.push(assignedShift);
        }

        setScheduleShifts(prev => [...prev, ...newAssignedShifts]);
        setUnassignedShifts(prev => prev.filter(s => !shiftsToAssign.some(as => as.id === s.id)));
        
        // Clear selections after assignment
        setSelectedRequiredShifts(new Set());
      } else {
        // Reassign existing shift to different employee (local state only)
        setScheduleShifts(prev => 
          prev.map(s => s.id === shift.id ? { ...s, userId: employeeId, user: employee } : s)
        );
      }
    }


    // Handle dropping shift onto employee in sidebar (assignment workflow)
    if (draggedItem.type === 'shift' && overId.startsWith('drop-employee-')) {
      const employeeId = overId.replace('drop-employee-', '');
      const employee = employees.find(e => e.id === employeeId);
      const shift = draggedItem.data as ScheduleShift;

      // Check if this is an unassigned shift or already assigned shift
      const isUnassigned = unassignedShifts.some(s => s.id === shift.id);
      
      if (isUnassigned) {
        // Check if multiple shifts are selected and the dragged shift is one of them
        const shiftsToAssign = selectedRequiredShifts.has(shift.id) && selectedRequiredShifts.size > 1
          ? unassignedShifts.filter(s => selectedRequiredShifts.has(s.id))
          : [shift];

        // Assign each shift to the employee (local state only)
        const newAssignedShifts: ScheduleShift[] = [];
        for (const shiftToAssign of shiftsToAssign) {
          const assignedShift = {
            ...shiftToAssign,
            userId: employeeId,
            user: employee
          };
          newAssignedShifts.push(assignedShift);
        }

        setScheduleShifts(prev => [...prev, ...newAssignedShifts]);
        setUnassignedShifts(prev => prev.filter(s => !shiftsToAssign.some(as => as.id === s.id)));
        
        // Clear selections after assignment
        setSelectedRequiredShifts(new Set());
      } else {
        // Reassign existing shift to different employee (local state only)
        setScheduleShifts(prev => 
          prev.map(s => s.id === shift.id ? { ...s, userId: employeeId, user: employee } : s)
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
          // Generate unique ID with timestamp + random component to avoid collisions
          const uniqueId = `unassigned-${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${shiftType.id}-${i}`;
          newShifts.push({
            id: uniqueId,
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
    return employees.filter(employee => assignedEmployeeIds.has(employee.id));
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

  const handleCreateShiftType = async (newShiftTypeData: Omit<ShiftType, 'id' | 'isActive'>) => {
    try {
      await handleCreateShiftTypeAPI(newShiftTypeData);
    } catch (err) {
      console.error('Failed to create shift type:', err);
      // Could show toast notification here
    }
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

  const copyPreviousWeek = async () => {
    try {
      // For now, use first available schedule as source
      // Updated to use new API structure
      await copyPreviousWeekAPI();
    } catch (err) {
      console.error('Failed to copy previous week:', err);
      // Could show error toast here
    }
  };

  const clearAllShifts = () => {
    // Clear all local state shifts
    setScheduleShifts([]);
    setUnassignedShifts([]);
  };

  const handleSaveDraft = async () => {
    if (!selectedSchedule) {
      console.error('No selected schedule to save');
      return;
    }

    try {
      console.log('Saving draft changes to backend...');

      // Get the original data for comparison
      const originalShifts = allScheduleShifts || [];
      const currentShifts = [...scheduleShifts, ...unassignedShifts];

      // Find new shifts (local shifts with temp IDs that don't exist in original data)
      const newShifts = currentShifts.filter(shift => 
        shift.id.startsWith('unassigned-') || shift.id.startsWith('shift-')
      );

      // Find shifts to delete (original shifts not in current local state)
      const shiftsToDelete = originalShifts.filter(originalShift => 
        !currentShifts.some(currentShift => currentShift.id === originalShift.id)
      );

      // Find shifts to update (existing shifts with changed assignments)
      const shiftsToUpdate = currentShifts.filter(currentShift => {
        const originalShift = originalShifts.find(orig => orig.id === currentShift.id);
        return originalShift && (
          originalShift.userId !== currentShift.userId ||
          originalShift.order !== currentShift.order
        );
      });

      console.log('Draft save summary:', {
        newShifts: newShifts.length,
        shiftsToUpdate: shiftsToUpdate.length,
        shiftsToDelete: shiftsToDelete.length
      });

      console.log('DEBUG - Original shifts IDs:', originalShifts.map(s => s.id));
      console.log('DEBUG - Current shifts IDs:', currentShifts.map(s => s.id));
      console.log('DEBUG - New shifts detected:', newShifts.map(s => ({ id: s.id, shiftType: s.shiftType?.name })));
      console.log('DEBUG - scheduleShifts count:', scheduleShifts.length);
      console.log('DEBUG - unassignedShifts count:', unassignedShifts.length);

      // If this is a published schedule, unpublish it first
      if (selectedSchedule.status === 'published') {
        console.log('Unpublishing schedule...');
        await unpublishSchedule();
      }

      // Save all changes using the streamlined function
      await saveScheduleChanges(newShifts, shiftsToUpdate, shiftsToDelete);

      console.log('Schedule successfully saved as draft');
      // Could show success toast here
    } catch (err) {
      console.error('Failed to save draft:', err);
      // Could show error toast here
    }
  };

  const handlePublishSchedule = async () => {
    if (isSaving) {
      console.log('Save already in progress, ignoring...');
      return;
    }

    setIsSaving(true);

    try {
      await publishSchedule();
      console.log('Schedule published successfully');
      // Could show success toast and redirect
    } catch (err) {
      console.error('Failed to publish schedule:', err);
      // Could show error toast here
    } finally {
      setIsSaving(false);
    }
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
                <Button 
                  variant="outline" 
                  onClick={() => {
                    // Clear local state before going back
                    setScheduleShifts([]);
                    setUnassignedShifts([]);
                    setSelectedSchedule(null);
                  }}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Schedules
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleSaveDraft}
                  disabled={isSaving}
                >
                  {isSaving ? 'Saving...' : (selectedSchedule.status === 'published' ? 'Save as Draft' : 'Save Draft')}
                </Button>
                <Button 
                  className="bg-primary hover:bg-primary/90" 
                  onClick={handlePublishSchedule}
                  disabled={isSaving}
                >
                  {isSaving ? 'Saving...' : (selectedSchedule.status === 'published' ? 'Save Schedule' : 'Publish Schedule')}
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
                <h2 className="text-lg font-semibold">{selectedSchedule.name}</h2>
                <Button variant="outline" size="sm">
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>

              <div className="grid grid-cols-8 gap-1 border border-border rounded-lg overflow-hidden">
                {/* Header */}
                <div className="bg-muted p-2"></div>
                {weekDays.map((day, index) => {
                  const dateObj = weekDates[index] ? new Date(weekDates[index]) : new Date();
                  const dayNumber = dateObj.getDate();
                  return (
                    <div key={day} className="bg-muted p-2 text-center">
                      <div className="text-sm font-medium">{day}</div>
                      <div className="text-xs text-muted-foreground">{dayNumber}</div>
                    </div>
                  );
                })}

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
                    <DroppableUnassignedDay key={dayIndex} dayIndex={dayIndex} draggedItemType={draggedItem?.type}>
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
                      {employees.map((employee) => (
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