// Mock data types for Schedule Manager

export interface ShiftType {
  id: string;
  name: string;
  startTime: string; // HH:MM format
  endTime: string;   // HH:MM format
  colorIndex: number; // 0-9 for theme colors
}

export interface ScheduleShift {
  id: string;
  shiftTypeId: string;
  shiftType: ShiftType;
  date: string; // YYYY-MM-DD format
  order: number; // Timeline position
  userId?: string; // null if unassigned
  user?: Employee;
}

export interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
  avatar?: string;
}

export interface Schedule {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: "draft" | "published";
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

// Color mapping for shift types - Vibrant dark theme with blue-tinted light text
export const shiftTypeColors = [
  "bg-slate-700 border-slate-600 text-blue-50", // 0 - Dark slate blue
  "bg-blue-800 border-blue-700 text-blue-50", // 1 - Dark blue
  "bg-cyan-800 border-cyan-700 text-blue-50", // 2 - Dark cyan (blue-green)
  "bg-teal-800 border-teal-700 text-blue-50", // 3 - Dark teal (green-blue)
  "bg-emerald-800 border-emerald-700 text-blue-50", // 4 - Dark emerald (blue-green)
  "bg-indigo-800 border-indigo-700 text-blue-50", // 5 - Dark indigo (blue-purple)
  "bg-purple-800 border-purple-700 text-blue-50", // 6 - Dark purple (blue-purple)
  "bg-violet-800 border-violet-700 text-blue-50", // 7 - Dark violet (blue-purple)
  "bg-sky-800 border-sky-700 text-blue-50", // 8 - Dark sky blue
  "bg-blue-900 border-blue-800 text-blue-50" // 9 - Very dark blue
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