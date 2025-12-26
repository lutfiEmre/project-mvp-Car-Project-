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
import { useTranslations } from 'next-intl';

export default function DealerSettingsPage() {
  const t = useTranslations('dealer.settings');
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
      toast.success(t('profileUpdatedSuccess'));
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
      toast.error(t('failedToSaveProfile') + `: ${error.message || 'Unknown error'}`);
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
    toast.success(t('logoReadyToSave'));
  };

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold">{t('title')}</h1>
        <p className="text-muted-foreground">
          {t('subtitle')}
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile">{t('profile')}</TabsTrigger>
          <TabsTrigger value="contact">{t('contact')}</TabsTrigger>
          <TabsTrigger value="hours">{t('hours')}</TabsTrigger>
          <TabsTrigger value="social">{t('social')}</TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="rounded-xl border bg-card p-6">
              <h3 className="font-semibold mb-4">{t('dealershipLogo')}</h3>
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
                    {t('uploadLogo')}
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    {t('logoFormat')}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border bg-card p-6">
              <h3 className="font-semibold mb-4">{t('bannerImage')}</h3>
              <div className="aspect-[3/1] rounded-lg bg-gradient-to-r from-primary/20 to-coral-500/20 flex items-center justify-center">
                <Button variant="outline" className="gap-2">
                  <Camera className="h-4 w-4" />
                  {t('uploadBanner')}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {t('bannerFormat')}
              </p>
            </div>

            <div className="rounded-xl border bg-card p-6">
              <h3 className="font-semibold mb-4">{t('businessInformation')}</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label>{t('businessName')}</Label>
                  <Input defaultValue="Premium Auto Gallery" />
                </div>
                <div className="space-y-2">
                  <Label>{t('businessLicense')}</Label>
                  <Input placeholder={t('licensePlaceholder')} />
                </div>
                <div className="space-y-2">
                  <Label>{t('taxNumber')}</Label>
                  <Input placeholder={t('taxPlaceholder')} />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>{t('description')}</Label>
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
                {t('saveChanges')}
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
            <h3 className="font-semibold mb-4">{t('contactInformation')}</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>{t('contactEmail')}</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input defaultValue="sales@premiumauto.ca" className="pl-10" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t('contactPhone')}</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input defaultValue="+1 (416) 555-0123" className="pl-10" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t('website')}</Label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input defaultValue="https://premiumautogallery.ca" className="pl-10" />
                </div>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>{t('address')}</Label>
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
              {t('saveChanges')}
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
            <h3 className="font-semibold mb-4">{t('businessHours')}</h3>
            <div className="space-y-4">
              {[t('monday'), t('tuesday'), t('wednesday'), t('thursday'), t('friday'), t('saturday'), t('sunday')].map((day) => (
                <div key={day} className="flex items-center gap-4">
                  <div className="w-28 font-medium">{day}</div>
                  <Switch defaultChecked={day !== 'Sunday'} />
                  <Input className="w-24" defaultValue="09:00" type="time" />
                  <span>{t('to')}</span>
                  <Input className="w-24" defaultValue={day === t('saturday') ? '17:00' : '20:00'} type="time" />
                </div>
              ))}
            </div>
            <Button className="mt-6 gap-2">
              <Save className="h-4 w-4" />
              {t('saveHours')}
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
            <h3 className="font-semibold mb-4">{t('socialMediaLinks')}</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Facebook className="h-4 w-4" />
                  {t('facebook')}
                </Label>
                <Input placeholder="https://facebook.com/..." />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Instagram className="h-4 w-4" />
                  {t('instagram')}
                </Label>
                <Input placeholder="https://instagram.com/..." />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Twitter className="h-4 w-4" />
                  {t('twitter')}
                </Label>
                <Input placeholder="https://twitter.com/..." />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Youtube className="h-4 w-4" />
                  {t('youtube')}
                </Label>
                <Input placeholder="https://youtube.com/..." />
              </div>
            </div>
            <Button className="mt-6 gap-2">
              <Save className="h-4 w-4" />
              {t('saveLinks')}
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

