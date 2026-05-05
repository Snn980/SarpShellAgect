import { useState, useCallback } from 'react';

// App.jsx içinden 'services.ai' olarak geldiği için 'claude' yerine 'ai' kullanıyoruz
export function AgentPanel({ ai, loading, onOutput, currentCode }) {
  const [agents, setAgents] = useState([
    { 
      id: 1,
      name: 'Analyzer', 
      instructions: 'C# kodunu detaylı analiz et, hataları listele.',
      color: '#C586C0'
    },
    { 
      id: 2,
      name: 'Optimizer', 
      instructions: 'Kodu performans açısından optimize et.',
      color: '#4EC9B0'
    }
  ]);

  const [workflowType, setWorkflowType] = useState('sequential');
  const [userInput, setUserInput] = useState('Bu kodu analiz et ve optimize önerilerde bulun.');
  const [running, setRunning] = useState(false);

  // ... (addAgent, updateAgent, removeAgent fonksiyonların aynı kalabilir)

  const runWorkflow = useCallback(async () => {
    if (agents.length === 0 || running || !ai) return;

    setRunning(true);
    
    // Terminale başlangıç mesajı
    onOutput(`🚀 ${workflowType.toUpperCase()} Workflow başlatıldı.`, 'system');

    // Analiz edilecek ana bağlam: Kullanıcı İsteği + Editördeki Kod
    let context = `Kullanıcı Mesajı: ${userInput}\n\nKod:\n${currentCode}`;

    for (const agent of agents) {
      onOutput(`🤖 [${agent.name}] çalışıyor...`, 'info');

      try {
        const prompt = `
          Görevin: ${agent.instructions}
          Bağlam: ${context}
          Yanıtını Türkçe, teknik ve kısa tut.
        `;

        // ai.ask metodunu çağırıyoruz
        const response = await ai.ask(prompt, "Sen uzman bir C# AI ajansın.");

        // Çıktıyı terminale basıyoruz
        onOutput(`[${agent.name}]: ${response}`, 'ai');

        // Sıralı akışta bir sonraki ajan bu yanıtı görsün
        context = `Önceki Ajan (${agent.name}) Yanıtı: ${response}\n\nOrijinal Kod:\n${currentCode}`;

      } catch (err) {
        onOutput(`❌ ${agent.name} hatası: ${err.message}`, 'error');
        break;
      }
    }

    onOutput('✅ Workflow tamamlandı.', 'success');
    setRunning(false);
  }, [agents, workflowType, userInput, ai, onOutput, currentCode, running]);

  // UI kısmında buton disabled durumuna 'ai' kontrolünü de ekle
  return (
    <div style={{ padding: '16px', height: '100%', overflow: 'auto', background: '#1e1e1e' }}>
      {/* ... Senin UI Kodların ... */}
      <button
        onClick={runWorkflow}
        disabled={running || !ai || agents.length === 0}
        style={{
          width: '100%', padding: '12px', borderRadius: '6px', fontWeight: 'bold',
          background: running ? '#555' : '#007ACC', color: '#fff', cursor: 'pointer'
        }}
      >
        {running ? '● Ajanlar Çalışıyor...' : '▶ Workflow\'u Başlat'}
      </button>
    </div>
  );
}
