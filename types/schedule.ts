// Types for Schedule Manager - compatible with backend

export interface ShiftType {
  id: string;
  name: string;
  startTime: string; // HH:MM format
  endTime: string;   // HH:MM format
  colorIndex: number; // 0-9 for theme colors
  isActive?: boolean;
}

export interface ScheduleShift {
  id: string;
  scheduleId?: string;
  shiftTypeId: string;
  shiftType: ShiftType;
  date: string; // YYYY-MM-DD format
  order: number; // Timeline position
  userId?: string; // null if unassigned
  user?: Employee;
}

export interface Employee {
  id: string;
  _id?: string; // Backend compatibility
  firstName: string;
  lastName: string;
  role: string;
  avatar?: string;
  email?: string;
}

export interface Schedule {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: "draft" | "published";
  totalShifts?: number;
  assignedShifts?: number;
}

// Mock data
export const mockShiftTypes: ShiftType[] = [
  {
    id: "1",
    name: "Front Desk",
    startTime: "06:00",
    endTime: "10:00",
    colorIndex: 0 // Blue
  },
  {
    id: "2", 
    name: "Front Desk",
    startTime: "10:00",
    endTime: "13:00",
    colorIndex: 0 // Blue
  },
  {
    id: "3",
    name: "Front Desk", 
    startTime: "13:00",
    endTime: "17:00",
    colorIndex: 0 // Blue
  },
  {
    id: "4",
    name: "Cleaner",
    startTime: "10:00",
    endTime: "14:00", 
    colorIndex: 3 // Yellow
  },
  {
    id: "5",
    name: "Manager",
    startTime: "09:00",
    endTime: "17:00",
    colorIndex: 2 // Green
  },
  {
    id: "6",
    name: "Security",
    startTime: "17:00",
    endTime: "23:00",
    colorIndex: 4 // Purple
  }
];

export const mockEmployees: Employee[] = [
  {
    id: "1",
    firstName: "Sarah",
    lastName: "Johnson", 
    role: "Manager"
  },
  {
    id: "2",
    firstName: "Mike",
    lastName: "Chen",
    role: "Front Desk"
  },
  {
    id: "3",
    firstName: "Emma", 
    lastName: "Davis",
    role: "Cleaner"
  },
  {
    id: "4",
    firstName: "John",
    lastName: "Smith",
    role: "Security"
  },
  {
    id: "5",
    firstName: "Lisa",
    lastName: "Wong",
    role: "Front Desk"
  }
];

export const mockSchedule: Schedule = {
  id: "1",
  name: "Week of January 15-21, 2024",
  startDate: "2024-01-15",
  endDate: "2024-01-21", 
  status: "draft"
};

// Color mapping for shift types - Using custom CSS variables with dark theme
export const shiftTypeColors = [
  "text-blue-50 border-2 bg-shift-0 border-shift-0", // 0 - Custom shift-0 color
  "text-blue-50 border-2 bg-shift-1 border-shift-1", // 1 - Custom shift-1 color  
  "text-blue-50 border-2 bg-shift-2 border-shift-2", // 2 - Custom shift-2 color
  "text-blue-50 border-2 bg-shift-3 border-shift-3", // 3 - Custom shift-3 color
  "text-blue-50 border-2 bg-shift-4 border-shift-4", // 4 - Custom shift-4 color
  "text-blue-50 border-2 bg-shift-5 border-shift-5", // 5 - Custom shift-5 color
  "text-blue-50 border-2 bg-shift-6 border-shift-6", // 6 - Custom shift-6 color
  "text-blue-50 border-2 bg-shift-7 border-shift-7", // 7 - Custom shift-7 color
  "text-blue-50 border-2 bg-shift-8 border-shift-8", // 8 - Custom shift-8 color
  "text-blue-50 border-2 bg-shift-9 border-shift-9"  // 9 - Custom shift-9 color
];

// Utility functions
export const getDayOfWeek = (dateStr: string) => {
  const date = new Date(dateStr);
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[date.getDay()];
};

export const getWeekDates = (startDate: string) => {
  const dates = [];
  const start = new Date(startDate);
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    dates.push(date.toISOString().split('T')[0]);
  }
  
  return dates;
};