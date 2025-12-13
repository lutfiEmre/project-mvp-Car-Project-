// Shared mock vehicles store - allows editing across pages
let mockVehiclesStore: Record<string, any> = {};

// Initialize with default mock data
export const initializeMockVehicles = (vehicles: Record<string, any>) => {
  mockVehiclesStore = { ...vehicles };
};

// Get all vehicles
export const getMockVehicles = (): Record<string, any> => {
  return mockVehiclesStore;
};

// Get vehicle by slug
export const getMockVehicleBySlug = (slug: string): any => {
  return mockVehiclesStore[slug] || null;
};

// Update vehicle
export const updateMockVehicle = (slug: string, data: any) => {
  if (mockVehiclesStore[slug]) {
    mockVehiclesStore[slug] = { ...mockVehiclesStore[slug], ...data };
    // Also update in localStorage for persistence
    if (typeof window !== 'undefined') {
      localStorage.setItem('mockVehicles', JSON.stringify(mockVehiclesStore));
      // Trigger storage event for other tabs/pages
      window.dispatchEvent(new Event('storage'));
    }
  } else {
    // If vehicle doesn't exist in store, add it
    mockVehiclesStore[slug] = { ...data, slug };
    if (typeof window !== 'undefined') {
      localStorage.setItem('mockVehicles', JSON.stringify(mockVehiclesStore));
      window.dispatchEvent(new Event('storage'));
    }
  }
};

// Get vehicles as array
export const getMockVehiclesArray = (): any[] => {
  return Object.values(mockVehiclesStore);
};

// Load from localStorage on init
if (typeof window !== 'undefined') {
  const stored = localStorage.getItem('mockVehicles');
  if (stored) {
    try {
      mockVehiclesStore = JSON.parse(stored);
    } catch (e) {
      console.error('Failed to load mock vehicles from localStorage:', e);
    }
  }
}

