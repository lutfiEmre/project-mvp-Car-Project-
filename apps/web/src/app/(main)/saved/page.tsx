'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { 
  Heart, 
  Trash2, 
  MapPin, 
  Fuel, 
  Gauge, 
  Calendar,
  ExternalLink,
  Search,
  ArrowLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const savedVehicles = [
  {
    id: '1',
    title: '2023 BMW M4 Competition',
    price: 89900,
    location: 'Toronto, ON',
    mileage: 12500,
    fuelType: 'Gasoline',
    year: 2023,
    slug: '2023-bmw-m4-competition',
  },
  {
    id: '2',
    title: '2024 Mercedes-Benz C300',
    price: 62500,
    location: 'Vancouver, BC',
    mileage: 5200,
    fuelType: 'Gasoline',
    year: 2024,
    slug: '2024-mercedes-benz-c300',
  },
  {
    id: '3',
    title: '2023 Tesla Model 3 Long Range',
    price: 54990,
    location: 'Calgary, AB',
    mileage: 18000,
    fuelType: 'Electric',
    year: 2023,
    slug: '2023-tesla-model-3-long-range',
  },
];

export default function SavedPage() {
  const [vehicles, setVehicles] = useState(savedVehicles);
  const [searchTerm, setSearchTerm] = useState('');

  const removeVehicle = (id: string) => {
    setVehicles(vehicles.filter((v) => v.id !== id));
  };

  const filteredVehicles = vehicles.filter((v) =>
    v.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
          <h1 className="font-display text-3xl font-bold">Saved Vehicles</h1>
          <p className="text-muted-foreground mt-1">
            {vehicles.length} vehicles saved
          </p>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search saved vehicles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select defaultValue="recent">
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Recently Saved</SelectItem>
              <SelectItem value="price-low">Price: Low to High</SelectItem>
              <SelectItem value="price-high">Price: High to Low</SelectItem>
              <SelectItem value="year">Newest Year</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {filteredVehicles.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border bg-card p-12 text-center"
          >
            <Heart className="mx-auto h-16 w-16 text-muted-foreground/30" />
            <h3 className="mt-4 font-display text-xl font-semibold">
              No saved vehicles yet
            </h3>
            <p className="mt-2 text-muted-foreground max-w-md mx-auto">
              Start browsing and click the heart icon on vehicles you like to save them here.
            </p>
            <Link href="/search">
              <Button className="mt-6" size="lg">
                Browse Vehicles
              </Button>
            </Link>
          </motion.div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredVehicles.map((vehicle, index) => (
              <motion.div
                key={vehicle.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="group overflow-hidden rounded-xl border bg-card shadow-sm transition-all hover:shadow-lg"
              >
                <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
                  <img
                    src={(vehicle as any).media?.[0]?.url || (vehicle as any).image || '/placeholder-car.jpg'}
                    alt={vehicle.title}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      if (target.src !== '/placeholder-car.jpg') {
                        target.src = '/placeholder-car.jpg';
                      }
                    }}
                  />
                  <button
                    onClick={() => removeVehicle(vehicle.id)}
                    className="absolute right-3 top-3 rounded-full bg-white/90 p-2 shadow-md transition-all hover:bg-red-50 hover:scale-110"
                  >
                    <Heart className="h-5 w-5 fill-red-500 text-red-500" />
                  </button>
                </div>

                <div className="p-5">
                  <Link href={`/vehicles/${vehicle.slug}`}>
                    <h3 className="font-display text-lg font-semibold hover:text-primary transition-colors line-clamp-1">
                      {vehicle.title}
                    </h3>
                  </Link>
                  <p className="text-2xl font-bold text-primary mt-2">
                    ${vehicle.price.toLocaleString()}
                  </p>

                  <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 shrink-0" />
                      <span className="truncate">{vehicle.location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Gauge className="h-4 w-4 shrink-0" />
                      {vehicle.mileage.toLocaleString()} km
                    </div>
                    <div className="flex items-center gap-2">
                      <Fuel className="h-4 w-4 shrink-0" />
                      {vehicle.fuelType}
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 shrink-0" />
                      {vehicle.year}
                    </div>
                  </div>

                  <div className="mt-5 flex gap-2">
                    <Link href={`/vehicles/${vehicle.slug}`} className="flex-1">
                      <Button className="w-full gap-2">
                        <ExternalLink className="h-4 w-4" />
                        View Details
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="icon"
                      className="text-muted-foreground hover:text-red-500 hover:border-red-200"
                      onClick={() => removeVehicle(vehicle.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

