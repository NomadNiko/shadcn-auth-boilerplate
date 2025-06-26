/**
 * Schedule Assignment Page - Refactored Version
 * 
 * Clean, component-based implementation of the schedule assignment interface.
 * Uses extracted components for better maintainability and readability.
 */

"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ScheduleSelector } from "@/components/schedule-selector";
import { ScheduleHeader } from "@/components/schedule-manager/schedule-header";
import { EmployeeScheduleGrid } from "@/components/schedule-manager/employee-schedule-grid";
import { ScheduleSidebar } from "@/components/schedule-manager/schedule-sidebar";
import { DragDropProvider } from "@/components/schedule-manager/drag-drop-provider";
import { useScheduleData } from "@/hooks/use-schedule-data";
import { useEmployees } from "@/hooks/use-employees";
import { useScheduleEdit } from "@/hooks/use-schedule-edit";
import { schedulesApi } from "@/lib/api-services";
import type { Schedule, ShiftType } from "@/types/schedule";

function ScheduleAssignPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // Local state for schedule selection
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);
  const [loadingScheduleFromUrl, setLoadingScheduleFromUrl] = useState(false);

  // Check for scheduleId in URL parameters
  useEffect(() => {
    const scheduleId = searchParams.get('scheduleId');
    if (scheduleId && !selectedSchedule) {
      setLoadingScheduleFromUrl(true);
      // Load the specific schedule
      schedulesApi.getById(scheduleId)
        .then(dto => {
          const schedule = {
            id: dto.id,
            name: dto.name,
            startDate: typeof dto.startDate === 'string' ? dto.startDate : new Date(dto.startDate).toISOString().split('T')[0],
            endDate: typeof dto.endDate === 'string' ? dto.endDate : new Date(dto.endDate).toISOString().split('T')[0],
            status: dto.status,
            totalShifts: dto.totalShifts,
            assignedShifts: dto.assignedShifts
          };
          setSelectedSchedule(schedule);
        })
        .catch(err => {
          console.error('Failed to load schedule from URL:', err);
        })
        .finally(() => {
          setLoadingScheduleFromUrl(false);
        });
    }
  }, [searchParams, selectedSchedule]);
  
  // Core data hooks
  const {
    shiftTypes,
    scheduleShifts: originalScheduleShifts,
    loading,
    error,
    createShiftType,
    saveScheduleChanges,
    copyPreviousWeek,
    publishSchedule
  } = useScheduleData(selectedSchedule?.id);
  
  const { employees } = useEmployees();
  

  // Schedule editing state and logic
  const {
    scheduleShifts,
    unassignedShifts,
    selectedShiftTypes,
    selectedRequiredShifts,
    shiftTypeQuantities,
    isSaving,
    weekDates,
    assignedEmployees,
    hasChanges,
    setScheduleShifts,
    setUnassignedShifts,
    setIsSaving,
    handleShiftTypeSelect,
    handleRequiredShiftSelect,
    handleQuantityChange,
    clearAllSelections,
    clearSelectedRequiredShifts,
    getAssignedShiftsForEmployeeAndDay,
    getUnassignedShiftsForDay,
    getChangeSummary,
    clearAllShifts,
    // TEMPORARY: Click-to-move functionality
    selectedShiftForMove,
    handleShiftClickToMove,
    handleClickToPlaceShift,
    handleClickToUnassignShift,
    clearSelectedShiftForMove
  } = useScheduleEdit({
    currentSchedule: selectedSchedule,
    originalScheduleShifts,
    shiftTypes,
    employees
  });

  /**
   * Handle schedule selection
   */
  const handleScheduleSelect = (schedule: Schedule) => {
    setSelectedSchedule(schedule);
  };

  /**
   * Handle back navigation
   */
  const handleBack = () => {
    router.push('/schedule-manager');
  };

  /**
   * Handle save draft with bulk operations
   */
  const handleSaveDraft = async () => {
    if (!selectedSchedule || isSaving) return;

    setIsSaving(true);
    
    try {
      const { newShifts, shiftsToUpdate, shiftsToDelete } = getChangeSummary();
      
      console.log('Draft save summary:', {
        newShifts: newShifts.length,
        shiftsToUpdate: shiftsToUpdate.length,
        shiftsToDelete: shiftsToDelete.length
      });

      if (newShifts.length === 0 && shiftsToUpdate.length === 0 && shiftsToDelete.length === 0) {
        console.log('No changes to save');
        return;
      }

      await saveScheduleChanges(newShifts, shiftsToUpdate, shiftsToDelete);
      console.log('Schedule saved successfully');
      
    } catch (err) {
      console.error('Failed to save schedule:', err);
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Handle schedule publish
   */
  const handlePublish = async () => {
    if (!selectedSchedule || isSaving) return;

    setIsSaving(true);

    try {
      // First save any pending changes
      const { newShifts, shiftsToUpdate, shiftsToDelete } = getChangeSummary();
      
      if (newShifts.length > 0 || shiftsToUpdate.length > 0 || shiftsToDelete.length > 0) {
        await saveScheduleChanges(newShifts, shiftsToUpdate, shiftsToDelete);
      }

      // Then publish the schedule
      await publishSchedule();
      console.log('Schedule published successfully');
      
    } catch (err) {
      console.error('Failed to publish schedule:', err);
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Handle copy previous week
   */
  const handleCopyPreviousWeek = async () => {
    try {
      await copyPreviousWeek();
      console.log('Previous week copied successfully');
    } catch (err) {
      console.error('Failed to copy previous week:', err);
    }
  };

  /**
   * Handle create shift type
   */
  const handleCreateShiftType = async (shiftTypeData: Omit<ShiftType, 'id' | 'isActive'>) => {
    try {
      await createShiftType(shiftTypeData);
      console.log('Shift type created successfully');
    } catch (err) {
      console.error('Failed to create shift type:', err);
      throw err;
    }
  };

  // Show loading state
  if (loading || loadingScheduleFromUrl) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg font-semibold mb-2">Loading Schedule Manager...</div>
          <div className="text-sm text-muted-foreground">Please wait while we load your data</div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg font-semibold mb-2 text-destructive">Error Loading Data</div>
          <div className="text-sm text-muted-foreground mb-4">{error}</div>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Show schedule selector if no schedule is selected
  if (!selectedSchedule) {
    return (
      <div className="min-h-screen bg-background">
        <ScheduleSelector
          onScheduleSelect={handleScheduleSelect}
        />
      </div>
    );
  }

  // Main schedule assignment interface
  return (
    <DragDropProvider
      weekDates={weekDates}
      scheduleShifts={scheduleShifts}
      setScheduleShifts={setScheduleShifts}
      unassignedShifts={unassignedShifts}
      setUnassignedShifts={setUnassignedShifts}
      selectedShiftTypes={selectedShiftTypes}
      selectedRequiredShifts={selectedRequiredShifts}
      onClearSelectedRequiredShifts={clearSelectedRequiredShifts}
      shiftTypeQuantities={shiftTypeQuantities}
      employees={employees}
      shiftTypes={shiftTypes}
    >
      <div className="min-h-screen bg-background">
        {/* Header */}
        <ScheduleHeader
          selectedSchedule={selectedSchedule}
          isSaving={isSaving}
          onBack={handleBack}
          onSaveDraft={handleSaveDraft}
          onPublish={handlePublish}
        />

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-12 gap-6">
            {/* Calendar Grid */}
            <EmployeeScheduleGrid
              selectedSchedule={selectedSchedule}
              weekDates={weekDates}
              assignedEmployees={assignedEmployees}
              selectedRequiredShifts={selectedRequiredShifts}
              getAssignedShiftsForEmployeeAndDay={getAssignedShiftsForEmployeeAndDay}
              getUnassignedShiftsForDay={getUnassignedShiftsForDay}
              onRequiredShiftSelect={handleRequiredShiftSelect}
              onClearSelectedRequiredShifts={clearSelectedRequiredShifts}
              selectedShiftForMove={selectedShiftForMove}
              onShiftClickToMove={handleShiftClickToMove}
              onClickToPlaceShift={handleClickToPlaceShift}
              onClickToUnassignShift={handleClickToUnassignShift}
            />

            {/* Sidebar */}
            <ScheduleSidebar
              employees={employees}
              shiftTypes={shiftTypes}
              selectedShiftTypes={selectedShiftTypes}
              shiftTypeQuantities={shiftTypeQuantities}
              onCopyPreviousWeek={handleCopyPreviousWeek}
              onClearAllShifts={clearAllShifts}
              onShiftTypeSelect={handleShiftTypeSelect}
              onQuantityChange={handleQuantityChange}
              onClearAllSelections={clearAllSelections}
              onCreateShiftType={handleCreateShiftType}
            />
          </div>
        </div>

        {/* Debug Information (development only) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="fixed bottom-4 right-4 p-4 bg-card border rounded-lg shadow-lg text-xs max-w-sm">
            <div className="font-semibold mb-2">Debug Info</div>
            <div>Has Changes: {hasChanges ? 'Yes' : 'No'}</div>
            <div>Assigned Shifts: {scheduleShifts.length}</div>
            <div>Unassigned Shifts: {unassignedShifts.length}</div>
            <div>Selected Shift Types: {selectedShiftTypes.size}</div>
            <div>Selected Required: {selectedRequiredShifts.size}</div>
            <div>Is Saving: {isSaving ? 'Yes' : 'No'}</div>
            <div className="mt-2 pt-2 border-t">
              <div className="font-semibold text-yellow-600">TEMP: Click-to-Move</div>
              <div>Selected Shift: {selectedShiftForMove ? selectedShiftForMove.shiftType.name : 'None'}</div>
              {selectedShiftForMove && (
                <button 
                  onClick={clearSelectedShiftForMove}
                  className="mt-1 px-2 py-1 bg-yellow-500 text-white text-xs rounded hover:bg-yellow-600"
                >
                  Clear Selection
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </DragDropProvider>
  );
}

export default function ScheduleAssignPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg font-semibold mb-2">Loading Schedule Manager...</div>
          <div className="text-sm text-muted-foreground">Please wait while we load your data</div>
        </div>
      </div>
    }>
      <ScheduleAssignPageContent />
    </Suspense>
  );
}