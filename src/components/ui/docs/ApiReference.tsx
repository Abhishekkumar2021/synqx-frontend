/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Search, Globe, Activity, Terminal,
  ChevronDown, ShieldCheck, Braces,
  Settings2, ArrowRight, Maximize2, Minimize2,
  Copy, CheckCheck, Database, Cpu, X,
  AlertCircle, FileJson, Zap, Download,
  Code2, Send
} from 'lucide-react';
import { cn } from '@/lib/utils';
import openapiSpec from '@/docs/openapi.json';


// Types
interface Parameter {
  name: string;
  in: 'path' | 'query' | 'header' | 'cookie';
  required?: boolean;
  schema?: { type: string; format?: string; default?: any; enum?: string[] };
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
const resolveSchema = (schema: any, spec: any = openapiSpec): any => {
  if (!schema) return {};
  if (schema.$ref) {
    const refPath = schema.$ref.replace('#/', '').split('/');
    let resolved = spec;
    for (const part of refPath) resolved = resolved[part];
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

const generateCodeSnippet = (method: string, url: string, lang: string, params: any, body: string) => {
  const fullUrl = new URL(url);
  Object.entries(params || {}).forEach(([k, v]) => {
    if (v) fullUrl.searchParams.append(k, String(v));
  });

  const snippets: Record<string, string> = {
    curl: `curl -X ${method} "${fullUrl}" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json"${body ? ` \\
  -d '${body}'` : ''}`,

    python: `import requests

url = "${fullUrl}"
headers = {
    "Authorization": "Bearer YOUR_API_KEY",
    "Content-Type": "application/json"
}
${body ? `data = ${body}\n` : ''}response = requests.${method.toLowerCase()}(url, headers=headers${body ? ', json=data' : ''})
print(response.json())`,

    javascript: `fetch("${fullUrl}", {
  method: "${method}",
  headers: {
    "Authorization": "Bearer YOUR_API_KEY",
    "Content-Type": "application/json"
  }${body ? `,
  body: JSON.stringify(${body})` : ''}
})
  .then(res => res.json())
  .then(data => console.log(data));`,

    go: `package main

import (
    "fmt"
    "net/http"
    "io"
)

func main() {
    req, _ := http.NewRequest("${method}", "${fullUrl}", nil)
    req.Header.Add("Authorization", "Bearer YOUR_API_KEY")
    
    client := &http.Client{}
    resp, _ := client.Do(req)
    body, _ := io.ReadAll(resp.Body)
    fmt.Println(string(body))
}`
  };

  return snippets[lang] || snippets.curl;
};

// Components
const CopyButton = ({ content }: { content: string }) => {
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
      className="p-2 rounded-lg bg-background/50 hover:bg-background/80 transition-all"
      title={copied ? "Copied!" : "Copy"}
    >
      {copied ? <CheckCheck size={14} className="text-success" /> : <Copy size={14} className="text-muted-foreground" />}
    </button>
  );
};

const MethodBadge = ({ method, active }: { method: string; active?: boolean }) => {
  const styles: Record<string, string> = {
    GET: "text-emerald-500 border-emerald-500/30 bg-emerald-500/10",
    POST: "text-blue-500 border-blue-500/30 bg-blue-500/10",
    PUT: "text-amber-500 border-amber-500/30 bg-amber-500/10",
    DELETE: "text-red-500 border-red-500/30 bg-red-500/10",
    PATCH: "text-purple-500 border-purple-500/30 bg-purple-500/10",
  };

  return (
    <div className={cn(
      "px-2.5 py-1 rounded-lg text-[10px] font-black border uppercase tracking-wider min-w-[55px] text-center transition-all",
      active && "ring-2 ring-primary/20",
      styles[method]
    )}>
      {method}
    </div>
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
            className="p-1 rounded hover:bg-muted/30 transition-colors"
          >
            <ChevronDown size={12} className={cn("transition-transform", !isExpanded && "-rotate-90")} />
          </button>
        )}
        <span className="font-mono text-sm font-bold text-foreground">{name}</span>
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted/30 text-muted-foreground uppercase font-bold">
          {resolved.type}
        </span>
        {resolved.format && (
          <span className="text-[9px] px-1.5 py-0.5 rounded bg-primary/10 text-primary uppercase font-bold">
            {resolved.format}
          </span>
        )}
        {required && (
          <span className="text-[9px] px-1.5 py-0.5 rounded bg-destructive/10 text-destructive uppercase font-bold">
            Required
          </span>
        )}
      </div>

      {resolved.description && (
        <p className="text-xs text-muted-foreground ml-6 mb-2 leading-relaxed">{resolved.description}</p>
      )}

      {resolved.enum && (
        <div className="ml-6 flex flex-wrap gap-1 mb-2">
          {resolved.enum.map((val: any) => (
            <code key={val} className="text-[10px] px-2 py-0.5 rounded bg-muted/30 text-foreground/70 font-mono">
              {String(val)}
            </code>
          ))}
        </div>
      )}

      {isExpanded && resolved.properties && (
        <div className="ml-6 pl-4 border-l-2 border-border/20 space-y-2 mt-2">
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
        <div className="ml-6 pl-4 border-l-2 border-border/20 space-y-2 mt-2">
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
  const [activeOp, setActiveOp] = useState<Operation | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeSchemaTab, setActiveSchemaTab] = useState<'request' | 'response'>('request');
  const [activeCodeLang, setActiveCodeLang] = useState('curl');

  const servers = useMemo(() => openapiSpec.servers, []);
  const [baseUrl, setBaseUrl] = useState(servers[0]?.url);
  const [paramValues, setParamValues] = useState<Record<string, any>>({});
  const [requestBody, setRequestBody] = useState('');
  const [requestState, setRequestState] = useState<{
    loading: boolean;
    response: any;
    status: number | null;
    error: string | null;
  }>({ loading: false, response: null, status: null, error: null });

  const operations = useMemo(() => {
    const ops: Operation[] = [];
    Object.entries(openapiSpec.paths).forEach(([path, pathItem]: [string, any]) => {
      Object.entries(pathItem).forEach(([method, operation]: [string, any]) => {
        if (['get', 'post', 'put', 'delete', 'patch'].includes(method)) {
          ops.push({ path, method: method.toUpperCase(), ...operation, id: `${method}-${path}` });
        }
      });
    });
    return ops;
  }, []);

  useEffect(() => {
    if (!activeOp && operations.length > 0) setActiveOp(operations[0]);
  }, [operations, activeOp]);

  const groupedOps = useMemo(() => {
    const filtered = operations.filter(op => {
      const matchesSearch =
        op.path.toLowerCase().includes(search.toLowerCase()) ||
        op.summary?.toLowerCase().includes(search.toLowerCase()) ||
        op.operationId?.toLowerCase().includes(search.toLowerCase());
      return matchesSearch;
    });
    const groups: Record<string, Operation[]> = {};
    filtered.forEach(op => {
      const tag = op.tags?.[0] || 'General';
      if (!groups[tag]) groups[tag] = [];
      groups[tag].push(op);
    });
    return groups;
  }, [operations, search]);

  const handleTryItOut = async () => {
    if (!activeOp) return;

    setRequestState({ loading: true, response: null, status: null, error: null });
    await new Promise(r => setTimeout(r, 1500));

    try {
      // Validate required params
      const missingParams = activeOp.parameters?.filter(p => p.required && !paramValues[p.name]);
      if (missingParams && missingParams.length > 0) {
        throw new Error(`Missing required parameters: ${missingParams.map(p => p.name).join(', ')}`);
      }

      // Validate request body
      if (['POST', 'PUT', 'PATCH'].includes(activeOp.method) && activeOp.requestBody?.required) {
        if (!requestBody) throw new Error('Request body is required');
        try { JSON.parse(requestBody); }
        catch { throw new Error('Invalid JSON in request body'); }
      }

      // Mock response
      const mockResponse = {
        id: "usr_" + Math.random().toString(36).substr(2, 9),
        email: "user@example.com",
        name: "John Doe",
        role: "user",
        createdAt: new Date().toISOString(),
        message: "Operation completed successfully"
      };

      setRequestState({
        loading: false,
        response: mockResponse,
        status: activeOp.method === 'POST' ? 201 : activeOp.method === 'DELETE' ? 204 : 200,
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

  const generateExampleBody = useCallback(() => {
    if (!activeOp?.requestBody) return;
    const schema = resolveSchema(activeOp.requestBody.content?.['application/json']?.schema);
    const example: any = {};

    if (schema.properties) {
      Object.entries(schema.properties).forEach(([key, prop]: [string, any]) => {
        const resolved = resolveSchema(prop);
        if (resolved.type === 'string') {
          if (resolved.format === 'email') example[key] = 'user@example.com';
          else if (resolved.format === 'password') example[key] = 'SecurePass123!';
          else if (resolved.enum) example[key] = resolved.enum[0];
          else example[key] = `example_${key}`;
        } else if (resolved.type === 'number' || resolved.type === 'integer') {
          example[key] = 0;
        } else if (resolved.type === 'boolean') {
          example[key] = false;
        } else if (resolved.type === 'array') {
          example[key] = [];
        } else if (resolved.type === 'object') {
          example[key] = {};
        }
      });
    }

    setRequestBody(JSON.stringify(example, null, 2));
  }, [activeOp]);

  const downloadSpec = () => {
    const blob = new Blob([JSON.stringify(openapiSpec, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'openapi-spec.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <div className={cn(
        "flex rounded-3xl border border-border/40 overflow-hidden shadow-2xl transition-all duration-500 bg-linear-to-br from-background to-muted/20",
        isFullscreen ? "fixed inset-4 z-50 h-[calc(100vh-32px)]" : "relative h-[900px] max-w-[1600px] mx-auto"
      )}>

        {/* Sidebar */}
        <div className="w-80 border-r border-border/40 flex flex-col bg-card/50 backdrop-blur-xl">
          {/* Header */}
          <div className="p-6 border-b border-border/40">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-linear-to-br from-primary via-primary/80 to-primary/60 flex items-center justify-center shadow-lg shadow-primary/30">
                  <Database size={20} className="text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-sm font-black uppercase tracking-tight">API Docs</h1>
                  <p className="text-[10px] text-muted-foreground">{operations.length} endpoints</p>
                </div>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={downloadSpec}
                  className="p-2 rounded-lg hover:bg-muted/50 transition-colors text-muted-foreground hover:text-foreground"
                  title="Download OpenAPI Spec"
                >
                  <Download size={14} />
                </button>
                <button
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  className="p-2 rounded-lg hover:bg-muted/50 transition-colors text-muted-foreground hover:text-foreground"
                  title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
                >
                  {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                </button>
              </div>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search endpoints..."
                className="w-full h-10 pl-10 pr-10 rounded-xl bg-background/50 border border-border/40 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all outline-none"
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

          {/* Operations list */}
          <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
            {Object.entries(groupedOps).map(([tag, ops]) => (
              <div key={tag}>
                <div className="px-3 mb-2 flex items-center gap-2 sticky top-0 bg-card/80 backdrop-blur-sm py-2 z-10">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/70">{tag}</h3>
                </div>
                <div className="space-y-1">
                  {ops.map(op => (
                    <button
                      key={op.id}
                      onClick={() => {
                        setActiveOp(op);
                        setRequestState({ loading: false, response: null, status: null, error: null });
                        setRequestBody('');
                        setParamValues({});
                      }}
                      className={cn(
                        "w-full flex flex-col gap-1.5 px-4 py-3 rounded-xl transition-all text-left group",
                        activeOp?.id === op.id
                          ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                          : "hover:bg-muted/50 border border-transparent hover:border-border/40"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <MethodBadge method={op.method} active={activeOp?.id === op.id} />
                      </div>
                      <span className={cn(
                        "text-[11px] font-mono font-bold truncate",
                        activeOp?.id === op.id ? "text-primary-foreground" : "text-foreground/80"
                      )}>
                        {op.path}
                      </span>
                      {op.summary && (
                        <span className={cn(
                          "text-[10px] line-clamp-2 leading-tight",
                          activeOp?.id === op.id ? "text-primary-foreground/70" : "text-muted-foreground"
                        )}>
                          {op.summary}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Server selector */}
          <div className="h-14 border-b border-border/40 flex items-center px-6 gap-4 bg-muted/5 backdrop-blur-xl">
            <Globe size={14} className="text-muted-foreground" />
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Environment</span>
            <select
              className="flex-1 bg-transparent border-0 text-xs font-bold text-primary outline-none cursor-pointer"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
            >
              {servers.map((s: any) => (
                <option key={s.url} value={s.url} className="bg-background">{s.description}</option>
              ))}
            </select>
          </div>

          {!activeOp ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 text-muted-foreground/30">
              <Cpu size={80} strokeWidth={1} />
              <h2 className="text-2xl font-black uppercase tracking-[0.3em]">Select Endpoint</h2>
              <p className="text-sm">Choose an endpoint from the sidebar to view details</p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto">
              <div className="grid grid-cols-1 xl:grid-cols-2 min-h-full">

                {/* Left: Documentation */}
                <div className="p-10 space-y-10 border-r border-border/40 bg-background/30">
                  {/* Header */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 flex-wrap">
                      <MethodBadge method={activeOp.method} />
                      <h2 className="text-3xl font-black tracking-tight">{activeOp.summary}</h2>
                    </div>
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-muted/20 border border-border/40 font-mono text-sm font-bold text-primary">
                      <Terminal size={14} />
                      {activeOp.path}
                    </div>
                    {activeOp.description && (
                      <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">{activeOp.description}</p>
                    )}
                  </div>

                  {/* Parameters */}
                  {activeOp.parameters && activeOp.parameters.length > 0 && (
                    <section className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Settings2 size={18} className="text-primary" />
                        <h3 className="text-xs font-black uppercase tracking-widest">Parameters</h3>
                        <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold">{activeOp.parameters.length}</span>
                      </div>
                      <div className="space-y-3">
                        {activeOp.parameters.map(p => (
                          <div key={p.name} className="p-4 rounded-xl bg-card/50 border border-border/40 space-y-2">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap mb-1">
                                  <span className="font-mono text-sm font-bold">{p.name}</span>
                                  <span className="px-2 py-0.5 rounded bg-muted/50 text-[10px] font-bold uppercase">{p.in}</span>
                                  {p.required && (
                                    <span className="px-2 py-0.5 rounded bg-destructive/10 text-destructive text-[10px] font-bold uppercase">Required</span>
                                  )}
                                </div>
                                {p.description && (
                                  <p className="text-xs text-muted-foreground leading-relaxed">{p.description}</p>
                                )}
                                {p.schema?.enum && (
                                  <div className="flex flex-wrap gap-1 mt-2">
                                    {p.schema.enum.map((val: string) => (
                                      <code key={val} className="text-[10px] px-2 py-0.5 rounded bg-muted/30 font-mono">{val}</code>
                                    ))}
                                  </div>
                                )}
                              </div>
                              <input
                                type="text"
                                placeholder={p.schema?.default ? String(p.schema.default) : `Enter ${p.name}`}
                                value={paramValues[p.name] || ''}
                                onChange={(e) => setParamValues({ ...paramValues, [p.name]: e.target.value })}
                                className="w-40 h-9 px-3 rounded-lg bg-background/50 border border-border/40 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  {/* Schemas */}
                  <section className="space-y-4">
                    <div className="flex items-center gap-2">
                      <FileJson size={18} className="text-primary" />
                      <h3 className="text-xs font-black uppercase tracking-widest">Schemas</h3>
                    </div>

                    {/* Schema Tabs */}
                    <div className="border border-border/40 rounded-2xl overflow-hidden bg-card/30">
                      <div className="flex border-b border-border/40 bg-muted/10">
                        <button
                          onClick={() => setActiveSchemaTab('request')}
                          className={cn(
                            "flex-1 px-6 py-3 text-xs font-black uppercase tracking-wider transition-all",
                            activeSchemaTab === 'request'
                              ? "bg-background text-primary border-b-2 border-primary"
                              : "text-muted-foreground hover:text-foreground hover:bg-muted/20"
                          )}
                        >
                          Request Body
                        </button>
                        <button
                          onClick={() => setActiveSchemaTab('response')}
                          className={cn(
                            "flex-1 px-6 py-3 text-xs font-black uppercase tracking-wider transition-all",
                            activeSchemaTab === 'response'
                              ? "bg-background text-primary border-b-2 border-primary"
                              : "text-muted-foreground hover:text-foreground hover:bg-muted/20"
                          )}
                        >
                          Responses
                        </button>
                      </div>

                      <div className="p-6 max-h-[500px] overflow-y-auto">
                        {activeSchemaTab === 'request' ? (
                          activeOp.requestBody ? (
                            <SchemaNode
                              name="body"
                              schema={activeOp.requestBody.content?.['application/json']?.schema}
                            />
                          ) : (
                            <div className="py-12 text-center border-2 border-dashed border-border/30 rounded-xl">
                              <p className="text-xs font-bold text-muted-foreground/50 uppercase tracking-widest">
                                No request body required
                              </p>
                            </div>
                          )
                        ) : (
                          <div className="space-y-6">
                            {Object.entries(activeOp.responses || {}).map(([code, res]: [string, any]) => (
                              <div key={code} className="space-y-3">
                                <div className="flex items-center gap-3">
                                  <span className={cn(
                                    "px-3 py-1 rounded-lg text-xs font-black border",
                                    code.startsWith('2')
                                      ? "bg-success/10 text-success border-success/20"
                                      : code.startsWith('4')
                                        ? "bg-warning/10 text-warning border-warning/20"
                                        : "bg-destructive/10 text-destructive border-destructive/20"
                                  )}>
                                    {code}
                                  </span>
                                  <span className="text-sm font-medium text-muted-foreground">{res.description}</span>
                                </div>
                                {res.content?.['application/json']?.schema && (
                                  <div className="ml-4 pl-4 border-l-2 border-border/20">
                                    <SchemaNode name="response" schema={res.content['application/json'].schema} />
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </section>
                </div>

                {/* Right: Playground */}
                <div className="p-10 space-y-8 bg-linear-to-br from-muted/5 to-transparent">

                  {/* Code Examples */}
                  <section className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Code2 size={18} className="text-primary" />
                      <h3 className="text-xs font-black uppercase tracking-widest">Code Examples</h3>
                    </div>

                    <div className="rounded-2xl border border-border/40 overflow-hidden bg-card/30">
                      {/* Language Tabs */}
                      <div className="flex gap-1 p-1 bg-black/20 border-b border-white/5">
                        {['curl', 'python', 'javascript', 'go'].map(lang => (
                          <button
                            key={lang}
                            onClick={() => setActiveCodeLang(lang)}
                            className={cn(
                              "flex-1 py-2 px-3 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all",
                              activeCodeLang === lang
                                ? "bg-primary text-primary-foreground shadow-lg"
                                : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                            )}
                          >
                            {lang}
                          </button>
                        ))}
                      </div>

                      {/* Code Block */}
                      <div className="relative group">
                        <pre className="p-6 bg-black/60 dark:bg-black/80 font-mono text-[11px] leading-relaxed text-emerald-400 overflow-x-auto max-h-[400px]">
                          {generateCodeSnippet(
                            activeOp.method,
                            `${baseUrl}${activeOp.path}`,
                            activeCodeLang,
                            paramValues,
                            requestBody
                          )}
                        </pre>
                        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                          <CopyButton
                            content={generateCodeSnippet(
                              activeOp.method,
                              `${baseUrl}${activeOp.path}`,
                              activeCodeLang,
                              paramValues,
                              requestBody
                            )}
                          />
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* Try It Out */}
                  <section className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Send size={18} className="text-primary" />
                      <h3 className="text-xs font-black uppercase tracking-widest">Try It Out</h3>
                    </div>

                    <div className="rounded-2xl border border-primary/20 bg-linear-to-br from-primary/5 to-transparent p-6 space-y-6">

                      {/* Request Body Editor */}
                      {['POST', 'PUT', 'PATCH'].includes(activeOp.method) && (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                              <Braces size={14} /> Request Body
                            </label>
                            <div className="flex gap-2">
                              {activeOp.requestBody && (
                                <button
                                  onClick={generateExampleBody}
                                  className="px-3 py-1 rounded-lg bg-primary/10 text-primary text-[10px] font-bold hover:bg-primary/20 transition-all flex items-center gap-1.5"
                                >
                                  <Zap size={12} />
                                  Generate Example
                                </button>
                              )}
                              {requestBody && (
                                <button
                                  onClick={() => setRequestBody('')}
                                  className="px-3 py-1 rounded-lg bg-muted/20 text-muted-foreground text-[10px] font-bold hover:bg-muted/30 transition-all"
                                >
                                  Clear
                                </button>
                              )}
                            </div>
                          </div>
                          <textarea
                            placeholder='{ "key": "value" }'
                            value={requestBody}
                            onChange={(e) => setRequestBody(e.target.value)}
                            className="w-full min-h-[180px] px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-sm font-mono text-blue-200 focus:ring-2 focus:ring-primary/20 outline-none resize-y"
                          />
                        </div>
                      )}

                      {/* Send Button */}
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
                            <Activity className="animate-spin h-5 w-5" />
                            Sending Request...
                          </>
                        ) : (
                          <>
                            <Send size={16} />
                            Send Request
                            <ArrowRight size={16} />
                          </>
                        )}
                      </button>

                      {/* Response Display */}
                      {(requestState.status || requestState.error) && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                          <div className="flex items-center justify-between pb-3 border-b border-border/20">
                            <div className="flex items-center gap-2">
                              <div className={cn(
                                "h-2.5 w-2.5 rounded-full animate-pulse",
                                requestState.status && requestState.status < 300
                                  ? "bg-success shadow-[0_0_8px_rgba(16,185,129,0.6)]"
                                  : "bg-destructive shadow-[0_0_8px_rgba(239,68,68,0.6)]"
                              )} />
                              <span className="text-xs font-black tracking-wider">
                                Status: {requestState.status}
                              </span>
                            </div>
                            <button
                              onClick={() => setRequestState({ loading: false, response: null, status: null, error: null })}
                              className="p-1 rounded hover:bg-muted/30 transition-colors text-muted-foreground hover:text-foreground"
                            >
                              <X size={14} />
                            </button>
                          </div>

                          {requestState.error ? (
                            <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20">
                              <div className="flex items-start gap-3">
                                <AlertCircle size={18} className="text-destructive shrink-0 mt-0.5" />
                                <div>
                                  <p className="text-sm font-bold text-destructive mb-1">Error</p>
                                  <p className="text-sm text-destructive/80 leading-relaxed">{requestState.error}</p>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="rounded-xl border border-border/40 bg-black/40 overflow-hidden">
                              <div className="max-h-[400px] overflow-y-auto">
                                <pre className="p-5 font-mono text-xs leading-relaxed text-blue-300">
                                  {JSON.stringify(requestState.response, null, 2)}
                                </pre>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </section>

                  {/* Security Notice */}
                  <div className="flex items-center justify-center gap-3 text-[10px] font-black text-muted-foreground/30 uppercase tracking-[0.3em] pt-4">
                    <ShieldCheck size={16} />
                    Secure Connection
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Fullscreen Backdrop */}
      {isFullscreen && (
        <div
          className="fixed inset-0 bg-background/90 backdrop-blur-md z-40 animate-in fade-in duration-300"
          onClick={() => setIsFullscreen(false)}
        />
      )}
    </>
  );
}