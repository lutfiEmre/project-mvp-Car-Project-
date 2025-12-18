'use client';

import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  Building2, 
  Camera, 
  Globe, 
  Phone, 
  Mail, 
  MapPin,
  Clock,
  Facebook,
  Instagram,
  Twitter,
  Youtube,
  Save,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ImageCropper } from '@/components/ui/image-cropper';
import { useAuth } from '@/hooks/use-auth';
import { useAuthStore } from '@/stores/auth';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

export default function DealerSettingsPage() {
  const { user, refreshUser } = useAuth();
  const { setUser } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [cropperOpen, setCropperOpen] = useState(false);
  const [logoCropperOpen, setLogoCropperOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedLogo, setSelectedLogo] = useState<string | null>(null);
  const [pendingLogoBlob, setPendingLogoBlob] = useState<Blob | null>(null);
  const [pendingLogoPreview, setPendingLogoPreview] = useState<string | null>(null);


  const saveProfileMutation = useMutation({
    mutationFn: async () => {
      const token = localStorage.getItem('accessToken');
      
      if (!pendingLogoBlob) {
        throw new Error('No logo to save');
      }
      
      const formData = new FormData();
      formData.append('file', pendingLogoBlob, 'logo.jpg');
      
      const uploadResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/media/upload`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        }
      );
      
      if (!uploadResponse.ok) throw new Error('Failed to upload image');
      const { url } = await uploadResponse.json();
      
      const updateResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/dealers/me`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ logo: url }),
        }
      );
      
      if (!updateResponse.ok) throw new Error('Failed to update logo');
      return updateResponse.json();
    },
    onSuccess: (updatedDealer) => {
      toast.success('Profile updated successfully');
      if (updatedDealer && user?.dealer) {
        setUser({
          ...user,
          dealer: { ...user.dealer, logo: updatedDealer.logo }
        });
      }
      setPendingLogoBlob(null);
      setPendingLogoPreview(null);
      refreshUser?.();
    },
    onError: (error: any) => {
      console.error('Profile save error:', error);
      toast.error(`Failed to save profile: ${error.message || 'Unknown error'}`);
    },
  });

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setSelectedImage(reader.result as string);
        setCropperOpen(true);
      };
      reader.readAsDataURL(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setSelectedLogo(reader.result as string);
        setLogoCropperOpen(true);
      };
      reader.readAsDataURL(file);
    }
    if (logoInputRef.current) {
      logoInputRef.current.value = '';
    }
  };


  const handleLogoCropComplete = (croppedImage: Blob) => {
    setPendingLogoBlob(croppedImage);
    const previewUrl = URL.createObjectURL(croppedImage);
    setPendingLogoPreview(previewUrl);
    setLogoCropperOpen(false);
    setSelectedLogo(null);
    toast.success('Logo ready to save. Click "Save Changes" to apply.');
  };

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold">Dealership Settings</h1>
        <p className="text-muted-foreground">
          Manage your dealership profile and preferences
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="contact">Contact</TabsTrigger>
          <TabsTrigger value="hours">Hours</TabsTrigger>
          <TabsTrigger value="social">Social</TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="rounded-xl border bg-card p-6">
              <h3 className="font-semibold mb-4">Dealership Logo</h3>
              <div className="flex items-center gap-6">
                <Avatar className="h-24 w-24">
                  <AvatarImage 
                    src={
                      pendingLogoPreview || 
                      (user?.dealer?.logo ? `${user.dealer.logo}${user.dealer.logo.includes('?') ? '&' : '?'}cb=${Date.now()}` : '')
                    } 
                    alt="Dealership logo" 
                  />
                  <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                    {user?.dealer?.businessName?.substring(0, 2).toUpperCase() || 'DL'}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-2">
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                    className="hidden"
                  />
                  <Button 
                    variant="outline" 
                    className="gap-2"
                    onClick={() => logoInputRef.current?.click()}
                  >
                    <Camera className="h-4 w-4" />
                    Upload Logo
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    PNG, JPG. Max 10MB. Recommended: 400x400px
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border bg-card p-6">
              <h3 className="font-semibold mb-4">Banner Image</h3>
              <div className="aspect-[3/1] rounded-lg bg-gradient-to-r from-primary/20 to-coral-500/20 flex items-center justify-center">
                <Button variant="outline" className="gap-2">
                  <Camera className="h-4 w-4" />
                  Upload Banner
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Recommended: 1200x400px
              </p>
            </div>

            <div className="rounded-xl border bg-card p-6">
              <h3 className="font-semibold mb-4">Business Information</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label>Business Name</Label>
                  <Input defaultValue="Premium Auto Gallery" />
                </div>
                <div className="space-y-2">
                  <Label>Business License</Label>
                  <Input placeholder="License number" />
                </div>
                <div className="space-y-2">
                  <Label>Tax Number</Label>
                  <Input placeholder="Tax/GST number" />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>Description</Label>
                  <Textarea
                    rows={4}
                    defaultValue="Premium Auto Gallery is Toronto's trusted destination for luxury and pre-owned vehicles. With over 10 years of experience, we offer a curated selection of quality vehicles."
                  />
                </div>
              </div>
              <Button 
                className="mt-6 gap-2"
                onClick={() => saveProfileMutation.mutate()}
                disabled={!pendingLogoBlob || saveProfileMutation.isPending}
              >
                {saveProfileMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Save Changes
              </Button>
            </div>
          </motion.div>
        </TabsContent>

        {/* Contact Tab */}
        <TabsContent value="contact">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border bg-card p-6"
          >
            <h3 className="font-semibold mb-4">Contact Information</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Contact Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input defaultValue="sales@premiumauto.ca" className="pl-10" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Contact Phone</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input defaultValue="+1 (416) 555-0123" className="pl-10" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Website</Label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input defaultValue="https://premiumautogallery.ca" className="pl-10" />
                </div>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Address</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Textarea
                    defaultValue="123 Auto Drive, Toronto, ON M5V 2H1, Canada"
                    className="pl-10"
                    rows={2}
                  />
                </div>
              </div>
            </div>
            <Button className="mt-6 gap-2">
              <Save className="h-4 w-4" />
              Save Changes
            </Button>
          </motion.div>
        </TabsContent>

        {/* Hours Tab */}
        <TabsContent value="hours">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border bg-card p-6"
          >
            <h3 className="font-semibold mb-4">Business Hours</h3>
            <div className="space-y-4">
              {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                <div key={day} className="flex items-center gap-4">
                  <div className="w-28 font-medium">{day}</div>
                  <Switch defaultChecked={day !== 'Sunday'} />
                  <Input className="w-24" defaultValue="09:00" type="time" />
                  <span>to</span>
                  <Input className="w-24" defaultValue={day === 'Saturday' ? '17:00' : '20:00'} type="time" />
                </div>
              ))}
            </div>
            <Button className="mt-6 gap-2">
              <Save className="h-4 w-4" />
              Save Hours
            </Button>
          </motion.div>
        </TabsContent>

        {/* Social Tab */}
        <TabsContent value="social">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border bg-card p-6"
          >
            <h3 className="font-semibold mb-4">Social Media Links</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Facebook className="h-4 w-4" />
                  Facebook
                </Label>
                <Input placeholder="https://facebook.com/..." />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Instagram className="h-4 w-4" />
                  Instagram
                </Label>
                <Input placeholder="https://instagram.com/..." />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Twitter className="h-4 w-4" />
                  Twitter / X
                </Label>
                <Input placeholder="https://twitter.com/..." />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Youtube className="h-4 w-4" />
                  YouTube
                </Label>
                <Input placeholder="https://youtube.com/..." />
              </div>
            </div>
            <Button className="mt-6 gap-2">
              <Save className="h-4 w-4" />
              Save Links
            </Button>
          </motion.div>
        </TabsContent>
      </Tabs>

      {selectedLogo && (
        <ImageCropper
          image={selectedLogo}
          open={logoCropperOpen}
          onClose={() => {
            setLogoCropperOpen(false);
            setSelectedLogo(null);
          }}
          onCropComplete={handleLogoCropComplete}
          aspect={1}
          shape="round"
        />
      )}
    </div>
  );
}

