"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Settings,
  User,
  Bell,
  Palette,
  Database,
  Download,
  Upload,
  Trash2,
  Save,
  RefreshCw,
  Shield,
  BookOpen,
  MessageCircle,
  Trophy,
  BarChart3,
} from "lucide-react";
import { useAuth } from "./auth-provider";

interface AppSettings {
  notifications: {
    courseUpdates: boolean;
    quizReminders: boolean;
    friendRequests: boolean;
    certificates: boolean;
    systemUpdates: boolean;
  };
  privacy: {
    profileVisibility: "public" | "friends" | "private";
    showProgress: boolean;
    allowFriendRequests: boolean;
    shareAchievements: boolean;
  };
  learning: {
    defaultDifficulty: "beginner" | "intermediate" | "advanced";
    autoSave: boolean;
    showHints: boolean;
    darkMode: boolean;
    language: "en" | "es" | "fr" | "de";
  };
  interface: {
    compactMode: boolean;
    animationsEnabled: boolean;
    soundEffects: boolean;
    sidebarCollapsed: boolean;
  };
}

const defaultSettings: AppSettings = {
  notifications: {
    courseUpdates: true,
    quizReminders: true,
    friendRequests: true,
    certificates: true,
    systemUpdates: false,
  },
  privacy: {
    profileVisibility: "public",
    showProgress: true,
    allowFriendRequests: true,
    shareAchievements: true,
  },
  learning: {
    defaultDifficulty: "beginner",
    autoSave: true,
    showHints: true,
    darkMode: false,
    language: "en",
  },
  interface: {
    compactMode: false,
    animationsEnabled: true,
    soundEffects: true,
    sidebarCollapsed: false,
  },
};

export function SettingsModule() {
  const { user, updateUser } = useAuth();
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [hasChanges, setHasChanges] = useState(false);
  const [activeTab, setActiveTab] = useState("general");
  const [exportData, setExportData] = useState("");
  const [importData, setImportData] = useState("");

  useEffect(() => {
    // Load settings from localStorage
    const savedSettings = localStorage.getItem("app-settings");
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings({ ...defaultSettings, ...parsed });
      } catch (error) {
        console.error("Failed to parse settings:", error);
      }
    }
  }, []);

  const updateSetting = (category: keyof AppSettings, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value,
      },
    }));
    setHasChanges(true);
  };

  const saveSettings = () => {
    localStorage.setItem("app-settings", JSON.stringify(settings));
    setHasChanges(false);

    // Apply some settings immediately
    if (settings.interface.sidebarCollapsed) {
      document.body.classList.add("sidebar-collapsed");
    } else {
      document.body.classList.remove("sidebar-collapsed");
    }

    if (settings.learning.darkMode) {
      document.body.classList.add("dark");
    } else {
      document.body.classList.remove("dark");
    }
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
    setHasChanges(true);
  };

  const exportUserData = () => {
    const userData = {
      user: user,
      courses: JSON.parse(localStorage.getItem("courses") || "[]"),
      localCourses: JSON.parse(localStorage.getItem("local-courses") || "[]"),
      certificates: JSON.parse(localStorage.getItem("certificates") || "[]"),
      settings: settings,
      messages: JSON.parse(localStorage.getItem("messages") || "[]"),
      friends: JSON.parse(localStorage.getItem("friends") || "[]"),
    };

    const dataStr = JSON.stringify(userData, null, 2);
    setExportData(dataStr);

    // Create download link
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `VLearn-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const importUserData = () => {
    try {
      const data = JSON.parse(importData);

      if (data.user) localStorage.setItem("local-user", JSON.stringify(data.user));
      if (data.courses) localStorage.setItem("courses", JSON.stringify(data.courses));
      if (data.localCourses) localStorage.setItem("local-courses", JSON.stringify(data.localCourses));
      if (data.certificates) localStorage.setItem("certificates", JSON.stringify(data.certificates));
      if (data.settings) {
        setSettings(data.settings);
        localStorage.setItem("app-settings", JSON.stringify(data.settings));
      }
      if (data.messages) localStorage.setItem("messages", JSON.stringify(data.messages));
      if (data.friends) localStorage.setItem("friends", JSON.stringify(data.friends));

      setImportData("");
      alert("Data imported successfully! Please refresh the page to see changes.");
    } catch (error) {
      alert("Failed to import data. Please check the format.");
    }
  };

  const clearAllData = () => {
    const keysToKeep = ["theme"]; // Keep essential browser preferences
    Object.keys(localStorage).forEach(key => {
      if (!keysToKeep.includes(key)) {
        localStorage.removeItem(key);
      }
    });
    alert("All data cleared! Please refresh the page.");
  };

  const getStorageSize = () => {
    let total = 0;
    Object.keys(localStorage).forEach(key => {
      total += localStorage.getItem(key)?.length || 0;
    });
    return (total / 1024).toFixed(2) + " KB";
  };

  const tabs = [
    { id: "general", label: "General", icon: Settings },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "privacy", label: "Privacy", icon: Shield },
    { id: "learning", label: "Learning", icon: BookOpen },
    { id: "interface", label: "Interface", icon: Palette },
    { id: "data", label: "Data", icon: Database },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case "general":
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Account Information
                </CardTitle>
                <CardDescription>Your basic account details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Name</Label>
                    <Input value={user?.name || ""} disabled />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input value={user?.email || ""} disabled />
                  </div>
                </div>
                <div>
                  <Label>Member Since</Label>
                  <Input 
                    value={user?.profile?.joinDate ? new Date(user.profile.joinDate).toLocaleDateString() : "N/A"} 
                    disabled 
                  />
                </div>
                <div className="flex gap-2">
                  <Badge variant="outline">
                    <Trophy className="h-3 w-3 mr-1" />
                    {user?.profile?.certificatesEarned?.length || 0} Certificates
                  </Badge>
                  <Badge variant="outline">
                    <BookOpen className="h-3 w-3 mr-1" />
                    {user?.profile?.coursesCompleted || 0} Courses
                  </Badge>
                  <Badge variant="outline">
                    <MessageCircle className="h-3 w-3 mr-1" />
                    {user?.profile?.friends?.length || 0} Friends
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case "notifications":
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notification Preferences
                </CardTitle>
                <CardDescription>Choose what notifications you want to receive</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(settings.notifications).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm font-medium">
                        {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        {key === 'courseUpdates' && "Get notified about course content updates"}
                        {key === 'quizReminders' && "Reminders for incomplete quizzes"}
                        {key === 'friendRequests' && "New friend requests and messages"}
                        {key === 'certificates' && "Certificate completion notifications"}
                        {key === 'systemUpdates' && "System maintenance and feature updates"}
                      </p>
                    </div>
                    <Switch
                      checked={value}
                      onCheckedChange={(checked) => updateSetting('notifications', key, checked)}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        );

      case "privacy":
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Privacy Settings
                </CardTitle>
                <CardDescription>Control who can see your information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Profile Visibility</Label>
                  <Select 
                    value={settings.privacy.profileVisibility}
                    onValueChange={(value: any) => updateSetting('privacy', 'profileVisibility', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">Public - Anyone can see</SelectItem>
                      <SelectItem value="friends">Friends Only</SelectItem>
                      <SelectItem value="private">Private - Only me</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                {Object.entries(settings.privacy).filter(([key]) => key !== 'profileVisibility').map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm font-medium">
                        {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        {key === 'showProgress' && "Display your course progress to others"}
                        {key === 'allowFriendRequests' && "Allow others to send friend requests"}
                        {key === 'shareAchievements' && "Share certificate achievements publicly"}
                      </p>
                    </div>
                    <Switch
                      checked={value as boolean}
                      onCheckedChange={(checked) => updateSetting('privacy', key, checked)}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        );

      case "learning":
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Learning Preferences
                </CardTitle>
                <CardDescription>Customize your learning experience</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Default Difficulty Level</Label>
                  <Select 
                    value={settings.learning.defaultDifficulty}
                    onValueChange={(value: any) => updateSetting('learning', 'defaultDifficulty', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Preferred Language</Label>
                  <Select 
                    value={settings.learning.language}
                    onValueChange={(value: any) => updateSetting('learning', 'language', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Español</SelectItem>
                      <SelectItem value="fr">Français</SelectItem>
                      <SelectItem value="de">Deutsch</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                {Object.entries(settings.learning).filter(([key]) => !['defaultDifficulty', 'language'].includes(key)).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm font-medium">
                        {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        {key === 'autoSave' && "Automatically save your progress"}
                        {key === 'showHints' && "Show helpful hints during quizzes"}
                        {key === 'darkMode' && "Use dark theme (experimental)"}
                      </p>
                    </div>
                    <Switch
                      checked={value as boolean}
                      onCheckedChange={(checked) => updateSetting('learning', key, checked)}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        );

      case "interface":
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  Interface Preferences
                </CardTitle>
                <CardDescription>Customize how VLearn looks and feels</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(settings.interface).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm font-medium">
                        {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        {key === 'compactMode' && "Use more compact layouts to fit more content"}
                        {key === 'animationsEnabled' && "Enable smooth animations and transitions"}
                        {key === 'soundEffects' && "Play sound effects for interactions"}
                        {key === 'sidebarCollapsed' && "Keep sidebar collapsed by default"}
                      </p>
                    </div>
                    <Switch
                      checked={value}
                      onCheckedChange={(checked) => updateSetting('interface', key, checked)}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        );

      case "data":
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Data Management
                </CardTitle>
                <CardDescription>Manage your stored data and privacy</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <BarChart3 className="h-4 w-4 text-blue-600" />
                    <span className="font-medium text-blue-800">Storage Usage</span>
                  </div>
                  <p className="text-sm text-blue-700">
                    Currently using {getStorageSize()} of browser storage
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Download className="h-4 w-4" />
                        Export Data
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-xs text-muted-foreground mb-3">
                        Download all your data as a JSON file
                      </p>
                      <Button onClick={exportUserData} className="w-full" size="sm">
                        Export All Data
                      </Button>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Upload className="h-4 w-4" />
                        Import Data
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <Textarea
                        placeholder="Paste your exported JSON data here..."
                        value={importData}
                        onChange={(e) => setImportData(e.target.value)}
                        className="min-h-20 text-xs"
                      />
                      <Button 
                        onClick={importUserData} 
                        className="w-full" 
                        size="sm" 
                        disabled={!importData.trim()}
                      >
                        Import Data
                      </Button>
                    </CardContent>
                  </Card>
                </div>

                <Separator />

                <div className="space-y-3">
                  <Label className="text-sm font-medium text-red-600">Danger Zone</Label>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm" className="w-full">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Clear All Data
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete all your courses, progress, certificates, messages, 
                          and settings. This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={clearAllData} className="bg-red-600 hover:bg-red-700">
                          Yes, delete everything
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Settings className="h-8 w-8" />
            Settings
          </h1>
          <p className="text-muted-foreground">
            Customize your VLearn experience and manage your data
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={resetSettings}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Reset to Defaults
          </Button>
          <Button
            onClick={saveSettings}
            disabled={!hasChanges}
            className="flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            Save Changes
            {hasChanges && <Badge variant="secondary" className="ml-2">•</Badge>}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Navigation */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Categories</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <nav className="space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left text-sm transition-colors hover:bg-muted ${
                    activeTab === tab.id ? "bg-muted border-r-2 border-primary" : ""
                  }`}
                >
                  <tab.icon className="h-4 w-4" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </CardContent>
        </Card>

        {/* Content Area */}
        <div className="lg:col-span-3">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
}