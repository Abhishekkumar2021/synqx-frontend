import { Moon, Sun, Laptop, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTheme } from "@/components/ThemeProvider"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function ModeToggle() {
    const { theme, setTheme } = useTheme()

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-9 w-9 relative text-muted-foreground hover:text-foreground transition-colors hover:bg-muted/50"
                >
                    <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all duration-300 dark:-rotate-90 dark:scale-0 text-amber-500" />
                    <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all duration-300 dark:rotate-0 dark:scale-100 text-blue-500" />
                    <span className="sr-only">Toggle theme</span>
                </Button>
            </DropdownMenuTrigger>
            
            <DropdownMenuContent align="end" className="min-w-[140px] border-border/50 bg-background/80 backdrop-blur-xl">
                <DropdownMenuItem onClick={() => setTheme("light")} className="gap-2 cursor-pointer focus:bg-primary/10 focus:text-primary">
                    <Sun className="h-4 w-4" />
                    <span>Light</span>
                    {theme === 'light' && <Check className="ml-auto h-3.5 w-3.5" />}
                </DropdownMenuItem>
                
                <DropdownMenuItem onClick={() => setTheme("dark")} className="gap-2 cursor-pointer focus:bg-primary/10 focus:text-primary">
                    <Moon className="h-4 w-4" />
                    <span>Dark</span>
                    {theme === 'dark' && <Check className="ml-auto h-3.5 w-3.5" />}
                </DropdownMenuItem>
                
                <DropdownMenuItem onClick={() => setTheme("system")} className="gap-2 cursor-pointer focus:bg-primary/10 focus:text-primary">
                    <Laptop className="h-4 w-4" />
                    <span>System</span>
                    {theme === 'system' && <Check className="ml-auto h-3.5 w-3.5" />}
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}