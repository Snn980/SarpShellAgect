/**
 * @file Settings.jsx
 * Uygulama ayarları paneli — font, tema, davranış.
 */

import { THEMES } from '../Editor/SyntaxHighlighter';

/** @typedef {import('../../types/index.js').AppSettings} AppSettings */

/**
 * @typedef {Object} SettingsProps
 * @property {AppSettings}                    settings
 * @property {(s:AppSettings)=>void}          onChange
 */

/** @param {SettingsProps} props */
export function Settings({ settings, onChange }) {
  const MONO = "'JetBrains Mono','Fira Code',monospace";

  /** @param {Partial<AppSettings>} patch */
  const patch = (partial) => onChange({ ...settings, ...partial });

  const Row = ({ children }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
      {children}
    </div>
  );

  const Label = ({ text }) => (
    <span style={{ fontSize: '13px', color: '#D4D4D4' }}>{text}</span>
  );

  /** @param {boolean} on @param {()=>void} toggle */
  const Toggle = ({ on, toggle }) => (
    <div
      role="switch"
      aria-checked={on}
      onClick={toggle}
      style={{
        width: '40px', height: '22px',
        background:   on ? '#007ACC' : '#555',
        borderRadius: '11px',
        cursor:       'pointer',
        position:     'relative',
        transition:   'background .2s',
        flexShrink:   0,
      }}
    >
      <div style={{
        width:      '18px',
        height:     '18px',
        background: 'white',
        borderRadius: '50%',
        position:   'absolute',
        top:        '2px',
        left:       on ? '20px' : '2px',
        transition: 'left .2s',
      }} />
    </div>
  );

  return (
    <div style={{ padding: '20px', overflow: 'auto', height: '100%', maxWidth: '480px', fontFamily: MONO }}>

      {/* Font boyutu */}
      <Row>
        <Label text={`Yazı Boyutu: ${settings.fontSize}px`} />
        <input
          type="range" min={10} max={22} value={settings.fontSize}
          onChange={(e) => patch({ fontSize: Number(e.target.value) })}
          style={{ width: '140px', accentColor: '#007ACC' }}
        />
      </Row>

      {/* Tab boyutu */}
      <Row>
        <Label text={`Tab Boyutu: ${settings.tabSize}`} />
        <input
          type="range" min={2} max={8} value={settings.tabSize}
          onChange={(e) => patch({ tabSize: Number(e.target.value) })}
          style={{ width: '140px', accentColor: '#007ACC' }}
        />
      </Row>

      {/* Toggle'lar */}
      {/** @type {Array<{label:string, key:keyof AppSettings}>} */([
        { label: 'Satır Numaraları', key: 'lineNumbers' },
        { label: 'Sözcük Sarma',     key: 'wordWrap'    },
        { label: 'Otomatik Kaydet',  key: 'autoSave'    },
      ]).map(({ label, key }) => (
        <Row key={key}>
          <Label text={label} />
          <Toggle
            on={/** @type {boolean} */ (settings[key])}
            toggle={() => patch({ [key]: !settings[key] })}
          />
        </Row>
      ))}

      {/* Tema */}
      <div style={{ marginTop: '6px' }}>
        <p style={{ fontSize: '12px', color: '#858585', marginBottom: '10px' }}>Tema</p>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {Object.keys(THEMES).map((t) => (
            <button
              key={t}
              onClick={() => patch({ theme: /** @type {AppSettings['theme']} */ (t) })}
              style={{
                background:   '#1E1E1E',
                border:       `2px solid ${settings.theme === t ? '#007ACC' : '#474747'}`,
                borderRadius: '6px',
                padding:      '7px 14px',
                color:        '#D4D4D4',
                cursor:       'pointer',
                fontSize:     '12px',
                fontFamily:   MONO,
              }}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
