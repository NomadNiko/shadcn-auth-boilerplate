"use client";

import { useState, useEffect } from 'react';
import { usersApi } from '@/lib/api-services';
import type { Employee } from '@/types/schedule';

// Convert backend user data to frontend Employee type
const convertUserToEmployee = (user: any): Employee => ({
  id: user._id || user.id,
  _id: user._id,
  firstName: user.firstName || '',
  lastName: user.lastName || '',
  role: typeof user.role === 'string' ? user.role : (user.role?.name || 'Employee'),
  email: user.email,
});

export const useEmployees = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadEmployees = async () => {
    try {
      setLoading(true);
      const data = await usersApi.getAllEmployees();
      const convertedEmployees = data.map(convertUserToEmployee);
      setEmployees(convertedEmployees);
      setError(null);
    } catch (err) {
      console.error('Failed to load employees:', err);
      setError('Failed to load employees');
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEmployees();
  }, []);

  return {
    employees,
    loading,
    error,
    refreshEmployees: loadEmployees
  };
};