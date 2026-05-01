/**
 * @file AgentPanel.jsx
 * Microsoft Agent Framework 1.2 — Agent tasarımcısı ve simülatörü.
 * Gerçek MAF SDK olmadan Claude API ile davranışı simüle eder.
 */

import { useState } from 'react';

/** @typedef {import('../../services/ClaudeService.js').ClaudeService} ClaudeService */

/**
 * @typedef {'sequential'|'parallel'|'hitl'} WorkflowType
 *
 * @typedef {Object} AgentConfig
 * @property {string} name
 * @property {string} instructions
 * @property {string[]} tools
 *
 * @typedef {Object} AgentPanelProps
 * @property {ClaudeService}   claude
 * @property {boolean}         loading
 * @property {(lines:import('../../types/index.js').OutputLine[])=>void} onOutput
 */

const TOOL_OPTIONS = ['web_search', 'file_read', 'code_exec', 'mcp_client', 'a2a_bridge'];

const WORKFLOW_TEMPLATES = /** @type {Record<WorkflowType, string>} */ ({
  sequential: `// MAF 1.2 — Sıralı Workflow
var workflow = new SequentialWorkflow()
    .AddStep(new AIAgent(client, name: "Analyzer",  instructions: "Kodu analiz et."))
    .AddStep(new AIAgent(client, name: "Optimizer", instructions: "Optimize öner."))
    .AddStep(new AIAgent(client, name: "Reviewer",  instructions: "Güvenlik incele."));

string result = await workflow.RunAsync(userInput);`,

  parallel: `// MAF 1.2 — Paralel Workflow (fan-out / fan-in)
var workflow = new ParallelWorkflow()
    .AddBranch(new AIAgent(client, name: "SecurityReviewer", instructions: "Güvenlik açıklarını bul."))
    .AddBranch(new AIAgent(client, name: "PerfAnalyzer",    instructions: "Performans sorunlarını bul."))
    .AddBranch(new AIAgent(client, name: "DocGenerator",    instructions: "Dokümantasyon yaz."))
    .WithAggregator(new AIAgent(client, name: "Summarizer", instructions: "Sonuçları birleştir."));

string result = await workflow.RunAsync(userInput);`,

  hitl: `// MAF 1.2 — Human-in-the-Loop Workflow
var workflow = new SequentialWorkflow()
    .AddStep(new AIAgent(client, name: "Drafter", instructions: "Taslak oluştur."))
    .AddStep(new HumanApprovalStep(
        prompt: "Taslağı onaylıyor musunuz?",
        onApprove: async (ctx) => Console.WriteLine("Onaylandı."),
        onReject:  async (ctx) => Console.WriteLine("Reddedildi.")
    ))
    .AddStep(new AIAgent(client, name: "Finalizer", instructions: "Onaylanan taslağı tamamla."));

string result = await workflow.RunAsync(userInput);`,
});

/** @param {AgentPanelProps} props */
export function AgentPanel({ claude, loading, onOutput }) {
  const [agents, setAgents]       = useState(/** @type {AgentConfig[]} */ ([
    { name: 'Analyzer',  instructions: 'C# kodunu analiz et, hataları ve iyileştirme fırsatlarını listele.', tools: [] },
    { name: 'Optimizer', instructions: 'Analiz sonuçlarına göre optimize edilmiş C# kodu üret.',             tools: ['code_exec'] },
  ]));
  const [workflowType, setType]   = useState(/** @type {WorkflowType} */ ('sequential'));
  const [userInput,    setInput]  = useState('Merhaba, C# kodumu analiz et.');
  const [running,      setRunning]= useState(false);

  const addAgent = () => {
    setAgents((prev) => [
      ...prev,
      { name: `Agent${prev.length + 1}`, instructions: '', tools: [] },
    ]);
  };

  /** @param {number} idx @param {Partial<AgentConfig>} patch */
  const updateAgent = (idx, patch) => {
    setAgents((prev) =>
      prev.map((a, i) => (i === idx ? { ...a, ...patch } : a)),
    );
  };

  /** @param {number} idx */
  const removeAgent = (idx) => {
    setAgents((prev) => prev.filter((_, i) => i !== idx));
  };

  const runWorkflow = async () => {
    if (agents.length === 0 || running) return;
    setRunning(true);

    /** @type {import('../../types/index.js').OutputLine[]} */
    const lines = [
      { type: 'cmd',    text: `> MAF Workflow başlatıldı (${workflowType})` },
      { type: 'system', text: `Ajan sayısı: ${agents.length}` },
    ];

    let context = userInput;

    for (let i = 0; i < agents.length; i++) {
      const agent = agents[i];
      lines.push({ type: 'info', text: `\n[${agent.name}] çalışıyor…` });

      try {
        const response = await claude.ask(
          `Sen "${agent.name}" adlı bir AI ajanısın.\nGörevin: ${agent.instructions}\n\nGiriş:\n${context}`,
          'MAF ajan simülatörüsün. Verilen role göre kısa, odaklı Türkçe yanıt ver.',
        );
        context = response;
        response.split('\n').filter(Boolean).forEach((l) => {
          lines.push({ type: 'ai', text: `  ${agent.name}: ${l}` });
        });
      } catch (err) {
        lines.push({ type: 'error', text: `  ${agent.name} hatası: ${String(err)}` });
        break;
      }
    }

    lines.push({ type: 'system', text: '\n─── Workflow tamamlandı ───' });
    onOutput(lines);
    setRunning(false);
  };

  const MONO = "'JetBrains Mono','Fira Code',monospace";

  const isLoading = loading || running;

  return (
    <div style={{ padding: '14px', overflow: 'auto', height: '100%', fontFamily: MONO }}>

      {/* Başlık */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
        <span style={{ fontSize: '16px' }}>🤖</span>
        <span style={{ fontSize: '13px', color: '#D4D4D4' }}>Microsoft Agent Framework 1.2</span>
      </div>

      {/* Workflow tipi */}
      <div style={{ marginBottom: '12px' }}>
        <p style={{ fontSize: '11px', color: '#858585', marginBottom: '6px' }}>Workflow Tipi</p>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {/** @type {Array<{id:WorkflowType, label:string}>} */ ([
            { id: 'sequential', label: '→ Sıralı'  },
            { id: 'parallel',   label: '⇉ Paralel' },
            { id: 'hitl',       label: '👤 HITL'    },
          ]).map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setType(id)}
              style={{
                background:   workflowType === id ? '#007ACC' : 'transparent',
                border:       `1px solid ${workflowType === id ? '#007ACC' : '#474747'}`,
                color:        workflowType === id ? '#fff' : '#858585',
                borderRadius: '4px',
                padding:      '4px 12px',
                fontSize:     '12px',
                cursor:       'pointer',
                fontFamily:   MONO,
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Ajan listesi */}
      <div style={{ marginBottom: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <p style={{ fontSize: '11px', color: '#858585' }}>AJANLAR ({agents.length})</p>
          <button onClick={addAgent} style={outlineBtn('#4EC9B0')}>+ Ajan Ekle</button>
        </div>

        {agents.map((agent, idx) => (
          <div key={idx} style={{
            background: '#252526', border: '1px solid #3C3C3C',
            borderRadius: '6px', padding: '10px', marginBottom: '8px',
          }}>
            <div style={{ display: 'flex', gap: '6px', marginBottom: '6px', alignItems: 'center' }}>
              <span style={{ color: '#C586C0', fontSize: '12px', minWidth: '20px' }}>#{idx + 1}</span>
              <input
                value={agent.name}
                onChange={(e) => updateAgent(idx, { name: e.target.value })}
                style={inputStyle}
                placeholder="Ajan adı"
              />
              <button onClick={() => removeAgent(idx)} style={{
                background: 'transparent', border: 'none',
                color: '#F44747', cursor: 'pointer', fontSize: '16px', flexShrink: 0,
              }}>×</button>
            </div>
            <textarea
              value={agent.instructions}
              onChange={(e) => updateAgent(idx, { instructions: e.target.value })}
              rows={2}
              placeholder="Görev / instructions…"
              style={{ ...inputStyle, resize: 'vertical', width: '100%' }}
            />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '6px' }}>
              {TOOL_OPTIONS.map((tool) => {
                const active = agent.tools.includes(tool);
                return (
                  <button
                    key={tool}
                    onClick={() => updateAgent(idx, {
                      tools: active
                        ? agent.tools.filter((t) => t !== tool)
                        : [...agent.tools, tool],
                    })}
                    style={{
                      background:   active ? '#1a3a1a' : 'transparent',
                      border:       `1px solid ${active ? '#4CAF50' : '#474747'}`,
                      color:        active ? '#4CAF50' : '#555',
                      borderRadius: '10px',
                      padding:      '2px 8px',
                      fontSize:     '10px',
                      cursor:       'pointer',
                      fontFamily:   MONO,
                    }}
                  >
                    {tool}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Giriş */}
      <div style={{ marginBottom: '10px' }}>
        <p style={{ fontSize: '11px', color: '#858585', marginBottom: '6px' }}>Workflow Girdisi</p>
        <textarea
          value={userInput}
          onChange={(e) => setInput(e.target.value)}
          rows={3}
          style={{ ...inputStyle, width: '100%', resize: 'vertical' }}
        />
      </div>

      {/* Çalıştır */}
      <button
        onClick={runWorkflow}
        disabled={isLoading || agents.length === 0}
        style={{
          background:   isLoading ? '#555' : '#007ACC',
          border:       'none',
          color:        '#fff',
          borderRadius: '4px',
          padding:      '8px 18px',
          fontSize:     '13px',
          cursor:       isLoading ? 'not-allowed' : 'pointer',
          fontFamily:   MONO,
          width:        '100%',
          marginBottom: '14px',
        }}
      >
        {isLoading ? '● Çalışıyor…' : '▶ Workflow Çalıştır'}
      </button>

      {/* .NET kod şablonu */}
      <details>
        <summary style={{ fontSize: '11px', color: '#858585', cursor: 'pointer', marginBottom: '6px' }}>
          .NET Kod Şablonu ({workflowType})
        </summary>
        <pre style={{
          background: '#252526', border: '1px solid #3C3C3C',
          borderRadius: '4px', padding: '10px',
          fontSize: '11px', color: '#9CDCFE',
          overflow: 'auto', whiteSpace: 'pre-wrap',
        }}>
          {WORKFLOW_TEMPLATES[workflowType]}
        </pre>
      </details>
    </div>
  );
}

/** @param {string} color @returns {import('react').CSSProperties} */
function outlineBtn(color) {
  return {
    background: 'transparent', border: `1px solid ${color}`, color,
    borderRadius: '4px', padding: '3px 10px', fontSize: '11px',
    cursor: 'pointer', fontFamily: "'JetBrains Mono','Fira Code',monospace",
  };
}

/** @type {import('react').CSSProperties} */
const inputStyle = {
  background: '#3C3C3C', border: '1px solid #474747',
  borderRadius: '4px', color: '#D4D4D4',
  padding: '5px 8px', fontSize: '12px',
  fontFamily: "'JetBrains Mono','Fira Code',monospace",
  outline: 'none',
};
