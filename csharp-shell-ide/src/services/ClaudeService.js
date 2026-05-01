/**
 * @file ClaudeService.js
 * Claude Anthropic API ile iletişim kuran servis sınıfı.
 * Global singleton YOKTUR — her kullanım yerinde new ClaudeService(config) ile örneklenir.
 */

/** @typedef {import('../types/index.js').ClaudeConfig}  ClaudeConfig  */
/** @typedef {import('../types/index.js').ApiMessage}    ApiMessage    */

const API_URL = 'https://api.anthropic.com/v1/messages';

export class ClaudeService {
  /** @type {string}  */ #model;
  /** @type {number}  */ #maxTokens;
  /** @type {string}  */ #defaultSystem;

  /**
   * @param {ClaudeConfig} config
   */
  constructor(config) {
    this.#model         = config.model;
    this.#maxTokens     = config.maxTokens;
    this.#defaultSystem = config.systemPrompt ?? '';
  }

  /**
   * Modeli değiştirir (yeni instance oluşturmadan).
   * @param {string} model
   * @returns {ClaudeService}
   */
  withModel(model) {
    return new ClaudeService({
      model,
      maxTokens:    this.#maxTokens,
      systemPrompt: this.#defaultSystem,
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

    const response = await fetch(API_URL, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        model:      this.#model,
        max_tokens: this.#maxTokens,
        system,
        messages,
      }),
    });

    const data = await response.json();
    if (data.error) throw new Error(data.error.message);

    return data.content
      .map((/** @type {{type:string, text?:string}} */ c) => c.text ?? '')
      .join('');
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
