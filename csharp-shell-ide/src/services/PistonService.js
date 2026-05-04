// src/services/PistonService.js
export class PistonService {
  constructor({ baseUrl, timeout = 12000 } = {}) {
    this.baseUrl = baseUrl || 'https://emkc.org/api/v2/piston';
    this.timeout = timeout;
  }

  async execute(code, language = 'csharp', stdin = '') {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeout);

    try {
      const res = await fetch(`${this.baseUrl}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          language,
          version: language === 'csharp' ? '6.12.0' : 'latest',
          files: [{ name: 'script.cs', content: code }],
          stdin,
          run_timeout: 5000
        })
      });

      clearTimeout(timer);
      if (!res.ok) throw new Error(`Piston HTTP ${res.status}`);

      const data = await res.json();
      const run = data.run;
      return {
        success: run?.code === 0,
        output: run?.output?.trim() || '(No output)',
        error: run?.stderr?.trim() || (data.compile?.output?.trim() || 'Build failed')
      };
    } catch (err) {
      clearTimeout(timer);
      if (err.name === 'AbortError') throw new Error('⏱️ Zaman aşımı');
      throw err;
    }
  }
}
