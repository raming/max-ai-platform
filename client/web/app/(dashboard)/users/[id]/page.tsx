'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Save,
  Edit,
  Eye,
  User,
  Twitter,
  Linkedin,
  Github,
  AlertCircle,
  CheckCircle,
  Undo,
  Redo,
  FileText
} from 'lucide-react';
import {
  profileService,
  settingsService,
  contentValidation,
  autoSaveService,
  type UserProfile
} from '@/lib/services/mock-content';

// Dynamically import QuillEditor to avoid SSR issues
const QuillEditor = dynamic(() => import('@max-ai/ui-editor').then(mod => ({ default: mod.QuillEditor })), {
  ssr: false,
  loading: () => <div className="h-32 bg-gray-100 rounded animate-pulse" />
});

export default function UserProfilePage() {
  const params = useParams();
  const userId = params.id as string;
  const queryClient = useQueryClient();

  const [isEditing, setIsEditing] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [validationWarnings, setValidationWarnings] = useState<string[]>([]);

  // Form state
  const [profileData, setProfileData] = useState<Partial<UserProfile>>({
    displayName: '',
    bio: '',
    location: '',
    website: '',
    content: '',
    isPublic: true,
    socialLinks: {}
  });

  // Fetch user profile
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['user-profile', userId],
    queryFn: () => profileService.getProfile(userId),
    enabled: !!userId
  });

  // Fetch user settings for content preferences
  const { data: settings } = useQuery({
    queryKey: ['user-settings', userId],
    queryFn: () => settingsService.getSettings(userId),
    enabled: !!userId
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: (updates: Partial<UserProfile>) =>
      Promise.resolve(profileService.updateProfile(userId, updates)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-profile', userId] });
      setHasUnsavedChanges(false);
      setValidationErrors([]);
      setValidationWarnings([]);
    }
  });

  // Initialize form data when profile loads
  useEffect(() => {
    if (profile) {
      setProfileData({
        displayName: profile.displayName,
        bio: profile.bio,
        location: profile.location,
        website: profile.website,
        content: profile.content,
        isPublic: profile.isPublic,
        socialLinks: { ...profile.socialLinks }
      });

      // Check for saved draft
      const draft = autoSaveService.getDraft(userId, 'profile');
      if (draft) {
        setProfileData(prev => ({ ...prev, content: draft }));
        setHasUnsavedChanges(true);
      }
    }
  }, [profile, userId]);

  // Auto-save functionality
  useEffect(() => {
    if (settings?.contentPreferences.autoSave && hasUnsavedChanges && profileData.content) {
      const timeoutId = setTimeout(() => {
        autoSaveService.saveDraft(userId, 'profile', profileData.content || '');
      }, 30000); // Auto-save every 30 seconds

      return () => clearTimeout(timeoutId);
    }
  }, [profileData.content, hasUnsavedChanges, settings, userId]);

  const handleContentChange = (content: string) => {
    setProfileData(prev => ({ ...prev, content }));
    setHasUnsavedChanges(true);

    // Validate content
    if (settings?.contentPreferences.maxContentSize) {
      const validation = contentValidation.validateHtmlContent(
        content,
        settings.contentPreferences.maxContentSize
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

    updateProfileMutation.mutate(profileData);
    autoSaveService.clearDraft(userId, 'profile');
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

  if (profileLoading) {
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

  if (!profile) {
    return (
      <div className="space-y-6 p-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            User profile not found.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Profile</h1>
          <p className="text-muted-foreground">
            Manage your profile information and content
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

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile">Profile Information</TabsTrigger>
          <TabsTrigger value="content">Rich Content</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>Basic Information</span>
              </CardTitle>
              <CardDescription>
                Update your basic profile information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="displayName">Display Name</Label>
                  <Input
                    id="displayName"
                    value={profileData.displayName || ''}
                    onChange={(e) => {
                      setProfileData(prev => ({ ...prev, displayName: e.target.value }));
                      setHasUnsavedChanges(true);
                    }}
                    disabled={!isEditing}
                  />
                </div>
                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={profileData.location || ''}
                    onChange={(e) => {
                      setProfileData(prev => ({ ...prev, location: e.target.value }));
                      setHasUnsavedChanges(true);
                    }}
                    disabled={!isEditing}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={profileData.bio || ''}
                  onChange={(e) => {
                    setProfileData(prev => ({ ...prev, bio: e.target.value }));
                    setHasUnsavedChanges(true);
                  }}
                  disabled={!isEditing}
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  type="url"
                  value={profileData.website || ''}
                  onChange={(e) => {
                    setProfileData(prev => ({ ...prev, website: e.target.value }));
                    setHasUnsavedChanges(true);
                  }}
                  disabled={!isEditing}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="isPublic"
                  checked={profileData.isPublic || false}
                  onCheckedChange={(checked) => {
                    setProfileData(prev => ({ ...prev, isPublic: checked }));
                    setHasUnsavedChanges(true);
                  }}
                  disabled={!isEditing}
                />
                <Label htmlFor="isPublic">Public profile</Label>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Social Links</CardTitle>
              <CardDescription>
                Connect your social media profiles
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="twitter" className="flex items-center space-x-2">
                  <Twitter className="h-4 w-4" />
                  <span>Twitter</span>
                </Label>
                <Input
                  id="twitter"
                  type="url"
                  value={profileData.socialLinks?.twitter || ''}
                  onChange={(e) => {
                    setProfileData(prev => ({
                      ...prev,
                      socialLinks: { ...prev.socialLinks, twitter: e.target.value }
                    }));
                    setHasUnsavedChanges(true);
                  }}
                  disabled={!isEditing}
                />
              </div>

              <div>
                <Label htmlFor="linkedin" className="flex items-center space-x-2">
                  <Linkedin className="h-4 w-4" />
                  <span>LinkedIn</span>
                </Label>
                <Input
                  id="linkedin"
                  type="url"
                  value={profileData.socialLinks?.linkedin || ''}
                  onChange={(e) => {
                    setProfileData(prev => ({
                      ...prev,
                      socialLinks: { ...prev.socialLinks, linkedin: e.target.value }
                    }));
                    setHasUnsavedChanges(true);
                  }}
                  disabled={!isEditing}
                />
              </div>

              <div>
                <Label htmlFor="github" className="flex items-center space-x-2">
                  <Github className="h-4 w-4" />
                  <span>GitHub</span>
                </Label>
                <Input
                  id="github"
                  type="url"
                  value={profileData.socialLinks?.github || ''}
                  onChange={(e) => {
                    setProfileData(prev => ({
                      ...prev,
                      socialLinks: { ...prev.socialLinks, github: e.target.value }
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
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5" />
                <span>Rich Content</span>
              </CardTitle>
              <CardDescription>
                Create and edit rich text content for your profile
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
                    value={profileData.content || ''}
                    onChange={handleContentChange}
                    placeholder="Tell your story... Share your experience, skills, and what makes you unique."
                    className="min-h-[400px]"
                  />

                  {/* Validation Messages */}
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
              ) : (
                <div
                  className="min-h-[400px] p-4 border rounded-md bg-muted/50 prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: profileData.content || '<p>No content yet. Click Edit to add rich content.</p>' }}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {isEditing && (
        <div className="flex justify-end space-x-2">
          <Button
            variant="outline"
            onClick={() => {
              setIsEditing(false);
              // Reset to original data
              if (profile) {
                setProfileData({
                  displayName: profile.displayName,
                  bio: profile.bio,
                  location: profile.location,
                  website: profile.website,
                  content: profile.content,
                  isPublic: profile.isPublic,
                  socialLinks: { ...profile.socialLinks }
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
            disabled={updateProfileMutation.isPending || validationErrors.length > 0}
          >
            <Save className="h-4 w-4 mr-2" />
            {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      )}

      {updateProfileMutation.isSuccess && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            Profile updated successfully!
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}