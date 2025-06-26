/**
 * TrashCanComponent
 * 
 * A droppable trash can component that allows users to remove shift types 
 * that might have been added to the required shifts by accident.
 */

"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { useDroppable } from "@dnd-kit/core";

interface TrashCanComponentProps {
  /** Array of week day labels for consistent column layout */
  weekDays: string[];
  
  /** Type of currently dragged item for visual feedback */
  draggedItemType?: string;
}

export function TrashCanComponent({
  weekDays,
  draggedItemType
}: TrashCanComponentProps) {
  const [isHovered, setIsHovered] = useState(false);
  
  // Make the trash can droppable
  const { isOver, setNodeRef } = useDroppable({
    id: 'trash-can',
    data: {
      type: 'trash-can'
    }
  });
  
  // Show active state when dragging a shift
  const isActive = draggedItemType === 'schedule-shift' || isOver;
  
  return (
    <div className="contents">
      {/* Header Cell */}
      <div 
        ref={setNodeRef}
        className={`
          bg-slate-900 p-3 border-r border-border transition-all duration-200 cursor-pointer
          ${isActive ? 'bg-red-900/30 border-red-500/50' : 'hover:bg-slate-800'}
        `}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="flex flex-col items-center justify-center text-center">
          <Trash2 
            className={`
              w-6 h-6 mb-2 transition-all duration-200
              ${isActive ? 'text-red-400 scale-110' : 'text-slate-400'}
              ${isHovered ? 'text-slate-300' : ''}
            `} 
          />
          <div className={`
            text-xs font-medium transition-colors duration-200
            ${isActive ? 'text-red-400' : 'text-slate-400'}
            ${isHovered ? 'text-slate-300' : ''}
          `}>
            Remove Shift
          </div>
          <div className={`
            text-xs mt-1 transition-colors duration-200
            ${isActive ? 'text-red-300' : 'text-slate-500'}
            ${isHovered ? 'text-slate-400' : ''}
          `}>
            {isActive ? 'Drop here' : 'Drag to remove'}
          </div>
        </div>
      </div>
      
      {/* Empty day cells to maintain grid structure */}
      {weekDays.map((_, dayIndex) => (
        <div 
          key={dayIndex}
          className={`
            bg-slate-900 border-r border-border min-h-[60px] transition-all duration-200
            ${isActive ? 'bg-red-900/20 border-red-500/30' : ''}
          `}
        />
      ))}
    </div>
  );
}