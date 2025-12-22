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
}

export const CodeBlock = ({
  code,
  language = 'typescript',
  editable = false,
  onChange,
  className,
  placeholder,
  title,
  maxHeight = '400px'
}: CodeBlockProps) => {
  const [isMaximized, setIsMaximized] = useState(false);
  const [highlightedCode, setHighlightedCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { theme } = useTheme();

  const isDark = useMemo(() =>
    theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches),
    [theme]
  );

  const shikiTheme = useMemo(() => isDark ? 'github-dark' : 'github-light', [isDark]);

  // Handle Keyboard Escape
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsMaximized(false);
    };
    if (isMaximized) window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isMaximized]);

  // Prevent background scroll
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
    e?.stopPropagation(); // Prevent modal toggle
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [code]);

  const renderContent = (isExpanded: boolean) => (
    <div className="relative w-full h-full group/content overflow-hidden">
      <div className="absolute inset-0 bg-noise opacity-[0.03] dark:opacity-[0.02] pointer-events-none" />

      {editable ? (
        <Textarea
          ref={textareaRef}
          value={code}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder={placeholder}
          className={cn(
            "font-mono bg-transparent border-0 focus-visible:ring-0 resize-none w-full relative z-10",
            "scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent",
            "selection:bg-primary/30 selection:text-foreground",
            isExpanded ? "text-sm leading-relaxed p-8 h-full" : "text-xs leading-relaxed p-5 min-h-[140px]"
          )}
          spellCheck={false}
        />
      ) : (
        <div
          className={cn(
            "w-full h-full overflow-auto relative z-20 select-text cursor-text",
            "scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent",
            "selection:bg-primary/20 dark:selection:bg-primary/40 selection:text-foreground",
            isExpanded ? "text-[13px]" : "text-[11px]",
            "[&>pre]:bg-transparent! [&>pre]:p-0 [&>pre]:m-0 [&>pre]:w-full",
            isExpanded ? "[&>pre]:p-8 [&>pre]:leading-7" : "[&>pre]:p-5 [&>pre]:leading-6"
          )}
          // Fix: prevent dragging/selecting from closing the modal
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
      {/* Compact Mode */}
      <div
        className={cn(
          "relative group transition-all duration-500 w-full flex flex-col overflow-hidden",
          "glass rounded-none border-0 shadow-none",
          "hover:shadow-xl hover:shadow-black/5 dark:hover:shadow-primary/5",
          className
        )}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        <div className="absolute inset-0 ring-1 ring-inset ring-black/5 dark:ring-white/10 pointer-events-none" />

        <div className={cn(
          "flex items-center justify-between px-5 py-2.5",
          "bg-white/40 dark:bg-black/20 backdrop-blur-xl border-b border-black/3 dark:border-white/5"
        )}>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 opacity-60">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500/40" />
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/40" />
              <div className="w-2.5 h-2.5 rounded-full bg-green-500/40" />
            </div>
            <div className="flex items-center gap-2 px-2 py-0.5 rounded bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10">
              <FileCode size={10} className="text-muted-foreground/70" />
              <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">{language}</span>
            </div>
          </div>

          <div className={cn(
            "flex gap-1 transition-all duration-300",
            isHovering ? "opacity-100 scale-100" : "opacity-0 scale-95"
          )}>
            <Button size="icon" variant="ghost" onClick={handleCopy} className="h-7 w-7 rounded hover:bg-black/5 dark:hover:bg-white/10">
              {copied ? <Check size={14} className="text-success" /> : <Copy size={14} className="text-muted-foreground" />}
            </Button>
            <Button size="icon" variant="ghost" onClick={() => setIsMaximized(true)} className="h-7 w-7 rounded hover:bg-black/5 dark:hover:bg-white/10">
              <Maximize2 size={14} className="text-muted-foreground" />
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-hidden" style={{ maxHeight }}>
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
              className="fixed inset-0 z-9999 flex items-center justify-center p-4 md:p-12 pointer-events-none"
            >
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-white/60 dark:bg-black/40 backdrop-blur-2xl pointer-events-auto"
                onClick={() => setIsMaximized(false)}
              />

              <motion.div
                layoutId={`code-block-${title}`}
                className={cn(
                  "relative w-full max-w-5xl h-full max-h-[85vh]",
                  "rounded-3xl overflow-hidden flex flex-col z-10000",
                  "glass-panel border-0 shadow-2xl pointer-events-auto",
                  "ring-1 ring-black/10 dark:ring-white/20"
                )}
                // This stops clicks on the header/padding from closing the modal
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

                <div className="flex-1 overflow-hidden bg-white/10 dark:bg-black/40">
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