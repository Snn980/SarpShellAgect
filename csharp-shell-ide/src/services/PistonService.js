// src/services/PistonService.js
export class PistonService {
  constructor({ baseUrl = 'https://emkc.org/api/v2/piston' } = {}) {
    this.baseUrl = baseUrl;
  }

  async execute(code, language = 'csharp') {
    try {
      const res = await fetch(`${this.baseUrl}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language: "csharp",
          version: "6.12.0",           // en stabil versiyon
          files: [{ name: "Program.cs", content: code }],
          stdin: "",
          compile_timeout: 10000,
          run_timeout: 5000
        })
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      const run = data.run || {};

      return {
        success: run.code === 0,
        output: (run.stdout || '').trim(),
        error: (run.stderr || run.compile?.output || 'Derleme hatası').trim()
      };
    } catch (err) {
      console.error(err);
      return { success: false, output: '', error: err.message || 'Piston bağlantı hatası' };
    }
  }
}
