'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function useVehicleMakes(popular?: boolean) {
  return useQuery({
    queryKey: ['vehicle-makes', popular],
    queryFn: () => api.vehicleData.getMakes(popular),
    staleTime: 1000 * 60 * 60,
  });
}

export function useVehicleModels(makeId: string) {
  return useQuery({
    queryKey: ['vehicle-models', makeId],
    queryFn: () => api.vehicleData.getModels(makeId),
    enabled: !!makeId,
    staleTime: 1000 * 60 * 60,
  });
}

export function useBodyTypes() {
  return useQuery({
    queryKey: ['body-types'],
    queryFn: () => api.vehicleData.getBodyTypes(),
    staleTime: 1000 * 60 * 60 * 24,
  });
}

export function useFuelTypes() {
  return useQuery({
    queryKey: ['fuel-types'],
    queryFn: () => api.vehicleData.getFuelTypes(),
    staleTime: 1000 * 60 * 60 * 24,
  });
}

export function useTransmissionTypes() {
  return useQuery({
    queryKey: ['transmission-types'],
    queryFn: () => api.vehicleData.getTransmissionTypes(),
    staleTime: 1000 * 60 * 60 * 24,
  });
}

export function useDriveTypes() {
  return useQuery({
    queryKey: ['drive-types'],
    queryFn: () => api.vehicleData.getDriveTypes(),
    staleTime: 1000 * 60 * 60 * 24,
  });
}

export function useYears() {
  return useQuery({
    queryKey: ['years'],
    queryFn: () => api.vehicleData.getYears(),
    staleTime: 1000 * 60 * 60 * 24,
  });
}

