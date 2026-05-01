/**
 * @file LintService.js
 * C# kaynak kodunu lint eden servis.
 * Bağımlılık: ClaudeService (constructor injection)
 */

/** @typedef {import('../types/index.js').LintError}     LintError     */
/** @typedef {import('../services/ClaudeService.js').ClaudeService} ClaudeService */

const LINT_SYSTEM =
  'C# linter asistanısın. ' +
  'Yalnızca JSON array döndür: ' +
  '[{"line":N,"col":N,"msg":"açıklama","severity":"error|warning|info"}]. ' +
  'Başka hiçbir şey yazma.';

const ROSLYN_PATTERN =
  /\((\d+),(\d+)\):\s+(error|warning)\s+\w+:\s+(.+)/g;

export class LintService {
  /** @type {ClaudeService} */
  #claude;

  /** @param {ClaudeService} claude */
  constructor(claude) {
    this.#claude = claude;
  }

  /**
   * Roslyn derleyici çıktısını parse eder.
   * @param {string} output
   * @returns {LintError[]}
   */
  parseRoslynOutput(output) {
    /** @type {LintError[]} */
    const errors = [];
    let match = ROSLYN_PATTERN.exec(output);

    while (match !== null) {
      errors.push({
        line:     parseInt(match[1], 10),
        col:      parseInt(match[2], 10),
        severity: /** @type {'error'|'warning'} */ (match[3]),
        msg:      match[4].trim(),
      });
      match = ROSLYN_PATTERN.exec(output);
    }

    return errors;
  }

  /**
   * Claude API ile kodu lint eder.
   * @param {string} code
   * @returns {Promise<LintError[]>}
   */
  async lintWithClaude(code) {
    try {
      const result = await this.#claude.askJson(
        `Bu C# kodunu kontrol et:\n\`\`\`csharp\n${code}\n\`\`\``,
        LINT_SYSTEM,
      );
      return Array.isArray(result) ? result : [];
    } catch {
      return [];
    }
  }
}
