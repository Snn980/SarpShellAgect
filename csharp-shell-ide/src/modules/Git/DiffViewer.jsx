/**
 * @file DiffViewer.jsx
 * İki metin arasındaki satır bazlı farkı gösterir.
 * Saf bileşen — state YOKTUR.
 */

/**
 * @typedef {'same'|'add'|'remove'} DiffType
 * @typedef {{ type: DiffType, line: string }} DiffLine
 */

/**
 * Basit LCS tabanlı satır diff'i hesaplar.
 * Dizilerden eleman çıkarmak için filter kullanılır (pop/shift yasak).
 * @param {string} original
 * @param {string} modified
 * @returns {DiffLine[]}
 */
function computeDiff(original, modified) {
  const aLines = original.split('\n');
  const bLines = modified.split('\n');

  /** @type {DiffLine[]} */
  const result = [];
  let ai = 0;
  let bi = 0;

  while (ai < aLines.length || bi < bLines.length) {
    if (ai >= aLines.length) {
      result.push({ type: 'add',    line: bLines[bi] });
      bi += 1;
    } else if (bi >= bLines.length) {
      result.push({ type: 'remove', line: aLines[ai] });
      ai += 1;
    } else if (aLines[ai] === bLines[bi]) {
      result.push({ type: 'same',   line: aLines[ai] });
      ai += 1;
      bi += 1;
    } else {
      result.push({ type: 'remove', line: aLines[ai] });
      result.push({ type: 'add',    line: bLines[bi] });
      ai += 1;
      bi += 1;
    }
  }

  return result;
}

/** @type {Record<DiffType, string>} */
const BG = { same: 'transparent', add: '#1a3a1a', remove: '#3a1a1a' };
/** @type {Record<DiffType, string>} */
const FG = { same: '#858585',     add: '#4EC9B0', remove: '#F44747' };
/** @type {Record<DiffType, string>} */
const SYM = { same: ' ', add: '+', remove: '−' };

/**
 * @typedef {Object} DiffViewerProps
 * @property {string} original
 * @property {string} modified
 */

/** @param {DiffViewerProps} props */
export function DiffViewer({ original, modified }) {
  const diff = computeDiff(original, modified);
  const MONO = "'JetBrains Mono','Fira Code',monospace";

  return (
    <div style={{ overflow: 'auto', fontFamily: MONO, fontSize: '12px' }}>
      {diff.map((d, i) => (
        <div
          key={i}
          style={{
            display:    'flex',
            gap:        '10px',
            padding:    '1px 8px',
            background: BG[d.type],
            color:      FG[d.type],
          }}
        >
          <span style={{ userSelect: 'none', minWidth: '12px' }}>{SYM[d.type]}</span>
          <span>{d.line}</span>
        </div>
      ))}
    </div>
  );
}
