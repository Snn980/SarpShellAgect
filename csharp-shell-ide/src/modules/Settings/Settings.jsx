// src/modules/Settings/Settings.jsx
import React from 'react';

export function Settings({ settings, onChange, onClose }) {
  const handleChange = (key, value) => {
    onChange(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="modal" onClick={onClose}>
      <div 
        className="modal-content"
        onClick={e => e.stopPropagation()}
        style={{
          background: '#252526',
          padding: '24px',
          borderRadius: '8px',
          width: '90%',
          maxWidth: '420px',
          color: '#d4d4d4',
          boxShadow: '0 10px 30px rgba(0,0,0,0.6)'
        }}
      >
        <h2 style={{ marginBottom: '20px', borderBottom: '1px solid #3c3c3c', paddingBottom: '10px' }}>
          ⚙️ Ayarlar
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label>Theme</label>
            <select 
              value={settings.theme}
              onChange={(e) => handleChange('theme', e.target.value)}
              style={inputStyle}
            >
              <option value="dark">Dark</option>
              <option value="light">Light</option>
            </select>
          </div>

          <div>
            <label>Font Size (px)</label>
            <input 
              type="number" 
              value={settings.fontSize}
              onChange={(e) => handleChange('fontSize', parseInt(e.target.value))}
              style={inputStyle}
            />
          </div>

          <div>
            <label>Tab Size</label>
            <input 
              type="number" 
              value={settings.tabSize}
              onChange={(e) => handleChange('tabSize', parseInt(e.target.value))}
              style={inputStyle}
            />
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
            <label>
              <input 
                type="checkbox" 
                checked={settings.lineNumbers}
                onChange={(e) => handleChange('lineNumbers', e.target.checked)}
              /> Line Numbers
            </label>
            <label>
              <input 
                type="checkbox" 
                checked={settings.wordWrap}
                onChange={(e) => handleChange('wordWrap', e.target.checked)}
              /> Word Wrap
            </label>
          </div>
        </div>

        <div style={{ marginTop: '30px', textAlign: 'right' }}>
          <button 
            onClick={onClose}
            style={{
              padding: '10px 20px',
              background: '#007acc',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
}

const inputStyle = {
  width: '100%',
  padding: '8px 12px',
  background: '#1e1e1e',
  border: '1px solid #3c3c3c',
  color: '#fff',
  borderRadius: '4px',
  marginTop: '5px'
};
