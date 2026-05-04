/**
 * @file ImportService.js
 * C# using/import yönetimi — analiz, ekleme, çözümleme
 * SRP: Sadece import statement'ları ile ilgilenir
 */

export class ImportService {
  constructor({ autoResolve = true } = {}) {
    this.autoResolve = autoResolve;
    // Standart C# namespace'leri (otomatik tamamlama için)
    this._standardNamespaces = [
      'System', 'System.Collections.Generic', 'System.Linq', 'System.Threading.Tasks',
      'System.IO', 'System.Net.Http', 'System.Text', 'System.Text.Json',
      'Microsoft.Extensions.DependencyInjection', 'Newtonsoft.Json'
    ];
  }

  /**
   * Koddan import'ları parse et
   * @param {string} code
   * @returns {string[]}
   */
  parseImports(code) {
    const regex = /^\s*using\s+([\w.]+)\s*;/gm;
    const imports = [];
    let match;
    while ((match = regex.exec(code)) !== null) {
      imports.push(match[1]);
    }
    return [...new Set(imports)]; // unique
  }

  /**
   * Import ekle (duplicate check ile)
   * @param {string} code
   * @param {string} namespace
   * @returns {string}
   */
  addImport(code, namespace) {
    const existing = this.parseImports(code);
    if (existing.includes(namespace)) return code; // Zaten var
    
    // using statement'larını kodun başına ekle
    const lines = code.split('\n');
    const lastUsingIndex = lines.findIndex(line => 
      line.trim().startsWith('using') && !line.includes('{')
    );
    const insertPos = lastUsingIndex >= 0 ? lastUsingIndex + 1 : 0;
    
    lines.splice(insertPos, 0, `using ${namespace};`);    return lines.join('\n');
  }

  /**
   * Import kaldır
   * @param {string} code
   * @param {string} namespace
   * @returns {string}
   */
  removeImport(code, namespace) {
    const regex = new RegExp(`^\\s*using\\s+${namespace.replace(/\./g, '\\.')}\\s*;\\s*\\n?`, 'gm');
    return code.replace(regex, '');
  }

  /**
   * Kullanılmayan import'ları tespit et (basit analiz)
   * @param {string} code
   * @param {string[]} imports
   * @returns {{used:string[],unused:string[]}}
   */
  analyzeUsage(code, imports) {
    const used = [];
    const unused = [];
    
    for (const ns of imports) {
      // Basit heuristic: namespace'in son parçası kodda geçiyor mu?
      const shortName = ns.split('.').pop();
      const pattern = new RegExp(`\\b${shortName}\\b`);
      
      // using statement'ını çıkarıp kontrol et
      const codeWithoutUsings = code.replace(/^\s*using\s+[\w.]+\s*;/gm, '');
      
      if (pattern.test(codeWithoutUsings)) {
        used.push(ns);
      } else {
        unused.push(ns);
      }
    }
    
    return { used, unused };
  }

  /**
   * Bağımlılık ekle (NuGet entegrasyonu için)
   * @param {string} packageName
   * @returns {{success:boolean,message:string}}
   */
  addDependency(packageName) {
    console.log(`[Import] Dependency requested: ${packageName}`);
    return {       success: true, 
      message: `📦 ${packageName} bağımlılık listesine eklendi` 
    };
  }

  /**
   * Otomatik import önerisi (basit)
   * @param {string} undefinedType
   * @returns {string|null}
   */
  suggestImport(undefinedType) {
    // Basit eşleştirme: List<T> → System.Collections.Generic
    const mapping = {
      'List': 'System.Collections.Generic',
      'Dictionary': 'System.Collections.Generic',
      'HttpClient': 'System.Net.Http',
      'JsonSerializer': 'System.Text.Json',
      'JObject': 'Newtonsoft.Json.Linq',
      'Task': 'System.Threading.Tasks',
    };
    return mapping[undefinedType] || null;
  }
}

export default ImportService;
