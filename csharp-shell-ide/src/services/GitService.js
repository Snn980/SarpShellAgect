// src/services/GitService.js - Mock Implementation
export class GitService {
  constructor({ mock = true } = {}) {
    this.mock = mock;
    this.status = { modified: [], staged: [], untracked: [] };
  }

  async getStatus() {
    if (this.mock) return this.status;
    // Gerçek git komutları buraya (Termux'ta child_process ile)
    return this.status;
  }

  async getDiff(filePath) {
    return { 
      oldContent: '// Önceki kod...', 
      newContent: '// Yeni kod...', 
      hunks: [],
      stats: { additions: 0, deletions: 0 }
    };
  }

  async commit(message) {
    console.log(`[Git] Commit: ${message}`);
    return { success: true, hash: 'mock-' + Math.random().toString(36).slice(2, 8), timestamp: Date.now() };
  }

  async push(remote = 'origin', branch = 'main') {
    if (this.mock) return { success: true, message: '[MOCK] Push başarılı' };
    // Gerçek push implementasyonu
    return { success: false, message: 'Gerçek push henüz implemente edilmedi' };
  }

  async pull(remote = 'origin', branch = 'main') {
    return { success: this.mock, changes: 0, message: this.mock ? '[MOCK] Güncel' : 'Pull failed' };
  }

  async init() {
    this.status = { modified: [], staged: [], untracked: ['Program.cs'] };
    return { success: true };
  }
}
export default GitService;