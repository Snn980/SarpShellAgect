/**
 * @file Terminal.jsx
 * Çıktı gösterici + AI sohbet girişi.
 */

import { useRef, useEffect, useState } from 'react';

/** @typedef {import('../../types/index.js').OutputLine} OutputLine */

/** @type {Record<OutputLine['type'], string>} */
const COLOR_MAP = {
  output:  '#D4D4D4',
  error:   '#F44747',
  system:  '#858585',
  cmd:     '#DCDCAA',
  info:    '#9CDCFE',
  user:    '#4EC9B0',
  ai:      '#C586C0',
  warning: '#FFCC00',
};

/**
 * @typedef {Object} TerminalProps
 * @property {OutputLine[]} lines
 * @property {boolean}      loading
 * @property {(msg:string)=>Promise<void>} onSend
 * @property {()=>void}    onClear
 */

/** @param {TerminalProps} props */
export function Terminal({ lines, loading, onSend, onClear }) {
  const [input, setInput]   = useState('');
  const bottomRef           = useRef(/** @type {HTMLDivElement|null} */ (null));
  const MONO = "'JetBrains Mono','Fira Code',monospace";

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [lines]);

  const handleSend = () => {
    const msg = input.trim();
    if (!msg || loading) return;
    setInput('');
    onSend(msg);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Çıktı alanı */}
      <div style={{ flex: 1, overflow: 'auto', padding: '10px 14px' }}>
        {lines.map((l, i) => (
          <div
            key={i}
            style={{
              color:      COLOR_MAP[l.type] ?? '#D4D4D4',
              fontFamily: MONO,
              fontSize:   '13px',
              lineHeight: '1.7',
              whiteSpace: 'pre-wrap',
              wordBreak:  'break-word',
            }}
          >
            {l.text}
          </div>
        ))}
        {loading && (
          <div style={{ color: '#C586C0', fontFamily: MONO, fontSize: '13px' }}>
            ● İşleniyor…
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Giriş satırı */}
      <div
        style={{
          borderTop:  '1px solid #474747',
          background: '#252526',
          padding:    '7px 10px',
          display:    'flex',
          gap:        '8px',
          alignItems: 'center',
          flexShrink: 0,
        }}
      >
        <span style={{ color: '#4EC9B0', fontSize: '14px', flexShrink: 0 }}>›</span>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSend(); }}
          placeholder="Kod hakkında soru sor…"
          disabled={loading}
          style={{
            flex:       1,
            background: 'transparent',
            border:     'none',
            outline:    'none',
            color:      '#D4D4D4',
            fontSize:   '13px',
            fontFamily: MONO,
          }}
        />
        <button
          onClick={onClear}
          style={{ background: 'transparent', border: 'none', color: '#555', cursor: 'pointer', fontSize: '16px' }}
          title="Temizle"
        >
          🗑
        </button>
        <button
          onClick={handleSend}
          disabled={loading || !input.trim()}
          style={{
            background:   'transparent',
            border:       '1px solid #007ACC',
            color:        '#007ACC',
            borderRadius: '4px',
            padding:      '3px 10px',
            fontSize:     '12px',
            cursor:       loading ? 'not-allowed' : 'pointer',
            fontFamily:   MONO,
            opacity:      loading ? 0.5 : 1,
          }}
        >
          Gönder ↵
        </button>
      </div>
    </div>
  );
}
