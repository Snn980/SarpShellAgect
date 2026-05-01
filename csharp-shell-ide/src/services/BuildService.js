/**
 * @file BuildService.js
 * Kodu gerçek .NET runtime veya Claude simülasyonu ile çalıştırır.
 * Bağımlılık: ClaudeService (constructor injection), LintService
 */

/** @typedef {import('../types/index.js').LintError}  LintError  */
/** @typedef {import('../types/index.js').OutputLine} OutputLine */

const DOTNET_FIDDLE_URL = 'https://dotnetfiddle.net/api/Compiler/Run';

/**
 * @typedef {Object} BuildResult
 * @property {string[]}    lines
 * @property {LintError[]} errors
 * @property {boolean}     success
 * @property {'real'|'simulated'} source
 */

export class BuildService {
  /** @type {import('./ClaudeService.js').ClaudeService} */
  #claude;
  /** @type {import('./LintService.js').LintService} */
  #lint;

  /**
   * @param {import('./ClaudeService.js').ClaudeService} claude
   * @param {import('./LintService.js').LintService}     lint
   */
  constructor(claude, lint) {
    this.#claude = claude;
    this.#lint   = lint;
  }

  /**
   * Kodu önce DotNet Fiddle API ile dener,
   * başarısız olursa Claude simülasyonuna düşer.
   * @param {string} code
   * @returns {Promise<BuildResult>}
   */
  async run(code) {
    try {
      return await this.#runReal(code);
    } catch {
      return this.#runSimulated(code);
    }
  }

  /**
   * DotNet Fiddle API — gerçek .NET 9 çalıştırma.
   * @param {string} code
   * @returns {Promise<BuildResult>}
   */
  async #runReal(code) {
    const response = await fetch(DOTNET_FIDDLE_URL, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        Compiler:       'Net90',
        Language:       'CSharp',
        ProjectType:    'Console',
        Program:        code,
        UseResultCache: false,
      }),
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = await response.json();

    if (data.CompilerOutput) {
      const errors = this.#lint.parseRoslynOutput(data.CompilerOutput);
      return { lines: [], errors, success: false, source: 'real' };
    }

    const lines = (data.ConsoleOutput ?? '').split('\n');
    return { lines, errors: [], success: true, source: 'real' };
  }

  /**
   * Claude simülasyonu — offline veya API hatası durumunda.
   * @param {string} code
   * @returns {Promise<BuildResult>}
   */
  async #runSimulated(code) {
    const raw = await this.#claude.ask(
      `Bu C# kodunu çalıştır ve YALNIZCA konsol çıktısını ver:\n\`\`\`csharp\n${code}\n\`\`\``,
      'C# .NET runtime simülatörüsün. Sadece konsol çıktısını döndür, açıklama ekleme.',
    );
    return {
      lines:   raw.split('\n'),
      errors:  [],
      success: true,
      source:  'simulated',
    };
  }
}
