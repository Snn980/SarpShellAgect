# C# Shell .NET IDE — Kurulum Kılavuzu
## Termux + GitHub ile Geliştirme

---

## 1. Termux Hazırlığı

```bash
# Paket listesini güncelle
pkg update && pkg upgrade -y

# Node.js ve Git kur
pkg install nodejs git -y

# Node sürümünü doğrula (18+ gerekli)
node --version
npm --version
```

---

## 2. Projeyi GitHub'dan Al

```bash
# GitHub'a SSH anahtarı ekle (ilk kurulum)
ssh-keygen -t ed25519 -C "termux"
cat ~/.ssh/id_ed25519.pub
# Çıktıyı GitHub → Settings → SSH Keys → New SSH Key'e yapıştır

# Projeyi klonla
git clone git@github.com:KULLANICI_ADI/csharp-shell-ide.git
cd csharp-shell-ide

# Bağımlılıkları yükle
npm install
```

---

## 3. Geliştirme Sunucusunu Başlat

```bash
npm run dev
```

Tarayıcıda açmak için:
- **Termux'ta Firefox/Chrome** → `http://localhost:5173`
- **Başka cihazdaki tarayıcı** → `http://TELEFON_IP:5173`

Telefonun IP'sini bulmak için:
```bash
ip addr show wlan0 | grep 'inet '
```

---

## 4. Klasör Yapısı

```
csharp-shell-ide/
├── index.html
├── vite.config.js
├── package.json
└── src/
    ├── main.jsx               ← React giriş noktası
    ├── App.jsx                ← Ana bileşen
    ├── types/
    │   └── index.js           ← JSDoc tip tanımları
    ├── constants/
    │   ├── models.js          ← Claude modelleri
    │   ├── keywords.js        ← C# anahtar kelimeler
    │   └── snippets.js        ← Kod şablonları
    ├── services/
    │   ├── ClaudeService.js   ← Anthropic API istemcisi
    │   ├── LintService.js     ← Kod denetleyici
    │   └── BuildService.js    ← .NET build / çalıştırıcı
    ├── hooks/
    │   └── index.js           ← useBreakpoint, useLinter, useFileManager, useGitState
    └── modules/
        ├── Editor/
        │   ├── CodeEditor.jsx
        │   └── SyntaxHighlighter.js
        ├── Terminal/
        │   └── Terminal.jsx
        ├── Git/
        │   ├── GitPanel.jsx
        │   └── DiffViewer.jsx
        ├── Import/
        │   └── ImportManager.jsx
        ├── NuGet/
        │   └── NuGetManager.jsx
        ├── Agent/
        │   └── AgentPanel.jsx
        └── Settings/
            └── Settings.jsx
```

---

## 5. GitHub'a Gönder

```bash
# İlk kez
git init
git remote add origin git@github.com:KULLANICI_ADI/csharp-shell-ide.git
git add .
git commit -m "feat: C# Shell IDE v2.0 başlangıç"
git push -u origin main

# Sonraki değişiklikler
git add .
git commit -m "feat: değişiklik açıklaması"
git push
```

---

## 6. OOP Kuralları

| Kural | Açıklama |
|-------|----------|
| ❌ Global singleton | `ClaudeService` her kullanımda `new` ile örneklenir |
| ❌ `any` tipi | Tüm tipler JSDoc `@typedef` ile tanımlanmıştır |
| ❌ `pop/shift` | Dizi güncellemeleri `filter` ve `slice` ile yapılır |
| ✅ Constructor injection | Servisler prop olarak aktarılır |
| ✅ Immutable state | Her güncelleme yeni nesne/dizi döndürür |
| ✅ Private `#field` | `ClaudeService` özel alanları `#` ile işaretlidir |
| ✅ Saf fonksiyonlar | `highlightCode`, `computeDiff` side-effect içermez |

---

## 7. Özellikler

| Özellik | Durum |
|---------|-------|
| Söz dizimi renklendirme | ✅ Phase 1 |
| Hata satırı vurgulama (inline) | ✅ Phase 1 |
| Git diff + commit simülasyonu | ✅ Phase 1 |
| MAF 1.2 Agent Panel | ✅ Phase 1 |
| Import yönetimi | ✅ Phase 1 |
| NuGet AI paket yöneticisi | ✅ Phase 1 |
| Çoklu dosya sekmeleri | ✅ Phase 1 |
| Darknet/ONNX şablonu | ✅ Phase 1 |
| Mobil uyumlu layout | ✅ Phase 2 |
| Gerçek .NET build (DotNet Fiddle) | ✅ Phase 2 |
| MAF Görsel Workflow Tasarımcı | 🔲 Phase 3 |
| Gerçek-zamanlı işbirliği (Yjs) | 🔲 Phase 3 |

---

## 8. Sorun Giderme

```bash
# Port meşgulse
npm run dev -- --port 5174

# node_modules bozuksa
rm -rf node_modules package-lock.json
npm install

# Termux'ta storage izni
termux-setup-storage
```
