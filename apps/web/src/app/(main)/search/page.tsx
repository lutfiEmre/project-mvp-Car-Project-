'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  SlidersHorizontal, 
  X, 
  Grid3X3,
  List,
  MapPin,
  Loader2,
  ChevronDown,
  ChevronUp,
  RotateCcw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { VehicleCard } from '@/components/vehicles/vehicle-card';
import { useListings } from '@/hooks/use-listings';
import type { Listing } from '@carhaus/types';
import { formatNumber } from '@/lib/utils';

// No fallback listings - only show API data
const fallbackListings: Listing[] = [];

const makes = ['All Makes', 'Toyota', 'Honda', 'Ford', 'BMW', 'Mercedes-Benz', 'Audi', 'Tesla', 'Chevrolet', 'Nissan', 'Porsche', 'Kia', 'Volkswagen', 'Hyundai'];
const bodyTypes = ['All Types', 'SUV', 'Sedan', 'Truck', 'Coupe', 'Hatchback', 'Convertible'];
const fuelTypes = ['Gasoline', 'Diesel', 'Electric', 'Hybrid', 'Plug-in Hybrid'];
const years = Array.from({ length: 15 }, (_, i) => 2024 - i);

// Filter Sidebar Component
function FilterSidebar({ 
  selectedMake, 
  setSelectedMake,
  selectedBody,
  setSelectedBody,
  priceRange,
  setPriceRange,
  selectedFuelTypes,
  setSelectedFuelTypes,
  selectedYear,
  setSelectedYear,
  onApply,
  onClear,
  isMobile = false,
}: {
  selectedMake: string;
  setSelectedMake: (v: string) => void;
  selectedBody: string;
  setSelectedBody: (v: string) => void;
  priceRange: number[];
  setPriceRange: (v: number[]) => void;
  selectedFuelTypes: string[];
  setSelectedFuelTypes: (v: string[]) => void;
  selectedYear: string;
  setSelectedYear: (v: string) => void;
  onApply: () => void;
  onClear: () => void;
  isMobile?: boolean;
}) {
  const [openSections, setOpenSections] = useState({
    make: true,
    body: true,
    price: true,
    fuel: false,
    year: false,
  });

  const toggleSection = (key: keyof typeof openSections) => {
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleFuelType = (fuel: string) => {
    if (selectedFuelTypes.includes(fuel)) {
      setSelectedFuelTypes(selectedFuelTypes.filter(f => f !== fuel));
    } else {
      setSelectedFuelTypes([...selectedFuelTypes, fuel]);
    }
  };

  return (
    <div className={`space-y-1 ${isMobile ? '' : 'pr-2'}`}>
      {/* Make */}
      <Collapsible open={openSections.make} onOpenChange={() => toggleSection('make')}>
        <CollapsibleTrigger className="flex w-full items-center justify-between py-3 text-sm font-semibold hover:text-primary transition-colors">
          Make
          {openSections.make ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </CollapsibleTrigger>
        <CollapsibleContent className="pb-4">
          <Select value={selectedMake} onValueChange={setSelectedMake}>
            <SelectTrigger className="h-10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {makes.map((make) => (
                <SelectItem key={make} value={make}>{make}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CollapsibleContent>
      </Collapsible>

      <Separator />

      {/* Body Type */}
      <Collapsible open={openSections.body} onOpenChange={() => toggleSection('body')}>
        <CollapsibleTrigger className="flex w-full items-center justify-between py-3 text-sm font-semibold hover:text-primary transition-colors">
          Body Type
          {openSections.body ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </CollapsibleTrigger>
        <CollapsibleContent className="pb-4">
          <div className="grid grid-cols-2 gap-2">
            {bodyTypes.map((type) => (
              <button
                key={type}
                onClick={() => setSelectedBody(type)}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                  selectedBody === type
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {type === 'All Types' ? 'All' : type}
              </button>
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>

      <Separator />

      {/* Price Range */}
      <Collapsible open={openSections.price} onOpenChange={() => toggleSection('price')}>
        <CollapsibleTrigger className="flex w-full items-center justify-between py-3 text-sm font-semibold hover:text-primary transition-colors">
          Price Range
          {openSections.price ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </CollapsibleTrigger>
        <CollapsibleContent className="pb-4 -mt-2  space-y-4">
          <Slider
          className='mt-2'
            value={priceRange}
            onValueChange={setPriceRange}
            min={0}
            max={200000}
            step={5000}
          />
          <div className="flex items-center justify-between">
            <div className="rounded-lg bg-slate-100 dark:bg-slate-800 px-3 py-2">
              <span className="text-xs text-muted-foreground">Min</span>
              <p className="font-semibold">${formatNumber(priceRange[0])}</p>
            </div>
            <div className="h-px w-4 bg-slate-300" />
            <div className="rounded-lg bg-slate-100 dark:bg-slate-800 px-3 py-2 text-right">
              <span className="text-xs text-muted-foreground">Max</span>
              <p className="font-semibold">${formatNumber(priceRange[1])}</p>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      <Separator />

      {/* Fuel Type */}
      <Collapsible open={openSections.fuel} onOpenChange={() => toggleSection('fuel')}>
        <CollapsibleTrigger className="flex w-full items-center justify-between py-3 text-sm font-semibold hover:text-primary transition-colors">
          Fuel Type
          {openSections.fuel ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </CollapsibleTrigger>
        <CollapsibleContent className="pb-4">
          <div className="space-y-2">
            {fuelTypes.map((fuel) => (
              <label key={fuel} className="flex items-center gap-3 cursor-pointer group">
                <input 
                  type="checkbox" 
                  checked={selectedFuelTypes.includes(fuel)}
                  onChange={() => toggleFuelType(fuel)}
                  className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
                />
                <span className="text-sm group-hover:text-primary transition-colors">{fuel}</span>
              </label>
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>

      <Separator />

      {/* Year */}
      <Collapsible open={openSections.year} onOpenChange={() => toggleSection('year')}>
        <CollapsibleTrigger className="flex w-full items-center justify-between py-3 text-sm font-semibold hover:text-primary transition-colors">
          Year
          {openSections.year ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </CollapsibleTrigger>
        <CollapsibleContent className="pb-4">
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="h-10">
              <SelectValue placeholder="Any Year" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any Year</SelectItem>
              {years.map((year) => (
                <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CollapsibleContent>
      </Collapsible>

      <Separator />

      {/* Location */}
      <div className="py-3">
        <p className="text-sm font-semibold mb-3">Location</p>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="City or Postal Code" className="pl-9 h-10" />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="pt-4 space-y-2">
        <Button className="w-full" onClick={onApply}>
          Apply Filters
        </Button>
        <Button variant="outline" className="w-full gap-2" onClick={onClear}>
          <RotateCcw className="h-4 w-4" />
          Clear All
        </Button>
      </div>
    </div>
  );
}

function SearchPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Read filters from URL
  const urlMake = searchParams.get('make') || 'All Makes';
  const urlBody = searchParams.get('bodyType') || 'All Types';
  const urlMinPrice = parseInt(searchParams.get('minPrice') || '0');
  const urlMaxPrice = parseInt(searchParams.get('maxPrice') || '200000');
  const urlSort = searchParams.get('sort') || 'newest';
  const urlSearch = searchParams.get('q') || '';
  const urlPage = parseInt(searchParams.get('page') || '1');
  const urlYear = searchParams.get('year') || 'all';
  const urlFuelType = searchParams.get('fuelType') || '';
  
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [priceRange, setPriceRange] = useState([urlMinPrice, urlMaxPrice]);
  const [selectedMake, setSelectedMake] = useState(urlMake);
  const [selectedBody, setSelectedBody] = useState(urlBody);
  const [selectedFuelTypes, setSelectedFuelTypes] = useState<string[]>(urlFuelType ? [urlFuelType] : []);
  const [selectedYear, setSelectedYear] = useState(urlYear);
  const [sortBy, setSortBy] = useState(urlSort);
  const [searchQuery, setSearchQuery] = useState(urlSearch);
  const [currentPage, setCurrentPage] = useState(urlPage);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Build filters for API
  const filters = useMemo(() => {
    const apiFilters: any = {
      skip: (currentPage - 1) * 9,
      take: 9,
    };
    
    if (selectedMake !== 'All Makes') {
      apiFilters.make = selectedMake;
    }
    
    if (selectedBody !== 'All Types') {
      apiFilters.bodyType = selectedBody.toUpperCase();
    }
    
    if (priceRange[0] > 0) {
      apiFilters.priceMin = priceRange[0];
    }
    
    if (priceRange[1] < 200000) {
      apiFilters.priceMax = priceRange[1];
    }
    
    if (selectedYear !== 'all') {
      const year = parseInt(selectedYear);
      apiFilters.yearMin = year;
      apiFilters.yearMax = year;
    }
    
    if (selectedFuelTypes.length > 0) {
      apiFilters.fuelType = selectedFuelTypes[0].toUpperCase();
    }
    
    // Map sort values to API format
    if (sortBy === 'price_asc') {
      apiFilters.sortBy = 'price';
      apiFilters.sortOrder = 'asc';
    } else if (sortBy === 'price_desc') {
      apiFilters.sortBy = 'price';
      apiFilters.sortOrder = 'desc';
    } else if (sortBy === 'mileage_asc') {
      apiFilters.sortBy = 'mileage';
      apiFilters.sortOrder = 'asc';
    } else if (sortBy === 'year_desc') {
      apiFilters.sortBy = 'year';
      apiFilters.sortOrder = 'desc';
    } else {
      apiFilters.sortBy = 'createdAt';
      apiFilters.sortOrder = 'desc';
    }
    
    // Search query - if it's a make, use make filter, otherwise search in model/title
    if (searchQuery) {
      // Check if search query matches a make
      const makeMatches = makes.find(m => m.toLowerCase() === searchQuery.toLowerCase());
      if (makeMatches && makeMatches !== 'All Makes') {
        apiFilters.make = makeMatches;
      } else {
        // For now, search by model (API doesn't have full text search)
        apiFilters.model = searchQuery;
      }
    }
    
    return apiFilters;
  }, [selectedMake, selectedBody, priceRange, selectedYear, selectedFuelTypes, sortBy, searchQuery, currentPage]);

  // Fetch listings from API
  const { data: apiData, isLoading } = useListings(filters);

  // Only use API data, no fallback listings - filtering is done by API
  const filteredListings = useMemo(() => {
    return apiData?.data || [];
  }, [apiData]);

  const updateURL = (page: number = 1) => {
    const params = new URLSearchParams();
    if (selectedMake !== 'All Makes') params.set('make', selectedMake);
    if (selectedBody !== 'All Types') params.set('bodyType', selectedBody);
    if (priceRange[0] > 0) params.set('minPrice', priceRange[0].toString());
    if (priceRange[1] < 200000) params.set('maxPrice', priceRange[1].toString());
    if (selectedYear !== 'all') params.set('year', selectedYear);
    if (selectedFuelTypes.length > 0) params.set('fuelType', selectedFuelTypes[0]);
    if (sortBy !== 'newest') params.set('sort', sortBy);
    if (searchQuery) params.set('q', searchQuery);
    if (page > 1) params.set('page', page.toString());
    
    router.push(`/search?${params.toString()}`, { scroll: false });
    setMobileFiltersOpen(false);
    setCurrentPage(page);
  };

  useEffect(() => {
    setSelectedMake(urlMake);
    setSelectedBody(urlBody);
    setPriceRange([urlMinPrice, urlMaxPrice]);
    setSortBy(urlSort);
    setSearchQuery(urlSearch);
    setCurrentPage(urlPage);
    setSelectedYear(urlYear);
    setSelectedFuelTypes(urlFuelType ? [urlFuelType] : []);
  }, [urlMake, urlBody, urlMinPrice, urlMaxPrice, urlSort, urlSearch, urlPage, urlYear, urlFuelType]);

  const activeFilters = [
    selectedMake !== 'All Makes' && selectedMake,
    selectedBody !== 'All Types' && selectedBody,
    priceRange[0] > 0 && `Min $${formatNumber(priceRange[0])}`,
    priceRange[1] < 200000 && `Max $${formatNumber(priceRange[1])}`,
    ...selectedFuelTypes,
    selectedYear !== 'all' && `Year: ${selectedYear}`,
  ].filter(Boolean);

  const clearFilters = () => {
    setSelectedMake('All Makes');
    setSelectedBody('All Types');
    setPriceRange([0, 200000]);
    setSelectedFuelTypes([]);
    setSelectedYear('all');
    setSearchQuery('');
    setCurrentPage(1);
    router.push('/search', { scroll: false });
  };

  const removeFilter = (filter: string) => {
    if (filter === selectedMake) {
      setSelectedMake('All Makes');
      updateURL(1);
    } else if (filter === selectedBody) {
      setSelectedBody('All Types');
      updateURL(1);
    } else if (filter.startsWith('Min')) {
      setPriceRange([0, priceRange[1]]);
      updateURL(1);
    } else if (filter.startsWith('Max')) {
      setPriceRange([priceRange[0], 200000]);
      updateURL(1);
    } else if (filter.startsWith('Year')) {
      setSelectedYear('all');
      updateURL(1);
    } else if (selectedFuelTypes.includes(filter)) {
      setSelectedFuelTypes(selectedFuelTypes.filter(f => f !== filter));
      updateURL(1);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900/50">
      {/* Search Header - Sticky */}
      <div className="sticky top-16 z-40 border-b bg-white/95 backdrop-blur dark:bg-slate-900/95 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 max-w-xl">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search make, model, or keyword..."
                className="pl-10 h-12 rounded-xl"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && updateURL(1)}
              />
            </div>
            
            <div className="flex items-center gap-3">
              {/* Mobile Filter Button */}
              <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" className="gap-2 lg:hidden">
                    <SlidersHorizontal className="h-4 w-4" />
                    Filters
                    {activeFilters.length > 0 && (
                      <Badge variant="secondary" className="ml-1">{activeFilters.length}</Badge>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[320px] overflow-y-auto">
                  <SheetHeader>
                    <SheetTitle>Filters</SheetTitle>
                  </SheetHeader>
                  <div className="mt-6">
                    <FilterSidebar
                      selectedMake={selectedMake}
                      setSelectedMake={setSelectedMake}
                      selectedBody={selectedBody}
                      setSelectedBody={setSelectedBody}
                      priceRange={priceRange}
                      setPriceRange={setPriceRange}
                      selectedFuelTypes={selectedFuelTypes}
                      setSelectedFuelTypes={setSelectedFuelTypes}
                      selectedYear={selectedYear}
                      setSelectedYear={setSelectedYear}
                      onApply={() => updateURL(1)}
                      onClear={clearFilters}
                      isMobile
                    />
                  </div>
                </SheetContent>
              </Sheet>

              <Select value={sortBy} onValueChange={(value) => {
                setSortBy(value);
                setCurrentPage(1);
                const params = new URLSearchParams(searchParams.toString());
                params.set('sort', value);
                params.delete('page'); // Reset to page 1
                router.push(`/search?${params.toString()}`, { scroll: false });
              }}>
                <SelectTrigger className="w-[180px] h-12 rounded-xl">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="price_asc">Price: Low to High</SelectItem>
                  <SelectItem value="price_desc">Price: High to Low</SelectItem>
                  <SelectItem value="mileage_asc">Lowest Mileage</SelectItem>
                  <SelectItem value="year_desc">Year: Newest</SelectItem>
                </SelectContent>
              </Select>

              <div className="hidden sm:flex rounded-xl border p-1 bg-white dark:bg-slate-800">
                <Button
                  variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                  size="icon"
                  className="h-9 w-9 rounded-lg"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                  size="icon"
                  className="h-9 w-9 rounded-lg"
                  onClick={() => setViewMode('list')}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Active Filters */}
          <AnimatePresence>
            {activeFilters.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 flex flex-wrap items-center gap-2"
              >
                <span className="text-sm text-muted-foreground">Active:</span>
                {activeFilters.map((filter, i) => (
                  <Badge key={i} variant="secondary" className="gap-1 pl-3">
                    {filter}
                    <button 
                      className="ml-1 hover:text-destructive rounded-full p-0.5 hover:bg-slate-200 dark:hover:bg-slate-700"
                      onClick={() => removeFilter(filter as string)}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
                <Button variant="ghost" size="sm" className="text-destructive h-7" onClick={clearFilters}>
                  Clear all
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex gap-8">
          {/* Desktop Sidebar - Fixed */}
          <aside className="hidden lg:block w-72 shrink-0">
            <div className="sticky top-24 flex-1 min-w-0 min-h-[600px] overflow-y-auto rounded-2xl bg-white p-6 shadow-sm dark:bg-slate-800">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display text-lg font-semibold">Filters</h3>
                {activeFilters.length > 0 && (
                  <Badge variant="secondary">{activeFilters.length} active</Badge>
                )}
              </div>
              <FilterSidebar
                selectedMake={selectedMake}
                setSelectedMake={setSelectedMake}
                selectedBody={selectedBody}
                setSelectedBody={setSelectedBody}
                priceRange={priceRange}
                setPriceRange={setPriceRange}
                selectedFuelTypes={selectedFuelTypes}
                setSelectedFuelTypes={setSelectedFuelTypes}
                selectedYear={selectedYear}
                setSelectedYear={setSelectedYear}
                onApply={() => updateURL(1)}
                onClear={clearFilters}
              />
            </div>
          </aside>

          {/* Results */}
          <div className="flex-1 min-w-0">
            <div className="mb-6 flex items-center justify-between">
              <p className="text-muted-foreground">
                <span className="font-semibold text-foreground">
                  {isLoading ? '...' : filteredListings.length}
                </span> vehicles found
                {selectedMake !== 'All Makes' && (
                  <span className="ml-1">for &quot;{selectedMake}&quot;</span>
                )}
              </p>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredListings.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-16 px-4"
              >
                <div className="mx-auto w-24 h-24 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-6">
                  <Search className="h-10 w-10 text-slate-400" />
                </div>
                <p className="text-xl font-semibold">No vehicles found</p>
                <p className="text-muted-foreground mt-2 max-w-md mx-auto">
                  Try adjusting your filters or search criteria to find what you&apos;re looking for
                </p>
                <Button variant="outline" className="mt-6 gap-2" onClick={clearFilters}>
                  <RotateCcw className="h-4 w-4" />
                  Clear Filters
                </Button>
              </motion.div>
            ) : (
              <div className={`grid gap-6 ${viewMode === 'grid' ? 'sm:grid-cols-2 xl:grid-cols-3' : 'grid-cols-1'}`}>
                {filteredListings.map((listing, index) => (
                  <VehicleCard key={listing.id} listing={listing} index={index} />
                ))}
              </div>
            )}

            {filteredListings.length > 0 && (() => {
              // Calculate total pages from API meta
              const totalPages = apiData?.meta 
                ? Math.ceil((apiData.meta.total || 0) / 9) 
                : 1;
              const pagesToShow = [];
              const maxPagesToShow = 5;
              
              let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
              let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
              
              if (endPage - startPage < maxPagesToShow - 1) {
                startPage = Math.max(1, endPage - maxPagesToShow + 1);
              }
              
              for (let i = startPage; i <= endPage; i++) {
                pagesToShow.push(i);
              }
              
              const handlePageChange = (page: number) => {
                updateURL(page);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              };
              
              return (
                <div className="mt-12 flex justify-center">
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      disabled={currentPage === 1}
                      onClick={() => handlePageChange(currentPage - 1)}
                    >
                      Previous
                    </Button>
                    {startPage > 1 && (
                      <>
                        <Button 
                          variant={1 === currentPage ? "secondary" : "ghost"}
                          onClick={() => handlePageChange(1)}
                        >
                          1
                        </Button>
                        {startPage > 2 && <span className="px-2">...</span>}
                      </>
                    )}
                    {pagesToShow.map((page) => (
                      <Button
                        key={page}
                        variant={page === currentPage ? "secondary" : "ghost"}
                        onClick={() => handlePageChange(page)}
                      >
                        {page}
                      </Button>
                    ))}
                    {endPage < totalPages && (
                      <>
                        {endPage < totalPages - 1 && <span className="px-2">...</span>}
                        <Button 
                          variant={totalPages === currentPage ? "secondary" : "ghost"}
                          onClick={() => handlePageChange(totalPages)}
                        >
                          {totalPages}
                        </Button>
                      </>
                    )}
                    <Button 
                      variant="outline" 
                      disabled={currentPage >= totalPages}
                      onClick={() => handlePageChange(currentPage + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <SearchPageContent />
    </Suspense>
  );
}
