/**
 * @file TerminalService.js
 * Terminal emülatörü servisi — output yönetimi, komut çalıştırma
 * SRP: Sadece terminal state ve I/O yönetimi
 */

export class TerminalService {
  constructor({ maxLines = 500, mock = import.meta.env.VITE_MOCK_MODE === 'true' } = {}) {
    this.maxLines = maxLines;
    this.mock = mock;
    this.output = [];
    this.history = [];
    this.historyIndex = -1;
    this._subscribers = [];
  }

  /**
   * Output'a satır ekle
   * @param {string} text
   * @param {'log'|'error'|'success'|'warn'} [type]
   */
  appendOutput(text, type = 'log') {
    const lines = String(text).split('\n').filter(l => l !== '');
    const timestamp = new Date().toLocaleTimeString();
    
    for (const line of lines) {
      const entry = { 
        text: line, 
        type, 
        timestamp,
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
      };
      this.output.push(entry);
    }
    
    // maxLines sınırını koru
    if (this.output.length > this.maxLines) {
      this.output = this.output.slice(-this.maxLines);
    }
    
    // Aboneleri bilgilendir
    this._notify();
  }

  /**
   * Terminali temizle
   */
  clear() {
    this.output = [];
    this._notify();  }

  /**
   * Komut çalıştır (mock veya gerçek)
   * @param {string} command
   * @returns {Promise<{success:boolean,output:string}>}
   */
  async executeCommand(command) {
    const trimmed = command.trim();
    if (!trimmed) return { success: true, output: '' };

    // History'e ekle
    this.history.push(trimmed);
    this.historyIndex = this.history.length;

    // Komut prefix'i göster
    this.appendOutput(`$ ${trimmed}`, 'log');

    // Mock modda basit komutları simüle et
    if (this.mock) {
      return this._executeMock(trimmed);
    }

    // Gerçek komut: Termux'ta child_process ile çalıştırılabilir
    return this._executeReal(trimmed);
  }

  /**
   * Mock komut çalıştırıcı
   * @private
   */
  async _executeMock(cmd) {
    await new Promise(r => setTimeout(r, 100 + Math.random() * 200));
    
    const responses = {
      'help': 'Available: help, clear, echo, date, version, ls, pwd',
      'clear': () => { this.clear(); return '✅ Terminal cleared'; },
      'echo': (args) => `> ${args.join(' ')}`,
      'date': () => new Date().toString(),
      'version': 'SarpShellAgect v0.1.0 (mock)',
      'ls': '📁 Program.cs  📁 obj/  📁 bin/  📄 .csproj',
      'pwd': '/data/data/com.termux/files/home/csharp-shell-ide',
      'git': '[Git] Use GitPanel for version control',
      'nuget': '[NuGet] Use NuGetManager for packages',
    };

    const [main, ...args] = cmd.split(/\s+/);
    const handler = responses[main.toLowerCase()];
    
    if (typeof handler === 'function') {      const result = handler(args);
      if (result) this.appendOutput(result, 'success');
      return { success: true, output: result || '' };
    } else if (handler) {
      this.appendOutput(handler, 'success');
      return { success: true, output: handler };
    }

    // Bilinmeyen komut
    this.appendOutput(`❌ Unknown command: ${main}. Type 'help' for list.`, 'error');
    return { success: false, output: `Unknown: ${main}` };
  }

  /**
   * Gerçek komut çalıştırıcı (Termux)
   * @private
   */
  async _executeReal(cmd) {
    try {
      // Termux'ta: fetch ile backend'e proxy veya WebAssembly terminal
      // Şimdilik mock fallback
      return this._executeMock(cmd);
    } catch (err) {
      this.appendOutput(`❌ ${err.message}`, 'error');
      return { success: false, output: err.message };
    }
  }

  /**
   * Output değişikliklerine abone ol
   * @param {(output: Array) => void} callback
   * @returns {() => void} unsubscribe
   */
  subscribe(callback) {
    this._subscribers.push(callback);
    return () => {
      this._subscribers = this._subscribers.filter(cb => cb !== callback);
    };
  }

  /**
   * Aboneleri bilgilendir (private)
   * @private
   */
  _notify() {
    for (const cb of this._subscribers) {
      try { cb([...this.output]); } catch (e) { console.error('[Terminal] Subscriber error:', e); }
    }
  }
  /**
   * Geçmişte gezin (↑ ↓ tuşları için)
   * @param {1|-1} direction
   * @returns {string|null}
   */
  navigateHistory(direction) {
    const newIndex = this.historyIndex + direction;
    if (newIndex < 0 || newIndex > this.history.length) return null;
    this.historyIndex = newIndex;
    return newIndex === this.history.length ? '' : this.history[newIndex] || '';
  }
}

export default TerminalService;
