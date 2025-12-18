'use client';

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  User, 
  Bell, 
  Lock, 
  Globe, 
  Palette, 
  Shield,
  Camera,
  Mail,
  Phone,
  MapPin,
  Save,
  Eye,
  EyeOff,
  Trash2,
  Loader2,
  AlertTriangle,
  Upload,
} from 'lucide-react';
import { ImageCropper } from '@/components/ui/image-cropper';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/use-auth';
import { useAuthStore } from '@/stores/auth';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { User as UserType } from '@carhaus/types';

export default function SettingsPage() {
  const { user, refreshUser } = useAuth();
  const { setUser } = useAuthStore();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [showPassword, setShowPassword] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteReason, setDeleteReason] = useState('');
  const [cropperOpen, setCropperOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [pendingAvatarBlob, setPendingAvatarBlob] = useState<Blob | null>(null);
  const [pendingAvatarPreview, setPendingAvatarPreview] = useState<string | null>(null);
  
  const [profileForm, setProfileForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    bio: '',
    city: '',
    province: '',
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
    marketingEmails: false,
  });

  useEffect(() => {
    if (user) {
      setProfileForm({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
        bio: user.bio || '',
        city: user.city || '',
        province: user.province || '',
      });
    }
  }, [user]);

  const { data: notificationSettings } = useQuery({
    queryKey: ['notification-settings'],
    queryFn: async () => {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/users/me/notification-settings`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!response.ok) return null;
      return response.json();
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (notificationSettings) {
      setNotifications(notificationSettings);
    }
  }, [notificationSettings]);

  const updateProfileMutation = useMutation({
    mutationFn: async (data: typeof profileForm) => {
      const token = localStorage.getItem('accessToken');
      
      let avatarUrl = user?.avatar;
      
      if (pendingAvatarBlob) {
        const formData = new FormData();
        formData.append('file', pendingAvatarBlob, 'avatar.jpg');
        
        const uploadResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/media/upload`,
          {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
            body: formData,
          }
        );
        
        if (!uploadResponse.ok) {
          const error = await uploadResponse.json();
          console.error('Upload error:', error);
          throw new Error(error.message || 'Failed to upload avatar');
        }
        const uploadResult = await uploadResponse.json();
        console.log('Upload result:', uploadResult);
        avatarUrl = uploadResult.url || uploadResult.fileUrl || uploadResult.path;
        
        if (!avatarUrl) {
          console.error('No URL in upload result:', uploadResult);
          throw new Error('No URL returned from upload');
        }
      }
      
      const { email, ...updateData } = data;
      const requestBody = { 
        ...updateData, 
        ...(avatarUrl && avatarUrl !== user?.avatar && { avatar: avatarUrl }) 
      };
      
      console.log('Sending to backend:', requestBody);
      console.log('Avatar URL being sent:', avatarUrl);
      
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/users/me`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(requestBody),
        }
      );
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update profile');
      }
      return response.json();
    },
    onSuccess: async (updatedUser) => {
      console.log('Updated user from backend:', updatedUser);
      
      if (updatedUser && user) {
        const newUserData: UserType = {
          id: user.id,
          email: user.email,
          firstName: updatedUser.firstName,
          lastName: updatedUser.lastName,
          phone: updatedUser.phone,
          avatar: updatedUser.avatar,
          bio: updatedUser.bio,
          city: updatedUser.city,
          province: updatedUser.province,
          role: user.role,
          status: user.status,
          emailVerified: user.emailVerified,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        };
        console.log('Setting new user:', newUserData);
        setUser(newUserData);
        
        localStorage.setItem('user', JSON.stringify(newUserData));
        
        await new Promise(resolve => setTimeout(resolve, 100));
        
        queryClient.invalidateQueries({ queryKey: ['user', 'me'] });
        
        toast.success('Profile updated successfully');
        
        window.location.href = '/dashboard/settings';
      }
      
      setPendingAvatarBlob(null);
      setPendingAvatarPreview(null);
    },
    onError: (error: any) => {
      console.error('Profile update error:', error);
      toast.error(`Failed to update profile: ${error.message || 'Unknown error'}`);
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: async (data: { currentPassword: string; newPassword: string }) => {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/users/me/change-password`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(data),
        }
      );
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to change password');
      }
      return response.json();
    },
    onSuccess: () => {
      toast.success('Password changed successfully');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to change password');
    },
  });

  const uploadAvatarMutation = useMutation({
    mutationFn: async (file: Blob) => {
      const token = localStorage.getItem('accessToken');
      const formData = new FormData();
      formData.append('file', file, 'avatar.jpg');
      
      const uploadResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/media/upload`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        }
      );
      
      if (!uploadResponse.ok) {
        const error = await uploadResponse.json();
        throw new Error(error.message || 'Failed to upload image');
      }
      const { url } = await uploadResponse.json();
      
      const updateResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/users/me/avatar`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ avatarUrl: url }),
        }
      );
      
      if (!updateResponse.ok) {
        const error = await updateResponse.json();
        throw new Error(error.message || 'Failed to update avatar');
      }
      return updateResponse.json();
    },
    onSuccess: (updatedUser) => {
      toast.success('Profile photo updated successfully');
      if (updatedUser && user) {
        setUser({ ...user, avatar: updatedUser.avatar });
      }
      refreshUser?.();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to upload photo');
    },
  });

  const updateNotificationsMutation = useMutation({
    mutationFn: async (settings: typeof notifications) => {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/users/me/notification-settings`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(settings),
        }
      );
      if (!response.ok) throw new Error('Failed to update settings');
      return response.json();
    },
    onSuccess: () => {
      toast.success('Notification settings updated');
    },
    onError: () => {
      toast.error('Failed to update notification settings');
    },
  });

  const requestDeletionMutation = useMutation({
    mutationFn: async (reason: string) => {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/users/me/request-deletion`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ reason }),
        }
      );
      if (!response.ok) throw new Error('Failed to submit request');
      return response.json();
    },
    onSuccess: () => {
      toast.success('Account deletion request submitted');
      setDeleteDialogOpen(false);
      setDeleteReason('');
    },
    onError: () => {
      toast.error('Failed to submit deletion request');
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

  const handleCropComplete = (croppedImage: Blob) => {
    setPendingAvatarBlob(croppedImage);
    const previewUrl = URL.createObjectURL(croppedImage);
    setPendingAvatarPreview(previewUrl);
    setCropperOpen(false);
    setSelectedImage(null);
    toast.success('Avatar ready to save. Click "Save Changes" to apply.');
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    changePasswordMutation.mutate({
      currentPassword: passwordForm.currentPassword,
      newPassword: passwordForm.newPassword,
    });
  };

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings and preferences
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
          <TabsTrigger value="profile" className="gap-2">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Profile</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">Notifications</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <Lock className="h-4 w-4" />
            <span className="hidden sm:inline">Security</span>
          </TabsTrigger>
          <TabsTrigger value="preferences" className="gap-2">
            <Palette className="h-4 w-4" />
            <span className="hidden sm:inline">Preferences</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="rounded-xl border bg-card p-6">
              <h3 className="font-semibold mb-4">Profile Photo</h3>
              <div className="flex items-center gap-6">
                <Avatar className="h-20 w-20" key={user?.avatar || 'no-avatar'}>
                  <AvatarImage 
                    src={
                      pendingAvatarPreview || 
                      (user?.avatar ? `${user.avatar}?cb=${Date.now()}` : '')
                    } 
                    alt="Profile photo"
                    key={user?.avatar || 'avatar-img'}
                  />
                  <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                    {user?.firstName?.[0]}{user?.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="gap-2"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Camera className="h-4 w-4" />
                    Change Photo
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    JPG, PNG or GIF. Max 2MB.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border bg-card p-6">
              <h3 className="font-semibold mb-4">Personal Information</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input 
                    id="firstName" 
                    value={profileForm.firstName}
                    onChange={(e) => setProfileForm({ ...profileForm, firstName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input 
                    id="lastName" 
                    value={profileForm.lastName}
                    onChange={(e) => setProfileForm({ ...profileForm, lastName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input 
                      id="email" 
                      value={profileForm.email}
                      onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                      className="pl-10" 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input 
                      id="phone" 
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                      className="pl-10" 
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  placeholder="Tell us about yourself..."
                  value={profileForm.bio}
                  onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                  rows={4}
                  maxLength={500}
                />
                <p className="text-xs text-muted-foreground text-right">
                  {profileForm.bio.length}/500
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="city"
                      placeholder="e.g., Toronto"
                      value={profileForm.city}
                      onChange={(e) => setProfileForm({ ...profileForm, city: e.target.value })}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="province">Province</Label>
                  <Select
                    value={profileForm.province}
                    onValueChange={(value) => setProfileForm({ ...profileForm, province: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select province" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Ontario">Ontario</SelectItem>
                      <SelectItem value="Quebec">Quebec</SelectItem>
                      <SelectItem value="British Columbia">British Columbia</SelectItem>
                      <SelectItem value="Alberta">Alberta</SelectItem>
                      <SelectItem value="Manitoba">Manitoba</SelectItem>
                      <SelectItem value="Saskatchewan">Saskatchewan</SelectItem>
                      <SelectItem value="Nova Scotia">Nova Scotia</SelectItem>
                      <SelectItem value="New Brunswick">New Brunswick</SelectItem>
                      <SelectItem value="Newfoundland and Labrador">Newfoundland and Labrador</SelectItem>
                      <SelectItem value="Prince Edward Island">Prince Edward Island</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button 
                className="mt-6 gap-2"
                onClick={() => updateProfileMutation.mutate(profileForm)}
                disabled={updateProfileMutation.isPending}
              >
                {updateProfileMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                <Save className="h-4 w-4" />
                )}
                Save Changes
              </Button>
            </div>
          </motion.div>
        </TabsContent>

        <TabsContent value="notifications">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border bg-card p-6"
          >
            <h3 className="font-semibold mb-6">Notification Preferences</h3>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive notifications via email
                  </p>
                </div>
                <Switch
                  checked={notifications.emailNotifications}
                  onCheckedChange={(checked) =>
                    setNotifications({ ...notifications, emailNotifications: checked })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Push Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive push notifications on your device
                  </p>
                </div>
                <Switch
                  checked={notifications.pushNotifications}
                  onCheckedChange={(checked) =>
                    setNotifications({ ...notifications, pushNotifications: checked })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>SMS Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive notifications via SMS
                  </p>
                </div>
                <Switch
                  checked={notifications.smsNotifications}
                  onCheckedChange={(checked) =>
                    setNotifications({ ...notifications, smsNotifications: checked })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Marketing Emails</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive marketing and promotional emails
                  </p>
                </div>
                <Switch
                  checked={notifications.marketingEmails}
                  onCheckedChange={(checked) =>
                    setNotifications({ ...notifications, marketingEmails: checked })
                  }
                />
              </div>
            </div>
            <Button 
              className="mt-6 gap-2"
              onClick={() => updateNotificationsMutation.mutate(notifications)}
              disabled={updateNotificationsMutation.isPending}
            >
              {updateNotificationsMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
              <Save className="h-4 w-4" />
              )}
              Save Preferences
            </Button>
          </motion.div>
        </TabsContent>

        <TabsContent value="security">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="rounded-xl border bg-card p-6">
              <h3 className="font-semibold mb-4">Change Password</h3>
              <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-md">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <div className="relative">
                    <Input
                      id="currentPassword"
                      type={showPassword ? 'text' : 'password'}
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type={showPassword ? 'text' : 'password'}
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  />
                </div>
                <Button 
                  type="submit" 
                  className="gap-2"
                  disabled={changePasswordMutation.isPending}
                >
                  {changePasswordMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                  <Lock className="h-4 w-4" />
                  )}
                  Update Password
                </Button>
              </form>
            </div>

            <div className="rounded-xl border bg-card p-6">
              <h3 className="font-semibold mb-4">Two-Factor Authentication</h3>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm">
                    Add an extra layer of security to your account
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Status: <span className="text-yellow-600">Not Enabled</span>
                  </p>
                </div>
                <Button variant="outline" className="gap-2">
                  <Shield className="h-4 w-4" />
                  Enable 2FA
                </Button>
              </div>
            </div>

            <div className="rounded-xl border border-destructive/50 bg-destructive/5 p-6">
              <h3 className="font-semibold mb-4 text-destructive">Delete Account</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Once you delete your account, there is no going back. Your request will be reviewed by an admin.
              </p>
              <Button 
                variant="destructive" 
                className="gap-2"
                onClick={() => setDeleteDialogOpen(true)}
              >
                <Trash2 className="h-4 w-4" />
                Request Account Deletion
              </Button>
            </div>
          </motion.div>
        </TabsContent>

        <TabsContent value="preferences">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border bg-card p-6"
          >
            <h3 className="font-semibold mb-6">Display Preferences</h3>
            <div className="space-y-6 max-w-md">
              <div className="space-y-2">
                <Label>Language</Label>
                <Select defaultValue="en">
                  <SelectTrigger>
                    <Globe className="mr-2 h-4 w-4" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="fr">Français</SelectItem>
                    <SelectItem value="es">Español</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Currency</Label>
                <Select defaultValue="cad">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cad">CAD ($)</SelectItem>
                    <SelectItem value="usd">USD ($)</SelectItem>
                    <SelectItem value="eur">EUR (€)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Distance Unit</Label>
                <Select defaultValue="km">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="km">Kilometers (km)</SelectItem>
                    <SelectItem value="mi">Miles (mi)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button className="gap-2">
                <Save className="h-4 w-4" />
                Save Preferences
              </Button>
            </div>
          </motion.div>
        </TabsContent>
      </Tabs>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Request Account Deletion
            </DialogTitle>
            <DialogDescription>
              Your account deletion request will be reviewed by an admin. This process may take 1-3 business days.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Reason for deletion (optional)</Label>
              <Textarea
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                placeholder="Please tell us why you want to delete your account..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={() => requestDeletionMutation.mutate(deleteReason)}
              disabled={requestDeletionMutation.isPending}
            >
              {requestDeletionMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Submit Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {selectedImage && (
        <ImageCropper
          image={selectedImage}
          open={cropperOpen}
          onClose={() => {
            setCropperOpen(false);
            setSelectedImage(null);
          }}
          onCropComplete={handleCropComplete}
          aspect={1}
          shape="round"
        />
      )}
    </div>
  );
}
