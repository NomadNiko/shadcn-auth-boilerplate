/**
 * DroppableDay Components
 * 
 * Droppable day cell components for both employee assigned days and unassigned days.
 * Handles drop zones for drag-and-drop functionality.
 */

"use client";

import { useDroppable } from '@dnd-kit/core';

interface DroppableEmployeeDayProps {
  /** Employee ID for this day cell */
  employeeId: string;
  
  /** Day index (0-6 for Mon-Sun) */
  dayIndex: number;
  
  /** Child components (shifts) */
  children: React.ReactNode;
  
  /** TEMPORARY: Callback for click-to-move placement */
  onClickToPlace?: (employeeId: string, dayIndex: number) => void;
  
  /** TEMPORARY: Whether there's a selected shift ready to be placed */
  hasSelectedShift?: boolean;
}

/**
 * Droppable day cell for employee assignments
 */
export function DroppableEmployeeDay({ 
  employeeId, 
  dayIndex, 
  children,
  onClickToPlace,
  hasSelectedShift = false
}: DroppableEmployeeDayProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: `employee-${employeeId}-day-${dayIndex}`,
  });

  /**
   * TEMPORARY: Handle click-to-move placement
   */
  const handleClickToPlace = (e: React.MouseEvent) => {
    if (hasSelectedShift) {
      e.preventDefault();
      e.stopPropagation();
      onClickToPlace?.(employeeId, dayIndex);
    }
  };

  return (
    <div 
      ref={setNodeRef}
      onClick={handleClickToPlace}
      data-employee-id={employeeId}
      data-day-index={dayIndex}
      className={`min-h-[80px] p-1 border-r border-b border-border relative ${
        isOver ? 'bg-blue-50' : 'bg-card'
      } ${hasSelectedShift ? 'cursor-pointer hover:bg-green-100 hover:border-green-300' : ''}`}
    >
      {children}
      {hasSelectedShift && (
        <div className="absolute inset-0 border-2 border-dashed border-green-500 bg-green-500/5 rounded flex items-center justify-center">
          <span className="text-green-700 text-xs font-semibold">Click to place shift</span>
        </div>
      )}
    </div>
  );
}

interface DroppableUnassignedDayProps {
  /** Day index (0-6 for Mon-Sun) */
  dayIndex: number;
  
  /** Type of currently dragged item for visual feedback */
  draggedItemType?: string;
  
  /** Child components (unassigned shifts) */
  children: React.ReactNode;
  
  /** TEMPORARY: Callback for click-to-move placement to unassigned */
  onClickToPlace?: (dayIndex: number) => void;
  
  /** TEMPORARY: Whether there's a selected shift ready to be placed */
  hasSelectedShift?: boolean;
}

/**
 * Droppable day cell for unassigned shifts
 */
export function DroppableUnassignedDay({ 
  dayIndex, 
  draggedItemType, 
  children,
  onClickToPlace,
  hasSelectedShift = false
}: DroppableUnassignedDayProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: `unassigned-day-${dayIndex}`,
  });

  /**
   * TEMPORARY: Handle click-to-move placement to unassigned
   */
  const handleClickToPlace = (e: React.MouseEvent) => {
    if (hasSelectedShift) {
      e.preventDefault();
      e.stopPropagation();
      onClickToPlace?.(dayIndex);
    }
  };

  return (
    <div 
      ref={setNodeRef}
      onClick={handleClickToPlace}
      data-day-index={dayIndex}
      className={`min-h-[80px] p-1 border-r border-b border-border relative ${
        isOver ? 'bg-blue-50' : 'bg-card'
      } ${draggedItemType === 'shiftType' ? 'bg-green-500/10 border-green-500/20' : ''} ${
        hasSelectedShift ? 'cursor-pointer hover:bg-blue-100 hover:border-blue-300' : ''
      }`}
    >
      {children}
      {hasSelectedShift && (
        <div className="absolute inset-0 border-2 border-dashed border-blue-500 bg-blue-500/5 rounded flex items-center justify-center">
          <span className="text-blue-700 text-xs font-semibold">Click to unassign</span>
        </div>
      )}
    </div>
  );
}