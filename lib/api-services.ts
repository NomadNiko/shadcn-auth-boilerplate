"use client";

import api from './api';
import { API_URL } from './config';

// API endpoints - Updated to match actual backend structure
const SHIFT_TYPES_URL = `${API_URL}/api/v1/shift-types`;
const SCHEDULES_URL = `${API_URL}/api/v1/schedules`;
const EMPLOYEES_URL = `${API_URL}/api/v1/employees/all`;
const USERS_URL = `${API_URL}/api/v1/auth/me`;
const ADMIN_USERS_URL = `${API_URL}/api/v1/users`;
const INVITE_URL = `${API_URL}/api/v1/auth/invite`;

// Types matching backend DTOs
export interface ShiftTypeDto {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  colorIndex: number;
  isActive: boolean;
}

export interface ScheduleDto {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: 'draft' | 'published';
  totalShifts: number;
  assignedShifts: number;
}

export interface ScheduleShiftDto {
  id: string;
  scheduleId: string;
  shiftTypeId: string;
  date: string;
  order: number;
  userId?: string;
  shiftType: ShiftTypeDto;
  user?: { id: string; firstName: string; lastName: string; role: { id: number } }; // User type
}

export interface CreateShiftTypeDto {
  name: string;
  startTime: string;
  endTime: string;
  colorIndex: number;
}

export interface CreateScheduleDto {
  name: string;
  startDate: string;
  endDate: string;
}

export interface CreateScheduleShiftDto {
  scheduleId: string;
  shiftTypeId: string;
  date: string;
  order: number;
  userId?: string;
}

export interface UpdateScheduleShiftDto {
  userId?: string;
  order?: number;
  date?: string;
}

export interface UpdateShiftTimesDto {
  actualStartTime?: string;
  actualEndTime?: string;
}

// User Management Types
export interface UserDto {
  _id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: {
    _id: string;
    id: string;
  };
  status: {
    _id: string;
    id: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserDto {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  role?: string | { id: string; _id: string };
}

export interface UpdateUserDto {
  firstName?: string;
  lastName?: string;
  role?: string | { id: string; _id: string };
  status?: string | { id: string; _id: string };
}

export interface InviteUserDto {
  email: string;
  firstName?: string;
  lastName?: string;
  role?: string;
}

// Bulk Operations Types
export enum BulkOperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
}

export interface BulkCreateOperationDto {
  type: BulkOperationType.CREATE;
  data: {
    shiftTypeId: string;
    date: string;
    order?: number;
    userId?: string;
  };
  clientId?: string;
}

export interface BulkUpdateOperationDto {
  type: BulkOperationType.UPDATE;
  id: string;
  data: UpdateScheduleShiftDto;
  clientId?: string;
}

export interface BulkDeleteOperationDto {
  type: BulkOperationType.DELETE;
  id: string;
  clientId?: string;
}

export type BulkOperationDto = BulkCreateOperationDto | BulkUpdateOperationDto | BulkDeleteOperationDto;

export interface BulkOperationsDto {
  operations: BulkOperationDto[];
}

export interface BulkOperationResultDto {
  type: BulkOperationType;
  success: boolean;
  clientId?: string;
  id?: string;
  error?: string;
  data?: ScheduleShiftDto;
}

export interface BulkOperationsResponseDto {
  results: BulkOperationResultDto[];
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  allSuccessful: boolean;
}

// Shift Types API
export const shiftTypesApi = {
  getAll: async (): Promise<ShiftTypeDto[]> => {
    const response = await api.get(SHIFT_TYPES_URL);
    return response.data;
  },

  getById: async (id: string): Promise<ShiftTypeDto> => {
    const response = await api.get(`${SHIFT_TYPES_URL}/${id}`);
    return response.data;
  },

  create: async (data: CreateShiftTypeDto): Promise<ShiftTypeDto> => {
    const response = await api.post(SHIFT_TYPES_URL, data);
    return response.data;
  },

  update: async (id: string, data: Partial<CreateShiftTypeDto>): Promise<ShiftTypeDto> => {
    const response = await api.patch(`${SHIFT_TYPES_URL}/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`${SHIFT_TYPES_URL}/${id}`);
  }
};

// Schedules API
export const schedulesApi = {
  getAll: async (params?: { status?: string; page?: number; limit?: number }): Promise<ScheduleDto[]> => {
    const response = await api.get(SCHEDULES_URL, { params });
    return response.data;
  },

  getById: async (id: string): Promise<ScheduleDto> => {
    const response = await api.get(`${SCHEDULES_URL}/${id}`);
    return response.data;
  },

  create: async (data: CreateScheduleDto): Promise<ScheduleDto> => {
    const response = await api.post(SCHEDULES_URL, data);
    return response.data;
  },

  update: async (id: string, data: Partial<CreateScheduleDto>): Promise<ScheduleDto> => {
    const response = await api.patch(`${SCHEDULES_URL}/${id}`, data);
    return response.data;
  },

  publish: async (id: string): Promise<ScheduleDto> => {
    const response = await api.patch(`${SCHEDULES_URL}/${id}/publish`);
    return response.data;
  },

  unpublish: async (id: string): Promise<ScheduleDto> => {
    // Try to update the status back to draft using the general update endpoint
    const response = await api.patch(`${SCHEDULES_URL}/${id}`, { status: 'draft' });
    return response.data;
  },

  copyPrevious: async (id: string, sourceScheduleId: string): Promise<ScheduleDto> => {
    const response = await api.post(`${SCHEDULES_URL}/${id}/copy-previous`, {
      sourceScheduleId
    });
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`${SCHEDULES_URL}/${id}`);
  }
};

// Schedule Shifts API - Updated to match actual backend nested structure
export const scheduleShiftsApi = {
  getBySchedule: async (scheduleId: string): Promise<{shifts: ScheduleShiftDto[], unassignedShifts: ScheduleShiftDto[]}> => {
    const response = await api.get(`${SCHEDULES_URL}/${scheduleId}/shifts`);
    
    // Backend returns { shifts: [...], unassignedShifts: [...] }
    if (response.data && typeof response.data === 'object' && 
        Array.isArray(response.data.shifts) && Array.isArray(response.data.unassignedShifts)) {
      return {
        shifts: response.data.shifts,
        unassignedShifts: response.data.unassignedShifts
      };
    }
    
    // Fallback for unexpected format
    console.warn('Unexpected shifts response format:', response.data);
    return { shifts: [], unassignedShifts: [] };
  },

  getById: async (scheduleId: string, id: string): Promise<ScheduleShiftDto> => {
    const response = await api.get(`${SCHEDULES_URL}/${scheduleId}/shifts/${id}`);
    return response.data;
  },

  create: async (scheduleId: string, data: Omit<CreateScheduleShiftDto, 'scheduleId'>): Promise<ScheduleShiftDto> => {
    const response = await api.post(`${SCHEDULES_URL}/${scheduleId}/shifts`, data);
    return response.data;
  },

  update: async (scheduleId: string, id: string, data: UpdateScheduleShiftDto): Promise<ScheduleShiftDto> => {
    const response = await api.patch(`${SCHEDULES_URL}/${scheduleId}/shifts/${id}`, data);
    return response.data;
  },

  updateTimes: async (scheduleId: string, id: string, data: UpdateShiftTimesDto): Promise<ScheduleShiftDto> => {
    const response = await api.patch(`${SCHEDULES_URL}/${scheduleId}/shifts/${id}/times`, data);
    return response.data;
  },

  delete: async (scheduleId: string, id: string): Promise<void> => {
    await api.delete(`${SCHEDULES_URL}/${scheduleId}/shifts/${id}`);
  },

  copyPrevious: async (scheduleId: string): Promise<{
    message: string, 
    count: number,
    shiftsToCreate: Array<{shiftTypeId: string, date: string, order: number}>,
    sourceScheduleName: string
  }> => {
    const response = await api.post(`${SCHEDULES_URL}/${scheduleId}/shifts/copy-previous`);
    return response.data;
  },

  bulkOperations: async (scheduleId: string, data: BulkOperationsDto): Promise<BulkOperationsResponseDto> => {
    const response = await api.post(`${SCHEDULES_URL}/${scheduleId}/shifts/bulk`, data);
    return response.data;
  }
};

// Users API 
export const usersApi = {
  getMe: async () => {
    const response = await api.get(USERS_URL);
    return response.data;
  },

  getAllEmployees: async () => {
    const response = await api.get(EMPLOYEES_URL);
    return response.data;
  },

  // Admin user management
  getAll: async (): Promise<UserDto[]> => {
    const response = await api.get(ADMIN_USERS_URL, {
      params: { limit: 1000 } // Request large limit to get all users
    });
    
    // Handle paginated response format: { data: UserDto[], hasNextPage: boolean }
    if (response.data && Array.isArray(response.data.data)) {
      return response.data.data;
    }
    
    // Fallback: if it's already an array, return it directly
    if (Array.isArray(response.data)) {
      return response.data;
    }
    
    // Return empty array for unexpected formats
    return [];
  },

  getById: async (id: string): Promise<UserDto> => {
    const response = await api.get(`${ADMIN_USERS_URL}/${id}`);
    return response.data;
  },

  create: async (data: CreateUserDto): Promise<UserDto> => {
    const response = await api.post(ADMIN_USERS_URL, data);
    return response.data;
  },

  update: async (id: string, data: UpdateUserDto): Promise<UserDto> => {
    const response = await api.patch(`${ADMIN_USERS_URL}/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`${ADMIN_USERS_URL}/${id}`);
  },

  invite: async (data: InviteUserDto): Promise<{ message: string; user: UserDto }> => {
    const response = await api.post(INVITE_URL, data);
    return response.data;
  }
};