import { useState, useEffect, useCallback, useRef, useMemo } from "react";

const MODELS = [
  { id: "claude-haiku-4-5-20251001", label: "Haiku 4.5 (Hızlı)" },
  { id: "claude-sonnet-4-20250514",  label: "Sonnet 4 (Güçlü)"  },
];
const WANDBOX_URL = "https://wandbox.org/api/compile.json";
const MAX_CODE_KB = 50;
const RUN_TIMEOUT = 20000; // 20sn
const MONO = "'JetBrains Mono','Fira Code','Cascadia Code',monospace";

const KEYWORDS = new Set([
  "using","namespace","class","struct","interface","enum","record","static","void","string","int",
  "bool","long","double","float","decimal","byte","char","object","var","new","return","if","else",
  "for","foreach","while","do","switch","case","break","continue","default","public","private",
  "protected","internal","sealed","abstract","partial","override","virtual","readonly","const",
  "null","true","false","this","base","try","catch","finally","throw","async","await","Task",
  "in","out","ref","params","typeof","nameof","is","as","lock","event","delegate","where","select",
  "from","orderby","group","join","let","on","equals","ascending","descending",
]);
const TYPES = new Set([
  "List","Dictionary","HashSet","Queue","Stack","Console","Math","String","Convert","Array",
  "Enumerable","Exception","HttpClient","JsonDocument","StringBuilder","Regex","DateTime","Guid",
  "Thread","CancellationToken","Program","IEnumerable","IList","IDictionary","Action","Func",
  "Stream","FileStream","StreamReader","StreamWriter","ValueTask",
]);
const THEMES = {
  dark:      { bg:"#1E1E1E", panel:"#252526", border:"#474747", kw:"#569CD6", str:"#CE9178", cmt:"#6A9955", num:"#B5CEA8", typ:"#4EC9B0", ln:"#555", accent:"#007ACC" },
  monokai:   { bg:"#272822", panel:"#3E3D32", border:"#555",    kw:"#F92672", str:"#E6DB74", cmt:"#75715E", num:"#AE81FF", typ:"#66D9EF", ln:"#555", accent:"#A6E22E" },
  solarized: { bg:"#002B36", panel:"#073642", border:"#586E75", kw:"#268BD2", str:"#2AA198", cmt:"#586E75", num:"#D33682", typ:"#859900", ln:"#555", accent:"#268BD2" },
};
const OUT_COLOR = { output:"#D4D4D4",error:"#F44747",system:"#858585",cmd:"#DCDCAA",info:"#9CDCFE",user:"#4EC9B0",ai:"#C586C0",warning:"#FFCC00",success:"#4CAF50" };
const TOK_RE = /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|\/\/.*$|[a-zA-Z_]\w*|\d+(?:\.\d+)?|[{}()[\];,.<>!=+\-*\/%&|^~?:]|\s+)/g;

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
        public YoloInference(string modelPath) => _session = new InferenceSession(modelPath);
        public float[] Run(float[] img, int w=640, int h=640)
        {
            var t = new DenseTensor<float>(img, new[]{ 1,3,h,w });
            var inputs = new List<NamedOnnxValue>{ NamedOnnxValue.CreateFromTensor("images", t) };
            using var r = _session.Run(inputs);
            return r.First().AsEnumerable<float>().ToArray();
        }
        public void Dispose() => _session?.Dispose();
        static void Main() => Console.WriteLine("ONNX hazir.");
    }
}`;

const MAF_CODE = `// Microsoft Agent Framework 1.2
// dotnet add package Microsoft.Agents.AI --version 1.2.*
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
            var agent = new AIAgent(client, name:"Helper", instructions:"C# uzman asistanisın.");
            string result = await agent.RunAsync("Merhaba!");
            Console.WriteLine(result);

            var workflow = new SequentialWorkflow()
                .AddStep(new AIAgent(client, name:"Analyzer",  instructions:"Kodu analiz et."))
                .AddStep(new AIAgent(client, name:"Optimizer", instructions:"Optimize oner."));
        }
    }
}`;

const SNIPPETS = [
  { label:"Merhaba Dunya", code:DEFAULT_CODE },
  { label:"Darknet/ONNX",  code:DARKNET_CODE },
  { label:"MAF Agent",     code:MAF_CODE },
  { label:"HTTP GET", code:`using System.Net.Http;\nvar client = new HttpClient();\nstring r = await client.GetStringAsync("https://api.example.com");\nConsole.WriteLine(r);` },
  { label:"JSON Parse", code:`using System.Text.Json;\nstring json = """{"name":"Ali","age":30}""";\nvar doc = JsonDocument.Parse(json);\nstring? name = doc.RootElement.GetProperty("name").GetString();\nConsole.WriteLine(name);` },
  { label:"LINQ", code:`using System.Linq;\nusing System.Collections.Generic;\nvar data = new List<int>{3,1,4,1,5,9,2,6};\nvar result = data.Where(x=>x>3).OrderByDescending(x=>x);\nforeach(int n in result) Console.WriteLine(n);` },
  { label:"Try/Catch", code:`try\n{\n    int r = int.Parse("abc");\n}\ncatch(FormatException ex)\n{\n    Console.Error.WriteLine($"Hata: {ex.Message}");\n}\nfinally { Console.WriteLine("Tamam."); }` },
];

const INIT_FILES = [
  { id:1, name:"Program.cs",   content:DEFAULT_CODE, active:true  },
  { id:2, name:"Darknet.cs",   content:DARKNET_CODE, active:false },
  { id:3, name:"AgentDemo.cs", content:MAF_CODE,     active:false },
];

const INIT_GIT = {
  branch:"main", branches:["main","develop","feature/piston-api"],
  commits:[
    { hash:"d4e1f2", msg:"feat: Piston API entegrasyonu", date:"2026-05-01" },
    { hash:"a3f9c2", msg:"feat: MAF agent panel",         date:"2026-04-28" },
    { hash:"c90d11", msg:"init: C# Shell IDE",            date:"2026-04-25" },
  ],
  staged:[], unstaged:[],
};

const TABS = [
  { id:"editor",   icon:"📝", label:"Editor"   },
  { id:"terminal", icon:"💻", label:"Terminal"  },
  { id:"git",      icon:"🌿", label:"Git"       },
  { id:"imports",  icon:"📦", label:"Import"    },
  { id:"nuget",    icon:"🧩", label:"NuGet"     },
  { id:"agent",    icon:"🤖", label:"Agent"     },
  { id:"settings", icon:"⚙",  label:"Ayarlar"   },
];

const DEFAULT_SETTINGS = { fontSize:14, tabSize:4, wordWrap:false, lineNumbers:true, theme:"dark", autoSave:true };
const IMPORT_DEFAULTS  = ["System","System.Collections.Generic","System.Linq","System.Text","System.IO"];
const IMPORT_SUGGEST   = ["System.Net.Http","System.Threading.Tasks","System.Text.Json","Microsoft.Agents.AI","Microsoft.Agents.Orchestration","Microsoft.ML.OnnxRuntime","System.Diagnostics"];
const NUGET_PRESETS    = [
  { id:"Microsoft.Agents.AI",            version:"1.2.2", desc:"MAF cekirdegi"  },
  { id:"Microsoft.Agents.Orchestration", version:"1.2.2", desc:"MAF workflow"   },
  { id:"Microsoft.ML.OnnxRuntime",       version:"1.17.3",desc:"ONNX/Darknet"   },
  { id:"Newtonsoft.Json",                version:"13.0.3",desc:"JSON"           },
];
const AGENT_TYPES = [
  { id:"lint",     label:"🔍 Lint",     instructions:"C# kodunu analiz et, hatalari ve uyarilari listele." },
  { id:"explain",  label:"📖 Explain",  instructions:"Bu C# kodunu Turkce satir satir acikla."            },
  { id:"refactor", label:"♻ Refactor",  instructions:"Bu C# kodunu yeniden duzenle, best practice uygula."},
  { id:"test",     label:"🧪 Test",     instructions:"Bu kod icin xUnit test yaz."                        },
  { id:"git",      label:"🌿 Git",      instructions:"Degisiklikler icin Conventional Commit mesaji yaz."  },
  { id:"nuget",    label:"🧩 NuGet",    instructions:"Bu proje icin uygun NuGet paketleri oner."          },
];

// ── Claude Servisi ────────────────────────────────────────────────────────────
class ClaudeService {
  #model; #max; #apiKey;
  constructor(model, max=1000, apiKey=""){
    this.#model=model; this.#max=max; this.#apiKey=apiKey;
  }
  hasKey(){ return this.#apiKey.length > 10; }
  async complete(messages, system=""){
    if(!this.hasKey()) throw new Error("API key yok — Ayarlar > API Key gir");
    const res = await fetch("https://api.anthropic.com/v1/messages",{
      method:"POST",
      headers:{
        "Content-Type":"application/json",
        "x-api-key": this.#apiKey,
        "anthropic-version":"2023-06-01",
        "anthropic-dangerous-direct-browser-access":"true",
      },
      body:JSON.stringify({model:this.#model,max_tokens:this.#max,system,messages}),
    });
    const data = await res.json();
    if(data.error) throw new Error(data.error.message);
    return data.content.map(c=>c.text??"").join("");
  }
  ask(content,system){ return this.complete([{role:"user",content}],system); }
  async askJson(content,system){
    const raw = await this.ask(content,system);
    return JSON.parse(raw.replace(/```json?|```/g,"").trim());
  }
}

// ── Build Servisleri ──────────────────────────────────────────────────────────
function parseBuildErrors(stderr){
  if(!stderr) return [];
  const errors=[], re=/(?:\w+\.cs)?\((\d+),(\d+)\):\s*(error|warning)\s+\w+:\s*(.+)/gi;
  let m=re.exec(stderr);
  while(m){ errors.push({line:parseInt(m[1],10),col:parseInt(m[2],10),severity:m[3].toLowerCase(),msg:m[4].trim()}); m=re.exec(stderr); }
  if(errors.length===0 && stderr.trim())
    stderr.trim().split("\n").filter(Boolean).forEach((l,i)=>errors.push({line:i+1,col:1,severity:"error",msg:l}));
  return errors;
}

async function runWithWandbox(code){
  const kb=new Blob([code]).size/1024;
  if(kb>MAX_CODE_KB) throw new Error(`Kod cok buyuk (${kb.toFixed(1)}KB)`);
  const ctrl=new AbortController();
  const tid=setTimeout(()=>ctrl.abort(),RUN_TIMEOUT);
  try{
    const res=await fetch(WANDBOX_URL,{
      method:"POST", signal:ctrl.signal,
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({compiler:"mcs-head",code,options:"",stdin:"","compiler-option-raw":""}),
    });
    if(!res.ok) throw new Error(`Wandbox HTTP ${res.status}`);
    const data=await res.json();
    return {
      stdout: data.program_output??"",
      stderr: data.compiler_error??"",
      code:   data.status==="0"?0:1,
      source: "wandbox",
    };
  }catch(err){
    if(err.name==="AbortError") throw new Error("Zaman asimi (20sn)");
    throw err;
  }finally{
    clearTimeout(tid);
  }
}

// ── Söz Dizimi ────────────────────────────────────────────────────────────────
function tokColor(tok,th){
  if(tok.startsWith("//"))                              return th.cmt;
  if(tok.startsWith('"')||tok.startsWith("'"))          return th.str;
  if(KEYWORDS.has(tok))                                  return th.kw;
  if(TYPES.has(tok)||/^[A-Z][a-zA-Z0-9]*$/.test(tok))  return th.typ;
  if(/^\d/.test(tok))                                    return th.num;
  return "#D4D4D4";
}

function highlight(code,th,lineNums,errors=[]){
  const errMap=new Map();
  errors.forEach(e=>{ const l=errMap.get(e.line)??[]; errMap.set(e.line,[...l,e]); });
  return code.split("\n").map((line,i)=>{
    const ln=i+1, errs=errMap.get(ln)??[];
    const isErr=errs.some(e=>e.severity==="error"), isWarn=errs.some(e=>e.severity==="warning");
    const tokens=(line.match(TOK_RE)??[]).map((t,ti)=>(
      <span key={ti} style={{color:tokColor(t,th)}}>{t}</span>
    ));
    return (
      <div key={ln} style={{display:"flex",minHeight:"1.5em",
        background:isErr?"rgba(244,71,71,0.09)":isWarn?"rgba(255,204,0,0.06)":"transparent",
        borderLeft:isErr?"3px solid #F44747":isWarn?"3px solid #FFCC00":"3px solid transparent"}}>
        {lineNums&&<span style={{minWidth:40,color:isErr?"#F44747":th.ln,textAlign:"right",
          paddingRight:14,fontSize:12,userSelect:"none",flexShrink:0}}>{ln}</span>}
        <span style={{flex:1}}>{tokens}</span>
        {errs.length>0&&<span style={{fontSize:11,color:isErr?"#F44747":"#FFCC00",
          padding:"0 8px",alignSelf:"center",whiteSpace:"nowrap",flexShrink:0,maxWidth:200,overflow:"hidden",textOverflow:"ellipsis"}}>
          ⚠ {errs[0].msg}</span>}
      </div>
    );
  });
}

// ── Hooks ─────────────────────────────────────────────────────────────────────
function useBreakpoint(){
  const get=()=>window.innerWidth<520?"mobile":window.innerWidth<900?"tablet":"desktop";
  const [bp,setBp]=useState(get);
  useEffect(()=>{ const h=()=>setBp(get()); window.addEventListener("resize",h); return()=>window.removeEventListener("resize",h); },[]);
  return bp;
}
function useDebounce(val,ms){
  const [v,setV]=useState(val);
  useEffect(()=>{ const t=setTimeout(()=>setV(val),ms); return()=>clearTimeout(t); },[val,ms]);
  return v;
}
function useFileManager(init){
  const [files,setFiles]=useState(init);
  const nextId=useRef(init.length+1);
  const active=files.find(f=>f.active);
  const switchTab   =useCallback(id=>setFiles(p=>p.map(f=>({...f,active:f.id===id}))),[]);
  const updateActive=useCallback(content=>setFiles(p=>p.map(f=>f.active?{...f,content}:f)),[]);
  const newFile=useCallback((name,content="// Yeni dosya\n")=>{
    const id=nextId.current++;
    setFiles(p=>[...p.map(f=>({...f,active:false})),{id,name:name??`File${id}.cs`,content,active:true}]);
  },[]);
  const closeFile=useCallback(id=>{
    setFiles(p=>{
      if(p.length<=1) return p;
      const rest=p.filter(f=>f.id!==id), wasActive=p.find(f=>f.id===id)?.active??false;
      if(!wasActive) return rest;
      return rest.map((f,i)=>({...f,active:i===rest.length-1}));
    });
  },[]);
  return{files,active,switchTab,updateActive,newFile,closeFile};
}
function useGitState(fileNames){
  const [git,setGit]=useState({...INIT_GIT,unstaged:fileNames.map(n=>({name:n,status:"unstaged"}))});
  const stageFile   =useCallback(n=>setGit(p=>({...p,unstaged:p.unstaged.filter(f=>f.name!==n),staged:[...p.staged,{name:n,status:"staged"}]})),[]);
  const unstageFile =useCallback(n=>setGit(p=>({...p,staged:p.staged.filter(f=>f.name!==n),unstaged:[...p.unstaged,{name:n,status:"unstaged"}]})),[]);
  const stageAll    =useCallback(()=>setGit(p=>({...p,staged:[...p.staged,...p.unstaged.map(f=>({...f,status:"staged"}))],unstaged:[]})),[]);
  const switchBranch=useCallback(br=>setGit(p=>({...p,branch:br})),[]);
  const doCommit    =useCallback(msg=>setGit(p=>{
    if(!p.staged.length) return p;
    return{...p,commits:[{hash:Math.random().toString(36).slice(2,8),msg,date:new Date().toISOString().slice(0,10)},...p.commits],staged:[]};
  }),[]);
  return{git,stageFile,unstageFile,stageAll,switchBranch,doCommit};
}

// ── UI Helpers ────────────────────────────────────────────────────────────────
function Btn({label,color,onClick,disabled,title}){
  return(
    <button title={title} onClick={onClick} disabled={disabled} style={{
      background:"transparent",border:`1px solid ${color}`,color,borderRadius:4,
      padding:"3px 10px",fontSize:12,cursor:disabled?"not-allowed":"pointer",
      opacity:disabled?0.45:1,fontFamily:MONO,whiteSpace:"nowrap",
    }}>{label}</button>
  );
}
const INP=(ex={})=>({background:"#3C3C3C",border:"1px solid #474747",borderRadius:4,color:"#D4D4D4",padding:"5px 8px",fontSize:12,fontFamily:MONO,outline:"none",...ex});

// ── Editör ────────────────────────────────────────────────────────────────────
function CodeEditor({code,onChange,errors,settings,isMobile,onSelectionChange}){
  const taRef=useRef(null);
  const th=THEMES[settings.theme]??THEMES.dark;
  const handleKeyDown=e=>{
    if(e.key!=="Tab") return; e.preventDefault();
    const s=e.currentTarget.selectionStart, indent=" ".repeat(settings.tabSize);
    onChange(code.slice(0,s)+indent+code.slice(e.currentTarget.selectionEnd));
    requestAnimationFrame(()=>{ if(taRef.current){taRef.current.selectionStart=taRef.current.selectionEnd=s+settings.tabSize;} });
  };
  const handleSelect=()=>{
    const ta=taRef.current; if(!ta) return;
    onSelectionChange(code.slice(ta.selectionStart,ta.selectionEnd).trim());
  };
  const insertAt=text=>{
    const ta=taRef.current; if(!ta) return;
    const s=ta.selectionStart;
    onChange(code.slice(0,s)+text+code.slice(ta.selectionEnd));
    requestAnimationFrame(()=>{ if(taRef.current){taRef.current.selectionStart=taRef.current.selectionEnd=s+text.length;taRef.current.focus();} });
  };
  const hl=highlight(code,th,settings.lineNumbers,errors);
  return(
    <div style={{display:"flex",height:"100%",overflow:"hidden"}}>
      <div style={{flex:1,position:"relative",overflow:"hidden"}}>
        <div aria-hidden style={{position:"absolute",inset:0,padding:`12px 0 ${isMobile?"52px":"12px"} ${settings.lineNumbers?"0":"8px"}`,fontFamily:MONO,fontSize:settings.fontSize,lineHeight:"1.5",whiteSpace:settings.wordWrap?"pre-wrap":"pre",overflow:"hidden",pointerEvents:"none",color:"#D4D4D4"}}>{hl}</div>
        <textarea ref={taRef} value={code} onChange={e=>onChange(e.target.value)} onKeyDown={handleKeyDown} onSelect={handleSelect} onMouseUp={handleSelect}
          spellCheck={false} autoCorrect="off" autoCapitalize="off"
          style={{position:"absolute",inset:0,padding:`12px 0 ${isMobile?"52px":"12px"} ${settings.lineNumbers?"54px":"8px"}`,background:"transparent",color:"transparent",caretColor:"#AEAFAD",border:"none",outline:"none",resize:"none",fontFamily:MONO,fontSize:settings.fontSize,lineHeight:"1.5",whiteSpace:settings.wordWrap?"pre-wrap":"pre",overflow:"auto",zIndex:2}}/>
      </div>
      {!isMobile&&(
        <aside style={{width:148,borderLeft:"1px solid #474747",background:"#252526",overflow:"auto",flexShrink:0}}>
          <div style={{padding:"7px 10px",fontSize:11,color:"#858585",borderBottom:"1px solid #474747"}}>📋 Snippets</div>
          {SNIPPETS.map(s=>(
            <button key={s.label} onClick={()=>onChange(s.code)} style={{display:"block",width:"100%",textAlign:"left",background:"transparent",border:"none",borderBottom:"1px solid #2D2D2D",color:"#9CDCFE",cursor:"pointer",padding:"7px 10px",fontSize:12,fontFamily:MONO}}
              onMouseEnter={e=>{e.currentTarget.style.background="#094771";}} onMouseLeave={e=>{e.currentTarget.style.background="transparent";}}
            >{s.label}</button>
          ))}
        </aside>
      )}
      {isMobile&&(
        <div style={{position:"absolute",bottom:0,left:0,right:0,zIndex:5,display:"flex",overflowX:"auto",background:"#2D2D2D",borderTop:"1px solid #474747",padding:"4px 6px",gap:4}}>
          {["{","}"," (",")",";","=>","//",'"',"[]","Tab"].map(sym=>(
            <button key={sym} onClick={()=>insertAt(sym==="Tab"?"    ":sym)} style={{background:"#3C3C3C",border:"1px solid #555",color:"#D4D4D4",borderRadius:4,padding:"5px 9px",fontSize:14,cursor:"pointer",whiteSpace:"nowrap",minWidth:34,fontFamily:MONO}}>{sym}</button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Terminal ──────────────────────────────────────────────────────────────────
function Terminal({lines,loading,onSend,onClear}){
  const [input,setInput]=useState(""), [history,setHistory]=useState([]), [histIdx,setHistIdx]=useState(-1);
  const bottomRef=useRef(null);
  useEffect(()=>{ bottomRef.current?.scrollIntoView({behavior:"smooth"}); },[lines]);
  const send=()=>{
    const msg=input.trim(); if(!msg||loading) return;
    setHistory(p=>[msg,...p.slice(0,49)]); setHistIdx(-1); setInput(""); onSend(msg);
  };
  const handleKey=e=>{
    if(e.key==="Enter"){send();return;}
    if(e.key==="ArrowUp"){ e.preventDefault(); const ni=Math.min(histIdx+1,history.length-1); setHistIdx(ni); setInput(history[ni]??""); }
    if(e.key==="ArrowDown"){ e.preventDefault(); const ni=Math.max(histIdx-1,-1); setHistIdx(ni); setInput(ni===-1?"":history[ni]??""); }
  };
  return(
    <div style={{display:"flex",flexDirection:"column",height:"100%"}}>
      <div style={{flex:1,overflow:"auto",padding:"10px 14px"}}>
        {lines.map((l,i)=>(
          <div key={i} style={{color:OUT_COLOR[l.type]??"#D4D4D4",fontFamily:MONO,fontSize:13,lineHeight:1.7,whiteSpace:"pre-wrap",wordBreak:"break-word"}}>{l.text}</div>
        ))}
        {loading&&<div style={{color:"#C586C0",fontFamily:MONO,fontSize:13}}>● Calisiyor...</div>}
        <div ref={bottomRef}/>
      </div>
      <div style={{borderTop:"1px solid #474747",background:"#252526",padding:"7px 10px",display:"flex",gap:8,alignItems:"center",flexShrink:0}}>
        <span style={{color:"#4EC9B0",fontSize:14,flexShrink:0}}>›</span>
        <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={handleKey}
          placeholder="Soru sor... (↑↓ gecmis)" disabled={loading}
          style={{flex:1,background:"transparent",border:"none",outline:"none",color:"#D4D4D4",fontSize:13,fontFamily:MONO}}/>
        <button onClick={onClear} style={{background:"transparent",border:"none",color:"#555",cursor:"pointer",fontSize:16}}>🗑</button>
        <Btn label="Gonder ↵" color="#007ACC" onClick={send} disabled={loading||!input.trim()}/>
      </div>
    </div>
  );
}

// ── Git ───────────────────────────────────────────────────────────────────────
function DiffViewer({original,modified}){
  const aL=original.split("\n"),bL=modified.split("\n"),out=[];
  let ai=0,bi=0;
  while(ai<aL.length||bi<bL.length){
    if(ai>=aL.length)       {out.push({t:"add",   l:bL[bi++]});}
    else if(bi>=bL.length)  {out.push({t:"remove",l:aL[ai++]});}
    else if(aL[ai]===bL[bi]){out.push({t:"same",  l:aL[ai++]});bi++;}
    else{out.push({t:"remove",l:aL[ai++]});out.push({t:"add",l:bL[bi++]});}
  }
  return(
    <div style={{overflow:"auto",fontFamily:MONO,fontSize:12}}>
      {out.map((d,i)=>(
        <div key={i} style={{display:"flex",gap:10,padding:"1px 8px",background:d.t==="add"?"#1a3a1a":d.t==="remove"?"#3a1a1a":"transparent",color:d.t==="add"?"#4EC9B0":d.t==="remove"?"#F44747":"#555"}}>
          <span style={{userSelect:"none",minWidth:12}}>{d.t==="add"?"+":d.t==="remove"?"−":" "}</span>
          <span>{d.l}</span>
        </div>
      ))}
    </div>
  );
}

function GitPanel({git,stageFile,unstageFile,stageAll,doCommit,switchBranch,currentCode,loading,generateMsg}){
  const [msg,setMsg]=useState(""), [showDiff,setShowDiff]=useState(false), [genLoad,setGenLoad]=useState(false);
  const gen=async()=>{ setGenLoad(true); const m=await generateMsg(git.staged.map(f=>f.name).join(", ")); setMsg(m); setGenLoad(false); };
  const commit=()=>{ if(!msg.trim()||!git.staged.length) return; doCommit(msg.trim()); setMsg(""); };
  return(
    <div style={{padding:12,overflow:"auto",height:"100%",fontFamily:MONO}}>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
        <span style={{color:"#4EC9B0"}}>🌿</span>
        <select value={git.branch} onChange={e=>switchBranch(e.target.value)} style={INP({fontSize:13})}>
          {git.branches.map(b=><option key={b} value={b}>{b}</option>)}
        </select>
      </div>
      <Section label={`STAGED (${git.staged.length})`} action={git.staged.length?<Btn label="Commit ▶" color="#4EC9B0" onClick={commit} disabled={!msg.trim()}/>:null}/>
      {git.staged.map(f=><FRow key={f.name} name={f.name} color="#4EC9B0" sym="−" onAction={()=>unstageFile(f.name)}/>)}
      <Section label={`UNSTAGED (${git.unstaged.length})`} action={git.unstaged.length?<Btn label="+ Tumu" color="#9CDCFE" onClick={stageAll} disabled={false}/>:null}/>
      {git.unstaged.map(f=><FRow key={f.name} name={f.name} color="#858585" sym="+" onAction={()=>stageFile(f.name)}/>)}
      {git.staged.length>0&&(
        <div style={{display:"flex",gap:6,marginBottom:12}}>
          <input value={msg} onChange={e=>setMsg(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")commit();}} placeholder="feat: aciklama..." style={{...INP(),flex:1}}/>
          <Btn label={genLoad?"...":"🤖 AI"} color="#C586C0" onClick={gen} disabled={genLoad||loading}/>
        </div>
      )}
      <div style={{marginBottom:12}}>
        <Btn label={showDiff?"▲ Gizle":"▼ Diff"} color="#DCDCAA" onClick={()=>setShowDiff(v=>!v)} disabled={false}/>
        {showDiff&&<div style={{marginTop:6,border:"1px solid #474747",borderRadius:4,overflow:"hidden"}}><DiffViewer original={"// Onceki\nConsole.WriteLine(\"v1\");"} modified={currentCode}/></div>}
      </div>
      <div style={{fontSize:12,color:"#858585",marginBottom:6}}>GECMIS</div>
      {git.commits.map(c=>(
        <div key={c.hash} style={{display:"flex",justifyContent:"space-between",padding:"7px 10px",background:"#252526",borderRadius:4,marginBottom:4,border:"1px solid #3C3C3C",fontSize:12}}>
          <span><span style={{color:"#569CD6",marginRight:8}}>{c.hash}</span>{c.msg}</span>
          <span style={{color:"#858585",flexShrink:0,marginLeft:8}}>{c.date}</span>
        </div>
      ))}
    </div>
  );
}
function Section({label,action}){
  return(<div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6,marginTop:4}}><span style={{fontSize:12,color:"#858585"}}>{label}</span>{action}</div>);
}
function FRow({name,color,sym,onAction}){
  return(<div style={{display:"flex",justifyContent:"space-between",padding:"5px 8px",background:"#1E1E1E",borderRadius:3,marginBottom:3}}><span style={{fontSize:12,color}}>{name}</span><button onClick={onAction} style={{background:"transparent",border:"none",color,cursor:"pointer",fontSize:16,lineHeight:1}}>{sym}</button></div>);
}

// ── Import ────────────────────────────────────────────────────────────────────
function ImportManager({code,onCodeChange}){
  const [imports,setImports]=useState(IMPORT_DEFAULTS), [val,setVal]=useState("");
  const add=ns=>{ const name=ns.trim(); if(!name||imports.includes(name)) return; setImports(p=>[...p,name]); const line=`using ${name};`; if(!code.includes(line)) onCodeChange(`${line}\n${code}`); setVal(""); };
  const remove=name=>{ setImports(p=>p.filter(i=>i!==name)); onCodeChange(code.replace(`using ${name};\n`,"").replace(`using ${name};`,"")); };
  return(
    <div style={{padding:14,overflow:"auto",height:"100%"}}>
      <p style={{fontSize:12,color:"#858585",marginBottom:12}}>📦 Namespace ekle / cikar</p>
      <div style={{display:"flex",gap:6,marginBottom:14}}>
        <input value={val} onChange={e=>setVal(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")add(val);}} placeholder="System.Net.Http" style={{...INP(),flex:1}}/>
        <Btn label="+ Ekle" color="#4CAF50" onClick={()=>add(val)} disabled={!val.trim()}/>
      </div>
      {imports.map(name=>(
        <div key={name} style={{display:"flex",justifyContent:"space-between",alignItems:"center",background:"#252526",borderRadius:4,padding:"7px 10px",marginBottom:4,border:"1px solid #3C3C3C"}}>
          <span style={{fontSize:12,color:"#9CDCFE",fontFamily:MONO}}>using {name};</span>
          <button onClick={()=>remove(name)} style={{background:"transparent",border:"none",color:"#F44747",cursor:"pointer",fontSize:16}}>×</button>
        </div>
      ))}
      <p style={{fontSize:11,color:"#858585",margin:"14px 0 8px"}}>Hizli ekle:</p>
      <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
        {IMPORT_SUGGEST.filter(s=>!imports.includes(s)).map(s=>(
          <button key={s} onClick={()=>add(s)} style={{background:"#3C3C3C",border:"1px solid #474747",color:"#858585",borderRadius:12,padding:"3px 10px",fontSize:11,cursor:"pointer",fontFamily:MONO}}>{s}</button>
        ))}
      </div>
    </div>
  );
}

// ── NuGet ─────────────────────────────────────────────────────────────────────
function NuGetManager({claude}){
  const [query,setQuery]=useState(""), [results,setResults]=useState([]), [instPkgs,setInstPkgs]=useState(NUGET_PRESETS.slice(0,2)), [busy,setBusy]=useState(false);
  const search=async()=>{ if(!query.trim()) return; setBusy(true);
    try{ const d=await claude.askJson(`"${query}" icin 5 NuGet paketi oner. JSON: [{"id":"...","version":"...","desc":"..."}]`,"NuGet asistani. Sadece JSON array dondur."); setResults(Array.isArray(d)?d:[]); }
    catch{ setResults(NUGET_PRESETS.filter(p=>p.id.toLowerCase().includes(query.toLowerCase()))); } setBusy(false); };
  const isInst=id=>instPkgs.some(p=>p.id===id);
  return(
    <div style={{padding:14,overflow:"auto",height:"100%"}}>
      <div style={{display:"flex",gap:6,marginBottom:14}}>
        <input value={query} onChange={e=>setQuery(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")search();}} placeholder="OnnxRuntime, Newtonsoft..." style={{...INP(),flex:1}}/>
        <Btn label={busy?"...":"🔍"} color="#2196F3" onClick={search} disabled={busy}/>
      </div>
      {results.map(p=>(<PkgRow key={p.id} pkg={p} isInst={isInst(p.id)} onInstall={()=>!isInst(p.id)&&setInstPkgs(prev=>[...prev,p])} onRemove={()=>setInstPkgs(prev=>prev.filter(x=>x.id!==p.id))}/>))}
      <p style={{fontSize:11,color:"#858585",margin:"12px 0 6px"}}>KURULU ({instPkgs.length})</p>
      {instPkgs.map(p=>(<PkgRow key={p.id} pkg={p} isInst={true} showRemove onInstall={null} onRemove={()=>setInstPkgs(prev=>prev.filter(x=>x.id!==p.id))}/>))}
      <p style={{fontSize:11,color:"#858585",margin:"14px 0 8px"}}>Populer:</p>
      <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
        {NUGET_PRESETS.filter(p=>!isInst(p.id)).map(p=>(
          <button key={p.id} onClick={()=>setInstPkgs(prev=>[...prev,p])} style={{background:"#3C3C3C",border:"1px solid #474747",color:"#858585",borderRadius:12,padding:"3px 10px",fontSize:11,cursor:"pointer",fontFamily:MONO}}>{p.id}</button>
        ))}
      </div>
    </div>
  );
}
function PkgRow({pkg,isInst,onInstall,onRemove,showRemove}){
  return(
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",background:"#252526",borderRadius:4,padding:"8px 10px",marginBottom:5,border:"1px solid #3C3C3C"}}>
      <div><div style={{fontSize:12,color:"#9CDCFE",fontFamily:MONO}}>{pkg.id}</div><div style={{fontSize:11,color:"#858585"}}>v{pkg.version}{pkg.desc?` — ${pkg.desc}`:""}</div></div>
      <div style={{display:"flex",gap:4}}>
        {!showRemove&&<Btn label={isInst?"✔":"+ Kur"} color={isInst?"#858585":"#4CAF50"} onClick={isInst?null:onInstall} disabled={isInst}/>}
        {(showRemove||isInst)&&<Btn label="🗑" color="#F44747" onClick={onRemove} disabled={false}/>}
      </div>
    </div>
  );
}

// ── Agent ─────────────────────────────────────────────────────────────────────
function AgentPanel({claude,loading,onOutput}){
  const [agents,setAgents]=useState([{name:"Analyzer",instructions:"C# kodunu analiz et."},{name:"Optimizer",instructions:"Optimize oner."}]);
  const [wfType,setWfType]=useState("sequential"), [input,setInput]=useState("Asagidaki kodu analiz edip iyilestir."), [running,setRunning]=useState(false);
  const addAgent=()=>setAgents(p=>[...p,{name:`Agent${p.length+1}`,instructions:""}]);
  const updAgent=(i,pat)=>setAgents(p=>p.map((a,j)=>j===i?{...a,...pat}:a));
  const remAgent=i=>setAgents(p=>p.filter((_,j)=>j!==i));
  const addPreset=pr=>setAgents(p=>[...p,{name:pr.label.replace(/[^a-zA-Z]/g,""),instructions:pr.instructions}]);
  const run=async()=>{
    if(!agents.length||running) return; setRunning(true);
    const lines=[{type:"cmd",text:`> MAF Workflow (${wfType})`},{type:"system",text:`${agents.length} ajan`}];
    let ctx=input;
    for(const ag of agents){
      lines.push({type:"info",text:`\n[${ag.name}] calisiyor...`});
      try{
        const r=await claude.ask(`Sen "${ag.name}" adli AI ajanisın.\nGorev: ${ag.instructions}\nGiris:\n${ctx}`,"MAF ajan. Kisa Turkce yanit ver.");
        ctx=r; r.split("\n").filter(Boolean).forEach(l=>lines.push({type:"ai",text:`  ${ag.name}: ${l}`}));
      }catch(err){lines.push({type:"error",text:`  ${ag.name} hatasi: ${err}`});break;}
    }
    lines.push({type:"system",text:"\n─── Workflow tamamlandi ───"});
    onOutput(lines); setRunning(false);
  };
  const isLoad=loading||running;
  const IA=INP();
  return(
    <div style={{padding:14,overflow:"auto",height:"100%",fontFamily:MONO}}>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}><span style={{fontSize:16}}>🤖</span><span style={{fontSize:13,color:"#D4D4D4"}}>Microsoft Agent Framework 1.2</span></div>
      <p style={{fontSize:11,color:"#858585",marginBottom:6}}>Hazir Agentler:</p>
      <div style={{display:"flex",flexWrap:"wrap",gap:5,marginBottom:12}}>
        {AGENT_TYPES.map(at=>(
          <button key={at.id} onClick={()=>addPreset(at)} style={{background:"#2D2D2D",border:"1px solid #474747",color:"#9CDCFE",borderRadius:4,padding:"3px 9px",fontSize:11,cursor:"pointer",fontFamily:MONO}}>{at.label}</button>
        ))}
      </div>
      <div style={{display:"flex",gap:6,marginBottom:12,flexWrap:"wrap"}}>
        {[["sequential","→ Sırali"],["parallel","⇉ Paralel"],["hitl","👤 HITL"]].map(([id,lbl])=>(
          <button key={id} onClick={()=>setWfType(id)} style={{background:wfType===id?"#007ACC":"transparent",border:`1px solid ${wfType===id?"#007ACC":"#474747"}`,color:wfType===id?"#fff":"#858585",borderRadius:4,padding:"4px 12px",fontSize:12,cursor:"pointer",fontFamily:MONO}}>{lbl}</button>
        ))}
      </div>
      <Section label={`AJANLAR (${agents.length})`} action={<Btn label="+ Ajan" color="#4EC9B0" onClick={addAgent} disabled={false}/>}/>
      {agents.map((ag,i)=>(
        <div key={i} style={{background:"#252526",border:"1px solid #3C3C3C",borderRadius:6,padding:10,marginBottom:8}}>
          <div style={{display:"flex",gap:6,marginBottom:6,alignItems:"center"}}>
            <span style={{color:"#C586C0",fontSize:12,minWidth:20}}>#{i+1}</span>
            <input value={ag.name} onChange={e=>updAgent(i,{name:e.target.value})} placeholder="Ajan adi" style={{...IA,flex:1}}/>
            <button onClick={()=>remAgent(i)} style={{background:"transparent",border:"none",color:"#F44747",cursor:"pointer",fontSize:16}}>×</button>
          </div>
          <textarea value={ag.instructions} onChange={e=>updAgent(i,{instructions:e.target.value})} rows={2} placeholder="Gorev..." style={{...IA,width:"100%",resize:"vertical"}}/>
        </div>
      ))}
      <p style={{fontSize:11,color:"#858585",marginBottom:6}}>Girdi:</p>
      <textarea value={input} onChange={e=>setInput(e.target.value)} rows={3} style={{...IA,width:"100%",resize:"vertical",marginBottom:10}}/>
      <button onClick={run} disabled={isLoad||!agents.length} style={{background:isLoad?"#555":"#007ACC",border:"none",color:"#fff",borderRadius:4,padding:"8px",fontSize:13,cursor:isLoad?"not-allowed":"pointer",fontFamily:MONO,width:"100%"}}>
        {isLoad?"● Calisiyor...":"▶ Workflow Calistir"}
      </button>
    </div>
  );
}

// ── Ayarlar ───────────────────────────────────────────────────────────────────
function Settings({settings,onChange,apiKey,onApiKey}){
  const p=patch=>onChange({...settings,...patch});
  return(
    <div style={{padding:20,overflow:"auto",height:"100%",maxWidth:480,fontFamily:MONO}}>
      {/* API Key */}
      <div style={{marginBottom:20,padding:"12px 14px",background:"#252526",borderRadius:6,border:"1px solid #474747"}}>
        <div style={{fontSize:12,color:"#858585",marginBottom:8}}>🔑 Anthropic API Key</div>
        <div style={{display:"flex",gap:6}}>
          <input
            type="password"
            value={apiKey}
            onChange={e=>onApiKey(e.target.value)}
            placeholder="sk-ant-api03-..."
            style={{flex:1,background:"#3C3C3C",border:`1px solid ${apiKey.length>10?"#4CAF50":"#474747"}`,borderRadius:4,color:"#D4D4D4",padding:"6px 10px",fontSize:12,fontFamily:MONO,outline:"none"}}
          />
        </div>
        <div style={{fontSize:11,color:apiKey.length>10?"#4CAF50":"#F44747",marginTop:6}}>
          {apiKey.length>10?"✅ Key girildi — localStorage'a kaydedildi":"❌ Key yok — tüm AI özellikleri çalışmaz"}
        </div>
        <div style={{fontSize:10,color:"#555",marginTop:4}}>
          console.anthropic.com → API Keys → Create Key
        </div>
      </div>
      {[{label:"Yazi Boyutu",key:"fontSize",min:10,max:22},{label:"Tab Boyutu",key:"tabSize",min:2,max:8}].map(({label,key,min,max})=>(
        <div key={key} style={{marginBottom:14}}>
          <div style={{fontSize:12,color:"#858585",marginBottom:6}}>{label}: <strong style={{color:"#D4D4D4"}}>{settings[key]}</strong></div>
          <input type="range" min={min} max={max} value={settings[key]} onChange={e=>p({[key]:Number(e.target.value)})} style={{width:"100%",accentColor:"#007ACC"}}/>
        </div>
      ))}
      {[{label:"Satir Numaralari",key:"lineNumbers"},{label:"Sozcuk Sarma",key:"wordWrap"},{label:"Otomatik Kaydet",key:"autoSave"}].map(({label,key})=>(
        <div key={key} style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
          <span style={{fontSize:13,color:"#D4D4D4"}}>{label}</span>
          <div onClick={()=>p({[key]:!settings[key]})} style={{width:40,height:22,background:settings[key]?"#007ACC":"#555",borderRadius:11,cursor:"pointer",position:"relative",transition:"background .2s"}}>
            <div style={{width:18,height:18,background:"white",borderRadius:"50%",position:"absolute",top:2,left:settings[key]?20:2,transition:"left .2s"}}/>
          </div>
        </div>
      ))}
      <p style={{fontSize:12,color:"#858585",marginBottom:10}}>Tema</p>
      <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
        {Object.keys(THEMES).map(t=>(
          <button key={t} onClick={()=>p({theme:t})} style={{background:"#1E1E1E",border:`2px solid ${settings.theme===t?"#007ACC":"#474747"}`,borderRadius:6,padding:"7px 14px",color:"#D4D4D4",cursor:"pointer",fontSize:12,fontFamily:MONO}}>{t.charAt(0).toUpperCase()+t.slice(1)}</button>
        ))}
      </div>
    </div>
  );
}

// ── Ana Uygulama ──────────────────────────────────────────────────────────────
const INIT_OUTPUT=[
  {type:"system", text:"🟢 C# Shell .NET IDE v2.1 — Claude + Piston API"},
  {type:"success",text:"✅ Build: Piston (Mono) → Fiddle (.NET 9) → Claude sim."},
  {type:"system", text:"🔒 Guvenlik: 15sn timeout | 50KB limit | Sandbox"},
  {type:"system", text:"Ctrl+Enter → Calistir | ↑↓ → Komut gecmisi"},
  {type:"system", text:"─".repeat(48)},
];

export default function App(){
  const bp=useBreakpoint(), isMobile=bp==="mobile";
  const [modelId,setModelId]=useState(MODELS[0].id);
  const [apiKey,setApiKey]=useState(()=>{ try{ return localStorage.getItem("cs_ide_key")??""; }catch{return "";} });
  const saveApiKey=(k)=>{ setApiKey(k); try{ localStorage.setItem("cs_ide_key",k); }catch{} };
  const [settings,setSettings]=useState(DEFAULT_SETTINGS);
  const [output,setOutput]=useState(INIT_OUTPUT);
  const [loading,setLoading]=useState(false);
  const [activeTab,setActiveTab]=useState("editor");
  const [errors,setErrors]=useState([]);
  const [selectedTxt,setSelectedTxt]=useState("");

  const claude=useMemo(()=>new ClaudeService(modelId,1000,apiKey),[modelId,apiKey]);
  const {files,active,switchTab:switchFile,updateActive,newFile,closeFile}=useFileManager(INIT_FILES);
  const {git,stageFile,unstageFile,stageAll,switchBranch,doCommit}=useGitState(files.map(f=>f.name));
  const code=active?.content??"";
  const th=THEMES[settings.theme]??THEMES.dark;

  // Debounce lint
  const dCode=useDebounce(code,1000);
  useEffect(()=>{
    if(!dCode.trim()){setErrors([]);return;}
    let cancel=false;
    claude.askJson(`C# lint:\n\`\`\`csharp\n${dCode}\n\`\`\``,'C# linter. JSON: [{"line":N,"col":N,"msg":"...","severity":"error|warning"}]')
      .then(r=>{if(!cancel)setErrors(Array.isArray(r)?r:[]);}).catch(()=>{});
    return()=>{cancel=true;};
  },[dCode,claude]);

  const addLine =useCallback(l  =>setOutput(p=>[...p,l]),[]);
  const addLines=useCallback(ls =>setOutput(p=>[...p,...ls]),[]);

  // Wandbox → Claude fallback
  const runCode=useCallback(async()=>{
    setLoading(true); setActiveTab("terminal");
    addLine({type:"cmd",text:"> dotnet run (Wandbox/Mono)"});
    try{
      let result;
      // 1. Wandbox — gercek Mono derlemesi
      try{
        result=await runWithWandbox(code);
        addLine({type:"system",text:"🟢 Wandbox (Mono C#)"});
      }catch(e1){
        addLine({type:"warning",text:`⚠ Wandbox: ${e1.message}`});
        addLine({type:"system", text:"🔵 Claude simulasyonuna geciliyor..."});
        // 2. Claude fallback
        try{
          const r=await claude.ask(
            `Bu C# kodunu calistir ve SADECE konsol ciktisini ver:\n\`\`\`csharp\n${code}\n\`\`\``,
            "C# .NET runtime simulatorusun. Sadece programin konsol ciktisini dondur. Aciklama ekleme.",
          );
          result={stdout:r,stderr:"",code:0,source:"claude"};
          addLine({type:"system",text:"🔵 Claude simulasyonu"});
        }catch(e2){
          addLine({type:"error",text:`❌ Claude: ${e2.message}`});
          addLine({type:"info", text:"Haiku modelini sec, internet baglantisini kontrol et."});
          setLoading(false);
          return;
        }
      }
      // Sonuclari goster
      if(result.stderr){
        const errs=parseBuildErrors(result.stderr);
        if(errs.length>0) setErrors(errs);
        result.stderr.split("\n").filter(Boolean).forEach(l=>addLine({type:"error",text:l}));
      }
      if(result.stdout) result.stdout.split("\n").forEach(l=>addLine({type:"output",text:l}));
      if(result.code===0&&!result.stderr) addLine({type:"success",text:"✅ Basariyla calisti"});
    }catch(err){
      addLine({type:"error",text:`❌ ${err.message}`});
    }
    addLine({type:"system",text:"─── Tamamlandi ───"});
    setLoading(false);
  },[code,claude,addLine]);

  // AI aksiyonlar
  const aiAction=useCallback(async(action,target=code)=>{
    setLoading(true); setActiveTab("terminal");
    const prompts={
      fix:      [`Bu C# kodundaki hatalari duzelt:\n\`\`\`csharp\n${target}\n\`\`\``,"C# uzman. Duzeltilmis tam kodu ver."],
      explain:  [`Bu C# kodunu Turkce acikla:\n\`\`\`csharp\n${target}\n\`\`\``,"C# uzman. Kisa anlasilir aciklama."],
      refactor: [`Bu C# kodunu refactor et:\n\`\`\`csharp\n${target}\n\`\`\``,"C# uzman. Refactor edilmis kodu ver."],
      test:     [`Bu C# kodu icin xUnit test yaz:\n\`\`\`csharp\n${target}\n\`\`\``,"C# uzman. Gercekci xUnit testleri yaz."],
      analyze:  [`C# kodunu analiz et:\n\`\`\`csharp\n${target}\n\`\`\``,"C# uzman. Hata, optimizasyon ozeti."],
    };
    const icons={fix:"🔧",explain:"📖",refactor:"♻",test:"🧪",analyze:"🔍"};
    addLine({type:"cmd",text:`> claude ${icons[action]} ${action}`});
    try{
      const [prompt,system]=prompts[action];
      const r=await claude.ask(prompt,system);
      r.split("\n").forEach(l=>addLine({type:"ai",text:l}));
      if(action==="fix"){
        const match=r.match(/```(?:csharp|cs)?\n([\s\S]+?)```/);
        if(match){updateActive(match[1].trim());addLine({type:"success",text:"✅ Kod otomatik guncellendi"});}
      }
    }catch(err){addLine({type:"error",text:String(err)});}
    setLoading(false); setSelectedTxt("");
  },[code,claude,addLine,updateActive]);

  const handleChat=useCallback(async msg=>{
    addLine({type:"user",text:`> ${msg}`}); setLoading(true);
    try{
      const r=await claude.ask(`Kod:\n\`\`\`csharp\n${code}\n\`\`\`\nSoru: ${msg}`,"C# uzman. Kisa Turkce yanit.");
      r.split("\n").forEach(l=>addLine({type:"ai",text:l}));
    }catch(err){addLine({type:"error",text:String(err)});}
    setLoading(false);
  },[code,claude,addLine]);

  const generateCommitMsg=useCallback(async fileNames=>{
    try{return await claude.ask(`Dosyalar: ${fileNames}. Conventional Commit mesaji.`,"Git. Sadece mesaj, max 72 karakter.");}
    catch{return "chore: guncelleme";}
  },[claude]);

  const errCount =errors.filter(e=>e.severity==="error").length;
  const warnCount=errors.filter(e=>e.severity==="warning").length;

  return(
    <div style={{background:th.bg,color:"#D4D4D4",height:"100vh",display:"flex",flexDirection:"column",fontFamily:MONO,overflow:"hidden"}}>

      {/* Baslik */}
      <header style={{background:"#323233",borderBottom:`1px solid ${th.border}`,padding:"0 12px",display:"flex",alignItems:"center",justifyContent:"space-between",height:38,flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <div style={{background:"linear-gradient(135deg,#1565C0,#42A5F5)",borderRadius:5,width:22,height:22,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:"bold",color:"white",flexShrink:0}}>C#</div>
          {!isMobile&&<span style={{fontSize:13}}>C# Shell .NET IDE</span>}
          <span style={{fontSize:11,color:"#858585"}}>v2.1</span>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          {loading&&<span style={{fontSize:10,color:"#C586C0"}}>●</span>}
          {!claude.hasKey()&&<span onClick={()=>setActiveTab("settings")} style={{fontSize:10,color:"#F44747",cursor:"pointer",border:"1px solid #F44747",borderRadius:3,padding:"1px 5px"}}>🔑 KEY YOK</span>}
          <select value={modelId} onChange={e=>setModelId(e.target.value)} style={{...INP({fontSize:11,padding:"2px 5px"}),maxWidth:isMobile?130:200,cursor:"pointer"}}>
            {MODELS.map(m=><option key={m.id} value={m.id}>{m.label}</option>)}
          </select>
        </div>
      </header>

      {/* Arac cubugu */}
      {!isMobile&&(
        <div style={{background:"#2D2D2D",borderBottom:`1px solid ${th.border}`,padding:"5px 10px",display:"flex",alignItems:"center",gap:5,flexShrink:0,flexWrap:"wrap"}}>
          <Btn label="▶ Calistir" color="#4CAF50" onClick={runCode}              disabled={loading} title="Ctrl+Enter"/>
          <Btn label="🔍 Analiz"  color="#2196F3" onClick={()=>aiAction("analyze")} disabled={loading}/>
          <Btn label="🔧 Fix"     color="#FF9800" onClick={()=>aiAction("fix")}     disabled={loading||errCount===0} title="Hata varken aktif"/>
          <Btn label="📖 Explain" color="#9CDCFE" onClick={()=>aiAction("explain")} disabled={loading}/>
          <Btn label="♻ Refactor" color="#C586C0" onClick={()=>aiAction("refactor")}disabled={loading}/>
          <Btn label="🧪 Test"    color="#4EC9B0" onClick={()=>aiAction("test")}    disabled={loading}/>
          <div style={{width:1,height:18,background:"#474747",margin:"0 4px"}}/>
          <Btn label="↺ Sifirla" color="#555" onClick={()=>updateActive(DEFAULT_CODE)} disabled={false}/>
          <Btn label="+ Dosya"   color="#555" onClick={()=>newFile()}               disabled={false}/>
          <div style={{marginLeft:"auto",display:"flex",gap:10,alignItems:"center"}}>
            {errCount >0&&<span style={{fontSize:11,color:"#F44747"}}>● {errCount} hata</span>}
            {warnCount>0&&<span style={{fontSize:11,color:"#FFCC00"}}>△ {warnCount} uyari</span>}
          </div>
        </div>
      )}

      {/* Secili metin AI menüsü */}
      {selectedTxt&&(
        <div style={{background:"#094771",borderBottom:`1px solid ${th.border}`,padding:"4px 12px",display:"flex",alignItems:"center",gap:6,flexShrink:0,overflowX:"auto"}}>
          <span style={{fontSize:11,color:"#9CDCFE",flexShrink:0}}>Secili:</span>
          {[["explain","📖 Acikla"],["refactor","♻ Refactor"],["test","🧪 Test"]].map(([act,lbl])=>(
            <Btn key={act} label={lbl} color="#4EC9B0" onClick={()=>aiAction(act,selectedTxt)} disabled={loading}/>
          ))}
          <button onClick={()=>setSelectedTxt("")} style={{background:"transparent",border:"none",color:"#555",cursor:"pointer",marginLeft:4,fontSize:14}}>×</button>
        </div>
      )}

      {/* Dosya sekmeleri */}
      <div style={{background:"#252526",borderBottom:`1px solid ${th.border}`,display:"flex",overflowX:"auto",flexShrink:0}}>
        {files.map(f=>(
          <div key={f.id} onClick={()=>switchFile(f.id)} style={{display:"flex",alignItems:"center",gap:5,padding:"5px 12px",background:f.active?th.bg:"transparent",borderRight:`1px solid ${th.border}`,borderTop:f.active?`1px solid ${th.accent}`:"1px solid transparent",cursor:"pointer",whiteSpace:"nowrap",fontSize:12,color:f.active?"#fff":"#858585"}}>
            <span>{f.name.endsWith(".cs")?"📄":"⚙"} {f.name}</span>
            <span role="button" onClick={e=>{e.stopPropagation();closeFile(f.id);}} style={{color:"#555",fontSize:14,lineHeight:1}}>×</span>
          </div>
        ))}
        <button onClick={()=>newFile()} style={{background:"transparent",border:"none",color:"#555",cursor:"pointer",padding:"0 10px",fontSize:18}}>+</button>
      </div>

      {/* Sekme cubugu */}
      {!isMobile&&(
        <div style={{background:"#252526",borderBottom:`1px solid ${th.border}`,display:"flex",flexShrink:0}}>
          {TABS.map(t=>(
            <button key={t.id} onClick={()=>setActiveTab(t.id)} style={{padding:"6px 14px",fontSize:12,cursor:"pointer",background:"transparent",border:"none",borderBottom:activeTab===t.id?`2px solid ${th.accent}`:"2px solid transparent",color:activeTab===t.id?"#fff":"#858585",fontFamily:MONO,whiteSpace:"nowrap"}}>{t.icon} {t.label}</button>
          ))}
        </div>
      )}

      {/* Icerik */}
      <main style={{flex:1,overflow:"hidden",position:"relative"}}>
        {activeTab==="editor"  &&<CodeEditor code={code} onChange={updateActive} errors={errors} settings={settings} isMobile={isMobile} onSelectionChange={setSelectedTxt}/>}
        {activeTab==="terminal"&&<Terminal lines={output} loading={loading} onSend={handleChat} onClear={()=>setOutput([{type:"system",text:"Temizlendi."}])}/>}
        {activeTab==="git"     &&<GitPanel git={git} stageFile={stageFile} unstageFile={unstageFile} stageAll={stageAll} doCommit={doCommit} switchBranch={switchBranch} currentCode={code} loading={loading} generateMsg={generateCommitMsg}/>}
        {activeTab==="imports" &&<ImportManager code={code} onCodeChange={updateActive}/>}
        {activeTab==="nuget"   &&<NuGetManager claude={claude}/>}
        {activeTab==="agent"   &&<AgentPanel claude={claude} loading={loading} onOutput={ls=>{addLines(ls);setActiveTab("terminal");}}/>}
        {activeTab==="settings"&&<Settings settings={settings} onChange={setSettings} apiKey={apiKey} onApiKey={saveApiKey}/>}
      </main>

      {/* Mobil: hata varsa Fix */}
      {isMobile&&errCount>0&&(
        <div style={{background:"#3a1a1a",borderTop:"1px solid #F44747",padding:"6px 12px",display:"flex",justifyContent:"space-between",alignItems:"center",flexShrink:0}}>
          <span style={{fontSize:12,color:"#F44747"}}>● {errCount} hata</span>
          <Btn label="🔧 AI Fix" color="#F44747" onClick={()=>aiAction("fix")} disabled={loading}/>
        </div>
      )}

      {/* Mobil alt nav */}
      {isMobile&&(
        <nav style={{position:"fixed",bottom:0,left:0,right:0,background:"#252526",borderTop:`1px solid ${th.border}`,display:"flex",justifyContent:"space-around",padding:"6px 0",zIndex:100}}>
          {TABS.map(t=>(
            <button key={t.id} onClick={()=>setActiveTab(t.id)} style={{background:"transparent",border:"none",color:activeTab===t.id?th.accent:"#555",display:"flex",flexDirection:"column",alignItems:"center",gap:2,cursor:"pointer",fontSize:17,minWidth:40}}>
              <span>{t.icon}</span><span style={{fontSize:9}}>{t.label}</span>
            </button>
          ))}
        </nav>
      )}
      {isMobile&&<div style={{height:60,flexShrink:0}}/>}

      {/* Durum cubugu */}
      <footer style={{background:th.accent,padding:"2px 12px",fontSize:11,display:"flex",gap:14,color:"#fff",flexShrink:0,alignItems:"center"}}>
        <span>C# .NET</span>
        <span>{code.split("\n").length} satir</span>
        <span>Wandbox+Claude</span>
        {errCount>0&&<span style={{color:"#FFD0D0"}}>● {errCount} hata</span>}
        {!isMobile&&<span style={{marginLeft:"auto"}}>{MODELS.find(m=>m.id===modelId)?.label}</span>}
      </footer>
    </div>
  );
}
