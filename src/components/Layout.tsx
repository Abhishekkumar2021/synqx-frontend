import React, { useState } from 'react';
import { NavLink, useLocation, Link } from 'react-router-dom';
import { 
    LayoutDashboard, Cable, Workflow, Activity, Settings, 
    Bell, Search, Menu, X, ChevronRight, Home, LogOut, 
    User, CreditCard, Users, PanelLeft
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ModeToggle } from './ModeToggle'; 
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'; 
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'; 
import { useAuth } from '@/hooks/useAuth';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const handleMobileNavClick = () => {
    setIsMobileMenuOpen(false);
  };

  if (location.pathname === '/') {
      return (
          <div className="min-h-screen bg-background text-foreground font-sans antialiased selection:bg-primary/20">
               {children}
          </div>
      );
  }

  return (
    <div className="flex h-screen w-full bg-background text-foreground overflow-hidden font-sans antialiased">      
      {/* --- Desktop Sidebar --- */}
      <aside 
        className={cn(
            "relative hidden border-r bg-muted/10 md:flex flex-col transition-[width] duration-300 ease-in-out z-30",
            isSidebarCollapsed ? "w-[70px]" : "w-64"
        )}
      >
        {/* Toggle Button (Absolute) */}
        <Button 
            variant="outline" 
            size="icon" 
            className={cn(
                "absolute -right-3 top-6 z-40 h-6 w-6 rounded-full border bg-background shadow-md hover:bg-accent text-muted-foreground transition-transform duration-300",
                isSidebarCollapsed && "rotate-180" 
            )}
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        >
            <PanelLeft className="h-3 w-3" />
        </Button>

        {/* Brand Header */}
        <div className={cn(
            "flex h-16 items-center border-b bg-background/50 backdrop-blur-sm transition-all duration-300 overflow-hidden",
            isSidebarCollapsed ? "justify-center px-0" : "px-4 gap-2"
        )}>
            <div className="shrink-0 flex items-center justify-center h-8 w-8 rounded-lg bg-primary/10 text-primary">
                <Workflow className="h-5 w-5" />
            </div>
            
            <div className={cn(
                "flex flex-col whitespace-nowrap transition-all duration-300 ease-in-out overflow-hidden",
                isSidebarCollapsed ? "w-0 opacity-0" : "w-32 opacity-100"
            )}>
                <span className="font-bold text-lg tracking-tight pl-1">
                    SynqX
                </span>
            </div>
        </div>
        
        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto py-4 scrollbar-none">
            <nav className="flex flex-col gap-1 px-3">
                <NavGroup collapsed={isSidebarCollapsed}>
                    <NavItem to="/dashboard" icon={<LayoutDashboard />} label="Dashboard" collapsed={isSidebarCollapsed} />
                    <NavItem to="/connections" icon={<Cable />} label="Connections" collapsed={isSidebarCollapsed} />
                    <NavItem to="/pipelines" icon={<Workflow />} label="Pipelines" collapsed={isSidebarCollapsed} />
                    <NavItem to="/jobs" icon={<Activity />} label="Jobs & Runs" collapsed={isSidebarCollapsed} />
                </NavGroup>
                
                <div className="my-4 border-t border-border/50 mx-2" />

                <NavGroup collapsed={isSidebarCollapsed} title="Config">
                    <NavItem to="/settings" icon={<Settings />} label="Settings" collapsed={isSidebarCollapsed} />
                </NavGroup>
            </nav>
        </div>

        {/* User Footer */}
        <div className="border-t p-3 bg-background/50 backdrop-blur-sm">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                     <button className={cn(
                         "flex items-center rounded-lg hover:bg-accent transition-all duration-300 w-full outline-none h-12",
                         // Conditional Padding/Gap logic for perfect centering
                         isSidebarCollapsed ? "justify-center px-0 gap-0" : "justify-start px-2 gap-3"
                     )}>
                        <Avatar className="h-8 w-8 border bg-primary/10 shrink-0">
                            <AvatarImage src={`https://api.dicebear.com/7.x/notionists/svg?seed=${user?.email || 'synqx'}`} />
                            <AvatarFallback>{user?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}</AvatarFallback>
                        </Avatar>
                        
                        <div className={cn(
                            "flex flex-col items-start overflow-hidden whitespace-nowrap transition-all duration-300 ease-in-out",
                            isSidebarCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"
                        )}>
                            <span className="text-sm font-medium truncate w-32 text-left">{user?.full_name || 'User'}</span>
                            <span className="text-xs text-muted-foreground truncate w-32 text-left">{user?.email || 'guest@synqx.dev'}</span>
                        </div>
                    </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56" side="right" sideOffset={10}>
                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                        <User className="mr-2 h-4 w-4" /> Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                        <CreditCard className="mr-2 h-4 w-4" /> Billing
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                        <Users className="mr-2 h-4 w-4" /> Team
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => logout()}>
                        <LogOut className="mr-2 h-4 w-4" /> Log out
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
      </aside>

      {/* --- Main Content Area --- */}
      <div className="flex flex-1 flex-col overflow-hidden bg-background">
        <header className="flex h-16 items-center justify-between border-b bg-background/95 px-4 md:px-8 backdrop-blur z-20 sticky top-0">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsMobileMenuOpen(true)}>
                    <Menu className="h-5 w-5" />
                </Button>
                <div className="hidden md:flex items-center text-sm text-muted-foreground">
                    <Link to="/dashboard" className="hover:text-foreground transition-colors">
                        <Home className="h-4 w-4" />
                    </Link>
                    {location.pathname !== '/dashboard' && (
                        <>
                            <ChevronRight className="h-4 w-4 mx-2" />
                            <span className="font-medium text-foreground capitalize">
                                {location.pathname.split('/')[1] || 'Dashboard'}
                            </span>
                        </>
                    )}
                </div>
            </div>
            
            <div className="flex items-center gap-3">
                <button className="hidden lg:flex items-center gap-2 h-9 rounded-md border border-input bg-muted/50 px-3 text-sm text-muted-foreground shadow-sm hover:bg-accent hover:text-accent-foreground transition-colors w-64">
                    <Search className="h-4 w-4" />
                    <span>Search pipelines...</span>
                    <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground ml-auto opacity-100">
                        <span className="text-xs">⌘</span>K
                    </kbd>
                </button>
                <div className="h-6 w-px bg-border mx-1 hidden sm:block"></div>
                <ModeToggle />
                <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-foreground">
                    <Bell className="h-5 w-5" />
                    <span className="absolute top-2.5 right-2.5 h-2 w-2 rounded-full bg-red-500 border-2 border-background"></span>
                </Button>
            </div>
        </header>
        
        <main className="flex-1 overflow-auto bg-muted/5 p-4 md:p-8 scrollbar-thin scrollbar-thumb-border">
          <div className="mx-auto max-w-8xl animate-in fade-in-5 slide-in-from-bottom-2 duration-500">
            {children}
          </div>
        </main>
      </div>

      {/* --- Mobile Overlay --- */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
            <div 
                className="fixed inset-0 bg-background/80 backdrop-blur-sm animate-in fade-in"
                onClick={() => setIsMobileMenuOpen(false)}
            ></div>
            <div className="relative w-[80%] max-w-[300px] bg-card border-r h-full p-4 shadow-xl animate-in slide-in-from-left duration-300">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-2 font-bold text-xl">
                        <Workflow className="h-6 w-6 text-primary" />
                        <span>SynqX</span>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(false)}>
                        <X className="h-5 w-5" />
                    </Button>
                </div>
                <nav className="flex flex-col gap-2">
                    <NavItem to="/dashboard" icon={<LayoutDashboard />} label="Dashboard" onClick={handleMobileNavClick} />
                    <NavItem to="/connections" icon={<Cable />} label="Connections" onClick={handleMobileNavClick} />
                    <NavItem to="/pipelines" icon={<Workflow />} label="Pipelines" onClick={handleMobileNavClick} />
                    <NavItem to="/jobs" icon={<Activity />} label="Jobs & Runs" onClick={handleMobileNavClick} />
                    <div className="h-px bg-border my-2"></div>
                    <NavItem to="/settings" icon={<Settings />} label="Settings" onClick={handleMobileNavClick} />
                </nav>
            </div>
        </div>
      )}
    </div>
  );
};

/* --- Sub Components --- */

const NavGroup = ({ children, title, collapsed }: { children: React.ReactNode, title?: string, collapsed?: boolean }) => {
    return (
        <div className="mb-2">
            {!collapsed && title && (
                <h4 className="px-2 mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70 whitespace-nowrap overflow-hidden">
                    {title}
                </h4>
            )}
            <div className="flex flex-col gap-1">
                {children}
            </div>
        </div>
    )
}

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  collapsed?: boolean;
  onClick?: () => void;
}

// FIX: Removed the nested NavLink. We use the render prop of the SINGLE NavLink to access `isActive`.
const NavItem: React.FC<NavItemProps> = ({ to, icon, label, collapsed, onClick }) => {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        cn(
          "flex items-center rounded-md py-2 transition-all duration-200 group relative min-h-10",
          collapsed ? "justify-center px-2" : "justify-start px-3 gap-3",
          isActive
            ? "bg-primary/10 text-primary"
            : "text-muted-foreground hover:bg-muted hover:text-foreground",
        )
      }
    >
      {({ isActive }) => (
        <>
            <span className={cn(
                "flex items-center justify-center transition-transform duration-200 shrink-0", 
                collapsed && "group-hover:scale-110",
                "[&>svg]:h-5 [&>svg]:w-5"
            )}>
                {icon}
            </span>
            
            <span className={cn(
                "whitespace-nowrap overflow-hidden transition-all duration-300 ease-in-out",
                collapsed ? "w-0 opacity-0" : "w-auto opacity-100"
            )}>
                {label}
            </span>

            {/* Tooltip for collapsed state */}
            {collapsed && (
                <span className="absolute left-full ml-2 rounded-md bg-popover px-2 py-1 text-xs text-popover-foreground shadow-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">
                    {label}
                </span>
            )}
            
            {/* Active Bar - Now inside the children, using the parent's `isActive` state */}
            {isActive && (
                <span className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full bg-primary" />
            )}
        </>
      )}
    </NavLink>
  );
};