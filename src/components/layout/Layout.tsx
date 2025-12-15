import React, { useState } from 'react';
import { useLocation, Link, Outlet } from 'react-router-dom';
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
import { motion, AnimatePresence } from 'framer-motion';
import { NavGroup } from './navigation/NavGroup';
import { NavItem } from './navigation/NavItem';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = () => {
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
               <Outlet />
          </div>
      );
  }

  return (
    <div className="flex h-screen w-full overflow-hidden font-sans antialiased bg-transparent">      
      
      {/* --- Floating Glass Sidebar --- */}
      <motion.aside 
        initial={false}
        animate={{ width: isSidebarCollapsed ? 80 : 280 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="relative hidden md:flex flex-col z-30 m-4 overflow-visible"
      >
        {/* Toggle Button (Absolute) */}
        <Button 
            variant="ghost" 
            size="icon" 
            className={cn(
                "absolute -right-3 top-8 z-50 h-7 w-7 rounded-full border border-border/50 bg-background shadow-md hover:bg-primary/10 hover:text-primary transition-all duration-300",
                isSidebarCollapsed && "rotate-180" 
            )}
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        >
            <PanelLeft className="h-3.5 w-3.5" />
        </Button>

        {/* Inner Content Wrapper (Glass & Clipped) */}
        <div className="absolute inset-0 rounded-3xl overflow-hidden sidebar-glass flex flex-col">
            {/* Brand Header */}
            <div className={cn(
                "flex h-20 items-center transition-all duration-500 overflow-hidden shrink-0",
                isSidebarCollapsed ? "justify-center px-0" : "px-6 gap-3"
            )}>
                <div className="shrink-0 flex items-center justify-center h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-blue-600 text-primary-foreground shadow-lg ring-1 ring-primary/20">
                    <Workflow className="h-6 w-6" />
                </div>
                
                <motion.div 
                    animate={{ opacity: isSidebarCollapsed ? 0 : 1, width: isSidebarCollapsed ? 0 : "auto" }}
                    className="flex flex-col whitespace-nowrap overflow-hidden"
                >
                    <span className="font-bold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
                        SynqX
                    </span>
                </motion.div>
            </div>
            
            {/* Navigation Items */}
            <div className="flex-1 overflow-y-auto py-6 px-3 scrollbar-none space-y-6">
                <nav className="flex flex-col gap-1.5">
                    <NavGroup collapsed={isSidebarCollapsed}>
                        <NavItem to="/dashboard" icon={<LayoutDashboard />} label="Dashboard" collapsed={isSidebarCollapsed} />
                        <NavItem to="/connections" icon={<Cable />} label="Connections" collapsed={isSidebarCollapsed} />
                        <NavItem to="/pipelines" icon={<Workflow />} label="Pipelines" collapsed={isSidebarCollapsed} />
                        <NavItem to="/jobs" icon={<Activity />} label="Jobs & Runs" collapsed={isSidebarCollapsed} />
                    </NavGroup>
                    
                    <div className={cn("mx-4 border-t border-border/40 transition-all duration-300", isSidebarCollapsed && "mx-2")} />

                    <NavGroup collapsed={isSidebarCollapsed} title="Configuration">
                        <NavItem to="/settings" icon={<Settings />} label="Settings" collapsed={isSidebarCollapsed} />
                    </NavGroup>
                </nav>
            </div>

            {/* User Footer */}
            <div className="p-4 mx-2 mb-2 mt-auto">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className={cn(
                            "flex items-center rounded-2xl hover:bg-white/5 dark:hover:bg-white/5 transition-all duration-300 w-full outline-none h-14 border border-border/50 hover:border-border",
                            isSidebarCollapsed ? "justify-center px-0 gap-0" : "justify-start px-2 gap-3 bg-white/5 dark:bg-white/5 border-border/50"
                        )}>
                            <Avatar className="h-9 w-9 border border-white/10 shrink-0 ring-2 ring-transparent group-hover:ring-primary/20 transition-all">
                                <AvatarImage src={`https://api.dicebear.com/7.x/notionists/svg?seed=${user?.email || 'synqx'}`} />
                                <AvatarFallback>{user?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}</AvatarFallback>
                            </Avatar>
                            
                            <motion.div 
                                animate={{ opacity: isSidebarCollapsed ? 0 : 1, width: isSidebarCollapsed ? 0 : "auto" }}
                                className="flex flex-col items-start overflow-hidden whitespace-nowrap"
                            >
                                <span className="text-sm font-semibold truncate w-32 text-left">{user?.full_name || 'User'}</span>
                                <span className="text-[11px] text-muted-foreground truncate w-32 text-left">{user?.email || 'guest@synqx.dev'}</span>
                            </motion.div>
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-56 rounded-2xl glass-card shadow-2xl ml-4 mb-2" side="right" sideOffset={15}>
                        <DropdownMenuLabel>My Account</DropdownMenuLabel>
                        <DropdownMenuSeparator className="bg-white/10" />
                        <DropdownMenuItem className="rounded-xl focus:bg-white/10 cursor-pointer">
                            <User className="mr-2 h-4 w-4" /> Profile
                        </DropdownMenuItem>
                        <DropdownMenuItem className="rounded-xl focus:bg-white/10 cursor-pointer">
                            <CreditCard className="mr-2 h-4 w-4" /> Billing
                        </DropdownMenuItem>
                        <DropdownMenuItem className="rounded-xl focus:bg-white/10 cursor-pointer">
                            <Users className="mr-2 h-4 w-4" /> Team
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-white/10" />
                        <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10 rounded-xl cursor-pointer" onClick={() => logout()}>
                            <LogOut className="mr-2 h-4 w-4" /> Log out
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
      </motion.aside>

      {/* --- Main Content Area --- */}
      <div className="flex flex-1 flex-col overflow-hidden relative">
        {/* Floating Header */}
        <header className="flex h-16 items-center justify-between glass mx-4 mt-4 rounded-3xl px-6 z-20 sticky top-0 transition-all">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsMobileMenuOpen(true)}>
                    <Menu className="h-5 w-5" />
                </Button>
                <div className="hidden md:flex items-center text-sm text-muted-foreground/80">
                    <Link to="/dashboard" className="hover:text-primary transition-colors flex items-center gap-1">
                        <Home className="h-4 w-4" />
                        <span className="sr-only">Dashboard</span>
                    </Link>
                    {location.pathname !== '/dashboard' && (
                        <>
                            <ChevronRight className="h-4 w-4 mx-2 opacity-50" />
                            <span className="font-medium text-foreground capitalize tracking-wide">
                                {location.pathname.split('/')[1] || 'Dashboard'}
                            </span>
                        </>
                    )}
                </div>
            </div>
            
            <div className="flex items-center gap-3">
                <button className="hidden lg:flex items-center gap-2 h-10 rounded-full border border-border/50 bg-white/5 dark:bg-white/5 px-4 text-sm text-muted-foreground shadow-sm hover:bg-white/10 dark:hover:bg-white/10 hover:text-foreground transition-all w-64 group">
                    <Search className="h-4 w-4 group-hover:text-primary transition-colors" />
                    <span>Search pipelines...</span>
                    <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-white/10 bg-white/5 px-1.5 font-mono text-[10px] font-medium text-muted-foreground ml-auto opacity-70">
                        <span className="text-xs">⌘</span>K
                    </kbd>
                </button>
                <div className="h-8 w-px bg-border/50 mx-1 hidden sm:block"></div>
                <ModeToggle />
                <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-foreground hover:bg-white/5 rounded-full h-10 w-10">
                    <Bell className="h-5 w-5" />
                    <span className="absolute top-2.5 right-2.5 h-2 w-2 rounded-full bg-red-500 border-2 border-background shadow-sm"></span>
                </Button>
            </div>
        </header>
        
        {/* Scrollable Content with Page Transitions */}
        <main className="flex-1 overflow-auto p-4 md:p-6 scrollbar-thin scrollbar-thumb-border/50">
          <AnimatePresence mode="wait">
            <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 20, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.98 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="mx-auto max-w-8xl h-full"
            >
                <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* --- Mobile Overlay --- */}
      <AnimatePresence>
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex isolate">
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm"
                onClick={() => setIsMobileMenuOpen(false)}
            ></motion.div>
            <motion.div 
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="relative w-[85%] max-w-[320px] glass-panel h-full p-6 shadow-2xl"
            >
                <div className="flex items-center justify-between mb-10">
                    <div className="flex items-center gap-2.5 font-bold text-xl">
                        <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20">
                            <Workflow className="h-5 w-5" />
                        </div>
                        <span>SynqX</span>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(false)} className="rounded-full hover:bg-white/5 dark:hover:bg-white/5">
                        <X className="h-5 w-5" />
                    </Button>
                </div>
                <nav className="flex flex-col gap-2">
                    <NavItem to="/dashboard" icon={<LayoutDashboard />} label="Dashboard" onClick={handleMobileNavClick} />
                    <NavItem to="/connections" icon={<Cable />} label="Connections" onClick={handleMobileNavClick} />
                    <NavItem to="/pipelines" icon={<Workflow />} label="Pipelines" onClick={handleMobileNavClick} />
                    <NavItem to="/jobs" icon={<Activity />} label="Jobs & Runs" onClick={handleMobileNavClick} />
                    <div className="h-px bg-white/10 my-4"></div>
                    <NavItem to="/settings" icon={<Settings />} label="Settings" onClick={handleMobileNavClick} />
                </nav>
            </motion.div>
        </div>
      )}
      </AnimatePresence>
    </div>
  );
};