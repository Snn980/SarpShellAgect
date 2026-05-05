// src/modules/Settings/Settings.jsx
import React from 'react';

export function Settings({ settings, onChange, onClose }) {
  const handleChange = (key, value) => {
    onChange(prev => ({ ...prev, [key]: value }));
  };

  const GroupTitle = ({ children }) => (
    <div style={{ color: '#007acc', fontSize: '12px', fontWeight: 'bold', marginBottom: '8px', marginTop: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
      {children}
    </div>
  );

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(2px)' }} onClick={onClose}>
      <div 
        onClick={e => e.stopPropagation()}
        style={{
          background: '#1e1e1e',
          padding: '28px',
          borderRadius: '12px',
          width: '90%',
          maxWidth: '400px',
          color: '#e1e1e1',
          boxShadow: '0 20px 50px rgba(0,0,0,0.8)',
          border: '1px solid #333'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, fontSize: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '24px' }}>⚙️</span> Editör Ayarları
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: '20px' }}>&times;</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <section>
            <GroupTitle>Görünüm</GroupTitle>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={labelStyle}>Tema</label>
                <select value={settings.theme} onChange={(e) => handleChange('theme', e.target.value)} style={inputStyle}>
                  <option value="dark">Koyu (VS Dark)</option>
                  <option value="light">Açık (Visual Studio)</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Yazı Boyutu</label>
                <input type="number" value={settings.fontSize} onChange={(e) => handleChange('fontSize', parseInt(e.target.value))} style={inputStyle}/>
              </div>
            </div>
          </section>

          <section>
            <GroupTitle>Editör Davranışı</GroupTitle>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={labelStyle}>Sekme Genişliği</label>
                <input type="number" value={settings.tabSize} onChange={(e) => handleChange('tabSize', parseInt(e.target.value))} style={inputStyle}/>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '8px' }}>
                <label style={checkboxLabelStyle}>
                  <input type="checkbox" checked={settings.lineNumbers} onChange={(e) => handleChange('lineNumbers', e.target.checked)} /> Satır No
                </label>
                <label style={checkboxLabelStyle}>
                  <input type="checkbox" checked={settings.wordWrap} onChange={(e) => handleChange('wordWrap', e.target.checked)} /> Kaydırma
                </label>
              </div>
            </div>
          </section>
        </div>

        <button 
          onClick={onClose}
          style={{
            marginTop: '30px',
            width: '100%',
            padding: '12px',
            background: '#007acc',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 'bold',
            transition: 'background 0.2s'
          }}
          onMouseEnter={(e) => e.target.style.background = '#005a9e'}
          onMouseLeave={(e) => e.target.style.background = '#007acc'}
        >
          Değişiklikleri Kaydet
        </button>
      </div>
    </div>
  );
}

const labelStyle = { display: 'block', fontSize: '11px', color: '#888', marginBottom: '4px', marginLeft: '2px' };
const inputStyle = { width: '100%', padding: '10px', background: '#2d2d2d', border: '1px solid #444', color: '#fff', borderRadius: '4px', outline: 'none' };
const checkboxLabelStyle = { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer', color: '#ccc' };
