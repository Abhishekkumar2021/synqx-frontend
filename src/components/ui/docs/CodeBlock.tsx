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
  wrap = false
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
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsMaximized(false);
    };
    if (isMaximized) window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isMaximized]);

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
          onMouseDown={(e) => e.stopPropagation()}
          dangerouslySetInnerHTML={{
            __html: highlightedCode || `<pre class="p-4 opacity-40">${code}</pre>`
          }}
        />
      )}
    </div>
  );

  return (
    <>
      <div
        className={cn(
          "relative group transition-all duration-500 w-full flex flex-col overflow-hidden",
          "glass border-0 shadow-none flex flex-col",
          rounded ? "rounded-xl border border-border/40" : "rounded-none",
          "hover:shadow-xl hover:shadow-black/5 dark:hover:shadow-primary/5",
          className
        )}
        style={{ height: maxHeight }} // Fixed height enables internal scroll
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        <div className="absolute inset-0 ring-1 ring-inset ring-black/5 dark:ring-white/10 pointer-events-none" />

        <div className={cn(
          "flex items-center justify-between px-4 py-2 shrink-0",
          "bg-muted/30 border-b border-border/40 backdrop-blur-xl"
        )}>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 opacity-60">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500/40" />
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/40" />
              <div className="w-2.5 h-2.5 rounded-full bg-green-500/40" />
            </div>
            {title && (
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest truncate max-w-[200px]">
                {title}
              </span>
            )}
            {!title && (
              <div className="flex items-center gap-2 px-2 py-0.5 rounded bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10">
                <FileCode size={10} className="text-muted-foreground/70" />
                <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">{language}</span>
              </div>
            )}
          </div>

          <div className={cn(
            "flex gap-1 transition-all duration-300",
            isHovering ? "opacity-100 scale-100" : "opacity-0 scale-95"
          )}>
            <Button size="icon" variant="ghost" onClick={handleCopy} className="h-6 w-6 rounded hover:bg-black/5 dark:hover:bg-white/10">
              {copied ? <Check size={12} className="text-success" /> : <Copy size={12} className="text-muted-foreground" />}
            </Button>
            <Button size="icon" variant="ghost" onClick={() => setIsMaximized(true)} className="h-6 w-6 rounded hover:bg-black/5 dark:hover:bg-white/10">
              <Maximize2 size={12} className="text-muted-foreground" />
            </Button>
          </div>
        </div>

        {/* This container allows the internal scroll to happen */}
        <div className="flex-1 min-h-0 bg-background/50">
          {renderContent(false)}
        </div>
      </div>

      {createPortal(
        <AnimatePresence>
          {isMaximized && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[9999] flex items-center justify-center p-4 md:p-12"
            >
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-white/60 dark:bg-black/40 backdrop-blur-2xl"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMaximized(false);
                }}
              />

              <motion.div
                layoutId={`code-block-${title}`}
                className={cn(
                  "relative w-full max-w-5xl h-full max-h-[85vh]",
                  "rounded-3xl overflow-hidden flex flex-col z-[10000]",
                  "glass-panel border-0 shadow-2xl",
                  "ring-1 ring-black/10 dark:ring-white/20"
                )}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between px-8 py-5 bg-white/20 dark:bg-black/20 backdrop-blur-3xl shrink-0 border-b border-black/5 dark:border-white/5">
                  <div className="flex items-center gap-6">
                    <div
                      className="flex items-center gap-1.5 group/lights cursor-pointer"
                      onClick={() => setIsMaximized(false)}
                    >
                      <div className="w-3 h-3 rounded-full bg-red-500/80 flex items-center justify-center">
                        <X size={8} className="text-red-950 opacity-0 group-hover/lights:opacity-100 transition-opacity" />
                      </div>
                      <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                      <div className="w-3 h-3 rounded-full bg-green-500/80" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold tracking-tight">{title || 'Inspecting Code'}</h3>
                      <p className="text-[10px] opacity-50 font-medium uppercase tracking-widest">{language}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={handleCopy}
                      className="h-10 w-10 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10"
                    >
                      {copied ? <Check size={18} className="text-success" /> : <Copy size={18} />}
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => setIsMaximized(false)}
                      className="h-10 w-10 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10"
                    >
                      <Minimize size={18} />
                    </Button>
                  </div>
                </div>

                <div className="flex-1 min-h-0 bg-background">
                  {renderContent(true)}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
};