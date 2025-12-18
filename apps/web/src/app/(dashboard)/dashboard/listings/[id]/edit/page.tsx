'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Upload,
  X,
  ArrowLeft,
  Save,
  Loader2,
  Image as ImageIcon,
  AlertCircle,
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';
import { api } from '@/lib/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import Link from 'next/link';

interface PhotoFile {
  id: string;
  file: File;
  preview: string;
}

interface ExistingPhoto {
  id: string;
  url: string;
}

interface FormData {
  make: string;
  model: string;
  year: string;
  trim: string;
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

export default function EditListingPage() {
  const router = useRouter();
  const params = useParams();
  const listingId = params.id as string;
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [newImages, setNewImages] = useState<PhotoFile[]>([]);
  const [existingImages, setExistingImages] = useState<ExistingPhoto[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    make: '',
    model: '',
    year: '',
    trim: '',
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

  const { data: listingData, isLoading: queryLoading } = useQuery({
    queryKey: ['listing', listingId],
    queryFn: async () => {
      const data = await api.listings.getById(listingId);
      return data;
    },
    enabled: !!listingId,
  });

  useEffect(() => {
    if (listingData) {
      setFormData({
        make: listingData.make || '',
        model: listingData.model || '',
        year: listingData.year?.toString() || '',
        trim: listingData.trim || '',
        vin: listingData.vin || '',
        mileage: listingData.mileage?.toString() || '',
        fuelType: listingData.fuelType || '',
        transmission: listingData.transmission || '',
        driveType: listingData.driveType || '',
        bodyType: listingData.bodyType || '',
        condition: listingData.condition || 'USED',
        exteriorColor: listingData.exteriorColor || '',
        interiorColor: listingData.interiorColor || '',
        price: listingData.price?.toString() || '',
        originalPrice: listingData.originalPrice?.toString() || '',
        description: listingData.description || '',
      });

      if (listingData.media && Array.isArray(listingData.media)) {
        setExistingImages(
          listingData.media.map((m: any) => ({
            id: m.id || Math.random().toString(),
            url: m.url || m,
          }))
        );
      }
    }
  }, [listingData]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const photoFiles: PhotoFile[] = files.map((file) => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      preview: URL.createObjectURL(file),
    }));
    setNewImages((prev) => [...prev, ...photoFiles]);
  };

  const removeNewImage = (id: string) => {
    setNewImages((prev) => {
      const photo = prev.find((p) => p.id === id);
      if (photo) URL.revokeObjectURL(photo.preview);
      return prev.filter((p) => p.id !== id);
    });
  };

  const removeExistingImage = (id: string) => {
    setExistingImages((prev) => prev.filter((p) => p.id !== id));
  };

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      return api.listings.update(listingId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['listing', listingId] });
      queryClient.invalidateQueries({ queryKey: ['listings'] });
      toast.success('Listing updated successfully!');
      router.push('/dashboard/listings');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update listing');
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.make || !formData.model || !formData.year || !formData.price) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);

    try {
      const updateData = {
        make: formData.make,
        model: formData.model,
        year: parseInt(formData.year),
        trim: formData.trim || undefined,
        vin: formData.vin || undefined,
        mileage: formData.mileage ? parseInt(formData.mileage) : undefined,
        fuelType: formData.fuelType || undefined,
        transmission: formData.transmission || undefined,
        driveType: formData.driveType || undefined,
        bodyType: formData.bodyType || undefined,
        condition: formData.condition,
        exteriorColor: formData.exteriorColor || undefined,
        interiorColor: formData.interiorColor || undefined,
        price: parseFloat(formData.price),
        originalPrice: formData.originalPrice ? parseFloat(formData.originalPrice) : undefined,
        description: formData.description || undefined,
      };

      await updateMutation.mutateAsync(updateData);

      if (newImages.length > 0) {
        for (const photo of newImages) {
          try {
            await api.media.uploadForListing(listingId, photo.file);
          } catch (e) {
            console.error('Photo upload failed:', e);
          }
        }
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to update listing');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAuthenticated || user?.role !== 'USER') {
    return null;
  }

  if (queryLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!listingData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <AlertCircle className="h-16 w-16 text-destructive mb-4" />
        <h1 className="text-2xl font-bold mb-2">Listing Not Found</h1>
        <p className="text-muted-foreground mb-4">The listing you're looking for doesn't exist.</p>
        <Link href="/dashboard/listings">
          <Button>Back to Listings</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/listings">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="font-display text-3xl font-bold">Edit Listing</h1>
          <p className="text-muted-foreground mt-1">Update your vehicle information</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Vehicle Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="year">Year *</Label>
                <Input
                  id="year"
                  type="number"
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="make">Make *</Label>
                <Input
                  id="make"
                  value={formData.make}
                  onChange={(e) => setFormData({ ...formData, make: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="model">Model *</Label>
                <Input
                  id="model"
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="trim">Trim</Label>
                <Input
                  id="trim"
                  value={formData.trim}
                  onChange={(e) => setFormData({ ...formData, trim: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="vin">VIN</Label>
                <Input
                  id="vin"
                  value={formData.vin}
                  onChange={(e) => setFormData({ ...formData, vin: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="mileage">Mileage</Label>
                <Input
                  id="mileage"
                  type="number"
                  value={formData.mileage}
                  onChange={(e) => setFormData({ ...formData, mileage: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="condition">Condition</Label>
                <Select
                  value={formData.condition}
                  onValueChange={(value) => setFormData({ ...formData, condition: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NEW">New</SelectItem>
                    <SelectItem value="USED">Used</SelectItem>
                    <SelectItem value="CERTIFIED">Certified Pre-Owned</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bodyType">Body Type</Label>
                <Select
                  value={formData.bodyType}
                  onValueChange={(value) => setFormData({ ...formData, bodyType: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select body type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SEDAN">Sedan</SelectItem>
                    <SelectItem value="SUV">SUV</SelectItem>
                    <SelectItem value="TRUCK">Truck</SelectItem>
                    <SelectItem value="COUPE">Coupe</SelectItem>
                    <SelectItem value="HATCHBACK">Hatchback</SelectItem>
                    <SelectItem value="WAGON">Wagon</SelectItem>
                    <SelectItem value="VAN">Van</SelectItem>
                    <SelectItem value="CONVERTIBLE">Convertible</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="transmission">Transmission</Label>
                <Select
                  value={formData.transmission}
                  onValueChange={(value) => setFormData({ ...formData, transmission: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select transmission" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AUTOMATIC">Automatic</SelectItem>
                    <SelectItem value="MANUAL">Manual</SelectItem>
                    <SelectItem value="CVT">CVT</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fuelType">Fuel Type</Label>
                <Select
                  value={formData.fuelType}
                  onValueChange={(value) => setFormData({ ...formData, fuelType: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select fuel type" />
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
                <Label htmlFor="driveType">Drive Type</Label>
                <Select
                  value={formData.driveType}
                  onValueChange={(value) => setFormData({ ...formData, driveType: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select drive type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FWD">Front-Wheel Drive</SelectItem>
                    <SelectItem value="RWD">Rear-Wheel Drive</SelectItem>
                    <SelectItem value="AWD">All-Wheel Drive</SelectItem>
                    <SelectItem value="4WD">Four-Wheel Drive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="exteriorColor">Exterior Color</Label>
                <Input
                  id="exteriorColor"
                  value={formData.exteriorColor}
                  onChange={(e) => setFormData({ ...formData, exteriorColor: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="interiorColor">Interior Color</Label>
                <Input
                  id="interiorColor"
                  value={formData.interiorColor}
                  onChange={(e) => setFormData({ ...formData, interiorColor: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pricing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Price *</Label>
                <Input
                  id="price"
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="originalPrice">Original Price</Label>
                <Input
                  id="originalPrice"
                  type="number"
                  value={formData.originalPrice}
                  onChange={(e) => setFormData({ ...formData, originalPrice: e.target.value })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Photos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {existingImages.map((photo) => (
                <div key={photo.id} className="relative aspect-video rounded-lg overflow-hidden bg-slate-100">
                  <img src={photo.url} alt="Vehicle" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeExistingImage(photo.id)}
                    className="absolute top-2 right-2 p-1 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}

              {newImages.map((photo) => (
                <div key={photo.id} className="relative aspect-video rounded-lg overflow-hidden bg-slate-100">
                  <img src={photo.preview} alt="Upload preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeNewImage(photo.id)}
                    className="absolute top-2 right-2 p-1 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="aspect-video rounded-lg border-2 border-dashed border-slate-300 hover:border-primary transition-colors flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-primary"
              >
                <Upload className="h-8 w-8" />
                <span className="text-sm">Add Photos</span>
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageSelect}
              className="hidden"
            />
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button type="submit" disabled={isSubmitting} size="lg">
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Update Listing
              </>
            )}
          </Button>
          <Link href="/dashboard/listings">
            <Button type="button" variant="outline" size="lg">
              Cancel
            </Button>
          </Link>
        </div>
      </form>
    </div>
  );
}

