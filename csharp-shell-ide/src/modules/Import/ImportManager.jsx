/**
 * @file ImportManager.jsx
 * using direktiflerini yönetir; koda otomatik ekler / çıkarır.
 */

import { useState } from 'react';

/** @typedef {{ name:string }} ImportItem */

const DEFAULTS = [
  'System', 'System.Collections.Generic', 'System.Linq',
  'System.Text', 'System.IO',
];

const SUGGESTIONS = [
  'System.Net.Http', 'System.Threading.Tasks', 'System.Text.Json',
  'System.Diagnostics', 'Microsoft.Agents.AI', 'Microsoft.Agents.Orchestration',
  'Microsoft.ML.OnnxRuntime',
];

/**
 * @typedef {Object} ImportManagerProps
 * @property {string}           code
 * @property {(c:string)=>void} onCodeChange
 */

/** @param {ImportManagerProps} props */
export function ImportManager({ code, onCodeChange }) {
  const [imports,   setImports]   = useState(DEFAULTS);
  const [inputVal,  setInputVal]  = useState('');

  const addImport = (ns) => {
    const name = ns.trim();
    if (!name || imports.includes(name)) return;
    setImports((prev) => [...prev, name]);
    const line = `using ${name};`;
    if (!code.includes(line)) onCodeChange(`${line}\n${code}`);
    setInputVal('');
  };

  const removeImport = (name) => {
    setImports((prev) => prev.filter((i) => i !== name));
    onCodeChange(
      code
        .replace(`using ${name};\n`, '')
        .replace(`using ${name};`,   ''),
    );
  };

  const MONO = "'JetBrains Mono','Fira Code',monospace";

  return (
    <div style={{ padding: '14px', overflow: 'auto', height: '100%' }}>
      <p style={{ fontSize: '12px', color: '#858585', marginBottom: '12px' }}>
        📦 Namespace ekle/çıkar — koda otomatik yansır.
      </p>

      {/* Giriş */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '14px' }}>
        <input
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') addImport(inputVal); }}
          placeholder="System.Net.Http"
          style={{
            flex: 1, background: '#3C3C3C', border: '1px solid #474747',
            borderRadius: '4px', color: '#D4D4D4',
            padding: '5px 9px', fontSize: '13px', fontFamily: MONO, outline: 'none',
          }}
        />
        <button onClick={() => addImport(inputVal)} style={{
          background: 'transparent', border: '1px solid #4CAF50',
          color: '#4CAF50', borderRadius: '4px',
          padding: '4px 12px', cursor: 'pointer', fontSize: '12px', fontFamily: MONO,
        }}>
          + Ekle
        </button>
      </div>

      {/* Aktif importlar */}
      {imports.map((name) => (
        <div key={name} style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: '#252526', borderRadius: '4px', padding: '7px 10px',
          marginBottom: '4px', border: '1px solid #3C3C3C',
        }}>
          <span style={{ fontSize: '12px', color: '#9CDCFE', fontFamily: MONO }}>using {name};</span>
          <button onClick={() => removeImport(name)} style={{
            background: 'transparent', border: 'none', color: '#F44747', cursor: 'pointer', fontSize: '16px',
          }}>×</button>
        </div>
      ))}

      {/* Öneriler */}
      <p style={{ fontSize: '11px', color: '#858585', margin: '14px 0 8px' }}>Hızlı ekle:</p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
        {SUGGESTIONS.filter((s) => !imports.includes(s)).map((s) => (
          <button key={s} onClick={() => addImport(s)} style={{
            background: '#3C3C3C', border: '1px solid #474747', color: '#858585',
            borderRadius: '12px', padding: '3px 10px', fontSize: '11px',
            cursor: 'pointer', fontFamily: MONO,
          }}>
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}
