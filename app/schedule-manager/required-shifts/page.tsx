"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, ArrowRight, Plus, Copy, Trash2, GripVertical } from "lucide-react";
import { useRouter } from "next/navigation";
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
  mockSchedule, 
  shiftTypeColors, 
  getWeekDates,
  type ShiftType, 
  type ScheduleShift 
} from "@/types/schedule";

const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

function DroppableDay({ dayIndex, children }: { dayIndex: number; children: React.ReactNode }) {
  const { isOver, setNodeRef } = useDroppable({
    id: `day-${dayIndex}`,
  });

  return (
    <div 
      ref={setNodeRef}
      className={`min-h-[400px] p-3 space-y-2 ${
        isOver 
          ? 'bg-primary/5 border-primary border-2 border-dashed rounded-lg' 
          : ''
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
        className="flex-1 p-3 cursor-move"
        style={{ width: '60%' }}
      >
        <div className="flex items-center justify-between mb-1">
          <GripVertical className="w-4 h-4 opacity-60" />
          <span></span>
        </div>
        <div className="text-sm font-medium">{shiftType.name}</div>
        <div className="text-xs opacity-90">
          {shiftType.startTime} - {shiftType.endTime}
        </div>
      </div>

      {/* Middle 25% - Quantity selector */}
      <div className="flex flex-col items-center justify-center p-1 border-l border-current/20" style={{ width: '25%' }}>
        <button
          onClick={(e) => handleQuantityChange(1, e)}
          className="w-4 h-4 text-xs font-bold hover:bg-current/20 rounded flex items-center justify-center"
        >
          +
        </button>
        <div className="text-xs font-bold py-1">{quantity}</div>
        <button
          onClick={(e) => handleQuantityChange(-1, e)}
          className="w-4 h-4 text-xs font-bold hover:bg-current/20 rounded flex items-center justify-center"
        >
          −
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

function DraggableScheduleShift({ shift, onRemove }: { shift: ScheduleShift; onRemove: (id: string) => void }) {
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

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`p-3 rounded-lg border relative group cursor-move ${
        isDragging ? 'opacity-50' : ''
      } ${shiftTypeColors[shift.shiftType.colorIndex]}`}
    >
      <div className="flex items-center justify-between mb-1">
        <span></span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove(shift.id);
          }}
          className="opacity-60 hover:opacity-100 text-sm font-bold"
        >
          ×
        </button>
      </div>
      <div className="text-sm font-medium">{shift.shiftType.name}</div>
      <div className="text-xs opacity-90">
        {shift.shiftType.startTime} - {shift.shiftType.endTime}
      </div>
    </div>
  );
}

export default function RequiredShiftsPage() {
  const router = useRouter();
  
  // Initialize with the shifts shown in the mockup
  const [scheduleShifts, setScheduleShifts] = useState<ScheduleShift[]>([
    // Monday
    {
      id: 'shift-1',
      shiftTypeId: '1',
      shiftType: { ...mockShiftTypes[0], name: 'Front Desk', startTime: '06:00', endTime: '10:00' },
      date: getWeekDates(mockSchedule.startDate)[0],
      order: 1
    },
    {
      id: 'shift-2',
      shiftTypeId: '1',
      shiftType: { ...mockShiftTypes[0], name: 'Front Desk', startTime: '10:00', endTime: '13:00' },
      date: getWeekDates(mockSchedule.startDate)[0],
      order: 2
    },
    {
      id: 'shift-3',
      shiftTypeId: '4',
      shiftType: { ...mockShiftTypes[3], name: 'Cleaner', startTime: '10:00', endTime: '14:00' },
      date: getWeekDates(mockSchedule.startDate)[0],
      order: 3
    },
    {
      id: 'shift-4',
      shiftTypeId: '6',
      shiftType: { ...mockShiftTypes[5], name: 'Security', startTime: '17:00', endTime: '23:00' },
      date: getWeekDates(mockSchedule.startDate)[0],
      order: 4
    },
    
    // Tuesday
    {
      id: 'shift-5',
      shiftTypeId: '1',
      shiftType: { ...mockShiftTypes[0], name: 'Front Desk', startTime: '06:00', endTime: '10:00' },
      date: getWeekDates(mockSchedule.startDate)[1],
      order: 1
    },
    {
      id: 'shift-6',
      shiftTypeId: '5',
      shiftType: { ...mockShiftTypes[4], name: 'Manager', startTime: '09:00', endTime: '17:00' },
      date: getWeekDates(mockSchedule.startDate)[1],
      order: 2
    },
    {
      id: 'shift-7',
      shiftTypeId: '4',
      shiftType: { ...mockShiftTypes[3], name: 'Cleaner', startTime: '10:00', endTime: '14:00' },
      date: getWeekDates(mockSchedule.startDate)[1],
      order: 3
    },
    
    // Wednesday
    {
      id: 'shift-8',
      shiftTypeId: '1',
      shiftType: { ...mockShiftTypes[0], name: 'Front Desk', startTime: '06:00', endTime: '10:00' },
      date: getWeekDates(mockSchedule.startDate)[2],
      order: 1
    },
    {
      id: 'shift-9',
      shiftTypeId: '1',
      shiftType: { ...mockShiftTypes[0], name: 'Front Desk', startTime: '10:00', endTime: '13:00' },
      date: getWeekDates(mockSchedule.startDate)[2],
      order: 2
    },
    {
      id: 'shift-10',
      shiftTypeId: '1',
      shiftType: { ...mockShiftTypes[0], name: 'Front Desk', startTime: '13:00', endTime: '17:00' },
      date: getWeekDates(mockSchedule.startDate)[2],
      order: 3
    },
    
    // Thursday
    {
      id: 'shift-11',
      shiftTypeId: '5',
      shiftType: { ...mockShiftTypes[4], name: 'Manager', startTime: '09:00', endTime: '17:00' },
      date: getWeekDates(mockSchedule.startDate)[3],
      order: 1
    },
    {
      id: 'shift-12',
      shiftTypeId: '4',
      shiftType: { ...mockShiftTypes[3], name: 'Cleaner', startTime: '10:00', endTime: '14:00' },
      date: getWeekDates(mockSchedule.startDate)[3],
      order: 2
    },
    {
      id: 'shift-13',
      shiftTypeId: '6',
      shiftType: { ...mockShiftTypes[5], name: 'Security', startTime: '17:00', endTime: '23:00' },
      date: getWeekDates(mockSchedule.startDate)[3],
      order: 3
    },
    
    // Friday
    {
      id: 'shift-14',
      shiftTypeId: '1',
      shiftType: { ...mockShiftTypes[0], name: 'Front Desk', startTime: '06:00', endTime: '10:00' },
      date: getWeekDates(mockSchedule.startDate)[4],
      order: 1
    },
    {
      id: 'shift-15',
      shiftTypeId: '1',
      shiftType: { ...mockShiftTypes[0], name: 'Front Desk', startTime: '10:00', endTime: '17:00' },
      date: getWeekDates(mockSchedule.startDate)[4],
      order: 2
    },
    {
      id: 'shift-16',
      shiftTypeId: '4',
      shiftType: { ...mockShiftTypes[3], name: 'Cleaner', startTime: '10:00', endTime: '14:00' },
      date: getWeekDates(mockSchedule.startDate)[4],
      order: 3
    },
    
    // Saturday
    {
      id: 'shift-17',
      shiftTypeId: '1',
      shiftType: { ...mockShiftTypes[0], name: 'Front Desk', startTime: '10:00', endTime: '13:00' },
      date: getWeekDates(mockSchedule.startDate)[5],
      order: 1
    },
    {
      id: 'shift-18',
      shiftTypeId: '4',
      shiftType: { ...mockShiftTypes[3], name: 'Cleaner', startTime: '14:00', endTime: '18:00' },
      date: getWeekDates(mockSchedule.startDate)[5],
      order: 2
    },
    {
      id: 'shift-19',
      shiftTypeId: '6',
      shiftType: { ...mockShiftTypes[5], name: 'Security', startTime: '17:00', endTime: '23:00' },
      date: getWeekDates(mockSchedule.startDate)[5],
      order: 3
    },
    
    // Sunday
    {
      id: 'shift-20',
      shiftTypeId: '1',
      shiftType: { ...mockShiftTypes[0], name: 'Front Desk', startTime: '06:00', endTime: '10:00' },
      date: getWeekDates(mockSchedule.startDate)[6],
      order: 1
    },
    {
      id: 'shift-21',
      shiftTypeId: '4',
      shiftType: { ...mockShiftTypes[3], name: 'Cleaner', startTime: '10:00', endTime: '14:00' },
      date: getWeekDates(mockSchedule.startDate)[6],
      order: 2
    }
  ]);
  
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draggedShiftType, setDraggedShiftType] = useState<ShiftType | null>(null);
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
    if (data?.type === 'shiftType') {
      setDraggedShiftType(data.shiftType);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) {
      setActiveId(null);
      setDraggedShiftType(null);
      return;
    }

    const data = active.data.current;
    const overId = over.id as string;

    if (data?.type === 'shiftType' && overId.startsWith('day-')) {
      const dayIndex = parseInt(overId.replace('day-', ''));
      const draggedShiftType = data.shiftType as ShiftType;

      // If there are selected shift types and the dragged one is selected, create shifts for all selected
      const shiftTypesToCreate = selectedShiftTypes.has(draggedShiftType.id) && selectedShiftTypes.size > 1
        ? mockShiftTypes.filter(st => selectedShiftTypes.has(st.id))
        : [draggedShiftType];

      const currentShiftsCount = scheduleShifts.filter(s => s.date === weekDates[dayIndex]).length;
      
      // Create multiple instances based on quantity settings
      const newShifts: ScheduleShift[] = [];
      let orderCounter = currentShiftsCount + 1;
      
      shiftTypesToCreate.forEach((shiftType) => {
        const quantity = getQuantityForShiftType(shiftType.id);
        for (let i = 0; i < quantity; i++) {
          newShifts.push({
            id: `shift-${Date.now()}-${shiftType.id}-${i}`,
            shiftTypeId: shiftType.id,
            shiftType: shiftType,
            date: weekDates[dayIndex],
            order: orderCounter++
          });
        }
      });

      setScheduleShifts(prev => [...prev, ...newShifts]);
      
      // Keep selections so user can repeat the action on other days
    }

    setActiveId(null);
    setDraggedShiftType(null);
  };

  const handleRemoveShift = (shiftId: string) => {
    setScheduleShifts(prev => prev.filter(s => s.id !== shiftId));
  };

  const getShiftsForDay = (dayIndex: number) => {
    return scheduleShifts
      .filter(shift => shift.date === weekDates[dayIndex])
      .sort((a, b) => {
        const timeA = parseInt(a.shiftType.startTime.replace(':', ''));
        const timeB = parseInt(b.shiftType.startTime.replace(':', ''));
        return timeA - timeB;
      });
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
    
    setScheduleShifts(prev => [...prev, ...additionalShifts]);
  };

  const clearAllShifts = () => {
    setScheduleShifts([]);
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
              <Button className="bg-primary hover:bg-primary/90">
                <Plus className="w-4 h-4 mr-2" />
                Create Shift Type
              </Button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Page Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold">Assign Shifts</h1>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm font-medium">Week of Jan 15, 2024</span>
                <Button variant="outline" size="sm">
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-12 gap-6">
            {/* Calendar Grid */}
            <div className="col-span-9">
              <div className="grid grid-cols-7 gap-3">
                {weekDays.map((day, dayIndex) => (
                  <div key={day} className="space-y-2">
                    <div className="text-center py-2 border-b border-border">
                      <div className="font-medium text-sm">{day}</div>
                    </div>
                    
                    <DroppableDay dayIndex={dayIndex}>
                      {getShiftsForDay(dayIndex).map((shift) => (
                        <DraggableScheduleShift 
                          key={shift.id} 
                          shift={shift} 
                          onRemove={handleRemoveShift}
                        />
                      ))}
                    </DroppableDay>
                  </div>
                ))}
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
                  <Button 
                    onClick={() => router.push('/schedule-manager/assign')}
                    className="w-full justify-start bg-blue-800 hover:bg-blue-700 text-blue-50 border-blue-700"
                  >
                    <ArrowRight className="w-4 h-4 mr-2" />
                    Save and Continue
                  </Button>
                </CardContent>
              </Card>

              {/* Available Shift Types */}
              <Card className="mt-4">
                <CardHeader>
                  <CardTitle className="text-lg">Available Shift Types</CardTitle>
                  <p className="text-xs text-muted-foreground">
                    Set quantities with <strong>+/-</strong>, select with <strong>✓</strong>, then drag from the left to add multiple shifts
                  </p>
                </CardHeader>
                <CardContent className="space-y-3">
                  {selectedShiftTypes.size > 0 && (
                    <div className="flex justify-between items-center p-2 bg-primary/10 rounded-lg border border-primary/20">
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
                  
                  {mockShiftTypes.map((shiftType) => (
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
                  
                  <Button variant="outline" className="w-full mt-4">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Shift Type
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>

        </div>

        <DragOverlay>
          {activeId && draggedShiftType ? (
            <div className="relative">
              {selectedShiftTypes.has(draggedShiftType.id) && selectedShiftTypes.size > 1 ? (
                // Show clean preview for multiple selection with total count
                (() => {
                  const totalShifts = Array.from(selectedShiftTypes).reduce((total, shiftTypeId) => {
                    return total + getQuantityForShiftType(shiftTypeId);
                  }, 0);
                  return (
                    <div className={`p-3 rounded-lg border shadow-lg ${shiftTypeColors[draggedShiftType.colorIndex]}`}>
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
                  const quantity = getQuantityForShiftType(draggedShiftType.id);
                  return (
                    <div className={`p-3 rounded-lg border shadow-lg ${shiftTypeColors[draggedShiftType.colorIndex]}`}>
                      <div className="text-sm font-medium">{draggedShiftType.name}</div>
                      <div className="text-xs opacity-90">
                        {draggedShiftType.startTime} - {draggedShiftType.endTime}
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
          ) : null}
        </DragOverlay>
      </div>
    </DndContext>
  );
}