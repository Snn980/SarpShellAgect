/**
 * @file NuGetService.js
 * NuGet paket yönetimi servisi — mock + gerçek API desteği
 * SRP: Sadece paket arama/kurme/bağımlılık çözme
 */

export class NuGetService {
  constructor({ cache = true, mock = import.meta.env.VITE_MOCK_MODE === 'true' } = {}) {
    this.cache = cache;
    this.mock = mock;
    this._cache = new Map();
    // Mock paket veritabanı (offline geliştirme için)
    this._mockPackages = [
      { id: 'Newtonsoft.Json', version: '13.0.3', desc: 'JSON Framework for .NET' },
      { id: 'Microsoft.Extensions.DependencyInjection', version: '8.0.0', desc: 'DI Container' },
      { id: 'System.Text.Json', version: '8.0.4', desc: 'High-performance JSON API' },
      { id: 'FluentAssertions', version: '6.12.0', desc: 'TDD assertion library' },
      { id: 'xunit', version: '2.8.1', desc: 'Unit testing framework' },
    ];
  }

  /**
   * Paket ara (mock veya gerçek API)
   * @param {string} query
   * @returns {Promise<Array<{id:string,version:string,desc:string}>>}
   */
  async search(query) {
    if (this.mock || !query) return this._mockPackages.filter(p => 
      p.id.toLowerCase().includes(query.toLowerCase())
    );

    // Gerçek NuGet API: https://azuresearch-usnc.nuget.org/query
    try {
      const res = await fetch(
        `https://azuresearch-usnc.nuget.org/query?q=${encodeURIComponent(query)}&prerelease=false&take=10`
      );
      const data = await res.json();
      return data.data.map(p => ({
        id: p.id,
        version: p.versions?.[0]?.version || 'unknown',
        desc: p.description?.slice(0, 100) || ''
      }));
    } catch {
      return this._mockPackages.filter(p => p.id.toLowerCase().includes(query.toLowerCase()));
    }
  }

  /**
   * Paket kur (mock simülasyonu)
   * @param {string} packageId
   * @param {string} [version]
   * @returns {Promise<{success:boolean,name:string,message:string}>}
   */
  async install(packageId, version = 'latest') {
    console.log(`[NuGet] Installing ${packageId}@${version}`);
    
    if (this.mock) {
      await new Promise(r => setTimeout(r, 300)); // Network delay simülasyonu
      return { 
        success: true, 
        name: packageId, 
        message: `✅ [MOCK] ${packageId} kuruldu (simülasyon)` 
      };
    }

    // Gerçek kurulum: Termux'ta dotnet CLI gerektirir
    return { 
      success: false, 
      name: packageId, 
      message: '⚠️ Gerçek NuGet kurulumu için dotnet SDK gereklidir' 
    };
  }

  /**
   * Bağımlılık ağacını çöz
   * @param {string[]} packageIds
   * @returns {Promise<{resolved:string[],conflicts:string[]}>}
   */
  async resolveDependencies(packageIds) {
    // Basit mock implementasyon
    return {
      resolved: packageIds.map(p => `${p}@latest`),
      conflicts: []
    };
  }

  /**
   * Cache'i temizle
   */
  clearCache() {
    this._cache.clear();
    console.log('[NuGet] Cache cleared');
  }
}

export default NuGetService;
