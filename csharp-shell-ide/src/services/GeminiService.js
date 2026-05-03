/**
 * @file GeminiService.js
 * Google Gemini API ile iletişim kuran servis sınıfı.
 * Global singleton YOKTUR — her kullanım yerinde new GeminiService(config) ile örneklenir.
 */

/** @typedef {import('../types/index.js').GeminiConfig}  GeminiConfig  */
/** @typedef {import('../types/index.js').ApiMessage}    ApiMessage    */

const API_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

export class GeminiService {
  /** @type {string}  */ #model;
  /** @type {number}  */ #maxTokens;
  /** @type {string}  */ #defaultSystem;
  /** @type {string}  */ #apiKey;

  /**
   * @param {GeminiConfig & { apiKey: string }} config
   */
  constructor(config) {
    this.#model         = config.model;
    this.#maxTokens     = config.maxTokens;
    this.#defaultSystem = config.systemPrompt ?? '';
    this.#apiKey        = config.apiKey; 
  }

  /**
   * Yeni bir instance oluşturarak modeli değiştirir.
   * (Orijinal koddaki yoruma istinaden: Metot yeni bir instance dönüyor, yorum güncellendi)
   * @param {string} model
   * @returns {GeminiService}
   */
  withModel(model) {
    return new GeminiService({
      model,
      maxTokens:    this.#maxTokens,
      systemPrompt: this.#defaultSystem,
      apiKey:       this.#apiKey,
    });
  }

  /**
   * Mesaj listesi ile API çağrısı yapar.
   * @param {ApiMessage[]} messages
   * @param {string}       [systemOverride]
   * @returns {Promise<string>}
   */
  async complete(messages, systemOverride) {
    const system = systemOverride ?? this.#defaultSystem;

    // Claude'un "assistant" rolünü Gemini'nin "model" rolüne çeviriyoruz
    const geminiContents = messages.map(msg => ({
      role: msg.role === 'assistant' ? 'model' : msg.role,
      parts: [{ text: msg.content }],
    }));

    const payload = {
      contents: geminiContents,
      generationConfig: {
        maxOutputTokens: this.#maxTokens,
      },
    };

    // System prompt, Gemini'de ayrı bir systemInstruction objesi olarak gönderilir
    if (system) {
      payload.systemInstruction = {
        parts: [{ text: system }],
      };
    }

    // Gemini API isteği model ismini URL'de, API key'i ise query parametresi olarak bekler
    const url = `${API_BASE_URL}/${this.#model}:generateContent?key=${this.#apiKey}`;

    const response = await fetch(url, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
    });

    const data = await response.json();
    
    if (data.error) throw new Error(data.error.message);

    // Gemini yanıt formatından içeriği güvenli bir şekilde çıkarma
    return data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  }

  /**
   * Tek kullanımlık kolaylık metodu.
   * @param {string} userContent
   * @param {string} [system]
   * @returns {Promise<string>}
   */
  async ask(userContent, system) {
    return this.complete([{ role: 'user', content: userContent }], system);
  }

  /**
   * JSON beklenen yanıtlar için — markdown fence'leri temizler ve parse eder.
   * @template T
   * @param {string} userContent
   * @param {string} system
   * @returns {Promise<T>}
   */
  async askJson(userContent, system) {
    const raw     = await this.ask(userContent, system);
    const cleaned = raw.replace(/```json|```/g, '').trim();
    return JSON.parse(cleaned);
  }
}
