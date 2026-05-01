/**
 * @file SyntaxHighlighter.js
 * C# kaynak kodunu token'lara ayırıp renklendirir.
 * Saf fonksiyon — state veya side-effect YOKTUR.
 */

import { CSHARP_KEYWORDS, CSHARP_TYPES } from '../../constants/keywords.js';

/**
 * @typedef {Object} Theme
 * @property {string} keyword
 * @property {string} string
 * @property {string} comment
 * @property {string} number
 * @property {string} type
 * @property {string} lineNo
 */

/** @type {Record<string, Theme>} */
export const THEMES = {
  dark: {
    keyword: '#569CD6', string: '#CE9178', comment: '#6A9955',
    number:  '#B5CEA8', type:   '#4EC9B0', lineNo:  '#555',
  },
  monokai: {
    keyword: '#F92672', string: '#E6DB74', comment: '#75715E',
    number:  '#AE81FF', type:   '#66D9EF', lineNo:  '#555',
  },
  solarized: {
    keyword: '#268BD2', string: '#2AA198', comment: '#586E75',
    number:  '#D33682', type:   '#859900', lineNo:  '#555',
  },
};

const TOKEN_RE =
  /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|\/\/.*$|[a-zA-Z_]\w*|\d+(?:\.\d+)?|[{}()\[\];,.<>!=+\-*/%&|^~?:]|\s+)/g;

/**
 * Tek bir token'ı renklendirir.
 * @param {string} token
 * @param {number} index
 * @param {Theme}  theme
 * @returns {import('react').ReactElement}
 */
function colorToken(token, index, theme) {
  /** @type {string} */
  let color = '#D4D4D4';

  if (token.startsWith('//'))                        color = theme.comment;
  else if (token.startsWith('"') || token.startsWith("'")) color = theme.string;
  else if (CSHARP_KEYWORDS.includes(token))           color = theme.keyword;
  else if (CSHARP_TYPES.includes(token))              color = theme.type;
  else if (/^[A-Z][a-zA-Z0-9]*$/.test(token))        color = theme.type;
  else if (/^\d/.test(token))                         color = theme.number;

  return (
    <span key={index} style={{ color }}>
      {token}
    </span>
  );
}

/**
 * Kodu satır satır renklendirilmiş JSX'e çevirir.
 * @param {string}   code
 * @param {Theme}    theme
 * @param {boolean}  showLineNumbers
 * @param {import('../../types/index.js').LintError[]} errors
 * @returns {import('react').ReactElement[]}
 */
export function highlightCode(code, theme, showLineNumbers, errors) {
  /** @type {Map<number, import('../../types/index.js').LintError[]>} */
  const errorMap = new Map();
  errors.forEach((e) => {
    const existing = errorMap.get(e.line) ?? [];
    errorMap.set(e.line, [...existing, e]);
  });

  return code.split('\n').map((line, i) => {
    const lineNum    = i + 1;
    const lineErrors = errorMap.get(lineNum) ?? [];
    const hasError   = lineErrors.some((e) => e.severity === 'error');
    const hasWarning = lineErrors.some((e) => e.severity === 'warning');

    const tokens = (line.match(TOKEN_RE) ?? []).map((t, ti) =>
      colorToken(t, ti, theme),
    );

    return (
      <div
        key={lineNum}
        style={{
          display:    'flex',
          minHeight:  '1.5em',
          background: hasError   ? 'rgba(244,71,71,0.09)'
                    : hasWarning ? 'rgba(255,204,0,0.06)'
                    : 'transparent',
          borderLeft: hasError   ? '3px solid #F44747'
                    : hasWarning ? '3px solid #FFCC00'
                    : '3px solid transparent',
        }}
      >
        {showLineNumbers && (
          <span
            style={{
              minWidth:   '40px',
              color:      hasError ? '#F44747' : theme.lineNo,
              textAlign:  'right',
              paddingRight: '14px',
              fontSize:   '12px',
              userSelect: 'none',
              flexShrink: 0,
            }}
          >
            {lineNum}
          </span>
        )}
        <span style={{ flex: 1 }}>{tokens}</span>
        {lineErrors.length > 0 && (
          <span
            style={{
              fontSize:  '11px',
              color:     hasError ? '#F44747' : '#FFCC00',
              padding:   '0 8px',
              alignSelf: 'center',
              whiteSpace:'nowrap',
              flexShrink: 0,
            }}
          >
            ⚠ {lineErrors[0].msg}
          </span>
        )}
      </div>
    );
  });
}
