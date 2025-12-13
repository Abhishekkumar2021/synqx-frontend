import React, { useState } from 'react';
import { 
    User, Palette, Key, Bell, ShieldAlert, 
    Save, Copy, Check, Mail, 
    Globe, Laptop, Lock, Eye, EyeOff, 
    RefreshCw, Trash2, Moon, Sun, Monitor
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';

type SettingsTab = 'general' | 'security' | 'notifications' | 'billing';

export const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = () => {
      setIsLoading(true);
      setTimeout(() => {
          setIsLoading(false);
          toast.success("Settings updated successfully");
      }, 1000);
  };

  const tabs = [
      { id: 'general', label: 'General', icon: User, description: 'Profile & Appearance' },
      { id: 'security', label: 'Security', icon: ShieldAlert, description: 'API Keys & Access' },
      { id: 'notifications', label: 'Notifications', icon: Bell, description: 'Email & Alerts' },
  ];

  return (
    <div className="relative flex flex-col gap-8 pb-10 animate-in fade-in slide-in-from-bottom-4 duration-500 min-h-[80vh]">
      
      {/* --- Ambient Background Effects --- */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] opacity-30" />
          <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[100px] opacity-20" />
      </div>

      {/* --- Page Header --- */}
      <div className="flex flex-col gap-2 border-b border-border/50 pb-6 relative z-10">
        <h2 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            Settings
        </h2>
        <p className="text-muted-foreground text-lg">
            Manage your workspace preferences, API access, and security configurations.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 relative z-10">
        
        {/* --- Sidebar Navigation --- */}
        <aside className="lg:w-64 shrink-0 space-y-2">
            {tabs.map((tab) => (
                <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as SettingsTab)}
                    className={cn(
                        "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 border border-transparent outline-none focus:ring-2 focus:ring-primary/20",
                        activeTab === tab.id 
                            ? "bg-primary/10 text-primary border-primary/20 shadow-sm" 
                            : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                    )}
                >
                    <tab.icon className={cn("h-4 w-4", activeTab === tab.id ? "text-primary" : "text-muted-foreground")} />
                    <div className="flex flex-col items-start">
                        <span>{tab.label}</span>
                    </div>
                    {activeTab === tab.id && (
                        <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_var(--primary)]" />
                    )}
                </button>
            ))}
        </aside>

        {/* --- Main Content Area --- */}
        <div className="flex-1 space-y-8 max-w-3xl">
            
            {activeTab === 'general' && (
                <div className="space-y-6 animate-in slide-in-from-right-4 duration-500 fade-in">
                    {/* Profile Card */}
                    <Card className="border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden shadow-sm">
                        {/* Banner Background */}
                        <div className="h-24 bg-linear-to-r from-blue-600/20 via-purple-600/20 to-primary/20 border-b border-border/50" />
                        
                        <CardHeader className="relative pt-0">
                            <div className="absolute -top-12 left-6">
                                <Avatar className="h-24 w-24 border-4 border-card shadow-xl ring-1 ring-border/50">
                                    <AvatarImage src={`https://api.dicebear.com/7.x/notionists/svg?seed=${user?.email || 'synqx'}`} />
                                    <AvatarFallback className="bg-primary/10 text-primary text-2xl">
                                        {user?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="absolute bottom-0 right-0">
                                    <Button size="icon" variant="secondary" className="h-8 w-8 rounded-full shadow-md border border-border">
                                        <User className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                            <div className="ml-32 pt-4">
                                <CardTitle className="text-xl">{user?.full_name || 'User'}</CardTitle>
                                <CardDescription>{user?.email || 'guest@synqx.dev'} • Administrator</CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6 mt-4">
                            <div className="grid gap-6 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="display-name">Display Name</Label>
                                    <Input id="display-name" defaultValue={user?.full_name || ''} className="bg-background/50 focus:bg-background transition-colors" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="username">Username</Label>
                                    <div className="flex">
                                        <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-muted-foreground text-sm">
                                            synqx.dev/
                                        </span>
                                        <Input id="username" defaultValue={user?.email?.split('@')[0] || ''} className="rounded-l-none bg-background/50 focus:bg-background transition-colors" />
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="bio">Bio</Label>
                                <Input id="bio" placeholder="Tell us a little bit about yourself" className="bg-background/50 focus:bg-background transition-colors" />
                            </div>
                        </CardContent>
                        <CardFooter className="bg-muted/5 border-t border-border/50 py-4 flex justify-end">
                            <Button onClick={handleSave} disabled={isLoading} className="shadow-lg shadow-primary/20">
                                {isLoading ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                Save Changes
                            </Button>
                        </CardFooter>
                    </Card>

                    {/* Appearance - Replaced with Theme Cards */}
                    <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                                <Palette className="h-4 w-4 text-purple-500" /> Interface Theme
                            </CardTitle>
                            <CardDescription>Select your preferred color mode for the dashboard.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-3 gap-4">
                                <button 
                                    onClick={() => setTheme('light')}
                                    className={cn(
                                        "flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all hover:bg-muted/50 outline-none focus:ring-2 focus:ring-primary/20",
                                        theme === 'light' ? "border-primary bg-primary/5" : "border-transparent bg-muted/20 hover:border-border"
                                    )}
                                >
                                    <div className="p-3 bg-white rounded-full shadow-sm border border-slate-200">
                                        <Sun className="h-5 w-5 text-amber-500" />
                                    </div>
                                    <span className="text-sm font-medium">Light</span>
                                </button>
                                
                                <button 
                                    onClick={() => setTheme('dark')}
                                    className={cn(
                                        "flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all hover:bg-muted/50 outline-none focus:ring-2 focus:ring-primary/20",
                                        theme === 'dark' ? "border-primary bg-primary/5" : "border-transparent bg-muted/20 hover:border-border"
                                    )}
                                >
                                    <div className="p-3 bg-zinc-900 rounded-full shadow-sm border border-zinc-700">
                                        <Moon className="h-5 w-5 text-blue-400" />
                                    </div>
                                    <span className="text-sm font-medium">Dark</span>
                                </button>
                                
                                <button 
                                    onClick={() => setTheme('system')}
                                    className={cn(
                                        "flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all hover:bg-muted/50 outline-none focus:ring-2 focus:ring-primary/20",
                                        theme === 'system' ? "border-primary bg-primary/5" : "border-transparent bg-muted/20 hover:border-border"
                                    )}
                                >
                                    <div className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded-full shadow-sm border border-border">
                                        <Monitor className="h-5 w-5 text-foreground" />
                                    </div>
                                    <span className="text-sm font-medium">System</span>
                                </button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {activeTab === 'security' && (
                <div className="space-y-6 animate-in slide-in-from-right-4 duration-500 fade-in">
                    <ApiKeyCard />
                    
                    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                                <Lock className="h-4 w-4 text-blue-500" /> Active Sessions
                            </CardTitle>
                            <CardDescription>Manage devices currently logged into your account.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between p-3 border-b border-border/50 last:border-0">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-green-500/10 text-green-500 rounded-lg">
                                        <Laptop className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium">MacBook Pro 16"</p>
                                        <p className="text-xs text-muted-foreground">Pune, India • <span className="text-green-500 font-medium">Current Session</span></p>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center justify-between p-3 border-b border-border/50 last:border-0">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-muted text-muted-foreground rounded-lg">
                                        <Globe className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium">Chrome on Windows</p>
                                        <p className="text-xs text-muted-foreground">New York, USA • 2 days ago</p>
                                    </div>
                                </div>
                                <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                                    Revoke
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-destructive/30 bg-destructive/5 backdrop-blur-sm">
                        <CardHeader>
                            <CardTitle className="text-destructive text-base flex items-center gap-2">
                                <ShieldAlert className="h-4 w-4" /> Danger Zone
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex items-center justify-between">
                            <div className="space-y-1">
                                <p className="text-sm font-medium text-foreground">Delete Workspace</p>
                                <p className="text-xs text-muted-foreground max-w-sm">
                                    Permanently delete your account and all associated data pipelines. This action cannot be undone.
                                </p>
                            </div>
                            <Button variant="destructive" size="sm" className="gap-2">
                                <Trash2 className="h-4 w-4" /> Delete Account
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            )}

            {activeTab === 'notifications' && (
                <div className="space-y-6 animate-in slide-in-from-right-4 duration-500 fade-in">
                    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                                <Mail className="h-4 w-4 text-emerald-500" /> Email Notifications
                            </CardTitle>
                            <CardDescription>Choose what updates you want to receive via email.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center justify-between space-x-4">
                                <div className="flex flex-col space-y-1">
                                    <Label className="text-sm font-medium leading-none">Weekly Digests</Label>
                                    <p className="text-xs text-muted-foreground">Summary of pipeline performance and costs.</p>
                                </div>
                                <Switch />
                            </div>
                            <Separator className="bg-border/50" />
                            <div className="flex items-center justify-between space-x-4">
                                <div className="flex flex-col space-y-1">
                                    <Label className="text-sm font-medium leading-none">Pipeline Failures</Label>
                                    <p className="text-xs text-muted-foreground">Immediate alerts when a critical job fails.</p>
                                </div>
                                <Switch defaultChecked />
                            </div>
                            <Separator className="bg-border/50" />
                            <div className="flex items-center justify-between space-x-4">
                                <div className="flex flex-col space-y-1">
                                    <Label className="text-sm font-medium leading-none">Maintenance & Security</Label>
                                    <p className="text-xs text-muted-foreground">Important updates about your account security.</p>
                                </div>
                                <Switch defaultChecked disabled />
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

// --- Helper Components ---

const ApiKeyCard = () => {
    const [apiKey] = useState("sk_live_51Mxq8928349823498234");
    const [isVisible, setIsVisible] = useState(false);
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(apiKey);
        setCopied(true);
        toast.success("API Key copied");
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <CardTitle className="text-base flex items-center gap-2">
                            <Key className="h-4 w-4 text-amber-500" /> API Access
                        </CardTitle>
                        <CardDescription>Use this key to authenticate requests from your external apps.</CardDescription>
                    </div>
                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                        Active
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase text-muted-foreground">Production Key</Label>
                    <div className="relative flex items-center">
                        <div className="relative flex-1 group">
                            <Input 
                                type={isVisible ? "text" : "password"}
                                value={apiKey} 
                                readOnly 
                                className="pr-24 font-mono text-sm bg-muted/30 border-muted-foreground/20 text-foreground" 
                            />
                            {/* Blur effect overlay when hidden */}
                            {!isVisible && (
                                <div className="absolute inset-0 bg-linear-to-r from-transparent via-background/50 to-background pointer-events-none rounded-md" />
                            )}
                        </div>
                        
                        <div className="absolute right-1 top-1 bottom-1 flex items-center gap-1 bg-background/50 backdrop-blur-sm rounded-r-sm pl-2">
                            <Button 
                                type="button"
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                                onClick={() => setIsVisible(!isVisible)}
                            >
                                {isVisible ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                            </Button>
                            <Separator orientation="vertical" className="h-4" />
                            <Button 
                                type="button"
                                size="sm" 
                                variant="ghost" 
                                className="h-7 px-2 text-xs font-medium text-muted-foreground hover:text-foreground gap-1.5"
                                onClick={handleCopy}
                            >
                                {copied ? (
                                    <>
                                        <Check className="h-3 w-3 text-emerald-500" />
                                        <span className="text-emerald-500">Copied</span>
                                    </>
                                ) : (
                                    <>
                                        <Copy className="h-3 w-3" />
                                        <span>Copy</span>
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                    <p className="text-[10px] text-muted-foreground flex items-center gap-2">
                        <ShieldAlert className="h-3 w-3" />
                        Never share your API key. 
                        <span className="underline cursor-pointer hover:text-primary">Roll Key</span> if compromised.
                    </p>
                </div>
            </CardContent>
        </Card>
    );
};