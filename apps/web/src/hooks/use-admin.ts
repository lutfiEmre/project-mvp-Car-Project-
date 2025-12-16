'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function useAdminDashboard() {
  return useQuery({
    queryKey: ['admin', 'dashboard'],
    queryFn: () => api.admin.getDashboard(),
    staleTime: 1000 * 30, // 30 seconds - dashboard stats should be fresh
    gcTime: 1000 * 60 * 5, // 5 minutes cache
  });
}

export function usePendingListings(params?: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: ['admin', 'pending-listings', params],
    queryFn: () => api.admin.getPendingListings(params),
    staleTime: 1000 * 30, // 30 seconds - pending listings need to be fresh
    gcTime: 1000 * 60 * 2, // 2 minutes cache
  });
}

export function useAdminUsers(params?: { page?: number; limit?: number; role?: string }) {
  return useQuery({
    queryKey: ['admin', 'users', params],
    queryFn: () => api.admin.getUsers(params),
  });
}

export function useAdminDealers(params?: { page?: number; limit?: number; verified?: boolean }) {
  return useQuery({
    queryKey: ['admin', 'dealers', params],
    queryFn: () => api.admin.getDealers(params),
  });
}

export function usePendingDealers(params?: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: ['admin', 'pending-dealers', params],
    queryFn: () => api.admin.getPendingDealers(params),
    staleTime: 1000 * 30, // 30 seconds - pending dealers need to be fresh
    gcTime: 1000 * 60 * 2, // 2 minutes cache
  });
}

export function useAdminListings(params?: { page?: number; limit?: number; status?: string }) {
  return useQuery({
    queryKey: ['admin', 'listings', params],
    queryFn: () => api.admin.getAllListings(params),
  });
}

export function useAdminAnalytics(days?: number) {
  return useQuery({
    queryKey: ['admin', 'analytics', days],
    queryFn: () => api.admin.getAnalytics(days),
  });
}

export function useAdminSettings() {
  return useQuery({
    queryKey: ['admin', 'settings'],
    queryFn: () => api.admin.getSettings(),
  });
}

export function useApproveListing() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.admin.approveListing(id),
    onSuccess: () => {
      // Invalidate all related queries with broader patterns
      queryClient.invalidateQueries({ queryKey: ['admin', 'pending-listings'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'listings'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
      // Invalidate dealer inventory and my listings caches (with any params)
      queryClient.invalidateQueries({ queryKey: ['my-listings'] });
      queryClient.invalidateQueries({ queryKey: ['dealer', 'inventory'] });
      queryClient.invalidateQueries({ queryKey: ['listings'] }); // For admin listings search
      // Force refetch
      queryClient.refetchQueries({ queryKey: ['admin', 'listings'] });
      queryClient.refetchQueries({ queryKey: ['dealer', 'inventory'] });
    },
  });
}

export function useRejectListing() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) => api.admin.rejectListing(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'pending-listings'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'listings'] });
    },
  });
}

export function useDeleteListing() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.admin.deleteListing(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'listings'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
    },
  });
}

export function useUpdateUserStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => api.admin.updateUserStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
  });
}

export function useVerifyDealer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.admin.verifyDealer(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'dealers'] });
    },
  });
}

export function useSuspendDealer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.admin.suspendDealer(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'dealers'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
  });
}

export function useUpdateSetting() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ key, value }: { key: string; value: any }) => api.admin.updateSetting(key, value),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'settings'] });
    },
  });
}

export function useActivityLogs(params?: { 
  page?: number; 
  limit?: number; 
  userId?: string; 
  action?: string; 
  entity?: string; 
  startDate?: string; 
  endDate?: string;
}) {
  return useQuery({
    queryKey: ['admin', 'activity-logs', params],
    queryFn: () => api.admin.getActivityLogs(params),
  });
}

