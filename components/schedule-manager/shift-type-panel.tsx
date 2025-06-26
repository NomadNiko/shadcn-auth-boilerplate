/**
 * ShiftTypePanel Component
 * 
 * Renders the sidebar panel for available shift types with drag-and-drop functionality.
 * Includes quantity selection, multi-selection, and shift type creation.
 */

"use client";

import { Button } from "@/components/ui/button";
import { GripVertical } from "lucide-react";
import { useDraggable } from '@dnd-kit/core';
import type { ShiftType } from "@/types/schedule";
import { shiftTypeColors } from "@/types/schedule";
import { CreateShiftTypeDialog } from "@/components/create-shift-type-dialog";

interface ShiftTypePanelProps {
  /** Array of available shift types */
  shiftTypes: ShiftType[];
  
  /** Set of selected shift type IDs */
  selectedShiftTypes: Set<string>;
  
  /** Map of shift type ID to quantity */
  shiftTypeQuantities: Map<string, number>;
  
  /** Callback to handle shift type selection */
  onShiftTypeSelect: (shiftType: ShiftType, selected: boolean) => void;
  
  /** Callback to handle quantity changes */
  onQuantityChange: (shiftTypeId: string, quantity: number) => void;
  
  /** Callback to clear all selections */
  onClearAllSelections: () => void;
  
  /** Callback to create new shift type */
  onCreateShiftType: (shiftType: Omit<ShiftType, 'id' | 'isActive'>) => Promise<void>;
}

/**
 * Draggable shift type component with selection and quantity controls
 */
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

export function ShiftTypePanel({
  shiftTypes,
  selectedShiftTypes,
  shiftTypeQuantities,
  onShiftTypeSelect,
  onQuantityChange,
  onClearAllSelections,
  onCreateShiftType
}: ShiftTypePanelProps) {
  /**
   * Get quantity for a specific shift type
   */
  const getQuantityForShiftType = (shiftTypeId: string): number => {
    return shiftTypeQuantities.get(shiftTypeId) || 1;
  };

  return (
    <div>
      <div className="pb-3">
        <h3 className="text-lg text-center font-semibold">Available Shifts</h3>
        <p className="text-xs text-muted-foreground text-center mt-2">
          Set quantities with <strong>+/-</strong>, select with <strong>✓</strong>, then drag to add shifts
        </p>
      </div>
      
      <div className="space-y-3">
        {/* Selection Summary */}
        {selectedShiftTypes.size > 0 && (
          <div className="flex justify-between items-center p-2 bg-primary/10 rounded-lg border border-primary/20 mb-3">
            <span className="text-sm font-medium">
              {selectedShiftTypes.size} shift type{selectedShiftTypes.size > 1 ? 's' : ''} selected
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearAllSelections}
              className="text-xs h-6"
            >
              Clear
            </Button>
          </div>
        )}
        
        {/* Shift Types List */}
        {shiftTypes.map((shiftType) => (
          <DraggableShiftType 
            key={shiftType.id} 
            shiftType={shiftType}
            isSelected={selectedShiftTypes.has(shiftType.id)}
            onSelect={onShiftTypeSelect}
            selectedCount={selectedShiftTypes.size}
            quantity={getQuantityForShiftType(shiftType.id)}
            onQuantityChange={onQuantityChange}
          />
        ))}
        
        {/* Create New Shift Type */}
        <CreateShiftTypeDialog onCreateShiftType={onCreateShiftType} />
      </div>
    </div>
  );
}