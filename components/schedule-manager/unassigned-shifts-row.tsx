/**
 * UnassignedShiftsRow Component
 * 
 * Renders the bottom row of the calendar showing unassigned shifts that need to be assigned.
 * Includes selection capabilities for bulk operations on unassigned shifts.
 */

"use client";

import type { ScheduleShift } from "@/types/schedule";
import { DroppableUnassignedDay } from "./droppable-day-cell";
import { DraggableScheduleShift } from "./draggable-schedule-shift";

interface UnassignedShiftsRowProps {
  /** Array of week day labels */
  weekDays: string[];
  
  /** Set of selected required shifts for bulk operations */
  selectedRequiredShifts: Set<string>;
  
  /** Type of currently dragged item for visual feedback */
  draggedItemType?: string;
  
  /** Callback to get unassigned shifts for a specific day */
  getUnassignedShiftsForDay: (dayIndex: number) => ScheduleShift[];
  
  /** Callback to handle shift selection */
  onRequiredShiftSelect: (shift: ScheduleShift, selected: boolean) => void;
  
  /** Callback to clear all selected shifts */
  onClearSelectedRequiredShifts: () => void;
  
  // TEMPORARY: Click-to-move functionality
  selectedShiftForMove?: ScheduleShift | null;
  onShiftClickToMove?: (shift: ScheduleShift) => void;
  onClickToUnassignShift?: (dayIndex: number) => void;
}

/**
 * Header cell for the unassigned shifts row
 */
function UnassignedShiftsHeader({ 
  selectedRequiredShifts, 
  onClearSelectedRequiredShifts 
}: {
  selectedRequiredShifts: Set<string>;
  onClearSelectedRequiredShifts: () => void;
}) {
  return (
    <div className="bg-slate-800 p-2 border-r border-border">
      <div className="text-sm font-medium text-blue-50">Required Shifts</div>
      <div className="text-xs text-blue-100">Drag to assign</div>
      {selectedRequiredShifts.size > 0 && (
        <div className="mt-2 flex items-center justify-between">
          <span className="text-xs font-medium text-blue-100">
            {selectedRequiredShifts.size} selected
          </span>
          <button
            onClick={onClearSelectedRequiredShifts}
            className="text-xs bg-slate-700 hover:bg-slate-600 text-blue-50 px-2 py-1 rounded transition-colors"
          >
            Clear
          </button>
        </div>
      )}
    </div>
  );
}

export function UnassignedShiftsRow({
  weekDays,
  selectedRequiredShifts,
  draggedItemType,
  getUnassignedShiftsForDay,
  onRequiredShiftSelect,
  onClearSelectedRequiredShifts,
  selectedShiftForMove,
  onShiftClickToMove,
  onClickToUnassignShift
}: UnassignedShiftsRowProps) {
  return (
    <div className="contents">
      {/* Header Cell */}
      <UnassignedShiftsHeader 
        selectedRequiredShifts={selectedRequiredShifts}
        onClearSelectedRequiredShifts={onClearSelectedRequiredShifts}
      />
      
      {/* Day Cells for Unassigned Shifts */}
      {weekDays.map((_, dayIndex) => (
        <DroppableUnassignedDay 
          key={dayIndex} 
          dayIndex={dayIndex} 
          draggedItemType={draggedItemType}
          onClickToPlace={onClickToUnassignShift}
          hasSelectedShift={!!selectedShiftForMove}
        >
          {getUnassignedShiftsForDay(dayIndex).map((shift) => (
            <DraggableScheduleShift 
              key={shift.id} 
              shift={shift} 
              isUnassigned={true}
              isSelected={selectedRequiredShifts.has(shift.id)}
              onSelect={onRequiredShiftSelect}
              selectedCount={selectedRequiredShifts.size}
              isClickSelected={selectedShiftForMove?.id === shift.id}
              onClickSelect={onShiftClickToMove}
            />
          ))}
        </DroppableUnassignedDay>
      ))}
    </div>
  );
}