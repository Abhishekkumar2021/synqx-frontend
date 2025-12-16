import React from 'react';
import { motion } from 'framer-motion';

export const NavGroup = ({ children, title, collapsed }: { children: React.ReactNode, title?: string, collapsed?: boolean }) => {
    return (
        <div className="mb-2">
            {!collapsed && title && (
                <motion.h4
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="px-3 mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground/60 whitespace-nowrap overflow-hidden"
                >
                    {title}
                </motion.h4>
            )}
            <div className="flex flex-col gap-1">
                {children}
            </div>
        </div>
    )
}