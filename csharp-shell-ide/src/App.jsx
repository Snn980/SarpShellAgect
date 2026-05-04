import React, { useState, useCallback } from 'react';

export default function App() {
  const [code, setCode] = useState(`using System;

class Program
{
    static void Main()
    {
        Console.WriteLine("Merhaba Dünya! 👋");
        Console.WriteLine("SarpShellAgect çalışıyor.");

        // Hata testi için bu satırı aç:
        // TestHata();
    }

    static void TestHata()
    {
        int x = 0;
        Console.WriteLine(10 / x);   // Division by zero hatası
    }
}`);

  const [logs, setLogs] = useState([
    { type: 'system', text: '🚀 SarpShellAgect v0.2 - Temiz Test Modu' },
    { type: 'system', text: 'Piston ve Gemini hazır olduğunda gerçek çalıştırılacak.' }
  ]);

  const [loading, setLoading] = useState(false);

  const addLog = (text, type = 'output') => {
    setLogs(prev => [...prev, { text, type }]);
  };

  // ====================== ÇALIŞTIR ======================
  const runCode = async () => {
    setLoading(true);
    addLog('> Derleniyor...', 'cmd');

    // Gerçek Piston servisi varsa kullan, yoksa simüle et
    setTimeout(() => {
      if (code.includes("TestHata")) {
        addLog('❌ Hata: Division by zero', 'error');
      } else {
        addLog('Merhaba Dünya! 👋', 'output');
        addLog('Program başarıyla tamamlandı.', 'system');
      }
      setLoading(false);
    }, 700);
  };

  // ====================== GEMINI AI ======================
  const askAI = async () => {
    const question = prompt("Gemini'ye ne sormak istiyorsun?");
    if (!question) return;

    addLog(`👤 ${question}`, 'user');
    setLoading(true);

    setTimeout(() => {
      addLog("🤖 Bu kod genel olarak iyi görünüyor. Main metodu düzgün tanımlanmış.", 'ai');
      setLoading(false);
    }, 900);
  };

  return (
    <div style={{
      height: '100dvh',
      display: 'flex',
      flexDirection: 'column',
      background: '#1e1e1e',
      color: '#ffffff',
      overflow: 'hidden'
    }}>

      {/* HEADER */}
      <div style={{
        padding: '12px 16px',
        background: '#252526',
        borderBottom: '2px solid #007acc',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        flexShrink: 0
      }}>
        <h1 style={{ margin: 0, fontSize: '18px' }}>⚡ SarpShell</h1>

        <button 
          onClick={runCode}
          disabled={loading}
          style={{
            padding: '9px 24px',
            background: loading ? '#555' : '#007acc',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            fontWeight: 'bold',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '15px'
          }}
        >
          {loading ? '⏳ Çalışıyor...' : '▶ Çalıştır'}
        </button>

        <button 
          onClick={askAI}
          style={{
            padding: '9px 18px',
            background: 'transparent',
            border: '1px solid #4EC9B0',
            color: '#4EC9B0',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          🤖 AI Sor
        </button>
      </div>

      {/* CODE EDITOR */}
      <div style={{ flex: 1, padding: '15px', background: '#1e1e1e', overflow: 'hidden' }}>
        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          spellCheck={false}
          style={{
            width: '100%',
            height: '100%',
            background: '#1e1e1e',
            color: '#d4d4d4',
            border: '1px solid #3c3c3c',
            borderRadius: '6px',
            padding: '15px',
            fontFamily: 'Consolas, "Courier New", monospace',
            fontSize: '15px',
            lineHeight: '1.5',
            resize: 'none',
            outline: 'none',
            overflow: 'auto'
          }}
        />
      </div>

      {/* TERMINAL */}
      <div style={{
        height: '38%',
        background: '#0d0d0d',
        borderTop: '3px solid #007acc',
        overflow: 'auto',
        padding: '12px',
        fontFamily: 'Consolas, monospace',
        fontSize: '14px'
      }}>
        {logs.map((log, index) => (
          <div
            key={index}
            style={{
              marginBottom: '6px',
              color: log.type === 'error' ? '#f44747' :
                     log.type === 'ai' ? '#4ec9b0' :
                     log.type === 'cmd' ? '#dcdcaa' : '#d4d4d4'
            }}
          >
            {log.text}
          </div>
        ))}
      </div>
    </div>
  );
}
