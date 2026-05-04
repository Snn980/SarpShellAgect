// src/services/GeminiService.js
export class GeminiService {
  constructor({ apiKey, mock = false } = {}) {
    this.apiKey = apiKey || import.meta.env.VITE_GEMINI_API_KEY;
    this.mock = mock || !this.apiKey;
  }

  // AgentPanel.jsx -> claude.ask(prompt, systemPrompt) bekler
  async ask(prompt, systemPrompt = '') {
    if (this.mock) {
      await new Promise(r => setTimeout(r, 500));
      return `[Mock AI] ${prompt} için simüle edilmiş yanıt.`;
    }

    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          ...(systemPrompt ? { systemInstruction: { parts: [{ text: systemPrompt }] } } : {})
        })
      });
      if (!res.ok) throw new Error(`Gemini ${res.status}`);
      const data = await res.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || 'Yanıt alınamadı.';
    } catch {
      throw new Error('AI bağlantı hatası');
    }
  }

  // NuGetManager.jsx -> claude.askJson(prompt, systemPrompt) bekler
  async askJson(prompt, systemPrompt = '') {
    const text = await this.ask(prompt, systemPrompt);
    try {
      const match = text.match(/\[[\s\S]*\]/);
      return match ? JSON.parse(match[0]) : [];
    } catch {
      return [];
    }
  }
}
