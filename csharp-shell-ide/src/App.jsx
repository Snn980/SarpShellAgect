import { useState, useEffect, useCallback, useRef, useMemo } from "react";

// ═══════════════════════════════════════════════
// SABİTLER
// ═══════════════════════════════════════════════

const MODELS = [
  { id: "claude-haiku-4-5-20251001", label: "Haiku 4.5 (Hızlı/Ücretsiz)" },
  { id: "claude-sonnet-4-20250514",  label: "Sonnet 4 (Güçlü)" },
];

const KEYWORDS = new Set([
  "using","namespace","class","struct","interface","enum","record",
  "static","void","string","int","bool","long","double","float","decimal",
  "byte","char","object","var","new","return","if","else","for","foreach",
  "while","do","switch","case","break","continue","default","public","private",
  "protected","internal","sealed","abstract","partial","override","virtual",
  "readonly","const","null","true","false","this","base","try","catch",
  "finally","throw","async","await","Task","in","out","ref","params",
  "typeof","nameof","is","as","checked","unsafe","lock","event","delegate",
]);

const TYPES = new Set([
  "List","Dictionary","HashSet","Console","Math","String","Convert","Array",
  "Enumerable","Exception","HttpClient","JsonDocument","StringBuilder","Regex",
  "DateTime","Guid","Thread","CancellationToken","Program","IEnumerable",
]);

const DEFAULT_CODE = `using System;
using System.Collections.Generic;
using System.Linq;

namespace MyProgram
{
    class Program
    {
        static void Main(string[] args)
        {
            Console.WriteLine("Merhaba, C# Shell!");
            var numbers = new List<int> { 1, 2, 3, 4, 5 };
            int sum = numbers.Sum();
            Console.WriteLine($"Toplam: {sum}");
        }
    }
}`;

const DARKNET_CODE = `// Darknet / ONNX .NET
// dotnet add package Microsoft.ML.OnnxRuntime
using System;
using System.Linq;
using System.Collections.Generic;
using Microsoft.ML.OnnxRuntime;
using Microsoft.ML.OnnxRuntime.Tensors;

namespace DarknetDemo
{
    class YoloInference : IDisposable
    {
        private readonly InferenceSession _session;
        public YoloInference(string modelPath)
            => _session = new InferenceSession(modelPath);

        public float[] Run(float[] img, int w = 640, int h = 640)
        {
            var t = new DenseTensor<float>(img, new[] { 1, 3, h, w });
            var inputs = new List<NamedOnnxValue>
                { NamedOnnxValue.CreateFromTensor("images", t) };
            using var r = _session.Run(inputs);
            return r.First().AsEnumerable<float>().ToArray();
        }

        public void Dispose() => _session?.Dispose();
        static void Main() => Console.WriteLine("ONNX hazır.");
    }
}`;

const MAF_CODE = `// Microsoft Agent Framework 1.2
// dotnet add package Microsoft.Agents.AI --version 1.2.*
// dotnet add package Microsoft.Agents.Orchestration --version 1.2.*
using System;
using System.Threading.Tasks;
using Microsoft.Agents.AI;
using Microsoft.Agents.Orchestration;

namespace AgentDemo
{
    class Program
    {
        static async Task Main(string[] args)
        {
            var client = new AnthropicChatClient(
                apiKey: Environment.GetEnvironmentVariable("ANTHROPIC_KEY") ?? "");

            // Tek ajan
            var agent = new AIAgent(client,
                name: "Helper",
                instructions: "C# uzman asistanısın.");
            string result = await agent.RunAsync("Merhaba!");
            Console.WriteLine(result);

            // Sıralı workflow
            var workflow = new SequentialWorkflow()
                .AddStep(new AIAgent(client, name: "Analyzer",
                    instructions: "Kodu analiz et."))
                .AddStep(new AIAgent(client, name: "Optimizer",
                    instructions: "Optimize öner."));
            // string r = await workflow.RunAsync(code);
        }
    }
}`;

const SNIPPETS = [
  { label: "Merhaba Dünya", code: DEFAULT_CODE },
  { label: "Darknet/ONNX",  code: DARKNET_CODE },
  { label: "MAF Agent",     code: MAF_CODE },
  { label: "HTTP GET", code: `using System.Net.Http;
var client = new HttpClient();
string r = await client.GetStringAsync("https://api.example.com");
Console.WriteLine(r);` },
  { label: "JSON Parse", code: `using System.Text.Json;
string json = """{"name":"Ali","age":30}""";
var doc  = JsonDocument.Parse(json);
string? name = doc.RootElement.GetProperty("name").GetString();
Console.WriteLine(name);` },
  { label: "LINQ", code: `using System.Linq;
using System.Collections.Generic;
var data = new List<int> { 3,1,4,1,5,9,2,6 };
var result = data.Where(x => x > 3).OrderByDescending(x => x);
foreach (int n in result) Console.WriteLine(n);` },
  { label: "Try/Catch", code: `try
{
    int r = int.Parse("abc");
}
catch (FormatException ex)
{
    Console.Error.WriteLine($"Hata: {ex.Message}");
}
finally { Console.WriteLine("Tamamlandı."); }` },
];

const THEMES = {
  dark:      { bg:"#1E1E1E", panel:"#252526", kw:"#569CD6", str:"#CE9178", cmt:"#6A9955", num:"#B5CEA8", typ:"#4EC9B0", ln:"#555" },
  monokai:   { bg:"#272822", panel:"#3E3D32", kw:"#F92672", str:"#E6DB74", cmt:"#75715E", num:"#AE81FF", typ:"#66D9EF", ln:"#555" },
  solarized: { bg:"#002B36", panel:"#073642", kw:"#268BD2", str:"#2AA198", cmt:"#586E75", num:"#D33682", typ:"#859900", ln:"#555" },
};

const OUTPUT_COLORS = {
  output:"#D4D4D4", error:"#F44747", system:"#858585",
  cmd:"#DCDCAA", info:"#9CDCFE", user:"#4EC9B0", ai:"#C586C0", warning:"#FFCC00",
};

const MONO = "'JetBrains Mono','Fira Code','Cascadia Code',monospace";
const TOKEN_RE = /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|\/\/.*$|[a-zA-Z_]\w*|\d+(?:\.\d+)?|[{}()[\];,.<>!=+\-*/%&|^~?:]|\s+)/g;

const INITIAL_FILES = [
  { id:1, name:"Program.cs",   content:DEFAULT_CODE,  active:true  },
  { id:2, name:"Darknet.cs",   content:DARKNET_CODE,  active:false },
  { id:3, name:"AgentDemo.cs", content:MAF_CODE,      active:false },
];

const INITIAL_GIT = {
  branch:"main",
  branches:["main","develop","feature/agent-support"],
  commits:[
    { hash:"a3f9c2", msg:"feat: MAF agent panel eklendi",      date:"2026-04-28" },
    { hash:"b71e84", msg:"fix: import manager null ref hatası", date:"2026-04-27" },
    { hash:"c90d11", msg:"init: C# Shell IDE başlangıç",       date:"2026-04-25" },
  ],
  staged:[], unstaged:[],
};

const TABS = [
  { id:"editor",   icon:"📝", label:"Editör"  },
  { id:"terminal", icon:"💻", label:"Terminal" },
  { id:"git",      icon:"🌿", label:"Git"      },
  { id:"imports",  icon:"📦", label:"Import"   },
  { id:"nuget",    icon:"🧩", label:"NuGet"    },
  { id:"agent",    icon:"🤖", label:"Agent"    },
  { id:"settings", icon:"⚙",  label:"Ayarlar"  },
];

// ═══════════════════════════════════════════════
// Claude API SERVİSİ
// ═══════════════════════════════════════════════

class ClaudeService {
  #model; #maxTokens;
  constructor(model, maxTokens = 1000) {
    this.#model = model;
    this.#maxTokens = maxTokens;
  }
  async complete(messages, system = "") {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method:"POST",
      headers:{ "Content-Type":"application/json" },
      body:JSON.stringify({ model:this.#model, max_tokens:this.#maxTokens, system, messages }),
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error.message);
    return data.content.map(c => c.text ?? "").join("");
  }
  async ask(content, system) { return this.complete([{ role:"user", content }], system); }
  async askJson(content, system) {
    const raw = await this.ask(content, system);
    return JSON.parse(raw.replace(/```json?|```/g,"").trim());
  }
}

// ═══════════════════════════════════════════════
// SÖZ DİZİMİ RENKLENDİRME
// ═══════════════════════════════════════════════

function tokenColor(token, theme) {
  if (token.startsWith("//"))                             return theme.cmt;
  if (token.startsWith('"') || token.startsWith("'"))    return theme.str;
  if (KEYWORDS.has(token))                               return theme.kw;
  if (TYPES.has(token) || /^[A-Z][a-zA-Z0-9]*$/.test(token)) return theme.typ;
  if (/^\d/.test(token))                                 return theme.num;
  return "#D4D4D4";
}

function highlightCode(code, theme, showLineNumbers, errors = []) {
  const errMap = new Map();
  errors.forEach(e => {
    const list = errMap.get(e.line) ?? [];
    errMap.set(e.line, [...list, e]);
  });

  return code.split("\n").map((line, i) => {
    const lineNum = i + 1;
    const errs    = errMap.get(lineNum) ?? [];
    const hasErr  = errs.some(e => e.severity === "error");
    const hasWarn = errs.some(e => e.severity === "warning");

    const tokens = (line.match(TOKEN_RE) ?? []).map((tok, ti) => (
      <span key={ti} style={{ color: tokenColor(tok, theme) }}>{tok}</span>
    ));

    return (
      <div key={lineNum} style={{
        display:"flex", minHeight:"1.5em",
        background: hasErr ? "rgba(244,71,71,0.09)" : hasWarn ? "rgba(255,204,0,0.06)" : "transparent",
        borderLeft: hasErr ? "3px solid #F44747" : hasWarn ? "3px solid #FFCC00" : "3px solid transparent",
      }}>
        {showLineNumbers && (
          <span style={{ minWidth:40, color: hasErr ? "#F44747" : theme.ln, textAlign:"right",
            paddingRight:14, fontSize:12, userSelect:"none", flexShrink:0 }}>
            {lineNum}
          </span>
        )}
        <span style={{ flex:1 }}>{tokens}</span>
        {errs.length > 0 && (
          <span style={{ fontSize:11, color: hasErr ? "#F44747" : "#FFCC00",
            padding:"0 8px", alignSelf:"center", whiteSpace:"nowrap", flexShrink:0 }}>
            ⚠ {errs[0].msg}
          </span>
        )}
      </div>
    );
  });
}

// ═══════════════════════════════════════════════
// HOOKS
// ═══════════════════════════════════════════════

function useBreakpoint() {
  const get = () => window.innerWidth < 480 ? "mobile" : window.innerWidth < 900 ? "tablet" : "desktop";
  const [bp, setBp] = useState(get);
  useEffect(() => {
    const h = () => setBp(get());
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);
  return bp;
}

function useDebounce(value, ms) {
  const [v, setV] = useState(value);
  useEffect(() => { const t = setTimeout(() => setV(value), ms); return () => clearTimeout(t); }, [value, ms]);
  return v;
}

function useFileManager(initial) {
  const [files, setFiles] = useState(initial);
  const nextId = useRef(initial.length + 1);
  const activeFile = files.find(f => f.active);

  const switchTab = useCallback(id => setFiles(p => p.map(f => ({ ...f, active: f.id === id }))), []);

  const newFile = useCallback((name, content = "// Yeni dosya\n") => {
    const id = nextId.current++;
    const fname = name ?? `File${id}.cs`;
    setFiles(p => [...p.map(f => ({ ...f, active:false })), { id, name:fname, content, active:true }]);
  }, []);

  const closeFile = useCallback(id => {
    setFiles(p => {
      if (p.length <= 1) return p;
      const rest = p.filter(f => f.id !== id);
      const wasActive = p.find(f => f.id === id)?.active ?? false;
      if (!wasActive) return rest;
      return rest.map((f, i) => ({ ...f, active: i === rest.length - 1 }));
    });
  }, []);

  const updateActive = useCallback(content => {
    setFiles(p => p.map(f => f.active ? { ...f, content } : f));
  }, []);

  return { files, activeFile, switchTab, newFile, closeFile, updateActive };
}

function useGitState(fileNames) {
  const [git, setGit] = useState({
    ...INITIAL_GIT,
    unstaged: fileNames.map(name => ({ name, status:"unstaged" })),
  });
  const stageFile    = useCallback(name => setGit(p => ({ ...p, unstaged: p.unstaged.filter(f => f.name !== name), staged: [...p.staged, { name, status:"staged" }] })), []);
  const unstageFile  = useCallback(name => setGit(p => ({ ...p, staged: p.staged.filter(f => f.name !== name), unstaged: [...p.unstaged, { name, status:"unstaged" }] })), []);
  const stageAll     = useCallback(() => setGit(p => ({ ...p, staged: [...p.staged, ...p.unstaged.map(f => ({ ...f, status:"staged" }))], unstaged:[] })), []);
  const commit       = useCallback(msg => setGit(p => {
    if (!p.staged.length) return p;
    return { ...p, commits:[{ hash: Math.random().toString(36).slice(2,8), msg, date: new Date().toISOString().slice(0,10) }, ...p.commits], staged:[] };
  }), []);
  const switchBranch = useCallback(branch => setGit(p => ({ ...p, branch })), []);
  return { git, stageFile, unstageFile, stageAll, commit, switchBranch };
}

// ═══════════════════════════════════════════════
// ALT BİLEŞENLER
// ═══════════════════════════════════════════════

function OutlineBtn({ label, color, onClick, disabled }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      background:"transparent", border:`1px solid ${color}`, color,
      borderRadius:4, padding:"3px 10px", fontSize:12, cursor: disabled ? "not-allowed" : "pointer",
      opacity: disabled ? 0.5 : 1, fontFamily:MONO, whiteSpace:"nowrap",
    }}>{label}</button>
  );
}

// ── Editör ──────────────────────────────────────

function CodeEditor({ code, onChange, errors, settings, isMobile }) {
  const taRef = useRef(null);
  const theme = THEMES[settings.theme] ?? THEMES.dark;
  const FS    = `${settings.fontSize}px`;

  const handleKeyDown = e => {
    if (e.key !== "Tab") return;
    e.preventDefault();
    const s = e.currentTarget.selectionStart;
    const indent = " ".repeat(settings.tabSize);
    onChange(code.slice(0, s) + indent + code.slice(e.currentTarget.selectionEnd));
    requestAnimationFrame(() => {
      if (taRef.current) { taRef.current.selectionStart = taRef.current.selectionEnd = s + settings.tabSize; }
    });
  };

  const insertAt = text => {
    const ta = taRef.current;
    if (!ta) return;
    const s = ta.selectionStart;
    onChange(code.slice(0, s) + text + code.slice(ta.selectionEnd));
    requestAnimationFrame(() => {
      if (taRef.current) { taRef.current.selectionStart = taRef.current.selectionEnd = s + text.length; taRef.current.focus(); }
    });
  };

  const highlighted = highlightCode(code, theme, settings.lineNumbers, errors);

  return (
    <div style={{ display:"flex", height:"100%", overflow:"hidden" }}>
      <div style={{ flex:1, position:"relative", overflow:"hidden" }}>
        {/* Söz dizimi katmanı */}
        <div aria-hidden style={{
          position:"absolute", inset:0,
          padding:`12px 0 12px ${settings.lineNumbers ? "0" : "8px"}`,
          fontFamily:MONO, fontSize:FS, lineHeight:"1.5",
          whiteSpace: settings.wordWrap ? "pre-wrap" : "pre",
          overflow:"hidden", pointerEvents:"none", color:"#D4D4D4",
        }}>
          {highlighted}
        </div>
        {/* Textarea */}
        <textarea ref={taRef} value={code}
          onChange={e => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          spellCheck={false} autoCorrect="off" autoCapitalize="off"
          style={{
            position:"absolute", inset:0,
            padding:`12px 0 12px ${settings.lineNumbers ? "54px" : "8px"}`,
            background:"transparent", color:"transparent", caretColor:"#AEAFAD",
            border:"none", outline:"none", resize:"none",
            fontFamily:MONO, fontSize:FS, lineHeight:"1.5",
            whiteSpace: settings.wordWrap ? "pre-wrap" : "pre",
            overflow:"auto", zIndex:2,
          }}
        />
      </div>

      {/* Snippet paneli — sadece desktop */}
      {!isMobile && (
        <aside style={{ width:150, borderLeft:"1px solid #474747", background:"#252526", overflow:"auto", flexShrink:0 }}>
          <div style={{ padding:"7px 10px", fontSize:11, color:"#858585", borderBottom:"1px solid #474747" }}>📋 Snippets</div>
          {SNIPPETS.map(s => (
            <button key={s.label} onClick={() => onChange(s.code)} style={{
              display:"block", width:"100%", textAlign:"left",
              background:"transparent", border:"none", borderBottom:"1px solid #2D2D2D",
              color:"#9CDCFE", cursor:"pointer", padding:"7px 10px", fontSize:12, fontFamily:MONO,
            }}
              onMouseEnter={e => { e.currentTarget.style.background = "#094771"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
            >{s.label}</button>
          ))}
        </aside>
      )}

      {/* Mobil klavye yardımcısı */}
      {isMobile && (
        <div style={{
          position:"absolute", bottom:0, left:0, right:0,
          display:"flex", overflowX:"auto", background:"#2D2D2D",
          borderTop:"1px solid #474747", padding:"4px 6px", gap:4, zIndex:5,
        }}>
          {["{","}"," (",")",";","=>","//",'"',"Tab"].map(sym => (
            <button key={sym} onClick={() => insertAt(sym === "Tab" ? "    " : sym)} style={{
              background:"#3C3C3C", border:"1px solid #555", color:"#D4D4D4",
              borderRadius:4, padding:"5px 9px", fontSize:14, cursor:"pointer",
              whiteSpace:"nowrap", minWidth:34, fontFamily:MONO,
            }}>{sym}</button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Terminal ─────────────────────────────────────

function Terminal({ lines, loading, onSend, onClear }) {
  const [input, setInput] = useState("");
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:"smooth" }); }, [lines]);

  const send = () => {
    const msg = input.trim();
    if (!msg || loading) return;
    setInput("");
    onSend(msg);
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100%" }}>
      <div style={{ flex:1, overflow:"auto", padding:"10px 14px" }}>
        {lines.map((l, i) => (
          <div key={i} style={{ color: OUTPUT_COLORS[l.type] ?? "#D4D4D4", fontFamily:MONO, fontSize:13, lineHeight:1.7, whiteSpace:"pre-wrap", wordBreak:"break-word" }}>
            {l.text}
          </div>
        ))}
        {loading && <div style={{ color:"#C586C0", fontFamily:MONO, fontSize:13 }}>● İşleniyor…</div>}
        <div ref={bottomRef} />
      </div>
      <div style={{ borderTop:"1px solid #474747", background:"#252526", padding:"7px 10px", display:"flex", gap:8, alignItems:"center", flexShrink:0 }}>
        <span style={{ color:"#4EC9B0", fontSize:14, flexShrink:0 }}>›</span>
        <input value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") send(); }}
          placeholder="Soru sor…" disabled={loading}
          style={{ flex:1, background:"transparent", border:"none", outline:"none", color:"#D4D4D4", fontSize:13, fontFamily:MONO }}
        />
        <button onClick={onClear} style={{ background:"transparent", border:"none", color:"#555", cursor:"pointer", fontSize:16 }}>🗑</button>
        <OutlineBtn label="Gönder ↵" color="#007ACC" onClick={send} disabled={loading || !input.trim()} />
      </div>
    </div>
  );
}

// ── Git ──────────────────────────────────────────

function DiffViewer({ original, modified }) {
  const aLines = original.split("\n");
  const bLines = modified.split("\n");
  const result = [];
  let ai = 0, bi = 0;
  while (ai < aLines.length || bi < bLines.length) {
    if (ai >= aLines.length)           { result.push({ t:"add",    l:bLines[bi++] }); }
    else if (bi >= bLines.length)      { result.push({ t:"remove", l:aLines[ai++] }); }
    else if (aLines[ai] === bLines[bi]){ result.push({ t:"same",   l:aLines[ai++] }); bi++; }
    else { result.push({ t:"remove", l:aLines[ai++] }); result.push({ t:"add", l:bLines[bi++] }); }
  }
  return (
    <div style={{ overflow:"auto", fontFamily:MONO, fontSize:12 }}>
      {result.map((d, i) => (
        <div key={i} style={{ display:"flex", gap:10, padding:"1px 8px",
          background: d.t==="add" ? "#1a3a1a" : d.t==="remove" ? "#3a1a1a" : "transparent",
          color:      d.t==="add" ? "#4EC9B0" : d.t==="remove" ? "#F44747" : "#858585",
        }}>
          <span style={{ userSelect:"none", minWidth:12 }}>{d.t==="add" ? "+" : d.t==="remove" ? "−" : " "}</span>
          <span>{d.l}</span>
        </div>
      ))}
    </div>
  );
}

function GitPanel({ git, stageFile, unstageFile, stageAll, commit, switchBranch, currentCode, loading, generateMsg }) {
  const [commitMsg, setCommitMsg] = useState("");
  const [showDiff,  setShowDiff]  = useState(false);
  const [genLoad,   setGenLoad]   = useState(false);

  const handleGenerate = async () => {
    setGenLoad(true);
    const msg = await generateMsg(git.staged.map(f => f.name).join(", "));
    setCommitMsg(msg);
    setGenLoad(false);
  };
  const handleCommit = () => {
    if (!commitMsg.trim() || !git.staged.length) return;
    commit(commitMsg.trim()); setCommitMsg(""); setShowDiff(false);
  };

  return (
    <div style={{ padding:12, overflow:"auto", height:"100%", fontFamily:MONO }}>
      {/* Dal */}
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }}>
        <span style={{ color:"#4EC9B0" }}>🌿</span>
        <select value={git.branch} onChange={e => switchBranch(e.target.value)}
          style={{ background:"#3C3C3C", border:"1px solid #474747", color:"#D4D4D4", borderRadius:4, fontSize:13, padding:"3px 8px", cursor:"pointer", fontFamily:MONO }}>
          {git.branches.map(b => <option key={b} value={b}>{b}</option>)}
        </select>
      </div>

      {/* Staged */}
      <div style={{ marginBottom:12 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
          <span style={{ fontSize:12, color:"#858585" }}>STAGED ({git.staged.length})</span>
          {git.staged.length > 0 && <OutlineBtn label="Commit ▶" color="#4EC9B0" onClick={handleCommit} disabled={!commitMsg.trim()} />}
        </div>
        {git.staged.map(f => (
          <div key={f.name} style={{ display:"flex", justifyContent:"space-between", padding:"5px 8px", background:"#1E1E1E", borderRadius:3, marginBottom:3 }}>
            <span style={{ fontSize:12, color:"#4EC9B0" }}>{f.name}</span>
            <button onClick={() => unstageFile(f.name)} style={{ background:"transparent", border:"none", color:"#4EC9B0", cursor:"pointer", fontSize:16, lineHeight:1 }}>−</button>
          </div>
        ))}
      </div>

      {/* Unstaged */}
      <div style={{ marginBottom:12 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
          <span style={{ fontSize:12, color:"#858585" }}>UNSTAGED ({git.unstaged.length})</span>
          {git.unstaged.length > 0 && <OutlineBtn label="+ Tümü" color="#9CDCFE" onClick={stageAll} disabled={false} />}
        </div>
        {git.unstaged.map(f => (
          <div key={f.name} style={{ display:"flex", justifyContent:"space-between", padding:"5px 8px", background:"#1E1E1E", borderRadius:3, marginBottom:3 }}>
            <span style={{ fontSize:12, color:"#858585" }}>{f.name}</span>
            <button onClick={() => stageFile(f.name)} style={{ background:"transparent", border:"none", color:"#9CDCFE", cursor:"pointer", fontSize:16, lineHeight:1 }}>+</button>
          </div>
        ))}
      </div>

      {/* Commit mesajı */}
      {git.staged.length > 0 && (
        <div style={{ display:"flex", gap:6, marginBottom:12 }}>
          <input value={commitMsg} onChange={e => setCommitMsg(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") handleCommit(); }}
            placeholder="feat: açıklama…"
            style={{ flex:1, background:"#3C3C3C", border:"1px solid #474747", borderRadius:4, color:"#D4D4D4", padding:"5px 8px", fontSize:12, fontFamily:MONO, outline:"none" }}
          />
          <OutlineBtn label={genLoad ? "…" : "🤖 AI"} color="#C586C0" onClick={handleGenerate} disabled={genLoad || loading} />
        </div>
      )}

      {/* Diff */}
      <div style={{ marginBottom:12 }}>
        <OutlineBtn label={showDiff ? "▲ Gizle" : "▼ Diff"} color="#DCDCAA" onClick={() => setShowDiff(v => !v)} disabled={false} />
        {showDiff && (
          <div style={{ marginTop:6, border:"1px solid #474747", borderRadius:4, overflow:"hidden" }}>
            <DiffViewer original="// Önceki sürüm\nConsole.WriteLine(1);" modified={currentCode} />
          </div>
        )}
      </div>

      {/* Geçmiş */}
      <div style={{ fontSize:12, color:"#858585", marginBottom:6 }}>GEÇMİŞ</div>
      {git.commits.map(c => (
        <div key={c.hash} style={{ display:"flex", justifyContent:"space-between", padding:"7px 10px", background:"#252526", borderRadius:4, marginBottom:4, border:"1px solid #3C3C3C", fontSize:12 }}>
          <span><span style={{ color:"#569CD6", marginRight:8 }}>{c.hash}</span><span style={{ color:"#D4D4D4" }}>{c.msg}</span></span>
          <span style={{ color:"#858585", flexShrink:0, marginLeft:8 }}>{c.date}</span>
        </div>
      ))}
    </div>
  );
}

// ── Import Yöneticisi ────────────────────────────

function ImportManager({ code, onCodeChange }) {
  const [imports,  setImports]  = useState(["System","System.Collections.Generic","System.Linq","System.Text","System.IO"]);
  const [inputVal, setInputVal] = useState("");

  const addImport = ns => {
    const name = ns.trim();
    if (!name || imports.includes(name)) return;
    setImports(p => [...p, name]);
    const line = `using ${name};`;
    if (!code.includes(line)) onCodeChange(`${line}\n${code}`);
    setInputVal("");
  };

  const removeImport = name => {
    setImports(p => p.filter(i => i !== name));
    onCodeChange(code.replace(`using ${name};\n`, "").replace(`using ${name};`, ""));
  };

  const SUGGESTIONS = ["System.Net.Http","System.Threading.Tasks","System.Text.Json","Microsoft.Agents.AI","Microsoft.Agents.Orchestration","Microsoft.ML.OnnxRuntime"];

  return (
    <div style={{ padding:14, overflow:"auto", height:"100%" }}>
      <p style={{ fontSize:12, color:"#858585", marginBottom:12 }}>📦 Namespace ekle / çıkar — koda otomatik yansır.</p>
      <div style={{ display:"flex", gap:6, marginBottom:14 }}>
        <input value={inputVal} onChange={e => setInputVal(e.target.value)} onKeyDown={e => { if (e.key === "Enter") addImport(inputVal); }}
          placeholder="System.Net.Http"
          style={{ flex:1, background:"#3C3C3C", border:"1px solid #474747", borderRadius:4, color:"#D4D4D4", padding:"5px 9px", fontSize:13, fontFamily:MONO, outline:"none" }}
        />
        <OutlineBtn label="+ Ekle" color="#4CAF50" onClick={() => addImport(inputVal)} disabled={false} />
      </div>
      {imports.map(name => (
        <div key={name} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", background:"#252526", borderRadius:4, padding:"7px 10px", marginBottom:4, border:"1px solid #3C3C3C" }}>
          <span style={{ fontSize:12, color:"#9CDCFE", fontFamily:MONO }}>using {name};</span>
          <button onClick={() => removeImport(name)} style={{ background:"transparent", border:"none", color:"#F44747", cursor:"pointer", fontSize:16 }}>×</button>
        </div>
      ))}
      <p style={{ fontSize:11, color:"#858585", margin:"14px 0 8px" }}>Hızlı ekle:</p>
      <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
        {SUGGESTIONS.filter(s => !imports.includes(s)).map(s => (
          <button key={s} onClick={() => addImport(s)} style={{ background:"#3C3C3C", border:"1px solid #474747", color:"#858585", borderRadius:12, padding:"3px 10px", fontSize:11, cursor:"pointer", fontFamily:MONO }}>{s}</button>
        ))}
      </div>
    </div>
  );
}

// ── NuGet Yöneticisi ─────────────────────────────

function NuGetManager({ claude }) {
  const PRESETS = [
    { id:"Microsoft.Agents.AI",            version:"1.2.2", desc:"MAF AI çekirdeği" },
    { id:"Microsoft.Agents.Orchestration", version:"1.2.2", desc:"MAF workflow"     },
    { id:"Microsoft.ML.OnnxRuntime",       version:"1.17.3",desc:"ONNX/Darknet"     },
    { id:"Newtonsoft.Json",                version:"13.0.3",desc:"JSON"             },
  ];
  const [query,     setQuery]     = useState("");
  const [results,   setResults]   = useState([]);
  const [installed, setInstalled] = useState(PRESETS.slice(0,2));
  const [searching, setSearching] = useState(false);

  const search = async () => {
    if (!query.trim()) return;
    setSearching(true);
    try {
      const data = await claude.askJson(
        `"${query}" için 5 NuGet paketi öner. JSON: [{"id":"...","version":"...","desc":"..."}]`,
        "NuGet asistanısın. Sadece JSON array döndür."
      );
      setResults(Array.isArray(data) ? data : []);
    } catch {
      setResults(PRESETS.filter(p => p.id.toLowerCase().includes(query.toLowerCase())));
    }
    setSearching(false);
  };

  const isInst = id => installed.some(p => p.id === id);

  return (
    <div style={{ padding:14, overflow:"auto", height:"100%" }}>
      <div style={{ display:"flex", gap:6, marginBottom:14 }}>
        <input value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => { if (e.key === "Enter") search(); }}
          placeholder="OnnxRuntime, Newtonsoft…"
          style={{ flex:1, background:"#3C3C3C", border:"1px solid #474747", borderRadius:4, color:"#D4D4D4", padding:"5px 9px", fontSize:12, fontFamily:MONO, outline:"none" }}
        />
        <OutlineBtn label={searching ? "…" : "🔍"} color="#2196F3" onClick={search} disabled={searching} />
      </div>
      {results.map(pkg => (
        <PkgRow key={pkg.id} pkg={pkg} installed={isInst(pkg.id)}
          onInstall={() => !isInst(pkg.id) && setInstalled(p => [...p, pkg])} />
      ))}
      <p style={{ fontSize:11, color:"#858585", margin:"12px 0 6px" }}>KURULU ({installed.length})</p>
      {installed.map(pkg => (
        <PkgRow key={pkg.id} pkg={pkg} installed={true}
          onInstall={() => setInstalled(p => p.filter(x => x.id !== pkg.id))} remove />
      ))}
      <p style={{ fontSize:11, color:"#858585", margin:"12px 0 8px" }}>Popüler:</p>
      <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
        {PRESETS.filter(p => !isInst(p.id)).map(p => (
          <button key={p.id} onClick={() => setInstalled(prev => [...prev, p])}
            style={{ background:"#3C3C3C", border:"1px solid #474747", color:"#858585", borderRadius:12, padding:"3px 10px", fontSize:11, cursor:"pointer", fontFamily:MONO }}>
            {p.id}
          </button>
        ))}
      </div>
    </div>
  );
}

function PkgRow({ pkg, installed, onInstall, remove }) {
  return (
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", background:"#252526", borderRadius:4, padding:"8px 10px", marginBottom:5, border:"1px solid #3C3C3C" }}>
      <div>
        <div style={{ fontSize:12, color:"#9CDCFE", fontFamily:MONO }}>{pkg.id}</div>
        <div style={{ fontSize:11, color:"#858585" }}>v{pkg.version}{pkg.desc ? ` — ${pkg.desc}` : ""}</div>
      </div>
      <OutlineBtn label={remove ? "🗑" : installed ? "✔" : "+ Kur"} color={remove ? "#F44747" : installed ? "#858585" : "#4CAF50"} onClick={onInstall} disabled={!remove && installed} />
    </div>
  );
}

// ── Agent Paneli ─────────────────────────────────

function AgentPanel({ claude, loading, onOutput }) {
  const [agents,  setAgents]  = useState([
    { name:"Analyzer",  instructions:"C# kodunu analiz et." },
    { name:"Optimizer", instructions:"Optimize öner."       },
  ]);
  const [wfType,  setWfType]  = useState("sequential");
  const [input,   setInput]   = useState("Merhaba, kodumu analiz et.");
  const [running, setRunning] = useState(false);

  const addAgent    = () => setAgents(p => [...p, { name:`Agent${p.length+1}`, instructions:"" }]);
  const updateAgent = (i, patch) => setAgents(p => p.map((a, j) => j===i ? { ...a, ...patch } : a));
  const removeAgent = i => setAgents(p => p.filter((_, j) => j !== i));

  const run = async () => {
    if (!agents.length || running) return;
    setRunning(true);
    const lines = [
      { type:"cmd",    text:`> MAF Workflow (${wfType}) başlatıldı` },
      { type:"system", text:`${agents.length} ajan` },
    ];
    let ctx = input;
    for (const agent of agents) {
      lines.push({ type:"info", text:`\n[${agent.name}] çalışıyor…` });
      try {
        const r = await claude.ask(
          `Sen "${agent.name}" adlı AI ajanısın.\nGörev: ${agent.instructions}\nGiriş:\n${ctx}`,
          "MAF ajan simülatörüsün. Kısa Türkçe yanıt ver."
        );
        ctx = r;
        r.split("\n").filter(Boolean).forEach(l => lines.push({ type:"ai", text:`  ${agent.name}: ${l}` }));
      } catch (err) { lines.push({ type:"error", text:`  ${agent.name} hatası: ${err}` }); break; }
    }
    lines.push({ type:"system", text:"\n─── Tamamlandı ───" });
    onOutput(lines);
    setRunning(false);
  };

  const IA = { background:"#3C3C3C", border:"1px solid #474747", borderRadius:4, color:"#D4D4D4", padding:"5px 8px", fontSize:12, fontFamily:MONO, outline:"none" };
  const isLoad = loading || running;

  return (
    <div style={{ padding:14, overflow:"auto", height:"100%", fontFamily:MONO }}>
      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:14 }}>
        <span style={{ fontSize:16 }}>🤖</span>
        <span style={{ fontSize:13, color:"#D4D4D4" }}>Microsoft Agent Framework 1.2</span>
      </div>
      <div style={{ display:"flex", gap:6, marginBottom:12, flexWrap:"wrap" }}>
        {[["sequential","→ Sıralı"],["parallel","⇉ Paralel"],["hitl","👤 HITL"]].map(([id, lbl]) => (
          <button key={id} onClick={() => setWfType(id)} style={{
            background: wfType===id ? "#007ACC" : "transparent",
            border:`1px solid ${wfType===id ? "#007ACC" : "#474747"}`,
            color: wfType===id ? "#fff" : "#858585",
            borderRadius:4, padding:"4px 12px", fontSize:12, cursor:"pointer", fontFamily:MONO,
          }}>{lbl}</button>
        ))}
      </div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
        <p style={{ fontSize:11, color:"#858585" }}>AJANLAR ({agents.length})</p>
        <OutlineBtn label="+ Ekle" color="#4EC9B0" onClick={addAgent} disabled={false} />
      </div>
      {agents.map((ag, i) => (
        <div key={i} style={{ background:"#252526", border:"1px solid #3C3C3C", borderRadius:6, padding:10, marginBottom:8 }}>
          <div style={{ display:"flex", gap:6, marginBottom:6, alignItems:"center" }}>
            <span style={{ color:"#C586C0", fontSize:12, minWidth:20 }}>#{i+1}</span>
            <input value={ag.name} onChange={e => updateAgent(i, { name:e.target.value })} placeholder="Ajan adı" style={{ ...IA, flex:1 }} />
            <button onClick={() => removeAgent(i)} style={{ background:"transparent", border:"none", color:"#F44747", cursor:"pointer", fontSize:16 }}>×</button>
          </div>
          <textarea value={ag.instructions} onChange={e => updateAgent(i, { instructions:e.target.value })}
            rows={2} placeholder="Görev / instructions…" style={{ ...IA, width:"100%", resize:"vertical" }} />
        </div>
      ))}
      <p style={{ fontSize:11, color:"#858585", marginBottom:6 }}>Girdi</p>
      <textarea value={input} onChange={e => setInput(e.target.value)} rows={3} style={{ ...IA, width:"100%", resize:"vertical", marginBottom:10 }} />
      <button onClick={run} disabled={isLoad || !agents.length} style={{
        background: isLoad ? "#555" : "#007ACC", border:"none", color:"#fff",
        borderRadius:4, padding:"8px 18px", fontSize:13, cursor: isLoad ? "not-allowed" : "pointer",
        fontFamily:MONO, width:"100%",
      }}>
        {isLoad ? "● Çalışıyor…" : "▶ Workflow Çalıştır"}
      </button>
    </div>
  );
}

// ── Ayarlar ──────────────────────────────────────

function Settings({ settings, onChange }) {
  const p = patch => onChange({ ...settings, ...patch });
  return (
    <div style={{ padding:20, overflow:"auto", height:"100%", maxWidth:480, fontFamily:MONO }}>
      {[{ label:"Yazı Boyutu", key:"fontSize", min:10, max:22 }, { label:"Tab Boyutu", key:"tabSize", min:2, max:8 }].map(({ label, key, min, max }) => (
        <div key={key} style={{ marginBottom:14 }}>
          <div style={{ fontSize:12, color:"#858585", marginBottom:6 }}>{label}: <strong style={{ color:"#D4D4D4" }}>{settings[key]}</strong></div>
          <input type="range" min={min} max={max} value={settings[key]}
            onChange={e => p({ [key]: Number(e.target.value) })}
            style={{ width:"100%", accentColor:"#007ACC" }}
          />
        </div>
      ))}
      {[{ label:"Satır Numaraları", key:"lineNumbers" }, { label:"Sözcük Sarma", key:"wordWrap" }, { label:"Otomatik Kaydet", key:"autoSave" }].map(({ label, key }) => (
        <div key={key} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
          <span style={{ fontSize:13, color:"#D4D4D4" }}>{label}</span>
          <div onClick={() => p({ [key]: !settings[key] })} style={{
            width:40, height:22, background: settings[key] ? "#007ACC" : "#555",
            borderRadius:11, cursor:"pointer", position:"relative", transition:"background .2s",
          }}>
            <div style={{ width:18, height:18, background:"white", borderRadius:"50%", position:"absolute", top:2, left: settings[key] ? 20 : 2, transition:"left .2s" }} />
          </div>
        </div>
      ))}
      <p style={{ fontSize:12, color:"#858585", marginBottom:10 }}>Tema</p>
      <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
        {Object.keys(THEMES).map(t => (
          <button key={t} onClick={() => p({ theme:t })} style={{
            background:"#1E1E1E", border:`2px solid ${settings.theme===t ? "#007ACC" : "#474747"}`,
            borderRadius:6, padding:"7px 14px", color:"#D4D4D4", cursor:"pointer", fontSize:12, fontFamily:MONO,
          }}>{t.charAt(0).toUpperCase()+t.slice(1)}</button>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════
// ANA UYGULAMA
// ═══════════════════════════════════════════════

const DEFAULT_SETTINGS = { fontSize:14, tabSize:4, wordWrap:false, lineNumbers:true, theme:"dark", autoSave:true };
const INIT_OUTPUT = [
  { type:"system", text:"🟢 C# Shell .NET IDE v2.0 — Claude API Destekli" },
  { type:"system", text:"MAF 1.2 | Git | Lint | Darknet/ONNX | NuGet AI"  },
  { type:"system", text:"Ctrl+Enter → Çalıştır  |  Tab → Girinti"         },
  { type:"system", text:"─".repeat(48) },
];

export default function App() {
  const bp       = useBreakpoint();
  const isMobile = bp === "mobile";

  const [modelId,   setModelId]   = useState(MODELS[0].id);
  const [settings,  setSettings]  = useState(DEFAULT_SETTINGS);
  const [output,    setOutput]    = useState(INIT_OUTPUT);
  const [loading,   setLoading]   = useState(false);
  const [activeTab, setActiveTab] = useState("editor");
  const [errors,    setErrors]    = useState([]);

  const claude = useMemo(() => new ClaudeService(modelId), [modelId]);

  const { files, activeFile, switchTab:switchFile, newFile, closeFile, updateActive } = useFileManager(INITIAL_FILES);
  const { git, stageFile, unstageFile, stageAll, commit, switchBranch } = useGitState(files.map(f => f.name));

  const code = activeFile?.content ?? "";

  // Debounce lint
  const debouncedCode = useDebounce(code, 900);
  useEffect(() => {
    if (!debouncedCode.trim()) { setErrors([]); return; }
    let cancelled = false;
    claude.askJson(
      `C# kontrol et:\n\`\`\`csharp\n${debouncedCode}\n\`\`\``,
      "C# linter. Sadece JSON: [{\"line\":N,\"col\":N,\"msg\":\"...\",\"severity\":\"error|warning\"}]"
    ).then(r => { if (!cancelled) setErrors(Array.isArray(r) ? r : []); }).catch(() => {});
    return () => { cancelled = true; };
  }, [debouncedCode, claude]);

  const addLine  = useCallback(line  => setOutput(p => [...p, line]),  []);
  const addLines = useCallback(lines => setOutput(p => [...p, ...lines]), []);

  const runCode = useCallback(async () => {
    setLoading(true); setActiveTab("terminal");
    addLine({ type:"cmd", text:"> dotnet run" });
    try {
      const res = await fetch("https://dotnetfiddle.net/api/Compiler/Run", {
        method:"POST", headers:{ "Content-Type":"application/json" },
        body:JSON.stringify({ Compiler:"Net90", Language:"CSharp", ProjectType:"Console", Program:code, UseResultCache:false }),
      });
      if (!res.ok) throw new Error("API hatası");
      const data = await res.json();
      if (data.CompilerOutput) {
        addLine({ type:"error", text: data.CompilerOutput });
      } else {
        (data.ConsoleOutput ?? "").split("\n").forEach(l => addLine({ type:"output", text:l }));
        addLine({ type:"system", text:"✅ Gerçek .NET 9" });
      }
    } catch {
      // Claude fallback
      const r = await claude.ask(
        `C# çalıştır, sadece konsol çıktısı:\n\`\`\`csharp\n${code}\n\`\`\``,
        "C# runtime simülatörüsün. Sadece konsol çıktısını ver."
      ).catch(e => `Hata: ${e}`);
      r.split("\n").forEach(l => addLine({ type:"output", text:l }));
      addLine({ type:"warning", text:"🔵 Claude simülasyonu" });
    }
    addLine({ type:"system", text:"─── Tamamlandı ───" });
    setLoading(false);
  }, [code, claude, addLine]);

  const analyzeCode = useCallback(async () => {
    setLoading(true); setActiveTab("terminal");
    addLine({ type:"cmd", text:"> analyze" });
    try {
      const r = await claude.ask(`C# analiz et:\n\`\`\`csharp\n${code}\n\`\`\``, "C# uzman. Kısa Türkçe analiz.");
      r.split("\n").filter(Boolean).forEach(l => addLine({ type:"info", text:l }));
    } catch (e) { addLine({ type:"error", text:String(e) }); }
    setLoading(false);
  }, [code, claude, addLine]);

  const handleChat = useCallback(async msg => {
    addLine({ type:"user", text:`> ${msg}` });
    setLoading(true);
    try {
      const r = await claude.ask(`Kod:\n\`\`\`csharp\n${code}\n\`\`\`\nSoru: ${msg}`, "C# uzman. Kısa Türkçe.");
      r.split("\n").forEach(l => addLine({ type:"ai", text:l }));
    } catch (e) { addLine({ type:"error", text:String(e) }); }
    setLoading(false);
  }, [code, claude, addLine]);

  const generateCommitMsg = useCallback(async fileNames => {
    try { return await claude.ask(`Dosyalar: ${fileNames}. Kısa Conventional Commit mesajı yaz.`, "Git commit asistanı. Sadece mesaj döndür."); }
    catch { return "chore: güncelleme"; }
  }, [claude]);

  const errorCount   = errors.filter(e => e.severity === "error").length;
  const warningCount = errors.filter(e => e.severity === "warning").length;
  const theme        = THEMES[settings.theme] ?? THEMES.dark;

  return (
    <div style={{ background:theme.bg, color:"#D4D4D4", height:"100vh", display:"flex", flexDirection:"column", fontFamily:MONO, overflow:"hidden" }}>

      {/* Başlık */}
      <header style={{ background:"#323233", borderBottom:"1px solid #474747", padding:"0 12px", display:"flex", alignItems:"center", justifyContent:"space-between", height:38, flexShrink:0 }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <div style={{ background:"linear-gradient(135deg,#1565C0,#42A5F5)", borderRadius:5, width:22, height:22, display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, fontWeight:"bold", color:"white", flexShrink:0 }}>C#</div>
          {!isMobile && <span style={{ fontSize:13 }}>C# Shell .NET IDE</span>}
          <span style={{ fontSize:11, color:"#858585" }}>claude</span>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          {loading && <span style={{ fontSize:10, color:"#C586C0" }}>● işlem</span>}
          <select value={modelId} onChange={e => setModelId(e.target.value)} style={{ background:"#3C3C3C", border:"1px solid #474747", color:"#D4D4D4", borderRadius:4, fontSize:11, padding:"2px 5px", cursor:"pointer", fontFamily:MONO, maxWidth: isMobile ? 130 : 210 }}>
            {MODELS.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
          </select>
        </div>
      </header>

      {/* Araç çubuğu */}
      {!isMobile && (
        <div style={{ background:"#2D2D2D", borderBottom:"1px solid #474747", padding:"5px 10px", display:"flex", alignItems:"center", gap:5, flexShrink:0, flexWrap:"wrap" }}>
          <OutlineBtn label="▶ Çalıştır" color="#4CAF50" onClick={runCode}     disabled={loading} />
          <OutlineBtn label="🔍 Analiz"  color="#2196F3" onClick={analyzeCode} disabled={loading} />
          <div style={{ width:1, height:18, background:"#474747", margin:"0 4px" }} />
          <OutlineBtn label="↺ Sıfırla" color="#555" onClick={() => updateActive(DEFAULT_CODE)} disabled={false} />
          <OutlineBtn label="+ Dosya"   color="#555" onClick={() => newFile()} disabled={false} />
          {errorCount   > 0 && <span style={{ marginLeft:"auto", fontSize:11, color:"#F44747" }}>● {errorCount} hata</span>}
          {warningCount > 0 && <span style={{ fontSize:11, color:"#FFCC00", marginLeft: errorCount ? 8 : "auto" }}>△ {warningCount} uyarı</span>}
        </div>
      )}

      {/* Dosya sekmeleri */}
      <div style={{ background:"#252526", borderBottom:"1px solid #474747", display:"flex", overflowX:"auto", flexShrink:0 }}>
        {files.map(f => (
          <div key={f.id} onClick={() => switchFile(f.id)} style={{
            display:"flex", alignItems:"center", gap:5, padding:"5px 12px",
            background: f.active ? theme.bg : "transparent",
            borderRight:"1px solid #474747",
            borderTop: f.active ? "1px solid #007ACC" : "1px solid transparent",
            cursor:"pointer", whiteSpace:"nowrap", fontSize:12,
            color: f.active ? "#fff" : "#858585",
          }}>
            <span>{f.name.endsWith(".cs") ? "📄" : "⚙"} {f.name}</span>
            <span role="button" onClick={e => { e.stopPropagation(); closeFile(f.id); }} style={{ color:"#555", fontSize:14, lineHeight:1 }}>×</span>
          </div>
        ))}
        <button onClick={() => newFile()} style={{ background:"transparent", border:"none", color:"#555", cursor:"pointer", padding:"0 10px", fontSize:18 }}>+</button>
      </div>

      {/* Sekmeler — desktop */}
      {!isMobile && (
        <div style={{ background:"#252526", borderBottom:"1px solid #474747", display:"flex", flexShrink:0 }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
              padding:"6px 14px", fontSize:12, cursor:"pointer",
              background:"transparent", border:"none",
              borderBottom: activeTab===t.id ? "2px solid #007ACC" : "2px solid transparent",
              color: activeTab===t.id ? "#fff" : "#858585", fontFamily:MONO, whiteSpace:"nowrap",
            }}>{t.icon} {t.label}</button>
          ))}
        </div>
      )}

      {/* İçerik */}
      <main style={{ flex:1, overflow:"hidden", position:"relative" }}>
        {activeTab==="editor"   && <CodeEditor code={code} onChange={updateActive} errors={errors} settings={settings} isMobile={isMobile} />}
        {activeTab==="terminal" && <Terminal lines={output} loading={loading} onSend={handleChat} onClear={() => setOutput([{ type:"system", text:"Temizlendi." }])} />}
        {activeTab==="git"      && <GitPanel git={git} stageFile={stageFile} unstageFile={unstageFile} stageAll={stageAll} commit={commit} switchBranch={switchBranch} currentCode={code} loading={loading} generateMsg={generateCommitMsg} />}
        {activeTab==="imports"  && <ImportManager code={code} onCodeChange={updateActive} />}
        {activeTab==="nuget"    && <NuGetManager claude={claude} />}
        {activeTab==="agent"    && <AgentPanel claude={claude} loading={loading} onOutput={lines => { addLines(lines); setActiveTab("terminal"); }} />}
        {activeTab==="settings" && <Settings settings={settings} onChange={setSettings} />}
      </main>

      {/* Mobil alt nav */}
      {isMobile && (
        <nav style={{ position:"fixed", bottom:0, left:0, right:0, background:"#252526", borderTop:"1px solid #474747", display:"flex", justifyContent:"space-around", padding:"6px 0", zIndex:100 }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
              background:"transparent", border:"none",
              color: activeTab===t.id ? "#007ACC" : "#555",
              display:"flex", flexDirection:"column", alignItems:"center", gap:2, cursor:"pointer", fontSize:18, minWidth:42,
            }}>
              <span>{t.icon}</span>
              <span style={{ fontSize:9 }}>{t.label}</span>
            </button>
          ))}
        </nav>
      )}
      {isMobile && <div style={{ height:62, flexShrink:0 }} />}

      {/* Durum çubuğu */}
      <footer style={{ background:"#007ACC", padding:"2px 12px", fontSize:11, display:"flex", gap:14, color:"#fff", flexShrink:0, alignItems:"center" }}>
        <span>C# .NET</span>
        <span>{code.split("\n").length} satır</span>
        {errorCount > 0 && <span style={{ color:"#FFD0D0" }}>● {errorCount} hata</span>}
        {!isMobile && <span style={{ marginLeft:"auto" }}>{MODELS.find(m => m.id === modelId)?.label}</span>}
      </footer>
    </div>
  );
}
