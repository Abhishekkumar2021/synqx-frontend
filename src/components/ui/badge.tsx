import React from 'react';
import { cn } from '../../lib/utils';

// We need to install class-variance-authority or just do it manually. 
// I'll do it manually to save an install step since I didn't install cva.

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: 'default' | 'secondary' | 'destructive' | 'outline';
}

export const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(({ className, variant = 'default', ...props }, ref) => {
    const variants = {
        default: "border-transparent bg-blue-600 text-white hover:bg-blue-700",
        secondary: "border-transparent bg-gray-800 text-white hover:bg-gray-700",
        destructive: "border-transparent bg-red-600 text-white hover:bg-red-700",
        outline: "text-white border-gray-700",
    }
    
    return (
        <div ref={ref} className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2", variants[variant], className)} {...props} />
    )
});
Badge.displayName = "Badge";
