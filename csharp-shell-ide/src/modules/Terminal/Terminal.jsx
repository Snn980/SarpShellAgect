// src/modules/Terminal/Terminal.jsx
import React, { useRef, useEffect } from 'react';

export function Terminal({ logs = [], onClear, onCommand }) {
  const terminalRef = useRef(null);

  // Yeni log geldiğinde en alta kaydır
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [logs]);

  const handleCommand = (e) => {
    if (e.key === 'Enter' && e.target.value.trim()) {
      const cmd = e.target.value.trim();
      
      // Eğer dışarıdan bir komut işleyici (onCommand) varsa onu çağır
      if (onCommand) {
        onCommand(cmd);
      } else {
        // Yoksa basit iç mantığı kullan
        if (cmd.toLowerCase() === 'clear') {
          onClear?.();
        }
      }
      
      e.target.value = '';
    }
  };

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: '#0d0d0d', // Daha koyu, gerçek terminal havası
      color: '#d4d4d4',
      fontFamily: "'JetBrains Mono', monospace",
      overflow: 'hidden'
    }}>
      {/* Terminal Header */}
      <div style={{
        padding: '6px 12px',
        background: '#1e1e1e',
        borderBottom: '1px solid #333',
        fontSize: '11px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        color: '#888'
      }}>
        <span>⚡ SARPSHELL OUTPUT</span>
        <button 
          onClick={onClear}
          style={{
            background: 'none',
            border: 'none',
            color: '#007acc',
            fontSize: '10px',
            cursor: 'pointer',
            textTransform: 'uppercase'
          }}
        >
          Temizle
        </button>
      </div>

      {/* Log Alanı */}
      <div
        ref={terminalRef}
        style={{
          flex: 1,
          padding: '15px',
          overflowY: 'auto',
          whiteSpace: 'pre-wrap',
          fontSize: '13px',
          lineHeight: '1.6',
          scrollBehavior: 'smooth'
        }}
      >
        {logs.length === 0 ? (
          <div style={{ color: '#444', fontStyle: 'italic' }}>
            Bekliyor... (Kodu çalıştırdığında çıktılar burada görünecek)
          </div>
        ) : (
          logs.map((log, index) => (
            <div
              key={index}
              style={{
                marginBottom: '4px',
                color: log.type === 'error' ? '#ff5555' :
                       log.type === 'success' ? '#50fa7b' :
                       log.type === 'system' ? '#8be9fd' :
                       log.type === 'input' ? '#bd93f9' : '#f8f8f2',
                borderLeft: log.type === 'error' ? '2px solid #ff5555' : 'none',
                paddingLeft: log.type === 'error' ? '8px' : '0'
              }}
            >
              {log.text}
            </div>
          ))
        )}
      </div>

      {/* Komut Giriş Alanı */}
      <div style={{ 
        padding: '10px 12px', 
        background: '#1a1a1a', 
        borderTop: '1px solid #333',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        <span style={{ color: '#50fa7b' }}>$</span>
        <input
          type="text"
          placeholder="Komut yaz..."
          onKeyDown={handleCommand}
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: '#f8f8f2',
            fontFamily: 'inherit',
            fontSize: '13px'
          }}
        />
      </div>
    </div>
  );
}
