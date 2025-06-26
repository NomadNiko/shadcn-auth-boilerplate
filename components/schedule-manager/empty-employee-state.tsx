/**
 * EmptyEmployeeState Component
 * 
 * Renders an empty state row when no employees have been assigned shifts.
 * Provides visual feedback and guidance for the user.
 */

"use client";

interface EmptyEmployeeStateProps {
  /** Array of week day labels */
  weekDays: string[];
}

export function EmptyEmployeeState({ weekDays }: EmptyEmployeeStateProps) {
  return (
    <div className="contents">
      {/* Message Cell */}
      <div className="bg-slate-800/30 p-2 border-r border-border text-center">
        <div className="text-sm text-blue-100">No users assigned shifts</div>
        <div className="text-xs text-blue-200/70 mt-1">
          Drag shifts to employees or drop shifts here first
        </div>
      </div>
      
      {/* Empty Day Cells */}
      {weekDays.map((_, dayIndex) => (
        <div 
          key={dayIndex} 
          className="bg-slate-800/10 p-2 border-r border-b border-border min-h-[80px] flex items-center justify-center"
        >
          <div className="text-xs text-muted-foreground opacity-50">
            No shifts
          </div>
        </div>
      ))}
    </div>
  );
}