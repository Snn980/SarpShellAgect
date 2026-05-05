// src/App.jsx
import React, { useState, useCallback } from 'react';

import {
  CodeEditor,
  Terminal,
  AgentPanel,
  GitPanel,
  ImportManager,
  NuGetManager,
  Settings
} from './modules';

import { useAppServices } from './hooks';
import { useFileState } from './hooks';

export default function App() {
  const services = useAppServices();

  const {
    files,
    activeFile,
    updateFileContent,
  } = useFileState(services);

  // ====================== STATE ======================
  const [activeTab, setActiveTab] = useState('editor');
  const [showSettings, setShowSettings] = useState(false);
  const [isRunning, setIsRunning] = useState(false);

  const [settings, setSettings] = useState({
    theme: 'dark',
    fontSize: 15,
    tabSize: 4,
    lineNumbers: true,
    wordWrap: true,
    autoSave: true,
  });

  // ====================== ÖRNEK C# DOSYALARI ======================
  const exampleFiles = {
    'Program.cs': `using System;

class Program {
    static void Main() {
        Console.WriteLine("Merhaba Dünya! SarpShellAgect Çalışıyor 🚀");
        Console.WriteLine("Tarih: " + DateTime.Now);
    }
}`,

    'HttpExample.cs': `using System;
using System.Net.Http;
using System.Threading.Tasks;

class Program {
    static async Task Main() {
        using var client = new HttpClient();
        var response = await client.GetAsync("https://httpbin.org/get");
        Console.WriteLine("Status: " + response.StatusCode);
        string content = await response.Content.ReadAsStringAsync();
        Console.WriteLine(content);
    }
}`
  };

  const currentFile = activeFile || { 
    id: 'main', 
    name: 'Program.cs', 
    content: exampleFiles['Program.cs'] 
  };

  const currentCode = currentFile.content;

  // ====================== HELPER ======================
  const addLog = useCallback((text, type = 'output') => {
    services.terminal?.addLog?.(text, type);
  }, [service]);
   // App.jsx içindeki runCode fonksiyonu
const runCode = async () => {
  // activeFile kontrolü
  const currentCode = activeFile?.content || "";
  if (!currentCode.trim() || isRunning) return;

  setIsRunning(true);
  addLog("⏳ Piston API derleniyor...", "system");
  setActiveTab('terminal'); 

  try {
    // BURASI KRİTİK: useAppServices'deki isimle aynı olmalı
    const result = await services.piston.execute(currentCode); 
    
    if (result && result.success) {
      addLog(result.output || "Program başarıyla çalıştı.", "success");
    } else {
      addLog(result?.error || "Bilinmeyen bir hata oluştu.", "error");
    }
  } catch (err) {
    // Görseldeki kırmızı hatayı yakalayan yer burası
    addLog(`❌ Bağlantı Hatası: ${err.message}`, "error");
  } finally {
    setIsRunning(false);
  }
};


  // ====================== RENDER ======================
  const renderContent = () => {
    switch (activeTab) {
      case 'editor':
        return (
          <CodeEditor
            code={currentCode}
            onChange={(newCode) => updateFileContent(currentFile.id, newCode)}
            settings={settings}
            isMobile={true}
            onRun={runCode}
            isRunning={isRunning}
            exampleFiles={exampleFiles}
            currentFileName={currentFile.name}
          />
        );

      case 'terminal':
        return <Terminal services={services} />;

      case 'agent':
  return (
    <AgentPanel 
      ai={services.ai}          // Servis ismi 'ai'
      currentCode={activeFile?.content || ""} 
      onOutput={addLog}         // App.jsx'teki addLog fonksiyonun
    />
  );


      case 'git':
        return <GitPanel services={services} currentFile={currentFile} />;

      case 'nuget':
        return <NuGetManager services={services.nuget} />;

      case 'imports':
        return <ImportManager code={currentCode} onChange={(c) => updateFileContent(currentFile.id, c)} />;

      default:
        return <div style={{ padding: 30 }}>Henüz geliştirilmedi.</div>;
    }
  };

  return (
    <div className="app-container">
      <header className="tab-bar">
        <div className="logo">⚡ SarpShellAgect</div>
        
        <div className="tabs" style={{ overflowX: 'auto', whiteSpace: 'nowrap' }}>
          {[
            { id: 'editor', label: '📝 Editör' },
            { id: 'terminal', label: '💻 Terminal' },
            { id: 'agent', label: '🤖 Agent' },
            { id: 'git', label: '🔀 Git' },
            { id: 'nuget', label: '📦 NuGet' },
            { id: 'imports', label: '🔗 Import' }
          ].map(tab => (
            <button
              key={tab.id}
              className={activeTab === tab.id ? 'active' : ''}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <button onClick={() => setShowSettings(true)} className="settings-btn">⚙️</button>
      </header>

      <main className="main-content">
        {renderContent()}
      </main>

      {showSettings && (
        <Settings
          settings={settings}
          onChange={setSettings}
          onClose={() => setShowSettings(false)}
        />
      )}

      <footer className="status-bar">
        <span>{currentFile.name} • C#</span>
        <span>Ready</span>
      </footer>
    </div>
  );
}
