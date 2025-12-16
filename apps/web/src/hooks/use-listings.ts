'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { SearchFilters, Listing } from '@carhaus/types';

export function useListings(filters?: SearchFilters) {
  return useQuery({
    queryKey: ['listings', filters],
    queryFn: () => api.listings.search(filters),
    staleTime: 1000 * 60 * 2, // 2 minutes - listings can change frequently
    gcTime: 1000 * 60 * 10, // 10 minutes cache
  });
}

export function useListing(slug: string) {
  return useQuery({
    queryKey: ['listing', slug],
    queryFn: () => api.listings.getBySlug(slug),
    enabled: !!slug,
    staleTime: 1000 * 60 * 5, // 5 minutes - individual listings change less frequently
    gcTime: 1000 * 60 * 30, // 30 minutes cache
  });
}

export function useFeaturedListings(limit = 8) {
  return useQuery({
    queryKey: ['listings', 'featured', limit],
    queryFn: () => api.listings.getFeatured(limit),
    staleTime: 1000 * 60 * 10, // 10 minutes - featured listings change less frequently
    gcTime: 1000 * 60 * 30, // 30 minutes cache
  });
}

export function useMyListings(params?: { status?: string; page?: number }) {
  return useQuery({
    queryKey: ['my-listings', params],
    queryFn: () => api.listings.getMyListings(params),
    staleTime: 1000 * 30, // 30 seconds - user's own listings should be fresh
    gcTime: 1000 * 60 * 5, // 5 minutes cache
  });
}

export function useSavedListings() {
  return useQuery({
    queryKey: ['saved-listings'],
    queryFn: () => api.listings.getSaved(),
    staleTime: 1000 * 60, // 1 minute - saved listings should be relatively fresh
    gcTime: 1000 * 60 * 10, // 10 minutes cache
  });
}

export function useCreateListing() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<Listing>) => api.listings.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-listings'] });
    },
  });
}

export function useUpdateListing() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Listing> }) =>
      api.listings.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['listing', id] });
      queryClient.invalidateQueries({ queryKey: ['my-listings'] });
    },
  });
}

export function useDeleteListing() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.listings.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-listings'] });
    },
  });
}

export function useSaveListing() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.listings.save(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-listings'] });
    },
  });
}

export function useUnsaveListing() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.listings.unsave(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-listings'] });
    },
  });
}

