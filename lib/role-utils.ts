/**
 * Role utility functions for handling user permissions
 */

import type { User } from '@/types/auth';

export const USER_ROLES = {
  ADMIN: '1',
  USER: '2'
} as const;

export const USER_STATUS = {
  ACTIVE: '1',
  INACTIVE: '2'
} as const;

/**
 * Check if a user has admin role
 */
export function isAdmin(user: User | null | undefined): boolean {
  const roleId = user?.role?._id || user?.role?.id;
  return roleId === USER_ROLES.ADMIN;
}

/**
 * Check if a user is active
 */
export function isActiveUser(user: User | null | undefined): boolean {
  const statusId = user?.status?._id || user?.status?.id;
  return statusId === USER_STATUS.ACTIVE;
}

/**
 * Get user role name
 */
export function getRoleName(user: User | null | undefined): string {
  const roleId = user?.role?._id || user?.role?.id;
  if (!roleId) return 'Unknown';
  return roleId === USER_ROLES.ADMIN ? 'Admin' : 'User';
}

/**
 * Get user status name
 */
export function getStatusName(user: User | null | undefined): string {
  const statusId = user?.status?._id || user?.status?.id;
  if (!statusId) return 'Unknown';
  return statusId === USER_STATUS.ACTIVE ? 'Active' : 'Inactive';
}

/**
 * Get user display name
 */
export function getUserDisplayName(user: User | null | undefined): string {
  if (!user) return 'Unknown User';
  
  const firstName = user.firstName?.trim();
  const lastName = user.lastName?.trim();
  
  if (firstName && lastName) {
    return `${firstName} ${lastName}`;
  } else if (firstName) {
    return firstName;
  } else if (lastName) {
    return lastName;
  } else {
    return user.email || 'Unknown User';
  }
}

/**
 * Check if user can manage other users (admin only)
 */
export function canManageUsers(user: User | null | undefined): boolean {
  return isAdmin(user) && isActiveUser(user);
}