// src/services/GeminiService.js
export class GeminiService {
  constructor({ apiKey } = {}) {
    this.apiKey = apiKey || import.meta.env.VITE_GEMINI_API_KEY;
  }

  async ask(prompt, systemPrompt = '') {
    if (!this.apiKey) return "API Anahtarı bulunamadı. Lütfen ayarları kontrol edin.";

    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ 
            role: "user",
            parts: [{ text: `${systemPrompt ? systemPrompt + "\n\n" : ""} Soru: ${prompt}` }] 
          }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 2048 }
        })
      });
      
      const data = await res.json();
      if (data.error) throw new Error(data.error.message);
      return data.candidates?.[0]?.content?.parts?.[0]?.text || 'Yanıt alınamadı.';
    } catch (err) {
      console.error("Gemini Hatası:", err);
      return `Hata: ${err.message}`;
    }
  }

  async askJson(prompt, systemPrompt = '') {
    const text = await this.ask(prompt + " (Lütfen sadece JSON formatında yanıt ver)", systemPrompt);
    try {
      const match = text.match(/\[[\s\S]*\]/);
      return match ? JSON.parse(match[0]) : [];
    } catch { return []; }
  }
}
