'use client';

import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Settings, 
  Globe, 
  Mail, 
  Bell, 
  Shield, 
  Database,
  Save,
  RefreshCw,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAdminSettings, useUpdateSetting } from '@/hooks/use-admin';
import { toast } from 'sonner';

export default function AdminSettingsPage() {
  const { data: settingsData, isLoading } = useAdminSettings();
  const updateSetting = useUpdateSetting();

  const settings = useMemo(() => {
    if (!settingsData) return {};
    return settingsData.reduce((acc: any, setting: any) => {
      acc[setting.key] = setting.value;
      return acc;
    }, {});
  }, [settingsData]);

  const [formData, setFormData] = useState({
    siteName: 'CarHaus',
    siteUrl: 'https://carhaus.ca',
    defaultLanguage: 'en',
    defaultCurrency: 'cad',
    siteDescription: "Canada's premier vehicle marketplace",
    requireApproval: true,
    allowPrivateSellers: true,
    featuredListings: true,
    smtpHost: 'smtp.mailgun.org',
    smtpPort: '587',
    smtpUsername: 'postmaster@carhaus.ca',
    smtpPassword: '',
    fromEmail: 'noreply@carhaus.ca',
    fromName: 'CarHaus',
    twoFactorAuth: true,
    sessionTimeout: '30',
    rateLimit: '100',
    maintenanceMode: false,
    maintenanceMessage: "We're currently performing scheduled maintenance. Please check back soon!",
  });

  useEffect(() => {
    if (settingsData && settingsData.length > 0) {
      setFormData({
        siteName: settings.siteName || 'CarHaus',
        siteUrl: settings.siteUrl || 'https://carhaus.ca',
        defaultLanguage: settings.defaultLanguage || 'en',
        defaultCurrency: settings.defaultCurrency || 'cad',
        siteDescription: settings.siteDescription || "Canada's premier vehicle marketplace",
        requireApproval: settings.requireApproval !== false,
        allowPrivateSellers: settings.allowPrivateSellers !== false,
        featuredListings: settings.featuredListings !== false,
        smtpHost: settings.smtpHost || 'smtp.mailgun.org',
        smtpPort: settings.smtpPort || '587',
        smtpUsername: settings.smtpUsername || 'postmaster@carhaus.ca',
        smtpPassword: '',
        fromEmail: settings.fromEmail || 'noreply@carhaus.ca',
        fromName: settings.fromName || 'CarHaus',
        twoFactorAuth: settings.twoFactorAuth !== false,
        sessionTimeout: settings.sessionTimeout || '30',
        rateLimit: settings.rateLimit || '100',
        maintenanceMode: settings.maintenanceMode === true,
        maintenanceMessage: settings.maintenanceMessage || "We're currently performing scheduled maintenance. Please check back soon!",
      });
    }
  }, [settingsData, settings]);

  const handleSaveSetting = async (key: string, value: any) => {
    try {
      await updateSetting.mutateAsync({ key, value });
      toast.success('Setting saved successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to save setting');
    }
  };

  const handleSaveGeneral = () => {
    handleSaveSetting('siteName', formData.siteName);
    handleSaveSetting('siteUrl', formData.siteUrl);
    handleSaveSetting('defaultLanguage', formData.defaultLanguage);
    handleSaveSetting('defaultCurrency', formData.defaultCurrency);
    handleSaveSetting('siteDescription', formData.siteDescription);
    handleSaveSetting('requireApproval', formData.requireApproval);
    handleSaveSetting('allowPrivateSellers', formData.allowPrivateSellers);
    handleSaveSetting('featuredListings', formData.featuredListings);
  };

  const handleSaveEmail = () => {
    handleSaveSetting('smtpHost', formData.smtpHost);
    handleSaveSetting('smtpPort', formData.smtpPort);
    handleSaveSetting('smtpUsername', formData.smtpUsername);
    if (formData.smtpPassword) {
      handleSaveSetting('smtpPassword', formData.smtpPassword);
    }
    handleSaveSetting('fromEmail', formData.fromEmail);
    handleSaveSetting('fromName', formData.fromName);
  };

  const handleSaveSecurity = () => {
    handleSaveSetting('twoFactorAuth', formData.twoFactorAuth);
    handleSaveSetting('sessionTimeout', formData.sessionTimeout);
    handleSaveSetting('rateLimit', formData.rateLimit);
  };

  const handleSaveMaintenance = () => {
    handleSaveSetting('maintenanceMode', formData.maintenanceMode);
    handleSaveSetting('maintenanceMessage', formData.maintenanceMessage);
  };

  const handleTestEmail = () => {
    toast.info('Test email functionality would be implemented here');
  };

  const handleClearCache = () => {
    toast.info('Cache cleared');
  };

  const handleRebuildIndex = () => {
    toast.info('Search index rebuild started');
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold">System Settings</h1>
        <p className="text-muted-foreground">
          Configure platform-wide settings
        </p>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="email">Email</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="rounded-xl border bg-card p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Site Settings
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Site Name</Label>
                  <Input 
                    value={formData.siteName}
                    onChange={(e) => setFormData({ ...formData, siteName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Site URL</Label>
                  <Input 
                    value={formData.siteUrl}
                    onChange={(e) => setFormData({ ...formData, siteUrl: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Default Language</Label>
                  <Select value={formData.defaultLanguage} onValueChange={(v) => setFormData({ ...formData, defaultLanguage: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="fr">French</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Default Currency</Label>
                  <Select value={formData.defaultCurrency} onValueChange={(v) => setFormData({ ...formData, defaultCurrency: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cad">CAD</SelectItem>
                      <SelectItem value="usd">USD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>Site Description</Label>
                  <Textarea 
                    value={formData.siteDescription}
                    onChange={(e) => setFormData({ ...formData, siteDescription: e.target.value })}
                  />
                </div>
              </div>
              <Button className="mt-6 gap-2" onClick={handleSaveGeneral} disabled={updateSetting.isPending}>
                {updateSetting.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Save Changes
              </Button>
            </div>

            <div className="rounded-xl border bg-card p-6">
              <h3 className="font-semibold mb-4">Listing Settings</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Require Approval</Label>
                    <p className="text-sm text-muted-foreground">
                      New listings require admin approval before going live
                    </p>
                  </div>
                  <Switch 
                    checked={formData.requireApproval}
                    onCheckedChange={(checked) => {
                      setFormData({ ...formData, requireApproval: checked });
                      handleSaveSetting('requireApproval', checked);
                    }}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Allow Private Sellers</Label>
                    <p className="text-sm text-muted-foreground">
                      Allow non-dealer users to create listings
                    </p>
                  </div>
                  <Switch 
                    checked={formData.allowPrivateSellers}
                    onCheckedChange={(checked) => {
                      setFormData({ ...formData, allowPrivateSellers: checked });
                      handleSaveSetting('allowPrivateSellers', checked);
                    }}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Featured Listings</Label>
                    <p className="text-sm text-muted-foreground">
                      Enable featured listing promotions
                    </p>
                  </div>
                  <Switch 
                    checked={formData.featuredListings}
                    onCheckedChange={(checked) => {
                      setFormData({ ...formData, featuredListings: checked });
                      handleSaveSetting('featuredListings', checked);
                    }}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        </TabsContent>

        {/* Email Settings */}
        <TabsContent value="email">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border bg-card p-6"
          >
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Email Configuration
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>SMTP Host</Label>
                <Input 
                  value={formData.smtpHost}
                  onChange={(e) => setFormData({ ...formData, smtpHost: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>SMTP Port</Label>
                <Input 
                  value={formData.smtpPort}
                  onChange={(e) => setFormData({ ...formData, smtpPort: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>SMTP Username</Label>
                <Input 
                  value={formData.smtpUsername}
                  onChange={(e) => setFormData({ ...formData, smtpUsername: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>SMTP Password</Label>
                <Input 
                  type="password" 
                  value={formData.smtpPassword}
                  onChange={(e) => setFormData({ ...formData, smtpPassword: e.target.value })}
                  placeholder="Enter new password to update"
                />
              </div>
              <div className="space-y-2">
                <Label>From Email</Label>
                <Input 
                  value={formData.fromEmail}
                  onChange={(e) => setFormData({ ...formData, fromEmail: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>From Name</Label>
                <Input 
                  value={formData.fromName}
                  onChange={(e) => setFormData({ ...formData, fromName: e.target.value })}
                />
              </div>
            </div>
            <div className="mt-6 flex gap-2">
              <Button className="gap-2" onClick={handleSaveEmail} disabled={updateSetting.isPending}>
                {updateSetting.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Save Changes
              </Button>
              <Button variant="outline" className="gap-2" onClick={handleTestEmail}>
                <Mail className="h-4 w-4" />
                Send Test Email
              </Button>
            </div>
          </motion.div>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="rounded-xl border bg-card p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security Settings
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Two-Factor Authentication</Label>
                    <p className="text-sm text-muted-foreground">
                      Require 2FA for all admin accounts
                    </p>
                  </div>
                  <Switch 
                    checked={formData.twoFactorAuth}
                    onCheckedChange={(checked) => {
                      setFormData({ ...formData, twoFactorAuth: checked });
                      handleSaveSetting('twoFactorAuth', checked);
                    }}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Session Timeout</Label>
                    <p className="text-sm text-muted-foreground">
                      Auto logout after inactivity
                    </p>
                  </div>
                  <Select value={formData.sessionTimeout} onValueChange={(v) => {
                    setFormData({ ...formData, sessionTimeout: v });
                    handleSaveSetting('sessionTimeout', v);
                  }}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 minutes</SelectItem>
                      <SelectItem value="30">30 minutes</SelectItem>
                      <SelectItem value="60">1 hour</SelectItem>
                      <SelectItem value="120">2 hours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Rate Limiting</Label>
                    <p className="text-sm text-muted-foreground">
                      Limit API requests per minute
                    </p>
                  </div>
                  <Input 
                    className="w-[100px]" 
                    value={formData.rateLimit}
                    onChange={(e) => setFormData({ ...formData, rateLimit: e.target.value })}
                    type="number" 
                  />
                </div>
              </div>
              <Button className="mt-6 gap-2" onClick={handleSaveSecurity} disabled={updateSetting.isPending}>
                {updateSetting.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Save Changes
              </Button>
            </div>
          </motion.div>
        </TabsContent>

        {/* Maintenance */}
        <TabsContent value="maintenance">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="rounded-xl border bg-card p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Database className="h-5 w-5" />
                Maintenance Mode
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Enable Maintenance Mode</Label>
                    <p className="text-sm text-muted-foreground">
                      Show maintenance page to all visitors
                    </p>
                  </div>
                  <Switch 
                    checked={formData.maintenanceMode}
                    onCheckedChange={(checked) => {
                      setFormData({ ...formData, maintenanceMode: checked });
                      handleSaveSetting('maintenanceMode', checked);
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Maintenance Message</Label>
                  <Textarea 
                    value={formData.maintenanceMessage}
                    onChange={(e) => setFormData({ ...formData, maintenanceMessage: e.target.value })}
                  />
                </div>
                <Button className="mt-4 gap-2" onClick={handleSaveMaintenance} disabled={updateSetting.isPending}>
                  {updateSetting.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Save Changes
                </Button>
              </div>
            </div>

            <div className="rounded-xl border bg-card p-6">
              <h3 className="font-semibold mb-4">System Actions</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                  <div>
                    <p className="font-medium">Clear Cache</p>
                    <p className="text-sm text-muted-foreground">
                      Clear all cached data
                    </p>
                  </div>
                  <Button variant="outline" className="gap-2" onClick={handleClearCache}>
                    <RefreshCw className="h-4 w-4" />
                    Clear Cache
                  </Button>
                </div>
                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                  <div>
                    <p className="font-medium">Rebuild Search Index</p>
                    <p className="text-sm text-muted-foreground">
                      Reindex all listings for search
                    </p>
                  </div>
                  <Button variant="outline" className="gap-2" onClick={handleRebuildIndex}>
                    <RefreshCw className="h-4 w-4" />
                    Rebuild Index
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

