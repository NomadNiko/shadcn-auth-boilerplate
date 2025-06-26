/**
 * DraggableScheduleShift Component
 * 
 * Individual draggable shift component that can be used both for assigned and unassigned shifts.
 * Handles drag functionality and optional selection for bulk operations.
 */

"use client";

import { useDraggable } from '@dnd-kit/core';
import type { ScheduleShift } from "@/types/schedule";
import { shiftTypeColors } from "@/types/schedule";

interface DraggableScheduleShiftProps {
  /** The shift to render */
  shift: ScheduleShift;
  
  /** Whether this is an unassigned shift */
  isUnassigned?: boolean;
  
  /** Whether this shift is selected for bulk operations */
  isSelected?: boolean;
  
  /** Total count of selected shifts (for badge display) */
  selectedCount?: number;
  
  /** Callback for selection toggle */
  onSelect?: (shift: ScheduleShift, selected: boolean) => void;
  
  /** TEMPORARY: Whether this shift is selected for click-to-move */
  isClickSelected?: boolean;
  
  /** TEMPORARY: Callback for click-to-move selection */
  onClickSelect?: (shift: ScheduleShift) => void;
}

export function DraggableScheduleShift({ 
  shift, 
  isUnassigned = false,
  isSelected = false,
  selectedCount = 0,
  onSelect,
  isClickSelected = false,
  onClickSelect
}: DraggableScheduleShiftProps) {
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

  /**
   * Handle selection checkbox click
   */
  const handleSelectClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onSelect?.(shift, !isSelected);
  };

  /**
   * TEMPORARY: Handle click-to-move selection
   */
  const handleClickToMove = (e: React.MouseEvent) => {
    // Only trigger on direct click, not on checkbox clicks
    if ((e.target as HTMLElement).closest('.selection-checkbox')) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    onClickSelect?.(shift);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={handleClickToMove}
      className={`text-xs p-1 mb-1 rounded cursor-move transition-all relative ${
        isDragging ? 'opacity-50' : ''
      } ${isSelected ? 'ring-2 ring-primary ring-offset-1' : ''} ${
        isClickSelected ? 'ring-4 ring-yellow-400 ring-offset-2' : ''
      } ${
        isUnassigned 
          ? `${shiftTypeColors[shift.shiftType.colorIndex]} hover:opacity-80` 
          : `${shiftTypeColors[shift.shiftType.colorIndex]} hover:opacity-80`
      }`}
    >
      <div className="flex items-center justify-between">
        {/* Shift Information */}
        <div className="flex-1 min-w-0">
          <div className="font-medium truncate">{shift.shiftType.name}</div>
          <div className="opacity-90 truncate text-xs">
            {shift.shiftType.startTime} - {shift.shiftType.endTime}
          </div>
          {shift.user && (
            <div className="opacity-80 truncate text-xs">
              {shift.user.firstName} {shift.user.lastName}
            </div>
          )}
        </div>
        
        {/* Selection checkbox for unassigned shifts */}
        {isUnassigned && onSelect && (
          <div
            onClick={handleSelectClick}
            className="selection-checkbox flex-shrink-0 ml-1 cursor-pointer"
          >
            <div className={`w-4 h-4 border border-current rounded flex items-center justify-center text-xs font-bold ${
              isSelected ? 'bg-primary text-primary-foreground' : 'opacity-60 hover:opacity-100'
            }`}>
              {isSelected ? '✓' : ''}
            </div>
          </div>
        )}
      </div>
      
      {/* Selection count badge */}
      {isSelected && selectedCount > 1 && (
        <div className="absolute -top-1 -right-1 bg-primary text-primary-foreground rounded-full w-4 h-4 flex items-center justify-center text-xs font-bold">
          {selectedCount}
        </div>
      )}
    </div>
  );
}