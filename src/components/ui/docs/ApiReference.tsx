/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Search, Globe, Activity, Terminal, Layers,
  ChevronDown, FileJson, ShieldCheck, Braces, 
  Settings2, ArrowRight, Maximize2, Minimize2, 
  LayoutDashboard, Copy, CheckCheck, X, AlertCircle,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import openAPISpec from '@/docs/openapi.json';

// Types
interface Parameter {
  name: string;
  in: 'path' | 'query' | 'header' | 'cookie';
  required?: boolean;
  schema?: { type: string; format?: string; default?: any };
  description?: string;
}

interface Operation {
  id: string;
  path: string;
  method: string;
  summary?: string;
  description?: string;
  tags?: string[];
  operationId: string;
  parameters?: Parameter[];
  requestBody?: any;
  responses?: any;
}

// Utilities
const resolveSchema = (schema: any, spec: any = openAPISpec): any => {
  if (!schema) return {};
  if (schema.$ref) {
    const refPath = schema.$ref.replace('#/', '').split('/');
    let resolved = spec;
    for (const part of refPath) {
      resolved = resolved[part];
    }
    return resolveSchema(resolved, spec);
  }
  if (schema.type === 'array' && schema.items) {
    return { ...schema, items: resolveSchema(schema.items, spec) };
  }
  if (schema.properties) {
    const resolvedProps: any = {};
    Object.entries(schema.properties).forEach(([key, value]) => {
      resolvedProps[key] = resolveSchema(value, spec);
    });
    return { ...schema, properties: resolvedProps };
  }
  return schema;
};

const generateCodeSnippet = (method: string, url: string, lang: string, params: any, body: string, token: string) => {
  const fullUrl = new URL(url);
  Object.entries(params.query || {}).forEach(([k, v]) => {
    if (v) fullUrl.searchParams.append(k, String(v));
  });

  switch (lang) {
    case 'curl':
      return `curl -X ${method} "${fullUrl.toString()}" \\
  -H "Authorization: Bearer ${token ? '••••' : 'YOUR_TOKEN'}" \\
  -H "Content-Type: application/json"${body ? ` \\
  -d '${body}'` : ''}`;
    case 'python':
      return `import requests

url = "${fullUrl.toString()}"
headers = {
    "Authorization": "Bearer ${token ? '••••' : 'YOUR_TOKEN'}",
    "Content-Type": "application/json"
}
${body ? `data = ${body}

` : ''}response = requests.${method.toLowerCase()}(url, headers=headers${body ? ', json=data' : ''})
print(response.json())`;
    case 'javascript':
      return `const response = await fetch("${fullUrl.toString()}", {
  method: "${method}",
  headers: {
    "Authorization": "Bearer ${token ? '••••' : 'YOUR_TOKEN'}",
    "Content-Type": "application/json"
  }${body ? `,
  body: JSON.stringify(${body})` : ''}
});

const data = await response.json();
console.log(data);`;
    default: return '';
  }
};

// Sub-components
const MethodBadge = ({ method, active }: { method: string; active?: boolean }) => {
  const colors: Record<string, string> = {
    GET: "text-emerald-500 border-emerald-500/20 bg-emerald-500/5",
    POST: "text-blue-500 border-blue-500/20 bg-blue-500/5",
    PUT: "text-amber-500 border-amber-500/20 bg-amber-500/5",
    DELETE: "text-red-500 border-red-500/20 bg-red-500/5",
    PATCH: "text-purple-500 border-purple-500/20 bg-purple-500/5",
  };
  
  return (
    <div className={cn(
      "px-2.5 py-1 rounded-lg text-[10px] font-black border uppercase tracking-wider min-w-[55px] text-center transition-all duration-300",
      active && "ring-2 ring-primary/30 scale-105 shadow-lg",
      colors[method] || "bg-muted text-muted-foreground"
    )}>
      {method}
    </div>
  );
};

const CopyButton = ({ content, className }: { content: string; className?: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className={cn(
        "p-2 rounded-lg transition-all duration-200 hover:bg-background/50",
        copied && "bg-success/10",
        className
      )}
      aria-label={copied ? "Copied!" : "Copy"}
    >
      {copied ? (
        <CheckCheck size={14} className="text-success" />
      ) : (
        <Copy size={14} className="text-muted-foreground" />
      )}
    </button>
  );
};

const SchemaNode = ({ name, schema, required, level = 0 }: { 
  name: string; 
  schema: any; 
  required?: boolean;
  level?: number;
}) => {
  const resolved = resolveSchema(schema);
  const [isExpanded, setIsExpanded] = useState(level < 2);

  const hasChildren = resolved.properties || (resolved.type === 'array' && resolved.items?.properties);

  return (
    <div className="py-2 border-b border-border/5 last:border-0">
      <div className="flex items-center gap-2 mb-1">
        {hasChildren && (
          <button 
            onClick={() => setIsExpanded(!isExpanded)} 
            className="text-muted-foreground hover:text-primary transition-colors p-1 rounded hover:bg-muted/20"
            aria-label={isExpanded ? "Collapse" : "Expand"}
          >
            <ChevronDown 
              size={12} 
              className={cn(
                "transition-transform duration-300",
                !isExpanded && "-rotate-90"
              )} 
            />
          </button>
        )}
        <span className="font-mono text-[13px] font-bold text-foreground/90">{name}</span>
        <span className="text-[10px] font-bold text-primary/60 uppercase tracking-widest">
          {resolved.type}
          {resolved.format && ` (${resolved.format})`}
        </span>
        {required && (
          <span className="text-[9px] font-bold text-destructive/70 px-1.5 py-0.5 rounded bg-destructive/10 uppercase">
            Required
          </span>
        )}
        {resolved.enum && (
          <span className="text-[9px] text-muted-foreground px-1.5 py-0.5 rounded bg-muted/20">
            enum
          </span>
        )}
      </div>
      
      {resolved.description && (
        <p className="text-xs text-muted-foreground ml-6 mb-2 leading-relaxed">
          {resolved.description}
        </p>
      )}
      
      {resolved.enum && (
        <div className="ml-6 flex flex-wrap gap-1 mb-2">
          {resolved.enum.map((val: any) => (
            <code key={val} className="text-[10px] px-2 py-0.5 rounded bg-muted/30 text-foreground/70">
              {String(val)}
            </code>
          ))}
        </div>
      )}

      {isExpanded && resolved.properties && (
        <div className="ml-6 pl-3 border-l-2 border-border/20 space-y-2 mt-2">
          {Object.entries(resolved.properties).map(([key, val]: [string, any]) => (
            <SchemaNode 
              key={key} 
              name={key} 
              schema={val} 
              required={resolved.required?.includes(key)}
              level={level + 1}
            />
          ))}
        </div>
      )}

      {isExpanded && resolved.type === 'array' && resolved.items?.properties && (
        <div className="ml-6 pl-3 border-l-2 border-border/20 space-y-2 mt-2">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Array Items:</span>
          {Object.entries(resolved.items.properties).map(([key, val]: [string, any]) => (
            <SchemaNode 
              key={key} 
              name={key} 
              schema={val} 
              required={resolved.items.required?.includes(key)}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// Main Component
export function ApiReference() {
  const [search, setSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [activeOp, setActiveOp] = useState<Operation | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeTab, setActiveTab] = useState('responses');
  const [activeCodeLang, setActiveCodeLang] = useState('curl');
  
  // Server state
  const servers = useMemo(() => openAPISpec.servers, []);
  const [baseUrl, setBaseUrl] = useState<string>(servers[0]?.url || 'https://api.example.com');
  
  // Request state
  const [paramValues, setParamValues] = useState<Record<string, any>>({});
  const [requestBody, setRequestBody] = useState<string>('');
  const [requestState, setRequestState] = useState<{ 
    loading: boolean;
    response: any;
    status: number | null;
    error: string | null;
  }>({ loading: false, response: null, status: null, error: null });

  // Parse operations from spec
  const operations = useMemo(() => {
    const ops: Operation[] = [];
    Object.entries(openAPISpec.paths).forEach(([path, pathItem]: [string, any]) => {
      Object.entries(pathItem).forEach(([method, operation]: [string, any]) => {
        if (['get', 'post', 'put', 'delete', 'patch'].includes(method)) {
          ops.push({
            path,
            method: method.toUpperCase(),
            ...operation,
            id: `${method}-${path}`,
          });
        }
      });
    });
    return ops;
  }, []);

  // Set initial active operation
  useEffect(() => {
    if (!activeOp && operations.length > 0) {
      setActiveOp(operations[0]);
    }
  }, [operations, activeOp]);

  // Extract tags
  const tags = useMemo(() => {
    const allTags = new Set<string>();
    operations.forEach(op => op.tags?.forEach((tag: string) => allTags.add(tag)));
    return Array.from(allTags).sort();
  }, [operations]);

  // Filter operations
  const filteredOps = useMemo(() => {
    return operations.filter(op => {
      const matchesSearch = 
        op.path.toLowerCase().includes(search.toLowerCase()) || 
        op.summary?.toLowerCase().includes(search.toLowerCase()) ||
        op.operationId?.toLowerCase().includes(search.toLowerCase());
      const matchesTag = !selectedTag || op.tags?.includes(selectedTag);
      return matchesSearch && matchesTag;
    });
  }, [operations, search, selectedTag]);

  // Group operations by tag
  const groupedOps = useMemo(() => {
    const groups: Record<string, Operation[]> = {};
    filteredOps.forEach(op => {
      const tag = op.tags?.[0] || 'Other';
      if (!groups[tag]) groups[tag] = [];
      groups[tag].push(op);
    });
    return groups;
  }, [filteredOps]);

  // Reset state when operation changes
  const handleSelectOperation = useCallback((op: Operation) => {
    setActiveOp(op);
    setRequestState({ loading: false, response: null, status: null, error: null });
    setRequestBody('');
    setParamValues({});
    setActiveTab('responses');
  }, []);

  // Mock API request
  const handleTryItOut = async () => {
    if (!activeOp) return;
    
    setRequestState({ loading: true, response: null, status: null, error: null });
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    try {
      // Validate required parameters
      const missingParams = activeOp.parameters?.filter(p => p.required && !paramValues[p.name]);
      if (missingParams && missingParams.length > 0) {
        throw new Error(`Missing required parameters: ${missingParams.map(p => p.name).join(', ')}`);
      }

      // Validate request body for POST/PUT/PATCH
      if (['POST', 'PUT', 'PATCH'].includes(activeOp.method) && activeOp.requestBody) {
        if (!requestBody) {
          throw new Error('Request body is required');
        }
        try {
          JSON.parse(requestBody);
        } catch {
          throw new Error('Invalid JSON in request body');
        }
      }

      // Mock successful response
      const mockResponse = {
        id: "123e4567-e89b-12d3-a456-426614174000",
        email: "user@example.com",
        name: "John Doe",
        role: "user",
        createdAt: new Date().toISOString()
      };

      setRequestState({ 
        loading: false, 
        response: mockResponse, 
        status: activeOp.method === 'POST' ? 201 : 200,
        error: null
      });
    } catch (err: any) {
      setRequestState({
        loading: false, 
        response: null,
        status: 400,
        error: err.message
      });
    }
  };

  // Generate example request body
  const generateExampleBody = useCallback(() => {
    if (!activeOp?.requestBody) return;
    
    const schema = resolveSchema(activeOp.requestBody.content?.['application/json']?.schema);
    const example: any = {};
    
    if (schema.properties) {
      Object.entries(schema.properties).forEach(([key, prop]: [string, any]) => {
        const resolved = resolveSchema(prop);
        if (resolved.type === 'string') {
          example[key] = resolved.format === 'email' ? 'user@example.com' : `example_${key}`;
        } else if (resolved.type === 'number' || resolved.type === 'integer') {
          example[key] = 0;
        } else if (resolved.type === 'boolean') {
          example[key] = false;
        }
      });
    }
    
    setRequestBody(JSON.stringify(example, null, 2));
  }, [activeOp]);

  return (
    <>
      <div className={cn(
        "flex rounded-3xl border border-border/40 bg-card/30 backdrop-blur-3xl overflow-hidden shadow-2xl transition-all duration-500",
        isFullscreen ? "fixed inset-4 z-50 h-[calc(100vh-32px)]" : "relative h-[800px]"
      )}>
        
        {/* Sidebar */}
        <div className="w-80 border-r border-border/40 flex flex-col bg-muted/5">
          {/* Header */}
          <div className="p-6 border-b border-border/40 flex items-center justify-between bg-background/50">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-linear-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20">
                <Layers size={18} />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-black uppercase tracking-wider text-foreground">API Explorer</span>
                <span className="text-[10px] text-muted-foreground">{operations.length} endpoints</span>
              </div>
            </div>
            <button 
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 rounded-lg hover:bg-muted/30 transition-all text-muted-foreground hover:text-foreground"
              aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            >
              {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>
          </div>

          {/* Search */}
          <div className="p-4 border-b border-border/20 bg-muted/5">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search endpoints..."
                className="w-full h-10 pl-10 pr-4 rounded-xl bg-background/50 border border-border/40 text-sm font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all outline-none"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Tag filters */}
          {tags.length > 1 && (
            <div className="p-4 border-b border-border/20">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedTag(null)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all",
                    !selectedTag 
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" 
                      : "bg-muted/20 text-muted-foreground hover:bg-muted/40"
                  )}
                >
                  All
                </button>
                {tags.map(tag => (
                  <button
                    key={tag}
                    onClick={() => setSelectedTag(tag)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all",
                      selectedTag === tag 
                        ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" 
                        : "bg-muted/20 text-muted-foreground hover:bg-muted/40"
                    )}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Operations list */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-2 space-y-6">
              {Object.entries(groupedOps).map(([tag, ops]) => (
                <div key={tag} className="space-y-1">
                  <h5 className="px-4 text-[9px] font-black uppercase tracking-[0.25em] text-muted-foreground/50 mb-2 mt-4 first:mt-0 sticky top-0 bg-background/80 backdrop-blur-sm py-1 z-10">
                    {tag}
                  </h5>
                  {ops.map(op => (
                    <button
                      key={op.id}
                      onClick={() => handleSelectOperation(op)}
                      className={cn(
                        "w-full flex items-start gap-3 px-4 py-3 rounded-xl transition-all duration-300 text-left group",
                        activeOp?.id === op.id 
                          ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" 
                          : "hover:bg-muted/30 border border-transparent hover:border-border/40"
                      )}
                    >
                      <div className="flex flex-col gap-1.5 w-full min-w-0">
                        <div className="flex items-center gap-2">
                          <MethodBadge method={op.method} active={activeOp?.id === op.id} />
                        </div>
                        <div className={cn(
                          "font-mono text-[11px] font-bold truncate",
                          activeOp?.id === op.id ? "text-primary-foreground" : "text-foreground/70"
                        )}>
                          {op.path}
                        </div>
                        {op.summary && (
                          <div className={cn(
                            "text-[10px] leading-tight line-clamp-2",
                            activeOp?.id === op.id ? "text-primary-foreground/80" : "text-muted-foreground"
                          )}>
                            {op.summary}
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              ))}
              
              {filteredOps.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <AlertCircle size={32} className="text-muted-foreground/40 mb-3" />
                  <p className="text-sm text-muted-foreground">No endpoints found</p>
                  <button
                    onClick={() => { setSearch(''); setSelectedTag(null); }}
                    className="mt-3 text-xs text-primary font-bold hover:underline"
                  >
                    Clear filters
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 flex flex-col min-w-0 bg-background/20">
          {/* Server selector */}
          <div className="h-14 border-b border-border/40 flex items-center justify-between px-6 bg-muted/5">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <Globe size={16} className="text-muted-foreground shrink-0" />
              <select 
                className="flex-1 bg-transparent border-0 text-xs font-bold uppercase tracking-wider text-foreground outline-none cursor-pointer"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
              >
                {servers.map((s: any) => (
                  <option key={s.url} value={s.url} className="bg-background">
                    {s.description || s.url}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {!activeOp ? (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-4 opacity-20">
              <LayoutDashboard size={64} />
              <span className="text-xl font-black uppercase tracking-widest">Select an Endpoint</span>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto">
              <div className="p-10 max-w-7xl mx-auto space-y-12">
                {/* Header */}
                <div className="space-y-4">
                  <div className="flex items-center gap-4 flex-wrap">
                    <MethodBadge method={activeOp.method} />
                    <h2 className="text-3xl font-black tracking-tight text-foreground">
                      {activeOp.summary || activeOp.operationId}
                    </h2>
                  </div>
                  <div className="inline-flex items-center gap-2 p-3 px-4 rounded-xl bg-muted/10 border border-border/40 font-mono text-sm font-bold text-primary">
                    <Terminal size={14} />
                    {activeOp.path}
                  </div>
                  {activeOp.description && (
                    <p className="text-base text-muted-foreground leading-relaxed max-w-3xl">
                      {activeOp.description}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-5 gap-12">
                  {/* Left column: Documentation */}
                  <div className="xl:col-span-3 space-y-12">
                    {/* Parameters */}
                    {activeOp.parameters && activeOp.parameters.length > 0 && (
                      <section className="space-y-6">
                        <div className="flex items-center gap-2 text-primary">
                          <Settings2 size={18} />
                          <h4 className="text-xs font-black uppercase tracking-widest">Parameters</h4>
                        </div>
                        <div className="border border-border/40 rounded-2xl overflow-hidden bg-card/20">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="bg-muted/30 border-b border-border/40">
                                <th className="px-5 py-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Value</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border/10">
                              {activeOp.parameters.map(p => (
                                <tr key={p.name} className="hover:bg-muted/10 transition-colors">
                                  <td className="px-5 py-4">
                                    <div className="flex flex-col gap-1">
                                      <span className="font-mono font-bold text-foreground text-sm">{p.name}</span>
                                      {p.description && (
                                        <span className="text-xs text-muted-foreground leading-relaxed">{p.description}</span>
                                      )}
                                      {p.required && (
                                        <span className="text-[8px] font-black text-destructive/70 px-1.5 py-0.5 rounded bg-destructive/10 w-fit uppercase">
                                          Required
                                        </span>
                                      )}
                                    </div>
                                  </td>
                                  <td className="px-5 py-4">
                                    <span className="text-xs font-bold px-2 py-1 rounded-lg bg-muted/20 border border-border/40 uppercase tracking-wider">
                                      {p.in}
                                    </span>
                                  </td>
                                  <td className="px-5 py-4">
                                    <input
                                      type="text"
                                      className="w-full h-9 px-3 rounded-lg text-sm bg-muted/10 border border-border/40 focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all outline-none"
                                      placeholder={p.schema?.default ? String(p.schema.default) : `Enter ${p.name}`}
                                      value={paramValues[p.name] || ''}
                                      onChange={(e) => setParamValues({ ...paramValues, [p.name]: e.target.value })}
                                    />
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </section>
                    )}

                    {/* Schemas */}
                    <section className="space-y-6">
                      <div className="flex items-center gap-2 text-primary">
                        <FileJson size={18} />
                        <h4 className="text-xs font-black uppercase tracking-widest">Schemas</h4>
                      </div>
                      
                      <div className="border border-border/40 rounded-2xl overflow-hidden bg-card/20">
                        {/* Tabs */}
                        <div className="flex border-b border-border/40 bg-muted/10">
                          <button
                            onClick={() => setActiveTab('request')}
                            className={cn(
                              "flex-1 px-6 py-3 text-xs font-black uppercase tracking-wider transition-all",
                              activeTab === 'request'
                                ? "bg-background text-primary border-b-2 border-primary"
                                : "text-muted-foreground hover:text-foreground hover:bg-muted/20"
                            )}
                          >
                            Request
                          </button>
                          <button
                            onClick={() => setActiveTab('responses')}
                            className={cn(
                              "flex-1 px-6 py-3 text-xs font-black uppercase tracking-wider transition-all",
                              activeTab === 'responses'
                                ? "bg-background text-primary border-b-2 border-primary"
                                : "text-muted-foreground hover:text-foreground hover:bg-muted/20"
                            )}
                          >
                            Responses
                          </button>
                        </div>

                        {/* Tab content */}
                        <div className="p-6">
                          {activeTab === 'request' && (
                            <div className="space-y-4">
                              {activeOp.requestBody ? (
                                <>
                                  <SchemaNode 
                                    name="Request Body" 
                                    schema={activeOp.requestBody.content?.['application/json']?.schema || {}} 
                                  />
                                  {['POST', 'PUT', 'PATCH'].includes(activeOp.method) && (
                                    <button
                                      onClick={generateExampleBody}
                                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 text-primary text-xs font-bold hover:bg-primary/20 transition-all"
                                    >
                                      <Zap size={14} />
                                      Generate Example
                                    </button>
                                  )}
                                </>
                              ) : (
                                <div className="py-12 text-center border-2 border-dashed border-border/40 rounded-xl opacity-30">
                                  <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                                    No Request Body
                                  </span>
                                </div>
                              )}
                            </div>
                          )}

                          {activeTab === 'responses' && (
                            <div className="space-y-6">
                              {Object.entries(activeOp.responses || {}).map(([code, res]: [string, any]) => (
                                <div key={code} className="p-6 rounded-xl bg-muted/5 border border-border/40">
                                  <div className="flex items-center gap-3 mb-4 pb-4 border-b border-border/10">
                                    <span className={cn(
                                      "px-3 py-1 rounded-lg text-xs font-black",
                                      code.startsWith('2') 
                                        ? "bg-success/10 text-success border border-success/20"
                                        : code.startsWith('4')
                                        ? "bg-warning/10 text-warning border border-warning/20"
                                        : "bg-destructive/10 text-destructive border border-destructive/20"
                                    )}>
                                      {code}
                                    </span>
                                    <span className="text-sm font-medium text-foreground/80">
                                      {res.description}
                                    </span>
                                  </div>
                                  {res.content?.['application/json']?.schema && (
                                    <SchemaNode name="Response Body" schema={res.content['application/json'].schema} />
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </section>
                  </div>

                  {/* Right column: Playground */}
                  <div className="xl:col-span-2 space-y-8">
                    <div className="sticky top-0 space-y-6">
                      <div className="glass-panel p-8 rounded-3xl border-primary/20 bg-linear-to-br from-primary/5 to-transparent shadow-2xl relative overflow-hidden">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-8">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-linear-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20">
                              <Terminal size={18} />
                            </div>
                            <h4 className="text-xs font-black uppercase tracking-[0.3em] text-primary">
                              Try It Out
                            </h4>
                          </div>
                          <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-success/10 text-success border border-success/20">
                            <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
                            <span className="text-[9px] font-black tracking-widest uppercase">Live API</span>
                          </div>
                        </div>

                        <div className="space-y-6">
                          {/* Code snippets */}
                          <div className="space-y-3">
                            <div className="flex items-center gap-1 p-0.5 rounded-lg bg-black/20 border border-white/5">
                              {['curl', 'python', 'javascript'].map(lang => (
                                <button
                                  key={lang}
                                  onClick={() => setActiveCodeLang(lang)}
                                  className={cn(
                                    "flex-1 py-2 rounded-md text-[10px] font-black uppercase tracking-wider transition-all",
                                    activeCodeLang === lang
                                      ? "bg-primary text-primary-foreground shadow-lg"
                                      : "text-muted-foreground hover:text-foreground"
                                  )}
                                >
                                  {lang}
                                </button>
                              ))}
                            </div>
                            
                            <div className="relative group">
                              <pre className="p-5 rounded-xl bg-black/60 dark:bg-black/80 border border-white/5 font-mono text-[11px] leading-relaxed text-emerald-400 overflow-x-auto max-h-[300px]">
                                {generateCodeSnippet(
                                  activeOp.method,
                                  `${baseUrl}${activeOp.path}`,
                                  activeCodeLang,
                                  { query: paramValues },
                                  requestBody,
                                  'YOUR_TOKEN'
                                )}
                              </pre>
                              <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                <CopyButton 
                                  content={generateCodeSnippet(
                                    activeOp.method,
                                    `${baseUrl}${activeOp.path}`,
                                    activeCodeLang,
                                    { query: paramValues },
                                    requestBody,
                                    'YOUR_TOKEN'
                                  )}
                                  className="bg-white/10 hover:bg-white/20"
                                />
                              </div>
                            </div>
                          </div>

                          {/* Request body input */}
                          {['POST', 'PUT', 'PATCH'].includes(activeOp.method) && (
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <label className="text-xs font-black uppercase tracking-widest text-muted-foreground/80 flex items-center gap-2">
                                  <Braces size={14} /> Request Body
                                </label>
                                {requestBody && (
                                  <button
                                    onClick={() => setRequestBody('')}
                                    className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                                  >
                                    <X size={12} /> Clear
                                  </button>
                                )}
                              </div>
                              <textarea
                                placeholder='{ "key": "value" }'
                                value={requestBody}
                                onChange={(e) => setRequestBody(e.target.value)}
                                className="w-full min-h-40 px-4 py-3 text-sm font-mono bg-black/40 border border-white/5 focus:ring-2 focus:ring-primary/20 focus:border-primary/40 rounded-xl transition-all outline-none resize-y"
                              />
                            </div>
                          )}

                          {/* Send button */}
                          <button 
                            onClick={handleTryItOut}
                            disabled={requestState.loading}
                            className={cn(
                              "w-full py-4 rounded-xl font-black text-xs tracking-[0.3em] uppercase transition-all duration-300 flex items-center justify-center gap-3 shadow-xl",
                              requestState.loading 
                                ? "bg-muted text-muted-foreground opacity-50 cursor-not-allowed" 
                                : "bg-linear-to-r from-primary to-primary/80 text-primary-foreground hover:shadow-2xl hover:shadow-primary/30 hover:scale-[1.02] active:scale-[0.98]"
                            )}
                          >
                            {requestState.loading ? (
                              <>
                                <Activity className="animate-spin h-4 w-4" />
                                Sending Request...
                              </>
                            ) : (
                              <>
                                Send Request
                                <ArrowRight size={16} />
                              </>
                            )}
                          </button>

                          {/* Response */}
                          {(requestState.status || requestState.error) && (
                            <div className="space-y-4 pt-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                              <div className="flex items-center justify-between pb-3 border-b border-border/20">
                                <div className="flex items-center gap-2">
                                  <div className={cn(
                                    "h-2.5 w-2.5 rounded-full",
                                    requestState.status && requestState.status < 300
                                      ? "bg-success shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse"
                                      : "bg-destructive shadow-[0_0_8px_rgba(239,68,68,0.5)] animate-pulse"
                                  )} />
                                  <span className="text-xs font-black tracking-wider text-foreground">
                                    Status: {requestState.status}
                                  </span>
                                </div>
                                <button
                                  onClick={() => setRequestState({ loading: false, response: null, status: null, error: null })}
                                  className="text-muted-foreground hover:text-foreground transition-colors"
                                >
                                  <X size={14} />
                                </button>
                              </div>
                              
                              {requestState.error ? (
                                <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive">
                                  <div className="flex items-start gap-2">
                                    <AlertCircle size={16} className="shrink-0 mt-0.5" />
                                    <div className="text-sm leading-relaxed">{requestState.error}</div>
                                  </div>
                                </div>
                              ) : (
                                <div className="max-h-[400px] overflow-y-auto rounded-xl border border-border/40 bg-black/40">
                                  <pre className="p-5 font-mono text-xs leading-relaxed text-blue-300">
                                    {JSON.stringify(requestState.response, null, 2)}
                                  </pre>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Security notice */}
                      <div className="flex items-center justify-center gap-3 text-[10px] font-black text-muted-foreground/30 uppercase tracking-[0.3em]">
                        <ShieldCheck size={16} />
                        Secure Connection
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Fullscreen backdrop */}
      {isFullscreen && (
        <div 
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 animate-in fade-in duration-300"
          onClick={() => setIsFullscreen(false)}
        />
      )}
    </>
  );
}