'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Save, 
  Camera,
  Plus,
  X,
  Info,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/use-auth';
import { useMyListings } from '@/hooks/use-listings';
import { formatPrice } from '@/lib/utils';
import { Car, FileText, Clock } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface PhotoFile {
  file: File;
  preview: string;
}

interface FormData {
  make: string;
  model: string;
  year: string;
  trim: string;
  stockNumber: string;
  vin: string;
  mileage: string;
  fuelType: string;
  transmission: string;
  driveType: string;
  bodyType: string;
  condition: string;
  exteriorColor: string;
  interiorColor: string;
  price: string;
  originalPrice: string;
  description: string;
}

export default function NewInventoryPage() {
  const t = useTranslations('dealer.addListing');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [images, setImages] = useState<PhotoFile[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { data: draftListingsData } = useMyListings({ status: 'DRAFT' });
  const draftListings = draftListingsData?.data || [];
  const [formData, setFormData] = useState<FormData>({
    make: '',
    model: '',
    year: '',
    trim: '',
    stockNumber: '',
    vin: '',
    mileage: '',
    fuelType: '',
    transmission: '',
    driveType: '',
    bodyType: '',
    condition: 'USED',
    exteriorColor: '',
    interiorColor: '',
    price: '',
    originalPrice: '',
    description: '',
  });

  // Clean up photo previews on unmount
  useEffect(() => {
    return () => {
      images.forEach(photo => URL.revokeObjectURL(photo.preview));
    };
  }, [images]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newPhotos: PhotoFile[] = [];
    
    Array.from(files).forEach(file => {
      if (file.size > 10 * 1024 * 1024) {
        toast.error(t('fileSizeLimit'));
        return;
      }
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} is not an image.`);
        return;
      }
      if (images.length + newPhotos.length >= 50) {
        toast.error('Maximum 50 photos allowed.');
        return;
      }
      
      newPhotos.push({
        file,
        preview: URL.createObjectURL(file),
      });
    });

    if (newPhotos.length > 0) {
      setImages(prev => [...prev, ...newPhotos]);
      toast.success(t('photosAdded', { count: newPhotos.length }));
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removePhoto = (index: number) => {
    setImages(prev => {
      const newPhotos = [...prev];
      URL.revokeObjectURL(newPhotos[index].preview);
      newPhotos.splice(index, 1);
      return newPhotos;
    });
    toast.success(t('photoRemoved'));
  };

  const updateFormData = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.make) {
      toast.error(t('makeRequired'));
      return;
    }
    if (!formData.model) {
      toast.error(t('modelRequired'));
      return;
    }
    if (!formData.year) {
      toast.error(t('yearRequired'));
      return;
    }
    if (!formData.stockNumber) {
      toast.error(t('stockNumberRequired'));
      return;
    }
    if (!formData.mileage) {
      toast.error(t('mileageRequired'));
      return;
    }
    if (!formData.fuelType) {
      toast.error(t('fuelTypeRequired'));
      return;
    }
    if (!formData.transmission) {
      toast.error(t('transmissionRequired'));
      return;
    }
    if (!formData.driveType) {
      toast.error(t('driveTypeRequired'));
      return;
    }
    if (!formData.bodyType) {
      toast.error(t('bodyTypeRequired'));
      return;
    }
    if (!formData.price) {
      toast.error(t('priceRequired'));
      return;
    }
    if (images.length === 0) {
      toast.error(t('atLeastOnePhoto'));
      return;
    }

    if (!isAuthenticated) {
      toast.error('Please login to create a listing.');
      router.push('/login');
      return;
    }

    setIsSubmitting(true);

    try {
      // Generate title
      const title = `${formData.year} ${formData.make} ${formData.model}${formData.trim ? ` ${formData.trim}` : ''}`;

      // Create listing first
      const listingData: any = {
        title,
        make: formData.make,
        model: formData.model,
        year: parseInt(formData.year),
        trim: formData.trim || undefined,
        vin: formData.vin || undefined,
        stockNumber: formData.stockNumber,
        condition: formData.condition || 'USED',
        mileage: parseInt(formData.mileage),
        mileageUnit: 'km',
        fuelType: formData.fuelType,
        transmission: formData.transmission,
        driveType: formData.driveType,
        bodyType: formData.bodyType,
        exteriorColor: formData.exteriorColor || undefined,
        interiorColor: formData.interiorColor || undefined,
        description: formData.description || undefined,
        price: parseFloat(formData.price),
        originalPrice: formData.originalPrice ? parseFloat(formData.originalPrice) : undefined,
        currency: 'CAD',
        features: [], // Empty array as default
        safetyFeatures: [], // Empty array as default
        status: 'PENDING_APPROVAL', // Set status to PENDING_APPROVAL for admin approval
      };

      const listing = await api.listings.create(listingData);

      // Upload photos
      if (images.length > 0) {
        const formData = new FormData();
        images.forEach((photo) => {
          formData.append('files', photo.file);
        });

        try {
          const token = localStorage.getItem('accessToken');
          const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
          const response = await fetch(`${apiBaseUrl}/media/listings/${listing.id}`, {
            method: 'POST',
            headers: token ? {
              'Authorization': `Bearer ${token}`,
            } : {},
            body: formData,
            credentials: 'include',
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || 'Photo upload failed');
          }
        } catch (e: any) {
          console.error('Photo upload failed:', e);
          toast.error(e.message || 'Listing created but some photos failed to upload');
        }
      }

      toast.success(t('vehicleAddedSuccess'));
      router.push('/dealer/inventory');
    } catch (error: any) {
      console.error('Submit error:', error);
      
      // Better error handling
      let errorMessage = 'Failed to create listing. Please try again.';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      // Show validation errors if any
      if (error.response?.data?.message && Array.isArray(error.response.data.message)) {
        const validationErrors = error.response.data.message.join(', ');
        toast.error(`Validation errors: ${validationErrors}`);
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Main Form */}
      <div className="lg:col-span-2">
        <div className="mb-8">
          <Link href="/dealer/inventory" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
            <ArrowLeft className="h-4 w-4" />
            {t('backToInventory')}
          </Link>
          <h1 className="font-display text-2xl font-bold">{t('title')}</h1>
          <p className="text-muted-foreground">
            {t('subtitle')}
          </p>
        </div>

        <form className="space-y-8" onSubmit={handleSubmit}>
        {/* Basic Info */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border bg-card p-6"
        >
          <h2 className="font-semibold mb-4">{t('basicInformation')}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>{t('make')} *</Label>
              <Select value={formData.make} onValueChange={(value) => updateFormData('make', value)}>
                <SelectTrigger>
                  <SelectValue placeholder={t('selectMake')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BMW">BMW</SelectItem>
                  <SelectItem value="Mercedes-Benz">Mercedes-Benz</SelectItem>
                  <SelectItem value="Audi">Audi</SelectItem>
                  <SelectItem value="Toyota">Toyota</SelectItem>
                  <SelectItem value="Honda">Honda</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t('model')} *</Label>
              <Select value={formData.model} onValueChange={(value) => updateFormData('model', value)}>
                <SelectTrigger>
                  <SelectValue placeholder={t('selectModel')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3 Series">3 Series</SelectItem>
                  <SelectItem value="5 Series">5 Series</SelectItem>
                  <SelectItem value="X5">X5</SelectItem>
                  <SelectItem value="M4">M4</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t('year')} *</Label>
              <Select value={formData.year} onValueChange={(value) => updateFormData('year', value)}>
                <SelectTrigger>
                  <SelectValue placeholder={t('selectYear')} />
                </SelectTrigger>
                <SelectContent>
                  {[2024, 2023, 2022, 2021, 2020, 2019, 2018].map((year) => (
                    <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t('trim')}</Label>
              <Input 
                placeholder={t('trimPlaceholder')} 
                value={formData.trim}
                onChange={(e) => updateFormData('trim', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('stockNumber')} *</Label>
              <Input 
                placeholder={t('stockNumberPlaceholder')} 
                value={formData.stockNumber}
                onChange={(e) => updateFormData('stockNumber', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('vin')}</Label>
              <Input 
                placeholder={t('vinPlaceholder')} 
                value={formData.vin}
                onChange={(e) => updateFormData('vin', e.target.value)}
              />
            </div>
          </div>
        </motion.div>

        {/* Specifications */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-xl border bg-card p-6"
        >
          <h2 className="font-semibold mb-4">{t('specifications')}</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>{t('mileage')} *</Label>
              <Input 
                type="number" 
                placeholder={t('mileagePlaceholder')} 
                value={formData.mileage}
                onChange={(e) => updateFormData('mileage', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('fuelType')} *</Label>
              <Select value={formData.fuelType} onValueChange={(value) => updateFormData('fuelType', value)}>
                <SelectTrigger>
                  <SelectValue placeholder={t('select')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GASOLINE">Gasoline</SelectItem>
                  <SelectItem value="DIESEL">Diesel</SelectItem>
                  <SelectItem value="ELECTRIC">Electric</SelectItem>
                  <SelectItem value="HYBRID">Hybrid</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t('transmission')} *</Label>
              <Select value={formData.transmission} onValueChange={(value) => updateFormData('transmission', value)}>
                <SelectTrigger>
                  <SelectValue placeholder={t('select')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AUTOMATIC">Automatic</SelectItem>
                  <SelectItem value="MANUAL">Manual</SelectItem>
                  <SelectItem value="CVT">CVT</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t('driveType')}</Label>
              <Select value={formData.driveType} onValueChange={(value) => updateFormData('driveType', value)}>
                <SelectTrigger>
                  <SelectValue placeholder={t('select')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FWD">FWD</SelectItem>
                  <SelectItem value="RWD">RWD</SelectItem>
                  <SelectItem value="AWD">AWD</SelectItem>
                  <SelectItem value="FOUR_WD">4WD</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t('bodyType')}</Label>
              <Select value={formData.bodyType} onValueChange={(value) => updateFormData('bodyType', value)}>
                <SelectTrigger>
                  <SelectValue placeholder={t('select')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SEDAN">Sedan</SelectItem>
                  <SelectItem value="SUV">SUV</SelectItem>
                  <SelectItem value="COUPE">Coupe</SelectItem>
                  <SelectItem value="PICKUP">Pickup</SelectItem>
                  <SelectItem value="HATCHBACK">Hatchback</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t('condition')}</Label>
              <Select value={formData.condition} onValueChange={(value) => updateFormData('condition', value)}>
                <SelectTrigger>
                  <SelectValue placeholder={t('select')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NEW">{t('new')}</SelectItem>
                  <SelectItem value="USED">{t('used')}</SelectItem>
                  <SelectItem value="CPO">{t('certifiedPreOwned')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t('exteriorColor')}</Label>
              <Input 
                placeholder={t('exteriorColorPlaceholder')} 
                value={formData.exteriorColor}
                onChange={(e) => updateFormData('exteriorColor', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('interiorColor')}</Label>
              <Input 
                placeholder={t('interiorColorPlaceholder')} 
                value={formData.interiorColor}
                onChange={(e) => updateFormData('interiorColor', e.target.value)}
              />
            </div>
          </div>
        </motion.div>

        {/* Pricing */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-xl border bg-card p-6"
        >
          <h2 className="font-semibold mb-4">{t('pricing')}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>{t('price')} *</Label>
              <Input 
                type="number" 
                placeholder={t('pricePlaceholder')} 
                value={formData.price}
                onChange={(e) => updateFormData('price', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('originalMsrp')}</Label>
              <Input 
                type="number" 
                placeholder={t('originalMsrpPlaceholder')} 
                value={formData.originalPrice}
                onChange={(e) => updateFormData('originalPrice', e.target.value)}
              />
            </div>
          </div>
        </motion.div>

        {/* Photos */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-xl border bg-card p-6"
        >
          <h2 className="font-semibold mb-4">{t('photos')}</h2>
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
            {/* Add Photo Button - Always on the left */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="aspect-square w-32 h-32 shrink-0 rounded-lg border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-primary hover:text-primary transition-colors"
            >
              <Camera className="h-8 w-8" />
              <span className="text-xs">{t('addPhoto')}</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleFileSelect}
            />
            
            {/* Uploaded Photos - Animated */}
            <AnimatePresence>
              {images.map((photo, index) => (
                <motion.div
                  key={photo.preview}
                  initial={{ opacity: 0, x: -20, scale: 0.9 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 20, scale: 0.9 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="relative aspect-square w-32 h-32 shrink-0 rounded-lg overflow-hidden bg-muted group"
                >
                  <img
                    src={photo.preview}
                    alt={`Photo ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  {index === 0 && (
                    <div className="absolute top-2 left-2 bg-primary text-white text-xs px-2 py-1 rounded">
                      {t('main')}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => removePhoto(index)}
                    className="absolute -right-2 -top-2 rounded-full bg-red-500 p-1.5 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 z-10"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            <Info className="inline h-3 w-3 mr-1" />
            {t('uploadInfo')}
          </p>
        </motion.div>

        {/* Description */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="rounded-xl border bg-card p-6"
        >
          <h2 className="font-semibold mb-4">{t('description')}</h2>
          <Textarea
            placeholder={t('descriptionPlaceholder')}
            rows={6}
            value={formData.description}
            onChange={(e) => updateFormData('description', e.target.value)}
          />
        </motion.div>

        {/* Actions */}
        <div className="flex gap-4">
          <Button type="submit" className="gap-2" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {t('saving')}
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                {t('saveAndPublish')}
              </>
            )}
          </Button>
          <Button type="button" variant="outline">
            {t('saveAsDraft')}
          </Button>
          <Link href="/dealer/inventory" className="ml-auto">
            <Button type="button" variant="ghost">
              {t('cancel')}
            </Button>
          </Link>
        </div>
      </form>
      </div>

      {/* Draft Listings Sidebar */}
      <div className="lg:col-span-1">
        <div className="sticky top-6">
          <div className="rounded-xl border bg-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <h2 className="font-semibold">{t('draftListings')}</h2>
            </div>
            
            {draftListings.length === 0 ? (
              <div className="text-center py-8">
                <Clock className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">{t('noDraftListings')}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {t('savedDraftsAppear')}
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto scrollbar-hide">
                {draftListings.map((listing: any) => (
                  <Link
                    key={listing.id}
                    href={`/dealer/inventory/edit/${listing.id}`}
                    className="block rounded-lg border p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group"
                  >
                    <div className="flex items-start gap-3">
                      <div className="h-16 w-20 rounded-lg overflow-hidden bg-muted shrink-0">
                        {listing.media?.[0]?.url ? (
                          <img
                            src={listing.media[0].url}
                            alt={listing.title}
                            className="h-full w-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center">
                            <Car className="h-6 w-6 text-muted-foreground/50" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm line-clamp-1 group-hover:text-primary transition-colors">
                          {listing.title}
                        </h3>
                        <p className="text-sm font-semibold text-primary mt-1">
                          {formatPrice(listing.price)}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(listing.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

