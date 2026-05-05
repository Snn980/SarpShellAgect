// src/modules/Terminal/Terminal.jsx
import React, { useRef, useEffect } from 'react';

export function Terminal({ services }) {
  const terminalRef = useRef(null);
  const logs = services?.logs || services?.getLogs?.() || [];

  useEffect(() => {
    // Otomatik scroll aşağı
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [logs]);

  const handleCommand = (e) => {
    if (e.key === 'Enter' && e.target.value.trim()) {
      const cmd = e.target.value.trim();
      services?.terminal?.addLog?.(`> ${cmd}`, 'input');
      
      // Basit komut işleme
      if (cmd.toLowerCase() === 'clear') {
        services?.terminal?.clearLogs?.();
      } else if (cmd.toLowerCase() === 'help') {
        services?.terminal?.addLog('Mevcut komutlar: clear, help, run', 'system');
      } else {
        services?.terminal?.addLog(`Komut tanınmadı: ${cmd}`, 'error');
      }
      
      e.target.value = '';
    }
  };

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: '#1e1e1e',
      color: '#d4d4d4',
      fontFamily: 'monospace',
      overflow: 'hidden'
    }}>
      {/* Terminal Header */}
      <div style={{
        padding: '8px 12px',
        background: '#252526',
        borderBottom: '1px solid #3c3c3c',
        fontSize: '0.9rem'
      }}>
        ⚡ SarpShell Terminal
      </div>

      {/* Log Alanı */}
      <div
        ref={terminalRef}
        style={{
          flex: 1,
          padding: '12px',
          overflowY: 'auto',
          background: '#0d0d0d',
          whiteSpace: 'pre-wrap',
          fontSize: '14px',
          lineHeight: '1.5'
        }}
      >
        {logs.length === 0 ? (
          <div style={{ color: '#666' }}>
            Terminal başlatıldı.<br />
            Komut yazıp Enter'a basın (help yazmayı deneyin)...
          </div>
        ) : (
          logs.map((log, index) => (
            <div
              key={index}
              style={{
                color: log.type === 'error' ? '#ff5555' :
                       log.type === 'input' ? '#00ddff' :
                       log.type === 'system' ? '#ffcc00' : '#d4d4d4'
              }}
            >
              {log.text}
            </div>
          ))
        )}
      </div>

      {/* Komut Giriş Alanı */}
      <div style={{ padding: '8px 12px', background: '#252526', borderTop: '1px solid #3c3c3c' }}>
        <input
          type="text"
          placeholder="Komut girin... (help)"
          onKeyDown={handleCommand}
          style={{
            width: '100%',
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: '#d4d4d4',
            fontFamily: 'monospace',
            fontSize: '14px'
          }}
        />
      </div>
    </div>
  );
}
