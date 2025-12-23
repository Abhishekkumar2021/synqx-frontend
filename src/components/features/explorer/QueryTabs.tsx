import React from 'react';
import { Terminal, Plus, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from '@/lib/utils';
import { type QueryTab } from './types';

interface QueryTabsProps {
    tabs: QueryTab[];
    activeTabId: string;
    onTabSelect: (id: string) => void;
    onTabAdd: () => void;
    onTabRemove: (id: string, e: React.MouseEvent) => void;
    onTabRename: (id: string, newTitle: string) => void;
    onCloseAll: () => void;
}

export const QueryTabs: React.FC<QueryTabsProps> = ({
    tabs,
    activeTabId,
    onTabSelect,
    onTabAdd,
    onTabRemove,
    onTabRename,
    onCloseAll
}) => {
    return (
        <div className="flex items-center bg-muted/30 border-b border-border/40 px-2 overflow-x-auto scrollbar-none shrink-0 group/tabbar">
            {tabs.map(tab => (
                <div 
                    key={tab.id}
                    onClick={() => onTabSelect(tab.id)}
                    onDoubleClick={() => {
                        const newTitle = prompt("Enter new tab name:", tab.title);
                        if (newTitle) onTabRename(tab.id, newTitle);
                    }}
                    className={cn(
                        "group flex items-center gap-2 px-4 py-2 border-r border-border/20 cursor-pointer transition-all min-w-[120px] max-w-[200px]",
                        activeTabId === tab.id 
                            ? "bg-background/60 border-b-2 border-b-primary shadow-sm" 
                            : "hover:bg-background/20 opacity-60"
                    )}
                >
                    <Terminal className={cn("h-3 w-3", activeTabId === tab.id ? "text-primary" : "text-muted-foreground")} />
                    <span className="text-[10px] font-bold truncate flex-1">{tab.title}</span>
                    <X 
                        className="h-3 w-3 opacity-0 group-hover:opacity-100 hover:text-rose-500 transition-all rounded-sm" 
                        onClick={(e) => onTabRemove(tab.id, e)}
                    />
                </div>
            ))}
            <div className="flex items-center gap-1 ml-1">
                <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary transition-all"
                    onClick={onTabAdd}
                >
                    <Plus className="h-3.5 w-3.5" />
                </Button>
                
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 rounded-lg hover:bg-rose-500/10 hover:text-rose-600 transition-all opacity-0 group-hover/tabbar:opacity-100"
                                onClick={onCloseAll}
                                disabled={tabs.length <= 1}
                            >
                                <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>Close All Tabs</TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </div>
        </div>
    );
};
