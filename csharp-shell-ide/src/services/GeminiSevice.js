// src/services/GeminiService.js
export class GeminiService {
  constructor({ apiKey } = {}) {
    this.apiKey = apiKey || import.meta.env.VITE_GEMINI_API_KEY;
    this.mock = !this.apiKey;
  }

  async ask(prompt, systemPrompt = '') {
    if (this.mock) {
      await new Promise(r => setTimeout(r, 800));
      return `[Gemini Mock] ${prompt.substring(0, 60)}... için yanıt`;
    }

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            systemInstruction: systemPrompt ? { parts: [{ text: systemPrompt }] } : undefined,
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 2048,
            }
          })
        }
      );

      if (!response.ok) throw new Error(`Gemini HTTP ${response.status}`);
      
      const data = await response.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || "Yanıt boş döndü.";
    } catch (error) {
      console.error(error);
      throw new Error('Gemini API hatası: ' + error.message);
    }
  }

  async askJson(prompt, systemPrompt = '') {
    const text = await this.ask(prompt, systemPrompt + "\nCevabını sadece geçerli JSON olarak ver.");
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/) || text.match(/\[[\s\S]*\]/);
      return jsonMatch ? JSON.parse(jsonMatch[0]) : {};
    } catch {
      return {};
    }
  }
}
