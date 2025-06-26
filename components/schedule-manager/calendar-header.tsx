/**
 * CalendarHeader Component
 * 
 * Renders the calendar header showing week days and dates.
 * Includes navigation controls for switching weeks.
 */

"use client";


interface CalendarHeaderProps {
  /** Name of the current schedule */
  scheduleName: string;
  
  /** Current schedule status */
  scheduleStatus: 'draft' | 'published';
  
  /** Whether there are unsaved changes */
  hasChanges?: boolean;
}

export function CalendarHeader({
  scheduleName,
  scheduleStatus,
  hasChanges = false
}: CalendarHeaderProps) {
  
  /**
   * Format the schedule name to remove chevrons and fix double comma
   */
  const formatScheduleName = (name: string) => {
    return name
      .replace(/Week of\s*/, 'Week of ')  // Normalize spacing
      .replace(/,,+/g, ',')               // Remove double commas
      .replace(/\s*,\s*(\d{4})/, ', $1'); // Fix spacing around year
  };

  /**
   * Get schedule status display info
   */
  const getScheduleStatus = () => {
    if (scheduleStatus === 'published') {
      return { label: 'Published', color: 'bg-green-100 text-green-800 border-green-200' };
    } else {
      return { label: 'Saved Draft', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' };
    }
  };

  /**
   * Get changes status display info
   */
  const getChangesStatus = () => {
    if (hasChanges) {
      return { label: 'Changed', color: 'bg-orange-100 text-orange-800 border-orange-200' };
    } else {
      return { label: 'Saved', color: 'bg-gray-100 text-gray-800 border-gray-200' };
    }
  };

  const statusInfo = getScheduleStatus();
  const changesInfo = getChangesStatus();

  return (
    <div className="mb-4 flex items-center justify-center space-x-4">
      <div className="flex items-center space-x-3">
        <h2 className="text-lg font-semibold">{formatScheduleName(scheduleName)}</h2>
        <div className="flex items-center space-x-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${statusInfo.color}`}>
            {statusInfo.label}
          </span>
          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${changesInfo.color}`}>
            {changesInfo.label}
          </span>
        </div>
      </div>
    </div>
  );
}