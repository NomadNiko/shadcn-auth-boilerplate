/**
 * CalendarGridHeader Component
 * 
 * Renders just the header row of the calendar grid (day names and dates).
 * Separate from the navigation header.
 */

"use client";

interface CalendarGridHeaderProps {
  /** Array of week dates in YYYY-MM-DD format */
  weekDates: string[];
}

const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function CalendarGridHeader({ weekDates }: CalendarGridHeaderProps) {
  return (
    <>
      {/* Empty corner cell */}
      <div className="bg-muted p-2"></div>
      
      {/* Day headers */}
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
    </>
  );
}