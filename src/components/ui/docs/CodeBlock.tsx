import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Maximize2, Copy, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { codeToHtml } from 'shiki';
import { motion, AnimatePresence } from 'framer-motion';

interface CodeBlockProps {
  code: string;
  language?: string;
  editable?: boolean;
  onChange?: (value: string) => void;
  className?: string;
  placeholder?: string;
  title?: string;
}

export const CodeBlock = ({ 
  code, 
  language = 'json', 
  editable = false, 
  onChange, 
  className,
  placeholder,
  title
}: CodeBlockProps) => {
  const [isMaximized, setIsMaximized] = useState(false);
  const [highlightedCode, setHighlightedCode] = useState('');
  const [copied, setCopied] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let mounted = true;
    
    async function highlight() {
      if (!code || editable) return;
      
      try {
        const html = await codeToHtml(code, {
          lang: language,
          theme: 'github-dark', // or consistent theme
        });
        if (mounted) setHighlightedCode(html);
      } catch (e) {
        console.error('Highlight failed', e);
        if (mounted) setHighlightedCode(`<pre><code>${code}</code></pre>`);
      }
    }

    highlight();
    
    return () => { mounted = false; };
  }, [code, language, editable]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderContent = (isExpanded: boolean) => (
    <div className={cn("w-full", isExpanded ? "h-full" : "h-auto")}>
      {editable ? (
        <Textarea
          value={code}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder={placeholder}
          className={cn(
            "font-mono glass-input bg-transparent border-0 focus-visible:ring-0 resize-none w-full transition-all",
            isExpanded ? "text-sm leading-relaxed p-6 h-full" : "text-[10px] p-4 min-h-[100px]"
          )}
          autoFocus={isExpanded}
          onInput={(e) => {
            if (!isExpanded) {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = 'auto';
              target.style.height = `${target.scrollHeight}px`;
            }
          }}
        />
      ) : (
        <div 
          className={cn(
            "font-mono w-full", 
            isExpanded ? "text-sm h-full" : "text-[10px] h-auto",
            "[&>pre]:!bg-transparent [&>pre]:!p-4 [&>pre]:!m-0 [&>pre]:w-full",
            isExpanded ? "[&>pre]:min-h-full [&>pre]:!rounded-none" : "[&>pre]:rounded-[calc(var(--radius)-4px)]"
          )}
          dangerouslySetInnerHTML={{ __html: highlightedCode || `<pre class="p-4 text-muted-foreground">${code}</pre>` }}
        />
      )}
    </div>
  );

  return (
    <>
      <div className={cn("relative group border border-white/5 bg-black/20 rounded-xl transition-all duration-300", className)} ref={containerRef}>
        <div className="absolute right-2 top-2 z-20 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            size="icon"
            variant="ghost"
            onClick={handleCopy}
            className="h-6 w-6 text-muted-foreground hover:text-foreground bg-black/40 hover:bg-black/60 backdrop-blur-md"
          >
            {copied ? <Check size={12} /> : <Copy size={12} />}
          </Button>
          <motion.div layoutId={`maximize-${code?.slice(0, 10)}`}>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setIsMaximized(true)}
              className="h-6 w-6 text-muted-foreground hover:text-foreground bg-black/40 hover:bg-black/60 backdrop-blur-md"
            >
              <Maximize2 size={12} />
            </Button>
          </motion.div>
        </div>
        <div className="w-full h-full overflow-auto custom-scrollbar">
          {renderContent(false)}
        </div>
      </div>

      {createPortal(
        <AnimatePresence>
          {isMaximized && (
            <div className="fixed inset-0 z-9999 flex items-center justify-center p-4 sm:p-10 pointer-events-auto">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={() => setIsMaximized(false)}
              />
              <motion.div
                layoutId={`maximize-${code?.slice(0, 10)}`}
                className="relative w-full max-w-5xl h-full max-h-[80vh] rounded-2xl border border-white/10 bg-black/90 backdrop-blur-3xl shadow-2xl overflow-hidden flex flex-col z-[10000]"
              >
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-white/5 shrink-0">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{title || language}</span>
                  <div className="flex gap-2">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={handleCopy}
                      className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-white/10"
                    >
                      {copied ? <Check size={14} /> : <Copy size={14} />}
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => setIsMaximized(false)}
                      className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-white/10"
                    >
                      <X size={14} />
                    </Button>
                  </div>
                </div>
                <div className="flex-1 overflow-auto custom-scrollbar p-0">
                  {renderContent(true)}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
};
