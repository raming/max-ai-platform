'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import {
  Save,
  Settings,
  Palette,
  Shield,
  Bell,
  FileText,
  AlertCircle,
  CheckCircle,
  Undo,
  Redo,
  Eye,
  Edit
} from 'lucide-react';
import {
  settingsService,
  contentValidation,
  autoSaveService,
  type UserSettings
} from '@/lib/services/mock-content';

// Dynamically import QuillEditor to avoid SSR issues
const QuillEditor = dynamic(() => import('@max-ai/ui-editor').then(mod => ({ default: mod.QuillEditor })), {
  ssr: false,
  loading: () => <div className="h-32 bg-gray-100 rounded animate-pulse" />
});

export default function SettingsPage() {
  const queryClient = useQueryClient();

  const [isEditing, setIsEditing] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [validationWarnings, setValidationWarnings] = useState<string[]>([]);

  // Form state
  const [settingsData, setSettingsData] = useState<Partial<UserSettings>>({
    theme: 'light',
    language: 'en',
    timezone: 'UTC',
    notifications: {
      email: true,
      push: false,
      marketing: false
    },
    privacy: {
      profileVisibility: 'public',
      dataSharing: false,
      analytics: true
    },
    contentPreferences: {
      autoSave: true,
      maxContentSize: 50000,
      defaultEditorMode: 'rich'
    },
    aboutContent: '',
    termsContent: ''
  });

  // Fetch user settings
  const { data: settings, isLoading: settingsLoading } = useQuery({
    queryKey: ['user-settings'],
    queryFn: () => settingsService.getSettings('current-user') // Using current-user as default
  });

  // Update settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: (updates: Partial<UserSettings>) =>
      Promise.resolve(settingsService.updateSettings('current-user', updates)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-settings'] });
      setHasUnsavedChanges(false);
      setValidationErrors([]);
      setValidationWarnings([]);
    }
  });

  // Initialize form data when settings load
  useEffect(() => {
    if (settings) {
      setSettingsData({
        theme: settings.theme,
        language: settings.language,
        timezone: settings.timezone,
        notifications: { ...settings.notifications },
        privacy: { ...settings.privacy },
        contentPreferences: { ...settings.contentPreferences },
        aboutContent: settings.aboutContent,
        termsContent: settings.termsContent
      });

      // Check for saved drafts
      const aboutDraft = autoSaveService.getDraft('current-user', 'settings');
      const termsDraft = autoSaveService.getDraft('current-user', 'settings');

      if (aboutDraft) {
        setSettingsData((prev: Partial<UserSettings>) => ({ ...prev, aboutContent: aboutDraft }));
        setHasUnsavedChanges(true);
      }

      if (termsDraft) {
        setSettingsData((prev: Partial<UserSettings>) => ({ ...prev, termsContent: termsDraft }));
        setHasUnsavedChanges(true);
      }
    }
  }, [settings]);

  // Auto-save functionality
  useEffect(() => {
    if (settingsData.contentPreferences?.autoSave && hasUnsavedChanges) {
      const timeoutId = setTimeout(() => {
        if (settingsData.aboutContent) {
          autoSaveService.saveDraft('current-user', 'settings', settingsData.aboutContent);
        }
        if (settingsData.termsContent) {
          autoSaveService.saveDraft('current-user', 'settings', settingsData.termsContent);
        }
      }, 30000); // Auto-save every 30 seconds

      return () => clearTimeout(timeoutId);
    }
  }, [settingsData.aboutContent, settingsData.termsContent, hasUnsavedChanges, settingsData.contentPreferences?.autoSave]);

  const handleContentChange = (field: 'aboutContent' | 'termsContent', content: string) => {
    setSettingsData((prev: Partial<UserSettings>) => ({ ...prev, [field]: content }));
    setHasUnsavedChanges(true);

    // Validate content
    if (settingsData.contentPreferences?.maxContentSize) {
      const validation = contentValidation.validateHtmlContent(
        content,
        settingsData.contentPreferences.maxContentSize
      );

      setValidationErrors(validation.errors);
      setValidationWarnings(validation.warnings);
    }
  };

  const handleSave = () => {
    if (validationErrors.length > 0) {
      alert('Please fix validation errors before saving.');
      return;
    }

    updateSettingsMutation.mutate(settingsData);
    autoSaveService.clearDraft('current-user', 'settings');
    autoSaveService.clearDraft('current-user', 'settings');
  };

  const handleUndo = () => {
    // This would need to be implemented in the QuillEditor component
    console.log('Undo functionality would be implemented here');
  };

  const handleRedo = () => {
    // This would need to be implemented in the QuillEditor component
    console.log('Redo functionality would be implemented here');
  };

  const toggleEditMode = () => {
    setIsEditing(!isEditing);
  };

  if (settingsLoading) {
    return (
      <div className="space-y-6 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="h-32 bg-muted rounded"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            Manage your account settings and preferences
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {hasUnsavedChanges && (
            <Badge variant="outline" className="text-orange-600">
              Unsaved changes
            </Badge>
          )}
          <Button
            variant={isEditing ? "default" : "outline"}
            onClick={toggleEditMode}
          >
            {isEditing ? <Eye className="h-4 w-4 mr-2" /> : <Edit className="h-4 w-4 mr-2" />}
            {isEditing ? 'Preview' : 'Edit'}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="privacy">Privacy</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="h-5 w-5" />
                <span>General Settings</span>
              </CardTitle>
              <CardDescription>
                Configure your basic account settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="language">Language</Label>
                  <Select
                    value={settingsData.language || 'en'}
                    onValueChange={(value) => {
                      setSettingsData((prev: Partial<UserSettings>) => ({ ...prev, language: value }));
                      setHasUnsavedChanges(true);
                    }}
                    disabled={!isEditing}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Spanish</SelectItem>
                      <SelectItem value="fr">French</SelectItem>
                      <SelectItem value="de">German</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select
                    value={settingsData.timezone || 'UTC'}
                    onValueChange={(value) => {
                      setSettingsData((prev: Partial<UserSettings>) => ({ ...prev, timezone: value }));
                      setHasUnsavedChanges(true);
                    }}
                    disabled={!isEditing}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UTC">UTC</SelectItem>
                      <SelectItem value="EST">Eastern Time</SelectItem>
                      <SelectItem value="PST">Pacific Time</SelectItem>
                      <SelectItem value="GMT">GMT</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Palette className="h-5 w-5" />
                <span>Appearance</span>
              </CardTitle>
              <CardDescription>
                Customize the look and feel of your interface
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="theme">Theme</Label>
                <Select
                  value={settingsData.theme || 'light'}
                  onValueChange={(value) => {
                    setSettingsData((prev: Partial<UserSettings>) => ({ ...prev, theme: value }));
                    setHasUnsavedChanges(true);
                  }}
                  disabled={!isEditing}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Bell className="h-5 w-5" />
                <span>Notifications</span>
              </CardTitle>
              <CardDescription>
                Manage your notification preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="email-notifications">Email notifications</Label>
                <Switch
                  id="email-notifications"
                  checked={settingsData.notifications?.email || false}
                  onCheckedChange={(checked) => {
                    setSettingsData((prev: Partial<UserSettings>) => ({
                      ...prev,
                      notifications: { ...prev.notifications, email: checked }
                    }));
                    setHasUnsavedChanges(true);
                  }}
                  disabled={!isEditing}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="push-notifications">Push notifications</Label>
                <Switch
                  id="push-notifications"
                  checked={settingsData.notifications?.push || false}
                  onCheckedChange={(checked) => {
                    setSettingsData((prev: Partial<UserSettings>) => ({
                      ...prev,
                      notifications: { ...prev.notifications, push: checked }
                    }));
                    setHasUnsavedChanges(true);
                  }}
                  disabled={!isEditing}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="marketing-notifications">Marketing emails</Label>
                <Switch
                  id="marketing-notifications"
                  checked={settingsData.notifications?.marketing || false}
                  onCheckedChange={(checked) => {
                    setSettingsData((prev: Partial<UserSettings>) => ({
                      ...prev,
                      notifications: { ...prev.notifications, marketing: checked }
                    }));
                    setHasUnsavedChanges(true);
                  }}
                  disabled={!isEditing}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="privacy" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5" />
                <span>Privacy</span>
              </CardTitle>
              <CardDescription>
                Control your privacy and data sharing settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="profile-visibility">Profile visibility</Label>
                <Select
                  value={settingsData.privacy?.profileVisibility || 'public'}
                  onValueChange={(value: 'public' | 'private' | 'friends') => {
                    setSettingsData((prev: Partial<UserSettings>) => ({
                      ...prev,
                      privacy: { ...prev.privacy!, profileVisibility: value }
                    }));
                    setHasUnsavedChanges(true);
                  }}
                  disabled={!isEditing}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">Public</SelectItem>
                    <SelectItem value="private">Private</SelectItem>
                    <SelectItem value="friends">Friends only</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="data-sharing">Data sharing</Label>
                <Switch
                  id="data-sharing"
                  checked={settingsData.privacy?.dataSharing || false}
                  onCheckedChange={(checked) => {
                    setSettingsData((prev: Partial<UserSettings>) => ({
                      ...prev,
                      privacy: { ...prev.privacy!, dataSharing: checked }
                    }));
                    setHasUnsavedChanges(true);
                  }}
                  disabled={!isEditing}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="analytics">Analytics</Label>
                <Switch
                  id="analytics"
                  checked={settingsData.privacy?.analytics || true}
                  onCheckedChange={(checked) => {
                    setSettingsData((prev: Partial<UserSettings>) => ({
                      ...prev,
                      privacy: { ...prev.privacy!, analytics: checked }
                    }));
                    setHasUnsavedChanges(true);
                  }}
                  disabled={!isEditing}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="content" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Content Preferences</CardTitle>
              <CardDescription>
                Configure content editing and storage settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="auto-save">Auto-save</Label>
                <Switch
                  id="auto-save"
                  checked={settingsData.contentPreferences?.autoSave || true}
                  onCheckedChange={(checked) => {
                    setSettingsData((prev: Partial<UserSettings>) => ({
                      ...prev,
                      contentPreferences: { ...prev.contentPreferences!, autoSave: checked }
                    }));
                    setHasUnsavedChanges(true);
                  }}
                  disabled={!isEditing}
                />
              </div>

              <div>
                <Label htmlFor="max-content-size">
                  Maximum content size: {settingsData.contentPreferences?.maxContentSize || 50000} characters
                </Label>
                <Slider
                  id="max-content-size"
                  min={10000}
                  max={200000}
                  step={5000}
                  value={[settingsData.contentPreferences?.maxContentSize || 50000]}
                  onValueChange={([value]) => {
                    setSettingsData((prev: Partial<UserSettings>) => ({
                      ...prev,
                      contentPreferences: { ...prev.contentPreferences!, maxContentSize: value }
                    }));
                    setHasUnsavedChanges(true);
                  }}
                  disabled={!isEditing}
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="default-editor-mode">Default editor mode</Label>
                <Select
                  value={settingsData.contentPreferences?.defaultEditorMode || 'rich'}
                  onValueChange={(value: 'rich' | 'plain') => {
                    setSettingsData((prev: Partial<UserSettings>) => ({
                      ...prev,
                      contentPreferences: { ...prev.contentPreferences!, defaultEditorMode: value }
                    }));
                    setHasUnsavedChanges(true);
                  }}
                  disabled={!isEditing}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rich">Rich text</SelectItem>
                    <SelectItem value="plain">Plain text</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5" />
                <span>About Content</span>
              </CardTitle>
              <CardDescription>
                Rich text content for your about section
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" onClick={handleUndo}>
                      <Undo className="h-4 w-4 mr-2" />
                      Undo
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleRedo}>
                      <Redo className="h-4 w-4 mr-2" />
                      Redo
                    </Button>
                  </div>

                  <QuillEditor
                    value={settingsData.aboutContent || ''}
                    onChange={(content: string) => handleContentChange('aboutContent', content)}
                    placeholder="Write about yourself, your mission, or your organization..."
                    className="min-h-[300px]"
                  />
                </div>
              ) : (
                <div
                  className="min-h-[300px] p-4 border rounded-md bg-muted/50 prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: settingsData.aboutContent || '<p>No about content yet. Click Edit to add rich content.</p>' }}
                />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5" />
                <span>Terms & Conditions</span>
              </CardTitle>
              <CardDescription>
                Rich text content for terms and conditions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" onClick={handleUndo}>
                      <Undo className="h-4 w-4 mr-2" />
                      Undo
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleRedo}>
                      <Redo className="h-4 w-4 mr-2" />
                      Redo
                    </Button>
                  </div>

                  <QuillEditor
                    value={settingsData.termsContent || ''}
                    onChange={(content: string) => handleContentChange('termsContent', content)}
                    placeholder="Define your terms and conditions..."
                    className="min-h-[300px]"
                  />
                </div>
              ) : (
                <div
                  className="min-h-[300px] p-4 border rounded-md bg-muted/50 prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: settingsData.termsContent || '<p>No terms content yet. Click Edit to add rich content.</p>' }}
                />
              )}
            </CardContent>
          </Card>

          {/* Validation Messages */}
          {(validationErrors.length > 0 || validationWarnings.length > 0) && (
            <div className="space-y-4">
              {validationErrors.length > 0 && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <ul className="list-disc list-inside">
                      {validationErrors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              {validationWarnings.length > 0 && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <ul className="list-disc list-inside">
                      {validationWarnings.map((warning, index) => (
                        <li key={index}>{warning}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {isEditing && (
        <div className="flex justify-end space-x-2">
          <Button
            variant="outline"
            onClick={() => {
              setIsEditing(false);
              // Reset to original data
              if (settings) {
                setSettingsData({
                  theme: settings.theme,
                  language: settings.language,
                  timezone: settings.timezone,
                  notifications: { ...settings.notifications },
                  privacy: { ...settings.privacy },
                  contentPreferences: { ...settings.contentPreferences },
                  aboutContent: settings.aboutContent,
                  termsContent: settings.termsContent
                });
                setHasUnsavedChanges(false);
                setValidationErrors([]);
                setValidationWarnings([]);
              }
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={updateSettingsMutation.isPending || validationErrors.length > 0}
          >
            <Save className="h-4 w-4 mr-2" />
            {updateSettingsMutation.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      )}

      {updateSettingsMutation.isSuccess && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            Settings updated successfully!
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}