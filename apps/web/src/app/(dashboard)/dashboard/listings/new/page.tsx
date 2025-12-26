'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import Image from 'next/image';
import { motion } from 'framer-motion';
import {
  ChevronRight,
  Upload,
  X,
  Plus,
  Car,
  Settings2,
  DollarSign,
  FileText,
  Loader2,
  GripVertical,
  Check,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/use-auth';
import { useVehicleMakes } from '@/hooks/use-vehicle-data';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import type { FuelType, TransmissionType, DriveType, BodyType, Condition } from '@carhaus/types';

const allFeatures = [
  'Leather Seats', 'Heated Seats', 'Ventilated Seats', 'Navigation',
  'Bluetooth', 'Apple CarPlay', 'Android Auto', 'Backup Camera',
  'Sunroof', 'Panoramic Roof', 'Keyless Entry', 'Push Start',
  'Cruise Control', 'Adaptive Cruise', 'Lane Assist', 'Blind Spot Monitor',
  '360 Camera', 'Parking Sensors', 'Power Liftgate', 'Wireless Charging',
];

const safetyFeaturesList = [
  'ABS Brakes', 'Airbags', 'Traction Control', 'Stability Control',
  'Forward Collision Warning', 'Automatic Emergency Braking',
  'Lane Departure Warning', 'Rear Cross Traffic Alert',
];

const provinces = [
  { value: 'ON', label: 'Ontario' },
  { value: 'QC', label: 'Quebec' },
  { value: 'BC', label: 'British Columbia' },
  { value: 'AB', label: 'Alberta' },
  { value: 'MB', label: 'Manitoba' },
  { value: 'SK', label: 'Saskatchewan' },
  { value: 'NS', label: 'Nova Scotia' },
  { value: 'NB', label: 'New Brunswick' },
  { value: 'NL', label: 'Newfoundland and Labrador' },
  { value: 'PE', label: 'Prince Edward Island' },
];

// Fallback makes list when API is empty
const defaultMakes = [
  'Acura', 'Alfa Romeo', 'Aston Martin', 'Audi', 'Bentley', 'BMW', 'Buick',
  'Cadillac', 'Chevrolet', 'Chrysler', 'Dodge', 'Ferrari', 'Fiat', 'Ford',
  'Genesis', 'GMC', 'Honda', 'Hyundai', 'Infiniti', 'Jaguar', 'Jeep', 'Kia',
  'Lamborghini', 'Land Rover', 'Lexus', 'Lincoln', 'Lotus', 'Maserati', 'Mazda',
  'McLaren', 'Mercedes-Benz', 'Mini', 'Mitsubishi', 'Nissan', 'Polestar',
  'Porsche', 'Ram', 'Rivian', 'Rolls-Royce', 'Subaru', 'Tesla', 'Toyota',
  'Volkswagen', 'Volvo',
];

interface FormData {
  // Step 1 - Vehicle Info
  make: string;
  model: string;
  year: string;
  trim: string;
  vin: string;
  stockNumber: string;
  condition: string;
  // Step 2 - Specifications
  mileage: string;
  fuelType: string;
  transmission: string;
  driveType: string;
  bodyType: string;
  engineSize: string;
  horsepower: string;
  exteriorColor: string;
  interiorColor: string;
  doors: string;
  seats: string;
  features: string[];
  safetyFeatures: string[];
  // Step 3 - Photos
  photos: { file: File; preview: string }[];
  // Step 4 - Description & Location
  title: string;
  description: string;
  city: string;
  province: string;
  postalCode: string;
  // Step 5 - Pricing
  price: string;
  originalPrice: string;
  priceNegotiable: boolean;
}

const initialFormData: FormData = {
  make: '',
  model: '',
  year: '',
  trim: '',
  vin: '',
  stockNumber: '',
  condition: 'USED',
  mileage: '',
  fuelType: '',
  transmission: '',
  driveType: '',
  bodyType: '',
  engineSize: '',
  horsepower: '',
  exteriorColor: '',
  interiorColor: '',
  doors: '',
  seats: '',
  features: [],
  safetyFeatures: [],
  photos: [],
  title: '',
  description: '',
  city: '',
  province: '',
  postalCode: '',
  price: '',
  originalPrice: '',
  priceNegotiable: false,
};

const DRAFT_KEY = 'carhaus_listing_draft';

export default function NewListingPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { data: makes } = useVehicleMakes();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [draftLoaded, setDraftLoaded] = useState(false);

  // Load draft from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined' && !draftLoaded) {
      const savedDraft = localStorage.getItem(DRAFT_KEY);
      if (savedDraft) {
        try {
          const parsed = JSON.parse(savedDraft);
          // Don't restore photos from localStorage (they're files)
          setFormData({ ...parsed, photos: [] });
          toast.info(t('draftRestored'));
        } catch (e) {
          console.error('Failed to parse draft:', e);
        }
      }
      setDraftLoaded(true);
    }
  }, [draftLoaded]);

  // Save draft to localStorage (debounced)
  useEffect(() => {
    if (draftLoaded) {
      const timeout = setTimeout(() => {
        const dataToSave = { ...formData, photos: [] };
        localStorage.setItem(DRAFT_KEY, JSON.stringify(dataToSave));
      }, 1000);
      return () => clearTimeout(timeout);
    }
  }, [formData, draftLoaded]);

  // Clean up photo previews on unmount
  useEffect(() => {
    return () => {
      formData.photos.forEach(photo => URL.revokeObjectURL(photo.preview));
    };
  }, [formData.photos]);

  const updateFormData = useCallback((field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user types
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  }, [errors]);

  const toggleFeature = (feature: string) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.includes(feature)
        ? prev.features.filter(f => f !== feature)
        : [...prev.features, feature],
    }));
  };

  const toggleSafetyFeature = (feature: string) => {
    setFormData(prev => ({
      ...prev,
      safetyFeatures: prev.safetyFeatures.includes(feature)
        ? prev.safetyFeatures.filter(f => f !== feature)
        : [...prev.safetyFeatures, feature],
    }));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newPhotos: { file: File; preview: string }[] = [];
    
    Array.from(files).forEach(file => {
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} is too large. Max 10MB.`);
        return;
      }
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} is not an image.`);
        return;
      }
      if (formData.photos.length + newPhotos.length >= 20) {
        toast.error('Maximum 20 photos allowed.');
        return;
      }
      
      newPhotos.push({
        file,
        preview: URL.createObjectURL(file),
      });
    });

    if (newPhotos.length > 0) {
      setFormData(prev => ({
        ...prev,
        photos: [...prev.photos, ...newPhotos],
      }));
      toast.success(t('photosAdded', { count: newPhotos.length }));
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removePhoto = (index: number) => {
    setFormData(prev => {
      const newPhotos = [...prev.photos];
      URL.revokeObjectURL(newPhotos[index].preview);
      newPhotos.splice(index, 1);
      return { ...prev, photos: newPhotos };
    });
  };

  const validateStep = (step: number): { valid: boolean; errors: Record<string, string> } => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!formData.make) newErrors.make = 'Make is required';
      if (!formData.model) newErrors.model = 'Model is required';
      if (!formData.year) newErrors.year = 'Year is required';
    } else if (step === 2) {
      if (!formData.mileage) newErrors.mileage = 'Mileage is required';
      if (!formData.fuelType) newErrors.fuelType = 'Fuel type is required';
      if (!formData.transmission) newErrors.transmission = 'Transmission is required';
      if (!formData.driveType) newErrors.driveType = 'Drive type is required';
      if (!formData.bodyType) newErrors.bodyType = 'Body type is required';
    } else if (step === 3) {
      if (formData.photos.length === 0) newErrors.photos = 'At least one photo is required';
    } else if (step === 4) {
      if (!formData.title) newErrors.title = 'Title is required';
      if (!formData.description) newErrors.description = t('descriptionRequired');
      if (!formData.city) newErrors.city = 'City is required';
      if (!formData.province) newErrors.province = 'Province is required';
    } else if (step === 5) {
      if (!formData.price) newErrors.price = 'Price is required';
      if (Number(formData.price) <= 0) newErrors.price = 'Price must be greater than 0';
    }

    return { valid: Object.keys(newErrors).length === 0, errors: newErrors };
  };

  // Validate all steps and find the first one with errors
  const validateAllSteps = (): { valid: boolean; firstErrorStep: number | null } => {
    for (let step = 1; step <= 5; step++) {
      const result = validateStep(step);
      if (!result.valid) {
        setErrors(result.errors);
        return { valid: false, firstErrorStep: step };
      }
    }
    setErrors({});
    return { valid: true, firstErrorStep: null };
  };

  // Animated transition to a step with error
  const goToStepWithError = (step: number) => {
    // First set the step
    setCurrentStep(step);
    
    // Scroll to top of form smoothly
    window.scrollTo({ top: 200, behavior: 'smooth' });
    
    // Show toast with step name
    const stepName = steps.find(s => s.id === step)?.name || 'Step ' + step;
    toast.error(`Please complete "${stepName}" section first.`, {
      duration: 4000,
      icon: '⚠️',
    });
  };

  const handleNext = () => {
    const result = validateStep(currentStep);
    if (result.valid) {
      setCurrentStep(prev => Math.min(5, prev + 1));
      window.scrollTo({ top: 200, behavior: 'smooth' });
    } else {
      setErrors(result.errors);
      toast.error('Please fill in all required fields.');
    }
  };

  const handleSubmit = async () => {
    // Validate ALL steps, not just the current one
    const { valid, firstErrorStep } = validateAllSteps();
    
    if (!valid && firstErrorStep) {
      goToStepWithError(firstErrorStep);
      return;
    }

    if (!isAuthenticated) {
      toast.error('Please login to create a listing.');
      router.push('/login');
      return;
    }

    setIsSubmitting(true);

    try {
      const listingData = {
        title: formData.title,
        make: formData.make,
        model: formData.model,
        year: parseInt(formData.year),
        trim: formData.trim || undefined,
        vin: formData.vin || undefined,
        stockNumber: formData.stockNumber || undefined,
        condition: formData.condition as Condition,
        mileage: parseInt(formData.mileage),
        mileageUnit: 'km',
        fuelType: formData.fuelType as FuelType,
        transmission: formData.transmission as TransmissionType,
        driveType: formData.driveType as DriveType,
        bodyType: formData.bodyType as BodyType,
        engineSize: formData.engineSize ? parseFloat(formData.engineSize) : undefined,
        horsepower: formData.horsepower ? parseInt(formData.horsepower) : undefined,
        exteriorColor: formData.exteriorColor || undefined,
        interiorColor: formData.interiorColor || undefined,
        doors: formData.doors ? parseInt(formData.doors) : undefined,
        seats: formData.seats ? parseInt(formData.seats) : undefined,
        features: formData.features,
        safetyFeatures: formData.safetyFeatures,
        description: formData.description,
        city: formData.city,
        province: formData.province,
        postalCode: formData.postalCode || undefined,
        price: parseFloat(formData.price),
        originalPrice: formData.originalPrice ? parseFloat(formData.originalPrice) : undefined,
        priceNegotiable: formData.priceNegotiable,
        currency: 'CAD',
      };

      const listing = await api.listings.create(listingData);
      
      if (formData.photos.length > 0) {
        for (const photo of formData.photos) {
          try {
            await api.media.uploadForListing(listing.id, photo.file);
          } catch (e) {
            console.error('Photo upload failed:', e);
          }
        }
      }
      
      localStorage.removeItem(DRAFT_KEY);
      
      queryClient.invalidateQueries({ queryKey: ['my-listings'] });
      queryClient.invalidateQueries({ queryKey: ['listings'] });
      
      toast.success('Listing submitted successfully! It will be reviewed shortly.');
      router.push('/dashboard/listings');
    } catch (error: any) {
      console.error('Submit error:', error);
      toast.error(error.message || 'Failed to create listing. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const clearDraft = () => {
    localStorage.removeItem(DRAFT_KEY);
    setFormData(initialFormData);
    setCurrentStep(1);
    toast.success('Draft cleared.');
  };

  // Generate title suggestion
  useEffect(() => {
    if (formData.year && formData.make && formData.model && !formData.title) {
      const suggestion = `${formData.year} ${formData.make} ${formData.model}${formData.trim ? ` ${formData.trim}` : ''}`;
      updateFormData('title', suggestion);
    }
  }, [formData.year, formData.make, formData.model, formData.trim, formData.title, updateFormData]);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">Create New Listing</h1>
          <p className="text-muted-foreground mt-1">
            Fill in the details to list your vehicle
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={clearDraft}>
          Clear Draft
        </Button>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center justify-between overflow-x-auto pb-4">
        {steps.map((step, index) => {
          // Check if this step has errors
          const stepResult = validateStep(step.id);
          const hasError = !stepResult.valid && Object.keys(errors).some(key => 
            Object.keys(stepResult.errors).includes(key)
          );
          
          return (
          <div key={step.id} className="flex items-center">
            <button
              onClick={() => {
                // Allow going back, but validate when going forward
                const result = validateStep(currentStep);
                if (step.id < currentStep || result.valid) {
                  setCurrentStep(step.id);
                  window.scrollTo({ top: 200, behavior: 'smooth' });
                } else {
                  setErrors(result.errors);
                  toast.error('Please complete this section first.');
                }
              }}
              className={`flex flex-col items-center gap-2 px-4 transition-all duration-300 ${
                currentStep === step.id
                  ? 'text-primary scale-105'
                  : currentStep > step.id
                  ? hasError ? 'text-red-500' : 'text-emerald-500'
                  : 'text-muted-foreground'
              }`}
            >
              <motion.div
                animate={hasError && currentStep === step.id ? { 
                  scale: [1, 1.1, 1],
                  rotate: [0, -5, 5, -5, 0]
                } : {}}
                transition={{ duration: 0.5 }}
                className={`relative flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-300 ${
                  currentStep === step.id
                    ? hasError 
                      ? 'border-red-500 bg-red-500 text-white animate-pulse'
                      : 'border-primary bg-primary text-white'
                    : currentStep > step.id
                    ? hasError
                      ? 'border-red-500 bg-red-500 text-white'
                      : 'border-emerald-500 bg-emerald-500 text-white'
                    : 'border-muted'
                }`}
              >
                {hasError && currentStep > step.id ? (
                  <AlertCircle className="h-5 w-5" />
                ) : currentStep > step.id ? (
                  <Check className="h-5 w-5" />
                ) : (
                  <step.icon className="h-5 w-5" />
                )}
              </motion.div>
              <span className="text-xs font-medium whitespace-nowrap">{step.name}</span>
            </button>
            {index < steps.length - 1 && (
              <ChevronRight className="h-5 w-5 text-muted-foreground mx-2" />
            )}
          </div>
        );
        })}
      </div>

      {/* Step Content */}
      <motion.div
        key={currentStep}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Step 1: Vehicle Info */}
        {currentStep === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>{t('vehicleInformation')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Make <span className="text-destructive">*</span>
                  </label>
                  <Select value={formData.make} onValueChange={(v) => updateFormData('make', v)}>
                    <SelectTrigger className={errors.make ? 'border-destructive' : ''}>
                      <SelectValue placeholder="Select make" />
                    </SelectTrigger>
                    <SelectContent>
                      {(makes && makes.length > 0 ? makes : defaultMakes).map((make: any) => (
                        <SelectItem key={typeof make === 'string' ? make : make.name} value={typeof make === 'string' ? make : make.name}>
                          {typeof make === 'string' ? make : make.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.make && <p className="text-xs text-destructive">{errors.make}</p>}
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Model <span className="text-destructive">*</span>
                  </label>
                  <Input
                    placeholder="e.g., Camry, Civic, F-150"
                    value={formData.model}
                    onChange={(e) => updateFormData('model', e.target.value)}
                    className={errors.model ? 'border-destructive' : ''}
                  />
                  {errors.model && <p className="text-xs text-destructive">{errors.model}</p>}
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Year <span className="text-destructive">*</span>
                  </label>
                  <Select value={formData.year} onValueChange={(v) => updateFormData('year', v)}>
                    <SelectTrigger className={errors.year ? 'border-destructive' : ''}>
                      <SelectValue placeholder="Select year" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 30 }, (_, i) => 2025 - i).map((year) => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.year && <p className="text-xs text-destructive">{errors.year}</p>}
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Trim</label>
                  <Input
                    placeholder="e.g., XLE, Sport, Limited"
                    value={formData.trim}
                    onChange={(e) => updateFormData('trim', e.target.value)}
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">VIN (Optional)</label>
                  <Input
                    placeholder="17-character VIN"
                    maxLength={17}
                    value={formData.vin}
                    onChange={(e) => updateFormData('vin', e.target.value.toUpperCase())}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Stock Number (Optional)</label>
                  <Input
                    placeholder="Your internal stock number"
                    value={formData.stockNumber}
                    onChange={(e) => updateFormData('stockNumber', e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Condition <span className="text-destructive">*</span>
                </label>
                <div className="flex gap-4">
                  {[
                    { value: 'NEW', label: 'New' },
                    { value: 'USED', label: 'Used' },
                    { value: 'CERTIFIED_PRE_OWNED', label: 'Certified Pre-Owned' },
                  ].map((option) => (
                    <label
                      key={option.value}
                      className={`flex items-center gap-2 cursor-pointer px-4 py-2 rounded-lg border transition-colors ${
                        formData.condition === option.value
                          ? 'border-primary bg-primary/10'
                          : 'border-muted hover:border-primary/50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="condition"
                        value={option.value}
                        checked={formData.condition === option.value}
                        onChange={(e) => updateFormData('condition', e.target.value)}
                        className="sr-only"
                      />
                      <span className={formData.condition === option.value ? 'text-primary font-medium' : ''}>
                        {option.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Specifications */}
        {currentStep === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>Specifications</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Mileage (km) <span className="text-destructive">*</span>
                  </label>
                  <Input
                    type="number"
                    placeholder="e.g., 50000"
                    value={formData.mileage}
                    onChange={(e) => updateFormData('mileage', e.target.value)}
                    className={errors.mileage ? 'border-destructive' : ''}
                  />
                  {errors.mileage && <p className="text-xs text-destructive">{errors.mileage}</p>}
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Fuel Type <span className="text-destructive">*</span>
                  </label>
                  <Select value={formData.fuelType} onValueChange={(v) => updateFormData('fuelType', v)}>
                    <SelectTrigger className={errors.fuelType ? 'border-destructive' : ''}>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GASOLINE">Gasoline</SelectItem>
                      <SelectItem value="DIESEL">Diesel</SelectItem>
                      <SelectItem value="ELECTRIC">Electric</SelectItem>
                      <SelectItem value="HYBRID">Hybrid</SelectItem>
                      <SelectItem value="PLUG_IN_HYBRID">Plug-in Hybrid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Transmission <span className="text-destructive">*</span>
                  </label>
                  <Select value={formData.transmission} onValueChange={(v) => updateFormData('transmission', v)}>
                    <SelectTrigger className={errors.transmission ? 'border-destructive' : ''}>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AUTOMATIC">Automatic</SelectItem>
                      <SelectItem value="MANUAL">Manual</SelectItem>
                      <SelectItem value="CVT">CVT</SelectItem>
                      <SelectItem value="DCT">Dual-Clutch</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Drive Type <span className="text-destructive">*</span>
                  </label>
                  <Select value={formData.driveType} onValueChange={(v) => updateFormData('driveType', v)}>
                    <SelectTrigger className={errors.driveType ? 'border-destructive' : ''}>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FWD">Front-Wheel Drive</SelectItem>
                      <SelectItem value="RWD">Rear-Wheel Drive</SelectItem>
                      <SelectItem value="AWD">All-Wheel Drive</SelectItem>
                      <SelectItem value="FOUR_WD">4WD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Body Type <span className="text-destructive">*</span>
                  </label>
                  <Select value={formData.bodyType} onValueChange={(v) => updateFormData('bodyType', v)}>
                    <SelectTrigger className={errors.bodyType ? 'border-destructive' : ''}>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SEDAN">Sedan</SelectItem>
                      <SelectItem value="SUV">SUV</SelectItem>
                      <SelectItem value="PICKUP">Pickup Truck</SelectItem>
                      <SelectItem value="COUPE">Coupe</SelectItem>
                      <SelectItem value="HATCHBACK">Hatchback</SelectItem>
                      <SelectItem value="WAGON">Wagon</SelectItem>
                      <SelectItem value="CONVERTIBLE">Convertible</SelectItem>
                      <SelectItem value="VAN">Van</SelectItem>
                      <SelectItem value="MINIVAN">Minivan</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Engine Size (L)</label>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="e.g., 2.5"
                    value={formData.engineSize}
                    onChange={(e) => updateFormData('engineSize', e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Horsepower</label>
                  <Input
                    type="number"
                    placeholder="e.g., 203"
                    value={formData.horsepower}
                    onChange={(e) => updateFormData('horsepower', e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Exterior Color</label>
                  <Input
                    placeholder="e.g., Pearl White"
                    value={formData.exteriorColor}
                    onChange={(e) => updateFormData('exteriorColor', e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Interior Color</label>
                  <Input
                    placeholder="e.g., Black Leather"
                    value={formData.interiorColor}
                    onChange={(e) => updateFormData('interiorColor', e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-medium">Features</label>
                <div className="flex flex-wrap gap-2">
                  {allFeatures.map((feature) => (
                    <Badge
                      key={feature}
                      variant={formData.features.includes(feature) ? 'default' : 'outline'}
                      className="cursor-pointer transition-all hover:scale-105"
                      onClick={() => toggleFeature(feature)}
                    >
                      {formData.features.includes(feature) && <Check className="h-3 w-3 mr-1" />}
                      {feature}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-medium">Safety Features</label>
                <div className="flex flex-wrap gap-2">
                  {safetyFeaturesList.map((feature) => (
                    <Badge
                      key={feature}
                      variant={formData.safetyFeatures.includes(feature) ? 'default' : 'outline'}
                      className="cursor-pointer transition-all hover:scale-105"
                      onClick={() => toggleSafetyFeature(feature)}
                    >
                      {formData.safetyFeatures.includes(feature) && <Check className="h-3 w-3 mr-1" />}
                      {feature}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Photos */}
        {currentStep === 3 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Photos</span>
                <span className="text-sm font-normal text-muted-foreground">
                  {formData.photos.length}/20 photos
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileSelect}
                className="hidden"
              />
              
              <div
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-colors hover:border-primary hover:bg-primary/5 ${
                  errors.photos ? 'border-destructive' : ''
                }`}
              >
                <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold mb-2">Click to upload photos</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Max 20 photos, 10MB each. JPG, PNG, WebP supported.
                </p>
                <Button variant="outline" type="button">
                  <Plus className="h-4 w-4 mr-2" />
                  {t('addPhotos')}
                </Button>
              </div>
              {errors.photos && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {errors.photos}
                </p>
              )}

              {formData.photos.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {formData.photos.map((photo, index) => (
                    <div
                      key={index}
                      className="group relative aspect-video rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800"
                    >
                      <Image
                        src={photo.preview}
                        alt={`Photo ${index + 1}`}
                        fill
                        className="object-cover"
                      />
                      {index === 0 && (
                        <div className="absolute top-2 left-2 bg-primary text-white text-xs px-2 py-1 rounded">
                          Main Photo
                        </div>
                      )}
                      <button
                        onClick={() => removePhoto(index)}
                        className="absolute top-2 right-2 h-6 w-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-4 w-4" />
                      </button>
                      <div className="absolute bottom-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <GripVertical className="h-5 w-5 text-white drop-shadow-lg" />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <p className="text-sm text-muted-foreground">
                First photo will be the main image displayed in search results.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Description & Location */}
        {currentStep === 4 && (
          <Card>
            <CardHeader>
              <CardTitle>{t('descriptionAndLocation')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Title <span className="text-destructive">*</span>
                </label>
                <Input
                  placeholder="e.g., 2024 Toyota Camry XLE - Low KM, One Owner"
                  value={formData.title}
                  onChange={(e) => updateFormData('title', e.target.value)}
                  className={errors.title ? 'border-destructive' : ''}
                />
                {errors.title && <p className="text-xs text-destructive">{errors.title}</p>}
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Description <span className="text-destructive">*</span>
                </label>
                <textarea
                  className={`w-full min-h-[200px] rounded-xl border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring ${
                    errors.description ? 'border-destructive' : ''
                  }`}
                  placeholder="Describe your vehicle in detail. Include any notable features, recent maintenance, reason for selling, etc."
                  value={formData.description}
                  onChange={(e) => updateFormData('description', e.target.value)}
                />
                {errors.description && <p className="text-xs text-destructive">{errors.description}</p>}
                <p className="text-xs text-muted-foreground">
                  {formData.description.length}/2000 characters
                </p>
              </div>
              
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    City <span className="text-destructive">*</span>
                  </label>
                  <Input
                    placeholder="e.g., Toronto"
                    value={formData.city}
                    onChange={(e) => updateFormData('city', e.target.value)}
                    className={errors.city ? 'border-destructive' : ''}
                  />
                  {errors.city && <p className="text-xs text-destructive">{errors.city}</p>}
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Province <span className="text-destructive">*</span>
                  </label>
                  <Select value={formData.province} onValueChange={(v) => updateFormData('province', v)}>
                    <SelectTrigger className={errors.province ? 'border-destructive' : ''}>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {provinces.map((prov) => (
                        <SelectItem key={prov.value} value={prov.label}>
                          {prov.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.province && <p className="text-xs text-destructive">{errors.province}</p>}
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Postal Code</label>
                  <Input
                    placeholder="e.g., M5V 1J2"
                    value={formData.postalCode}
                    onChange={(e) => updateFormData('postalCode', e.target.value.toUpperCase())}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 5: Pricing */}
        {currentStep === 5 && (
          <Card>
            <CardHeader>
              <CardTitle>Pricing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Asking Price (CAD) <span className="text-destructive">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                    <Input
                      type="number"
                      placeholder="e.g., 35000"
                      value={formData.price}
                      onChange={(e) => updateFormData('price', e.target.value)}
                      className={`pl-8 ${errors.price ? 'border-destructive' : ''}`}
                    />
                  </div>
                  {errors.price && <p className="text-xs text-destructive">{errors.price}</p>}
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Original MSRP (Optional)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                    <Input
                      type="number"
                      placeholder="For new vehicles"
                      value={formData.originalPrice}
                      onChange={(e) => updateFormData('originalPrice', e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>
              </div>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.priceNegotiable}
                  onChange={(e) => updateFormData('priceNegotiable', e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <span className="text-sm">Price is negotiable</span>
              </label>

              <div className="rounded-xl bg-gradient-to-r from-primary/10 to-primary/5 p-6">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <Check className="h-5 w-5 text-emerald-500" />
                  Ready to publish?
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Your listing will be reviewed and published within 24 hours. You'll receive an email notification once it's live.
                </p>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>✓ {formData.photos.length} photo(s) uploaded</li>
                  <li>✓ {formData.features.length + formData.safetyFeatures.length} features selected</li>
                  <li>✓ Located in {formData.city || 'your city'}, {formData.province || 'your province'}</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        )}
      </motion.div>

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
          disabled={currentStep === 1}
        >
          Previous
        </Button>
        
        {currentStep < 5 ? (
          <Button onClick={handleNext}>
            Continue
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="bg-gradient-to-r from-primary to-primary/80 hover:opacity-90"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              'Submit Listing'
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
