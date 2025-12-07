import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, Cable, Workflow, Activity, Settings, Bell, Search } from 'lucide-react';
import { cn } from '../lib/utils';
import { Toaster } from 'sonner';
import { ModeToggle } from './ModeToggle';
import { Button } from './ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from './ui/dropdown-menu';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();

  // If we are on the landing page, we might want a different layout, 
  // but for now, we'll assume the Landing Page is separate or handles its own layout, 
  // OR we use this layout for the app and a different one for public pages.
  // The user asked for a "best landing page", implying it's likely outside the console shell.
  // I'll check the path.
  const isLandingPage = location.pathname === '/';

  if (isLandingPage) {
      return (
          <div className="min-h-screen bg-background text-foreground font-sans antialiased">
               <Toaster position="top-right" theme="system" closeButton />
               {children}
          </div>
      )
  }
  
  const getPageTitle = (pathname: string) => {
    switch (pathname) {
      case '/dashboard': return 'Dashboard';
      case '/connections': return 'Connections';
      case '/pipelines': return 'Pipelines';
      case '/jobs': return 'Jobs & Runs';
      case '/settings': return 'Settings';
      default: return 'Console';
    }
  };

  return (
    <div className="flex h-screen w-full bg-background text-foreground overflow-hidden font-sans antialiased selection:bg-primary/20">
      <Toaster position="top-right" theme="system" closeButton />
      
      {/* Sidebar */}
      <aside className="hidden w-64 flex-col border-r bg-card md:flex">
        <div className="flex h-16 items-center border-b px-6">
          <Workflow className="mr-2 h-6 w-6 text-primary" />
          <span className="text-xl font-bold tracking-tight">SynqX</span>
        </div>
        
        <div className="flex-1 overflow-auto py-4">
            <nav className="flex flex-col gap-1 px-4">
            <NavItem to="/dashboard" icon={<LayoutDashboard />} label="Dashboard" />
            <NavItem to="/connections" icon={<Cable />} label="Connections" />
            <NavItem to="/pipelines" icon={<Workflow />} label="Pipelines" />
            <NavItem to="/jobs" icon={<Activity />} label="Jobs & Runs" />
            </nav>
            
            <div className="mt-8 px-6 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Configuration
            </div>
            <nav className="flex flex-col gap-1 px-4 mt-2">
                <NavItem to="/settings" icon={<Settings />} label="Settings" />
            </nav>
        </div>

        <div className="border-t p-4">
            <div className="flex items-center justify-between gap-2">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                         <button className="flex items-center gap-3 rounded-lg p-2 hover:bg-accent transition-colors w-full text-left">
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">A</div>
                            <div className="flex flex-col overflow-hidden">
                                <span className="text-sm font-medium truncate">Abhishek</span>
                                <span className="text-xs text-muted-foreground truncate">admin@synqx.dev</span>
                            </div>
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuLabel>My Account</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>Profile</DropdownMenuItem>
                        <DropdownMenuItem>Billing</DropdownMenuItem>
                        <DropdownMenuItem>Team</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive">Log out</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
                <ModeToggle />
            </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden bg-background">
        <header className="flex h-16 items-center justify-between border-b bg-background/95 px-8 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-20">
            <div className="flex items-center gap-4">
                <h1 className="text-lg font-semibold">{getPageTitle(location.pathname)}</h1>
            </div>
            
            <div className="flex items-center gap-4">
                <div className="relative hidden lg:block">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <input 
                        type="text" 
                        placeholder="Search resources..." 
                        className="h-9 w-64 rounded-md border border-input bg-transparent pl-9 pr-4 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    />
                </div>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-primary"></span>
                </Button>
            </div>
        </header>
        
        <main className="flex-1 overflow-auto p-8 scrollbar-thin scrollbar-thumb-accent scrollbar-track-transparent">
          <div className="w-full space-y-8 animate-in fade-in duration-500">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
}

const NavItem: React.FC<NavItemProps> = ({ to, icon, label }) => {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all duration-200",
          isActive
            ? "bg-primary/10 text-primary shadow-sm"
            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        )
      }
    >
      <span className="[&>svg]:h-4 [&>svg]:w-4">{icon}</span>
      {label}
    </NavLink>
  );
};