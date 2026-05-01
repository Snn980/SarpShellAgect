/**
 * @file GitPanel.jsx
 * Git durumunu gösterir; stage, commit, diff işlemleri.
 */

import { useState } from 'react';
import { DiffViewer } from './DiffViewer.jsx';

/** @typedef {import('../../types/index.js').GitState}  GitState  */

/**
 * @typedef {Object} GitPanelProps
 * @property {GitState}           git
 * @property {(n:string)=>void}   stageFile
 * @property {(n:string)=>void}   unstageFile
 * @property {()=>void}           stageAll
 * @property {(m:string)=>void}   commit
 * @property {(b:string)=>void}   switchBranch
 * @property {string}             currentCode   — diff için mevcut kod
 * @property {boolean}            loading
 * @property {(m:string)=>Promise<string>} generateMsg — AI commit mesajı
 */

/** @param {GitPanelProps} props */
export function GitPanel({
  git, stageFile, unstageFile, stageAll,
  commit, switchBranch, currentCode, loading, generateMsg,
}) {
  const [commitMsg,  setCommitMsg]  = useState('');
  const [showDiff,   setShowDiff]   = useState(false);
  const [genLoading, setGenLoading] = useState(false);

  const MONO = "'JetBrains Mono','Fira Code',monospace";

  const handleGenerateMsg = async () => {
    setGenLoading(true);
    const msg = await generateMsg(git.staged.map((f) => f.name).join(', '));
    setCommitMsg(msg);
    setGenLoading(false);
  };

  const handleCommit = () => {
    if (!commitMsg.trim() || git.staged.length === 0) return;
    commit(commitMsg.trim());
    setCommitMsg('');
    setShowDiff(false);
  };

  /** @param {string} label @param {string} color */
  const Pill = ({ label, color }) => (
    <span style={{
      background:   `${color}22`,
      border:       `1px solid ${color}`,
      color,
      borderRadius: '10px',
      padding:      '1px 8px',
      fontSize:     '11px',
    }}>
      {label}
    </span>
  );

  return (
    <div style={{ padding: '12px', overflow: 'auto', height: '100%', fontFamily: MONO }}>

      {/* Dal seçici */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
        <span style={{ color: '#4EC9B0', fontSize: '13px' }}>🌿</span>
        <select
          value={git.branch}
          onChange={(e) => switchBranch(e.target.value)}
          style={{
            background: '#3C3C3C', border: '1px solid #474747', color: '#D4D4D4',
            borderRadius: '4px', fontSize: '13px', padding: '3px 8px', cursor: 'pointer', fontFamily: MONO,
          }}
        >
          {git.branches.map((b) => <option key={b} value={b}>{b}</option>)}
        </select>
      </div>

      {/* Staged */}
      <div style={{ marginBottom: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
          <span style={{ fontSize: '12px', color: '#858585' }}>STAGED ({git.staged.length})</span>
          {git.staged.length > 0 && (
            <button onClick={handleCommit} disabled={!commitMsg.trim()} style={smallBtn('#4EC9B0', !commitMsg.trim())}>
              Commit ▶
            </button>
          )}
        </div>
        {git.staged.map((f) => (
          <FileRow key={f.name} name={f.name} color="#4EC9B0"
            onAction={() => unstageFile(f.name)} actionLabel="−" />
        ))}
      </div>

      {/* Unstaged */}
      <div style={{ marginBottom: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
          <span style={{ fontSize: '12px', color: '#858585' }}>UNSTAGED ({git.unstaged.length})</span>
          {git.unstaged.length > 0 && (
            <button onClick={stageAll} style={smallBtn('#9CDCFE', false)}>+ Tümü</button>
          )}
        </div>
        {git.unstaged.map((f) => (
          <FileRow key={f.name} name={f.name} color="#858585"
            onAction={() => stageFile(f.name)} actionLabel="+" />
        ))}
      </div>

      {/* Commit mesajı */}
      {git.staged.length > 0 && (
        <div style={{ marginBottom: '14px' }}>
          <div style={{ display: 'flex', gap: '6px', marginBottom: '6px' }}>
            <input
              value={commitMsg}
              onChange={(e) => setCommitMsg(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleCommit(); }}
              placeholder="feat: açıklama…"
              style={{
                flex: 1, background: '#3C3C3C', border: '1px solid #474747',
                borderRadius: '4px', color: '#D4D4D4', padding: '5px 8px',
                fontSize: '12px', fontFamily: MONO, outline: 'none',
              }}
            />
            <button onClick={handleGenerateMsg} disabled={genLoading || loading} style={smallBtn('#C586C0', false)}>
              {genLoading ? '…' : '🤖 AI'}
            </button>
          </div>
        </div>
      )}

      {/* Diff */}
      <div style={{ marginBottom: '14px' }}>
        <button
          onClick={() => setShowDiff((v) => !v)}
          style={{ ...smallBtn('#DCDCAA', false), marginBottom: '6px' }}
        >
          {showDiff ? '▲ Diff Gizle' : '▼ Diff Göster'}
        </button>
        {showDiff && (
          <div style={{ border: '1px solid #474747', borderRadius: '4px', overflow: 'hidden' }}>
            <DiffViewer original="// Önceki sürüm\nConsole.WriteLine(1);" modified={currentCode} />
          </div>
        )}
      </div>

      {/* Commit geçmişi */}
      <div style={{ fontSize: '12px', color: '#858585', marginBottom: '6px' }}>
        GEÇMİŞ ({git.commits.length})
      </div>
      {git.commits.map((c) => (
        <div key={c.hash} style={{
          display: 'flex', justifyContent: 'space-between',
          padding: '7px 10px', background: '#252526',
          borderRadius: '4px', marginBottom: '4px',
          border: '1px solid #3C3C3C', fontSize: '12px',
        }}>
          <span>
            <span style={{ color: '#569CD6', marginRight: '8px' }}>{c.hash}</span>
            <span style={{ color: '#D4D4D4' }}>{c.msg}</span>
          </span>
          <span style={{ color: '#858585', flexShrink: 0, marginLeft: '8px' }}>{c.date}</span>
        </div>
      ))}
    </div>
  );
}

/** @param {{ name:string, color:string, onAction:()=>void, actionLabel:string }} p */
function FileRow({ name, color, onAction, actionLabel }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '5px 8px', background: '#1E1E1E', borderRadius: '3px', marginBottom: '3px',
    }}>
      <span style={{ fontSize: '12px', color }}>{name}</span>
      <button onClick={onAction} style={{
        background: 'transparent', border: 'none',
        color, cursor: 'pointer', fontSize: '16px', lineHeight: 1,
      }}>
        {actionLabel}
      </button>
    </div>
  );
}

/**
 * @param {string}  color
 * @param {boolean} disabled
 * @returns {import('react').CSSProperties}
 */
function smallBtn(color, disabled) {
  return {
    background:   'transparent',
    border:       `1px solid ${color}`,
    color,
    borderRadius: '4px',
    padding:      '3px 10px',
    fontSize:     '11px',
    cursor:       disabled ? 'not-allowed' : 'pointer',
    opacity:      disabled ? 0.5 : 1,
    fontFamily:   "'JetBrains Mono','Fira Code',monospace",
    whiteSpace:   'nowrap',
  };
}
