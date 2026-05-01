/**
 * @file CodeEditor.jsx
 * Kod editörü — söz dizimi katmanı + düzenlenebilir textarea + snippet paneli.
 * Props ile her şey inject edilir; internal state sadece UI odağı için.
 */

import { useRef } from 'react';
import { highlightCode, THEMES } from './SyntaxHighlighter.jsx';
import { SNIPPETS } from '../../constants/snippets.js';

/** @typedef {import('../../types/index.js').LintError}   LintError   */
/** @typedef {import('../../types/index.js').AppSettings} AppSettings */
/** @typedef {import('../../types/index.js').Snippet}     Snippet     */

/**
 * @typedef {Object} CodeEditorProps
 * @property {string}      code
 * @property {(v:string)=>void} onChange
 * @property {LintError[]} errors
 * @property {AppSettings} settings
 * @property {boolean}     isMobile
 */

/** @param {CodeEditorProps} props */
export function CodeEditor({ code, onChange, errors, settings, isMobile }) {
  const textareaRef = useRef(/** @type {HTMLTextAreaElement|null} */ (null));
  const theme       = THEMES[settings.theme] ?? THEMES.dark;

  const MONO = "'JetBrains Mono','Fira Code','Cascadia Code',monospace";
  const FS   = `${settings.fontSize}px`;
  const LS   = '1.5';

  /** @param {import('react').KeyboardEvent<HTMLTextAreaElement>} e */
  const handleKeyDown = (e) => {
    const ta = e.currentTarget;

    if (e.key === 'Tab') {
      e.preventDefault();
      const indent = ' '.repeat(settings.tabSize);
      const start  = ta.selectionStart;
      const end    = ta.selectionEnd;
      onChange(code.slice(0, start) + indent + code.slice(end));
      // cursor pozisyonunu sonraki tick'te güncelle
      requestAnimationFrame(() => {
        ta.selectionStart = ta.selectionEnd = start + settings.tabSize;
      });
    }
  };

  /** @param {string} text */
  const insertAtCursor = (text) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    onChange(code.slice(0, start) + text + code.slice(ta.selectionEnd));
    requestAnimationFrame(() => {
      ta.selectionStart = ta.selectionEnd = start + text.length;
      ta.focus();
    });
  };

  /** @param {Snippet} snippet */
  const applySnippet = (snippet) => onChange(snippet.code);

  const highlighted = highlightCode(code, theme, settings.lineNumbers, errors);

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>

      {/* ── Editör alanı ── */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>

        {/* Söz dizimi önizleme (pointer-events:none) */}
        <div
          aria-hidden="true"
          style={{
            position:      'absolute',
            inset:         0,
            padding:       `12px 0 12px ${settings.lineNumbers ? '0' : '8px'}`,
            fontFamily:    MONO,
            fontSize:      FS,
            lineHeight:    LS,
            whiteSpace:    'pre',
            overflowWrap:  settings.wordWrap ? 'break-word' : 'normal',
            overflow:      'hidden',
            pointerEvents: 'none',
            color:         '#D4D4D4',
          }}
        >
          {highlighted}
        </div>

        {/* Düzenlenebilir textarea */}
        <textarea
          ref={textareaRef}
          value={code}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          spellCheck={false}
          autoCorrect="off"
          autoCapitalize="off"
          style={{
            position:    'absolute',
            inset:       0,
            padding:     `12px 0 12px ${settings.lineNumbers ? '54px' : '8px'}`,
            background:  'transparent',
            color:       'transparent',
            caretColor:  '#AEAFAD',
            border:      'none',
            outline:     'none',
            resize:      'none',
            fontFamily:  MONO,
            fontSize:    FS,
            lineHeight:  LS,
            whiteSpace:  settings.wordWrap ? 'pre-wrap' : 'pre',
            overflowWrap:settings.wordWrap ? 'break-word' : 'normal',
            overflow:    'auto',
            zIndex:      2,
          }}
        />
      </div>

      {/* ── Snippet paneli (desktop) ── */}
      {!isMobile && (
        <aside
          style={{
            width:      '160px',
            borderLeft: '1px solid #474747',
            background: '#252526',
            overflow:   'auto',
            flexShrink: 0,
            display:    'flex',
            flexDirection: 'column',
          }}
        >
          <div style={{ padding: '7px 10px', fontSize: '11px', color: '#858585', borderBottom: '1px solid #474747' }}>
            📋 Snippet'ler
          </div>
          {SNIPPETS.map((s) => (
            <button
              key={s.label}
              onClick={() => applySnippet(s)}
              style={{
                background:   'transparent',
                border:       'none',
                borderBottom: '1px solid #2D2D2D',
                color:        '#9CDCFE',
                cursor:       'pointer',
                padding:      '7px 10px',
                textAlign:    'left',
                fontSize:     '12px',
                fontFamily:   MONO,
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#094771'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
            >
              {s.label}
            </button>
          ))}
        </aside>
      )}

      {/* ── Mobil klavye araç çubuğu ── */}
      {isMobile && (
        <div
          style={{
            position:  'absolute',
            bottom:    0,
            left:      0,
            right:     0,
            display:   'flex',
            overflowX: 'auto',
            background:'#2D2D2D',
            borderTop: '1px solid #474747',
            padding:   '4px 6px',
            gap:       '4px',
            zIndex:    5,
          }}
        >
          {['{', '}', '(', ')', '[', ']', ';', '=>', '//', '"', 'Tab'].map((sym) => (
            <button
              key={sym}
              onClick={() => insertAtCursor(sym === 'Tab' ? '    ' : sym)}
              style={{
                background:   '#3C3C3C',
                border:       '1px solid #555',
                color:        '#D4D4D4',
                borderRadius: '4px',
                padding:      '5px 9px',
                fontSize:     '14px',
                cursor:       'pointer',
                whiteSpace:   'nowrap',
                minWidth:     '34px',
                fontFamily:   MONO,
              }}
            >
              {sym}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
