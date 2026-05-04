import React, { useState, useCallback } from 'react';
import { CodeEditor } from './modules/Editor/CodeEditor';
import { Terminal } from './modules/Terminal/Terminal';
import { AgentPanel } from './modules/Agent/AgentPanel';
import { GitPanel } from './modules/Git/GitPanel';
import { ImportManager } from './modules/Import/ImportManager';
import { NuGetManager } from './modules/NuGet/NuGetManager';
import { Settings } from './modules/Settings/Settings';
import { useAppServices } from './hooks/useAppServices';
import { useFileState } from './hooks/useFileState';

export default function App() {
  const services = useAppServices();
  const { files, activeFile, updateFile } = useFileState(services);
  const [tab, setTab] = useState('editor');
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState({ theme: 'dark', fontSize: 14, tabSize: 4, lineNumbers: true, wordWrap: false, autoSave: false });
  const [logs, setLogs] = useState([{ type: 'system', text: 'SarpShellAgect IDE v0.1.0' }]);
  const [loading, setLoading] = useState(false);
  const [git, setGit] = useState({ branch: 'main', branches: ['main', 'dev'], staged: [], unstaged: [{ name: 'Program.cs', changes: 0 }], commits: [] });

  const safeFile = activeFile || { id: 'main', name: 'Program.cs', content: '// Kod burada...\nusing System;\nclass Program { static void Main() { Console.WriteLine("Hello"); } }', language: 'csharp' };
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  const addLog = useCallback((t, type = 'output') => setLogs(p => [...p, { text: t, type }]), []);
  const runCode = async () => { setLoading(true); addLog('> Derleniyor...', 'cmd'); try { const r = await services.piston.execute(safeFile.content, 'csharp'); addLog(r.success ? r.output : r.error, r.success ? 'output' : 'error'); } catch (e) { addLog(e.message, 'error'); } setLoading(false); };
  const aiSend = async (msg) => { addLog(msg, 'user'); setLoading(true); try { const r = await services.ai.ask(msg, 'Kısa cevap ver.'); addLog(r.response || 'AI boş', 'ai'); } catch (e) { addLog(e.message, 'error'); } setLoading(false); };

  const stageFile = (n) => setGit(p => ({ ...p, unstaged: p.unstaged.filter(f => f.name !== n), staged: [...p.staged, { name: n }] }));
  const unstageFile = (n) => setGit(p => ({ ...p, staged: p.staged.filter(f => f.name !== n), unstaged: [...p.unstaged, { name: n, changes: 0 }] }));
  const stageAll = () => setGit(p => ({ ...p, staged: [...p.staged, ...p.unstaged], unstaged: [] }));
  const commit = (m) => { if (git.staged.length) { setGit(p => ({ ...p, commits: [{ hash: Math.random().toString(36).slice(2, 7), msg: m, date: 'Şimdi' }, ...p.commits], staged: [] })); addLog(`Commit: ${m}`, 'system'); } };
  const switchBranch = (b) => setGit(p => ({ ...p, branch: b }));

  const render = () => {
    switch (tab) {
      case 'editor': return <CodeEditor code={safeFile.content} onChange={c => updateFile(safeFile.id, { content: c })} errors={[]} settings={settings} isMobile={isMobile} />;
      case 'terminal': return <Terminal lines={logs} loading={loading} onSend={aiSend} onClear={() => setLogs([])} />;
      case 'agent': return <AgentPanel claude={services.ai} loading={loading} onOutput={l => l.forEach(x => addLog(x.text, x.type))} />;
      case 'git': return <GitPanel git={git} stageFile={stageFile} unstageFile={unstageFile} stageAll={stageAll} commit={commit} switchBranch={switchBranch} currentCode={safeFile.content} loading={loading} generateMsg={f => Promise.resolve(`feat: ${f}`)} />;
      case 'nuget': return <NuGetManager claude={services.ai} />;
      case 'imports': return <ImportManager code={safeFile.content} onCodeChange={c => updateFile(safeFile.id, { content: c })} />;
      default: return null;
    }
  };

  const tabs = [{ id: 'editor', l: '📝 Editör' }, { id: 'terminal', l: '💻 Terminal' }, { id: 'agent', l: '🤖 Agent' }, { id: 'git', l: '🔀 Git' }, { id: 'nuget', l: '📦 Paket' }, { id: 'imports', l: '🔗 Import' }];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', background: '#1e1e1e', color: '#fff', paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: '#252526', borderBottom: '1px solid #3c3c3c', overflowX: 'auto', flexShrink: 0, scrollbarWidth: 'none' }}>
        <span style={{ fontSize: 14, fontWeight: 'bold', marginRight: 6 }}>⚡ Sarp</span>
        {tabs.map(t => (
     
      <button key={t.id} onClick={() => setTab(t.id)} style={{ background: tab === t.id ? '#007acc' : '#3c3c3c', border: 'none', color: '#fff', fontSize: 13, padding: '5px 10px', borderRadius: 4, cursor: 'pointer', whiteSpace: 'nowrap' }}>
            {t.l}
          </button>
        ))}
        <button onClick={() => setShowSettings(true)} style={{ marginLeft: 'auto', background: '#3c3c3c', border: 'none', color: '#fff', fontSize: 16, padding: '4px 8px', borderRadius: 4, cursor: 'pointer', flexShrink: 0 }}>⚙️</button>
      </div>

      <main style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>{render()}</main>

      {showSettings && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999, padding: 20 }}>
          <div style={{ background: '#252526', padding: 20, borderRadius: 8, width: '100%', maxWidth: 400, border: '1px solid #3c3c3c' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <h3 style={{ margin: 0, color: '#fff' }}>Ayarlar</h3>
              <button onClick={() => setShowSettings(false)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: 20, cursor: 'pointer' }}>✕</button>
            </div>
            <Settings settings={settings} onChange={setSettings} />
          </div>
        </div>
      )}
    </div>
  );
}
