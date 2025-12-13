'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function useDealers(params?: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: ['dealers', params],
    queryFn: () => api.dealers.getAll(params),
    staleTime: 1000 * 60 * 5, // 5 minutes - dealer list changes less frequently
    gcTime: 1000 * 60 * 30, // 30 minutes cache
  });
}

export function useDealer(id: string) {
  return useQuery({
    queryKey: ['dealer', id],
    queryFn: () => api.dealers.getById(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 10, // 10 minutes - dealer profile changes infrequently
    gcTime: 1000 * 60 * 60, // 1 hour cache
  });
}

export function useDealerBySlug(slug: string) {
  return useQuery({
    queryKey: ['dealer', 'slug', slug],
    queryFn: () => api.dealers.getBySlug(slug),
    enabled: !!slug,
    staleTime: 1000 * 60 * 10, // 10 minutes
    gcTime: 1000 * 60 * 60, // 1 hour cache
  });
}

export function useDealerListings(dealerId: string, params?: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: ['dealer', dealerId, 'listings', params],
    queryFn: () => api.dealers.getListings(dealerId, params),
    enabled: !!dealerId,
    staleTime: 1000 * 60 * 2, // 2 minutes - dealer listings can change
    gcTime: 1000 * 60 * 10, // 10 minutes cache
  });
}

export function useDealerInventory(params?: { status?: string; page?: number }) {
  return useQuery({
    queryKey: ['dealer', 'inventory', params],
    queryFn: () => api.listings.getMyListings(params),
    staleTime: 1000 * 30, // 30 seconds - dealer's own inventory should be fresh
    gcTime: 1000 * 60 * 5, // 5 minutes cache
  });
}

