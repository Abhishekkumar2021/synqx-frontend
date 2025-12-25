/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Maximize2, Copy, Check, X, Minimize, FileCode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { codeToHtml } from 'shiki';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface CodeBlockProps {
  code: string;
  language?: string;
  editable?: boolean;
  onChange?: (value: string) => void;
  className?: string;
  placeholder?: string;
  title?: string;
  maxHeight?: string;
  rounded?: boolean;
  wrap?: boolean;
  usePortal?: boolean;
}

export const CodeBlock = ({
  code,
  language = 'typescript',
  editable = false,
  onChange,
  className,
  placeholder,
  title,
  maxHeight = '400px',
  rounded = false,
  wrap = false,
  usePortal = false
}: CodeBlockProps) => {
  const [isMaximized, setIsMaximized] = useState(false);
  const [highlightedCode, setHighlightedCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { theme } = useTheme();

  const isDark = useMemo(() =>
    theme === 'dark' || (theme === 'system' && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches),
    [theme]
  );

  const shikiTheme = useMemo(() => isDark ? 'vitesse-dark' : 'vitesse-light', [isDark]);

  useEffect(() => {
    if (isMaximized) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [isMaximized]);

  useEffect(() => {
    let mounted = true;
    async function highlight() {
      if (!code || editable) return;
      try {
        const html = await codeToHtml(code, { lang: language, theme: shikiTheme });
        if (mounted) setHighlightedCode(html);
      } catch (e) {
        if (mounted) setHighlightedCode(`<pre><code>${code}</code></pre>`);
      }
    }
    highlight();
    return () => { mounted = false; };
  }, [code, language, editable, shikiTheme]);

  const handleCopy = useCallback(async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [code]);

  const renderContent = (isExpanded: boolean) => (
    <div className="relative w-full h-full group/content flex flex-col min-h-0">
      <div className="absolute inset-0 bg-noise opacity-[0.03] dark:opacity-[0.02] pointer-events-none" />

      {editable ? (
        <Textarea
          ref={textareaRef}
          value={code}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder={placeholder}
          className={cn(
            "font-mono bg-transparent border-0 focus-visible:ring-0 resize-none w-full relative z-10",
            "overflow-y-auto custom-scrollbar flex-1",
            "selection:bg-primary/30 selection:text-foreground",
            wrap ? "whitespace-pre-wrap" : "whitespace-pre",
            isExpanded ? "text-sm leading-relaxed p-8" : "text-xs leading-relaxed p-5"
          )}
          spellCheck={false}
        />
      ) : (
        <div
          className={cn(
            "w-full h-full overflow-y-auto relative z-20 select-text cursor-text custom-scrollbar flex-1",
            "dark:[&_.shiki_span]:filter dark:[&_.shiki_span]:brightness-125",
            "selection:bg-primary/20 dark:selection:bg-primary/40 selection:text-foreground",
            wrap ? "[&>pre]:whitespace-pre-wrap" : "[&>pre]:whitespace-pre",
            isExpanded ? "text-[13px]" : "text-[11px]",
            "[&>pre]:bg-transparent! [&>pre]:m-0 [&>pre]:w-full [&>pre]:h-full",
            isExpanded ? "[&>pre]:p-8 [&>pre]:leading-7" : "[&>pre]:p-5 [&>pre]:leading-6"
          )}
          onPointerDown={(e) => e.stopPropagation()}
          dangerouslySetInnerHTML={{
            __html: highlightedCode || `<pre class="p-4 opacity-40">${code}</pre>`
          }}
        />
      )}
    </div>
  );

  const maximizedContent = (
    <AnimatePresence>
      {isMaximized && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[10000] flex items-center justify-center"
          onPointerDown={(e) => e.stopPropagation()}
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-white/60 dark:bg-black/40 backdrop-blur-2xl"
            onClick={() => setIsMaximized(false)}
          />

          <motion.div
            layoutId={`code-block-${title}`}
            className={cn(
              "relative w-full h-full",
              "rounded-none overflow-hidden flex flex-col z-[10001]",
              "bg-background border-0 shadow-none ring-0"
            )}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Production-grade Header */}
            <div className="flex items-center justify-between px-8 py-4 bg-muted/10 backdrop-blur-3xl shrink-0 border-b border-border/40 relative z-20">
              <div className="flex items-center gap-8">
                {/* Traffic Lights */}
                <div
                  className="flex items-center gap-2 group/lights cursor-pointer p-1.5 rounded-lg hover:bg-white/5 transition-colors"
                  onClick={() => setIsMaximized(false)}
                >
                  <div className="w-3 h-3 rounded-full bg-red-500/80 flex items-center justify-center shadow-[0_0_10px_rgba(239,68,68,0.2)]">
                    <X size={8} className="text-red-950 opacity-0 group-hover/lights:opacity-100 transition-opacity" />
                  </div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500/80 shadow-[0_0_10px_rgba(245,158,11,0.2)]" />
                  <div className="w-3 h-3 rounded-full bg-green-500/80 shadow-[0_0_10px_rgba(16,185,129,0.2)]" />
                </div>

                <div className="h-8 w-px bg-border/40 hidden sm:block" />

                <div className="flex items-center gap-4">
                  <div className="space-y-0.5">
                    <h3 className="text-sm font-black tracking-tight text-foreground uppercase tracking-widest">{title || 'Code Inspector'}</h3>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-primary/10 border border-primary/20">
                        <FileCode size={10} className="text-primary" />
                        <span className="text-[9px] font-black text-primary uppercase tracking-widest">{language}</span>
                      </div>
                      <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-muted/30 border border-border/40">
                        <div className="h-1 w-1 rounded-full bg-muted-foreground/50" />
                        <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">{editable ? 'Editable' : 'Read-Only'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={handleCopy}
                        className="h-10 w-10 rounded-xl bg-background/40 border border-border/40 hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-all shadow-sm"
                      >
                        {copied ? <Check size={18} className="text-success" /> : <Copy size={18} />}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Copy to Clipboard</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setIsMaximized(false)}
                        className="h-10 w-10 rounded-xl bg-background/40 border border-border/40 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-all shadow-sm"
                      >
                        <Minimize size={18} />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Exit Fullscreen (Esc)</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>

            <div className="flex-1 min-h-0 bg-background/50 relative z-10">
              {renderContent(true)}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <div className={cn("relative", isMaximized && "z-[9999]")}>
      <div
        className={cn(
          "relative group transition-all duration-500 w-full flex flex-col overflow-hidden",
          "bg-transparent border border-border/20 shadow-none",
          rounded ? "rounded-xl" : "rounded-sm",
          className
        )}
        style={{ height: maxHeight }} // Fixed height enables internal scroll
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        {/* Floating Actions (Top Right) */}
        {!isMaximized && (
          <div className={cn(
            "absolute top-2 right-2 z-30 flex gap-1 transition-all duration-300",
            isHovering ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"
          )}>
            <div className="flex items-center gap-1 p-1 rounded-lg bg-background/80 backdrop-blur-md border border-border/40 shadow-sm">
              <Button size="icon" variant="ghost" onClick={handleCopy} title="Copy Code" className="h-7 w-7 rounded-md hover:bg-primary/10 hover:text-primary">
                {copied ? <Check size={14} className="text-success" /> : <Copy size={14} />}
              </Button>
              <Button size="icon" variant="ghost" onClick={() => setIsMaximized(true)} title="Maximize" className="h-7 w-7 rounded-md hover:bg-primary/10 hover:text-primary">
                <Maximize2 size={14} />
              </Button>
            </div>
          </div>
        )}

        {/* This container allows the internal scroll to happen */}
        <div className="flex-1 min-h-0 bg-background/50">
          {renderContent(false)}
        </div>
      </div>

      {usePortal ? createPortal(maximizedContent, document.body) : maximizedContent}
    </div>
  );
};