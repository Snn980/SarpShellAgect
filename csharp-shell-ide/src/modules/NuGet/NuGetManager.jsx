/**
 * @file NuGetManager.jsx
 * NuGet paket arama (Claude AI) ve kurulu paket listesi.
 */

import { useState } from 'react';

/** @typedef {import('../../types/index.js').NuGetPackage}        NuGetPackage  */
/** @typedef {import('../../services/ClaudeService.js').ClaudeService} ClaudeService */

const PRESET_PACKAGES = /** @type {NuGetPackage[]} */ ([
  { id: 'Microsoft.Agents.AI',           version: '1.2.2', desc: 'MAF AI ajan çekirdeği'          },
  { id: 'Microsoft.Agents.Orchestration',version: '1.2.2', desc: 'MAF workflow motoru'             },
  { id: 'Microsoft.ML.OnnxRuntime',      version: '1.17.3',desc: 'Darknet/YOLO model çalıştırıcı' },
  { id: 'Newtonsoft.Json',               version: '13.0.3',desc: 'JSON serileştirme'               },
]);

/**
 * @typedef {Object} NuGetManagerProps
 * @property {ClaudeService} claude
 */

/** @param {NuGetManagerProps} props */
export function NuGetManager({ claude }) {
  const [query,     setQuery]     = useState('');
  const [results,   setResults]   = useState(/** @type {NuGetPackage[]} */ ([]));
  const [installed, setInstalled] = useState(/** @type {NuGetPackage[]} */ (PRESET_PACKAGES.slice(0, 2)));
  const [searching, setSearching] = useState(false);

  const MONO = "'JetBrains Mono','Fira Code',monospace";

  const search = async () => {
    if (!query.trim()) return;
    setSearching(true);
    try {
      const data = await claude.askJson(
        `"${query}" için 5 NuGet paketi öner. ` +
        `JSON: [{"id":"...","version":"...","desc":"..."}]`,
        'NuGet paket öneri asistanısın. Sadece JSON array döndür.',
      );
      setResults(Array.isArray(data) ? data : []);
    } catch {
      setResults(PRESET_PACKAGES.filter((p) =>
        p.id.toLowerCase().includes(query.toLowerCase()),
      ));
    }
    setSearching(false);
  };

  /** @param {NuGetPackage} pkg */
  const install = (pkg) => {
    if (installed.some((p) => p.id === pkg.id)) return;
    setInstalled((prev) => [...prev, pkg]);
  };

  /** @param {string} id */
  const uninstall = (id) => {
    setInstalled((prev) => prev.filter((p) => p.id !== id));
  };

  /** @param {NuGetPackage} pkg */
  const isInstalled = (pkg) => installed.some((p) => p.id === pkg.id);

  return (
    <div style={{ padding: '14px', overflow: 'auto', height: '100%' }}>

      {/* Arama */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '14px' }}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') search(); }}
          placeholder="Paket ara: OnnxRuntime, Newtonsoft…"
          style={{
            flex: 1, background: '#3C3C3C', border: '1px solid #474747',
            borderRadius: '4px', color: '#D4D4D4',
            padding: '5px 9px', fontSize: '12px', fontFamily: MONO, outline: 'none',
          }}
        />
        <button
          onClick={search}
          disabled={searching}
          style={{
            background: 'transparent', border: '1px solid #2196F3', color: '#2196F3',
            borderRadius: '4px', padding: '4px 12px', fontSize: '12px',
            cursor: searching ? 'not-allowed' : 'pointer', fontFamily: MONO,
            opacity: searching ? 0.5 : 1,
          }}
        >
          {searching ? '…' : '🔍'}
        </button>
      </div>

      {/* Arama sonuçları */}
      {results.length > 0 && (
        <div style={{ marginBottom: '14px' }}>
          <p style={{ fontSize: '11px', color: '#858585', marginBottom: '6px' }}>
            Sonuçlar ({results.length})
          </p>
          {results.map((pkg) => (
            <PkgRow
              key={pkg.id}
              pkg={pkg}
              actionLabel={isInstalled(pkg) ? '✔ Kurulu' : '+ Kur'}
              actionColor={isInstalled(pkg) ? '#858585' : '#4CAF50'}
              onAction={() => install(pkg)}
              disabled={isInstalled(pkg)}
            />
          ))}
        </div>
      )}

      {/* Kurulu paketler */}
      <p style={{ fontSize: '11px', color: '#858585', marginBottom: '6px' }}>
        KURULU ({installed.length})
      </p>
      {installed.map((pkg) => (
        <PkgRow
          key={pkg.id}
          pkg={pkg}
          actionLabel="🗑"
          actionColor="#F44747"
          onAction={() => uninstall(pkg.id)}
          disabled={false}
        />
      ))}

      {/* Hızlı öneri */}
      <p style={{ fontSize: '11px', color: '#858585', margin: '14px 0 8px' }}>Popüler</p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
        {PRESET_PACKAGES.filter((p) => !isInstalled(p)).map((p) => (
          <button key={p.id} onClick={() => install(p)} style={{
            background: '#3C3C3C', border: '1px solid #474747', color: '#858585',
            borderRadius: '12px', padding: '3px 10px', fontSize: '11px',
            cursor: 'pointer', fontFamily: MONO,
          }}>
            {p.id}
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * @typedef {Object} PkgRowProps
 * @property {NuGetPackage} pkg
 * @property {string}       actionLabel
 * @property {string}       actionColor
 * @property {()=>void}     onAction
 * @property {boolean}      disabled
 */

/** @param {PkgRowProps} props */
function PkgRow({ pkg, actionLabel, actionColor, onAction, disabled }) {
  const MONO = "'JetBrains Mono','Fira Code',monospace";
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      background: '#252526', borderRadius: '4px', padding: '8px 10px',
      marginBottom: '5px', border: '1px solid #3C3C3C',
    }}>
      <div>
        <div style={{ fontSize: '12px', color: '#9CDCFE', fontFamily: MONO }}>{pkg.id}</div>
        <div style={{ fontSize: '11px', color: '#858585' }}>v{pkg.version}{pkg.desc ? ` — ${pkg.desc}` : ''}</div>
      </div>
      <button
        onClick={onAction}
        disabled={disabled}
        style={{
          background: 'transparent', border: `1px solid ${actionColor}`,
          color: actionColor, borderRadius: '4px',
          padding: '3px 10px', fontSize: '11px',
          cursor: disabled ? 'default' : 'pointer',
          fontFamily: MONO, flexShrink: 0, marginLeft: '8px',
          opacity: disabled ? 0.6 : 1,
        }}
      >
        {actionLabel}
      </button>
    </div>
  );
}
