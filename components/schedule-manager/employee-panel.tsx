/**
 * EmployeePanel Component
 * 
 * Renders the sidebar panel for employees with drag-and-drop functionality.
 * Shows available employees that can be assigned to shifts.
 */

"use client";

import { useDraggable, useDroppable } from '@dnd-kit/core';
import type { Employee } from "@/types/schedule";

interface EmployeePanelProps {
  /** Array of available employees */
  employees: Employee[];
}

/**
 * Draggable employee component with drop functionality
 */
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
      className={`flex items-center space-x-3 p-2 rounded-lg hover:bg-muted cursor-move transition-all ${
        isDragging ? 'opacity-50' : ''
      } ${isOver ? 'ring-2 ring-primary bg-primary/5' : ''}`}
    >
      {/* Employee Avatar */}
      <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
        {employee.firstName[0]}
      </div>
      
      {/* Employee Info */}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate">
          {employee.firstName} {employee.lastName}
        </div>
        <div className="text-xs text-muted-foreground truncate">
          {employee.role}
        </div>
      </div>
    </div>
  );
}

export function EmployeePanel({ employees }: EmployeePanelProps) {
  return (
    <div>
      <div className="pb-3">
        <h3 className="text-lg text-center font-semibold">Employees</h3>
      </div>
      
      <div className="space-y-3">
        {employees.length > 0 ? (
          employees.map((employee) => (
            <DraggableEmployee key={employee.id} employee={employee} />
          ))
        ) : (
          <div className="text-center text-muted-foreground text-sm py-4">
            No employees available
          </div>
        )}
      </div>
    </div>
  );
}