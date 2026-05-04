/**
 * AgentPanel.jsx - Multi-Agent Workflow System
 * Gemini 1.5 Flash ile çalışan profesyonel ajan paneli
 */

import { useState, useCallback } from 'react';

export function AgentPanel({ claude, loading, onOutput }) {
  const [agents, setAgents] = useState([
    { 
      id: 1,
      name: 'Analyzer', 
      instructions: 'C# kodunu detaylı analiz et, hataları, iyileştirme fırsatlarını ve best practice önerilerini listele.',
      color: '#C586C0'
    },
    { 
      id: 2,
      name: 'Optimizer', 
      instructions: 'Kodu performans, okunabilirlik ve modern C# pratikleri açısından optimize et. Daha temiz ve verimli versiyon üret.',
      color: '#4EC9B0'
    }
  ]);

  const [workflowType, setWorkflowType] = useState('sequential');
  const [userInput, setUserInput] = useState('Bu kodu analiz et ve optimize önerilerde bulun.');
  const [running, setRunning] = useState(false);

  const addAgent = () => {
    const newAgent = {
      id: Date.now(),
      name: `Agent${agents.length + 1}`,
      instructions: 'Yeni ajanın görevini buraya yazın...',
      color: '#FFCC66'
    };
    setAgents(prev => [...prev, newAgent]);
  };

  const updateAgent = (id, updates) => {
    setAgents(prev => prev.map(agent => 
      agent.id === id ? { ...agent, ...updates } : agent
    ));
  };

  const removeAgent = (id) => {
    setAgents(prev => prev.filter(agent => agent.id !== id));
  };

  const runWorkflow = useCallback(async () => {
    if (agents.length === 0 || running) return;

    setRunning(true);
    const lines = [{ type: 'cmd', text: `🚀 \( {workflowType.toUpperCase()} Workflow başlatıldı ( \){agents.length} ajan)` }];

    let context = userInput;

    for (let i = 0; i < agents.length; i++) {
      const agent = agents[i];
      
      lines.push({ 
        type: 'info', 
        text: `\n🤖 [${agent.name}] çalışıyor...` 
      });

      try {
        const prompt = `
Sen "${agent.name}" adlı uzman bir AI ajansın.
Görev: ${agent.instructions}

Mevcut bağlam:
${context}

Kısa, net ve profesyonel Türkçe yanıt ver.
`;

        const response = await claude.ask(prompt, 
          "Sen Microsoft Agent Framework ile çalışan profesyonel bir C# AI ajansısın. Teknik ve net ol."
        );

        context = response;
        
        response.split('\n').forEach(line => {
          if (line.trim()) {
            lines.push({ type: 'ai', text: `  ${agent.name}: ${line}` });
          }
        });

      } catch (err) {
        lines.push({ 
          type: 'error', 
          text: `  ${agent.name} hatası: ${err.message || 'Bilinmeyen hata'}` 
        });
        break;
      }
    }

    lines.push({ type: 'system', text: '\n✅ Workflow başarıyla tamamlandı.' });
    onOutput(lines);
    setRunning(false);
  }, [agents, workflowType, userInput, claude, onOutput]);

  const workflowTypes = [
    { id: 'sequential', label: '→ Sıralı', color: '#007ACC' },
    { id: 'parallel',   label: '⇉ Paralel', color: '#4EC9B0' },
  ];

  return (
    <div style={{ padding: '16px', height: '100%', overflow: 'auto', fontFamily: "'JetBrains Mono', monospace" }}>
      
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ margin: '0 0 8px 0', color: '#fff' }}>🤖 Multi-Agent System</h2>
        <p style={{ color: '#888', fontSize: '13px', margin: 0 }}>
          Gemini ile çalışan akıllı ajan orkestrasyonu
        </p>
      </div>

      {/* Workflow Type */}
      <div style={{ marginBottom: '16px' }}>
        <p style={{ fontSize: '12px', color: '#aaa', marginBottom: '8px' }}>WORKFLOW TİPİ</p>
        <div style={{ display: 'flex', gap: '8px' }}>
          {workflowTypes.map(type => (
            <button
              key={type.id}
              onClick={() => setWorkflowType(type.id)}
              style={{
                padding: '8px 16px',
                border: `2px solid ${workflowType === type.id ? type.color : '#444'}`,
                background: workflowType === type.id ? '#1e1e1e' : 'transparent',
                color: workflowType === type.id ? '#fff' : '#aaa',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '13px'
              }}
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>

      {/* Agents List */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <p style={{ fontSize: '12px', color: '#aaa' }}>AJANLAR ({agents.length})</p>
          <button onClick={addAgent} style={{
            padding: '6px 12px',
            background: '#2d2d2d',
            border: '1px solid #4EC9B0',
            color: '#4EC9B0',
            borderRadius: '4px',
            cursor: 'pointer'
          }}>
            + Yeni Ajan
          </button>
        </div>

        {agents.map((agent, index) => (
          <div key={agent.id} style={{
            background: '#252526',
            border: '1px solid #3c3c3c',
            borderRadius: '8px',
            padding: '12px',
            marginBottom: '10px'
          }}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ color: agent.color, fontWeight: 'bold' }}>#{index + 1}</span>
              <input
                value={agent.name}
                onChange={(e) => updateAgent(agent.id, { name: e.target.value })}
                style={{ flex: 1, background: '#1e1e1e', border: '1px solid #444', color: '#fff', padding: '6px', borderRadius: '4px' }}
              />
              <button onClick={() => removeAgent(agent.id)} style={{ color: '#f44747', background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer' }}>
                ✕
              </button>
            </div>

            <textarea
              value={agent.instructions}
              onChange={(e) => updateAgent(agent.id, { instructions: e.target.value })}
              placeholder="Bu ajanın görevi nedir?"
              rows={3}
              style={{
                width: '100%',
                background: '#1e1e1e',
                border: '1px solid #444',
                color: '#d4d4d4',
                padding: '8px',
                borderRadius: '4px',
                resize: 'vertical'
              }}
            />
          </div>
        ))}
      </div>

      {/* User Input */}
      <div style={{ marginBottom: '16px' }}>
        <p style={{ fontSize: '12px', color: '#aaa', marginBottom: '6px' }}>İŞLEM GİRDİSİ</p>
        <textarea
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          rows={3}
          style={{
            width: '100%',
            background: '#1e1e1e',
            border: '1px solid #444',
            color: '#fff',
            padding: '10px',
            borderRadius: '6px',
            resize: 'vertical'
          }}
        />
      </div>

      {/* Run Button */}
      <button
        onClick={runWorkflow}
        disabled={running || loading || agents.length === 0}
        style={{
          width: '100%',
          padding: '12px',
          background: running ? '#555' : '#007ACC',
          color: '#fff',
          border: 'none',
          borderRadius: '6px',
          fontSize: '14px',
          fontWeight: 'bold',
          cursor: running ? 'not-allowed' : 'pointer',
          marginBottom: '20px'
        }}
      >
        {running ? '● Ajanlar Çalışıyor...' : '▶ Workflow\'u Başlat'}
      </button>
    </div>
  );
}
