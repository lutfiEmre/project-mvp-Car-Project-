'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
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
  SlidersHorizontal
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
    image: 'https://images.unsplash.com/photo-1617531653332-bd46c24f2068?w=800',
    location: 'Toronto, ON',
    mileage: 12500,
    fuelType: 'Gasoline',
    year: 2023,
    slug: '2023-bmw-m4-competition',
    savedAt: '2024-01-15',
  },
  {
    id: '2',
    title: '2024 Mercedes-Benz C300',
    price: 62500,
    image: 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=800',
    location: 'Vancouver, BC',
    mileage: 5200,
    fuelType: 'Gasoline',
    year: 2024,
    slug: '2024-mercedes-benz-c300',
    savedAt: '2024-01-10',
  },
  {
    id: '3',
    title: '2023 Tesla Model 3 Long Range',
    price: 54990,
    image: 'https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=800',
    location: 'Calgary, AB',
    mileage: 18000,
    fuelType: 'Electric',
    year: 2023,
    slug: '2023-tesla-model-3-long-range',
    savedAt: '2024-01-05',
  },
];

export default function SavedVehiclesPage() {
  const [vehicles, setVehicles] = useState(savedVehicles);
  const [searchTerm, setSearchTerm] = useState('');

  const removeVehicle = (id: string) => {
    setVehicles(vehicles.filter((v) => v.id !== id));
  };

  const filteredVehicles = vehicles.filter((v) =>
    v.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold">Saved Vehicles</h1>
        <p className="text-muted-foreground">
          Your favorite vehicles in one place
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
        <div className="flex gap-2">
          <Select defaultValue="recent">
            <SelectTrigger className="w-[160px]">
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
      </div>

      {filteredVehicles.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border bg-card p-12 text-center"
        >
          <Heart className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 font-display text-lg font-semibold">
            No saved vehicles
          </h3>
          <p className="mt-2 text-muted-foreground">
            Start browsing and save vehicles you are interested in.
          </p>
          <Link href="/search">
            <Button className="mt-6">Browse Vehicles</Button>
          </Link>
        </motion.div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
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
                  src={vehicle.image || '/placeholder-car.jpg'}
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
                  className="absolute right-3 top-3 rounded-full bg-white/90 p-2 shadow-md transition-colors hover:bg-red-50"
                >
                  <Heart className="h-5 w-5 fill-red-500 text-red-500" />
                </button>
              </div>

              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <Link href={`/vehicles/${vehicle.slug}`}>
                      <h3 className="font-display font-semibold hover:text-primary transition-colors">
                        {vehicle.title}
                      </h3>
                    </Link>
                    <p className="text-xl font-bold text-primary mt-1">
                      ${vehicle.price.toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {vehicle.location}
                  </div>
                  <div className="flex items-center gap-1">
                    <Gauge className="h-4 w-4" />
                    {vehicle.mileage.toLocaleString()} km
                  </div>
                  <div className="flex items-center gap-1">
                    <Fuel className="h-4 w-4" />
                    {vehicle.fuelType}
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {vehicle.year}
                  </div>
                </div>

                <div className="mt-4 flex gap-2">
                  <Link href={`/vehicles/${vehicle.slug}`} className="flex-1">
                    <Button variant="outline" className="w-full gap-2">
                      <ExternalLink className="h-4 w-4" />
                      View Details
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-red-500"
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
  );
}

