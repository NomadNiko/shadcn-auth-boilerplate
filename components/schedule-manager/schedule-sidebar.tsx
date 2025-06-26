/**
 * ScheduleSidebar Component
 * 
 * Combined sidebar that displays either employees or shift types panel based on the selected view.
 * Includes quick actions for schedule management.
 */

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Copy, Trash2, ArrowLeft, Save, Upload } from "lucide-react";
import type { Employee, ShiftType, Schedule } from "@/types/schedule";
import { EmployeePanel } from "./employee-panel";
import { ShiftTypePanel } from "./shift-type-panel";

interface ScheduleSidebarProps {
  /** Array of available employees */
  employees: Employee[];
  
  /** Array of available shift types */
  shiftTypes: ShiftType[];
  
  /** Set of selected shift type IDs */
  selectedShiftTypes: Set<string>;
  
  /** Map of shift type ID to quantity */
  shiftTypeQuantities: Map<string, number>;
  
  /** The currently selected schedule */
  selectedSchedule: Schedule;

  /** Whether a save operation is in progress */
  isSaving: boolean;
  
  /** Callback to copy previous week's shifts */
  onCopyPreviousWeek: () => void;
  
  /** Callback to clear all shifts */
  onClearAllShifts: () => void;
  
  /** Callback to handle shift type selection */
  onShiftTypeSelect: (shiftType: ShiftType, selected: boolean) => void;
  
  /** Callback to handle quantity changes */
  onQuantityChange: (shiftTypeId: string, quantity: number) => void;
  
  /** Callback to clear all shift type selections */
  onClearAllSelections: () => void;
  
  /** Callback to create new shift type */
  onCreateShiftType: (shiftType: Omit<ShiftType, 'id' | 'isActive'>) => Promise<void>;
  
  /** Callback to update existing shift type */
  onUpdateShiftType: (id: string, shiftType: Omit<ShiftType, 'id' | 'isActive'>) => Promise<void>;

  /** Callback to handle back navigation */
  onBack: () => void;

  /** Callback to save the schedule as draft */
  onSaveDraft: () => void;

  /** Callback to publish the schedule */
  onPublish: () => void;
}

type SidebarView = 'employees' | 'shifts';

export function ScheduleSidebar({
  employees,
  shiftTypes,
  selectedShiftTypes,
  shiftTypeQuantities,
  selectedSchedule,
  isSaving,
  onCopyPreviousWeek,
  onClearAllShifts,
  onShiftTypeSelect,
  onQuantityChange,
  onClearAllSelections,
  onCreateShiftType,
  onUpdateShiftType,
  onBack,
  onSaveDraft,
  onPublish
}: ScheduleSidebarProps) {
  const [sidebarView, setSidebarView] = useState<SidebarView>('shifts');

  return (
    <div className="col-span-3 space-y-4">
      {/* Quick Actions Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Schedule Management Actions */}
          <Button 
            variant="outline" 
            onClick={onBack}
            className="w-full justify-start"
            disabled={isSaving}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Schedules
          </Button>
          
          <Button 
            variant="outline" 
            onClick={onSaveDraft}
            className="w-full justify-start"
            disabled={isSaving}
          >
            <Save className="w-4 h-4 mr-2" />
            {isSaving
              ? "Saving..."
              : selectedSchedule.status === "published"
              ? "Save as Draft"
              : "Save Draft"}
          </Button>
          
          <Button 
            onClick={onPublish}
            className="w-full justify-start bg-primary hover:bg-primary/90"
            disabled={isSaving}
          >
            <Upload className="w-4 h-4 mr-2" />
            {isSaving
              ? "Saving..."
              : selectedSchedule.status === "published"
              ? "Save Schedule"
              : "Publish Schedule"}
          </Button>

          {/* Shift Management Actions */}
          <div className="border-t pt-3 mt-4">
            <Button 
              variant="outline" 
              onClick={onCopyPreviousWeek}
              className="w-full justify-start mb-2"
            >
              <Copy className="w-4 h-4 mr-2" />
              Copy Previous Week
            </Button>
            <Button 
              variant="outline" 
              onClick={onClearAllShifts}
              className="w-full justify-start"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Clear All Shifts
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Card */}
      <Card>
        <CardHeader className="pb-3">
          {/* View Toggle Buttons */}
          <div className="flex justify-center mb-4">
            <div className="flex bg-muted rounded-lg p-1">
              <Button
                variant={sidebarView === 'employees' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setSidebarView('employees')}
                className="rounded-md"
              >
                Employees
              </Button>
              <Button
                variant={sidebarView === 'shifts' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setSidebarView('shifts')}
                className="rounded-md"
              >
                Available Shifts
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {/* Conditional Content Based on View */}
          {sidebarView === 'employees' ? (
            <EmployeePanel employees={employees} />
          ) : (
            <ShiftTypePanel
              shiftTypes={shiftTypes}
              selectedShiftTypes={selectedShiftTypes}
              shiftTypeQuantities={shiftTypeQuantities}
              onShiftTypeSelect={onShiftTypeSelect}
              onQuantityChange={onQuantityChange}
              onClearAllSelections={onClearAllSelections}
              onCreateShiftType={onCreateShiftType}
              onUpdateShiftType={onUpdateShiftType}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}