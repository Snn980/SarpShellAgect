/**
 * @file hooks/index.js — Tüm custom hook'lar
 * Kural: Her hook saf fonksiyon, global state YOKTUR.
 */

import { useState, useEffect, useCallback, useRef } from 'react';

// ─── useBreakpoint ────────────────────────────────────────────────────────────

/** @typedef {import('../types/index.js').Breakpoint} Breakpoint */

/**
 * Ekran genişliğini izler, breakpoint döndürür.
 * @returns {Breakpoint}
 */
export function useBreakpoint() {
  const getBreakpoint = () => {
    const w = window.innerWidth;
    if (w < 480) return /** @type {Breakpoint} */ ('mobile');
    if (w < 900) return /** @type {Breakpoint} */ ('tablet');
    return /** @type {Breakpoint} */ ('desktop');
  };

  const [bp, setBp] = useState(getBreakpoint);

  useEffect(() => {
    const handler = () => setBp(getBreakpoint());
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  return bp;
}

// ─── useDebounce ──────────────────────────────────────────────────────────────

/**
 * Değeri belirtilen süre kadar debounce eder.
 * @template T
 * @param {T}      value
 * @param {number} delayMs
 * @returns {T}
 */
export function useDebounce(value, delayMs) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(id);
  }, [value, delayMs]);

  return debounced;
}

// ─── useLinter ────────────────────────────────────────────────────────────────

/** @typedef {import('../types/index.js').LintError}                  LintError    */
/** @typedef {import('../services/LintService.js').LintService}       LintService  */

/**
 * Kodu debounce ile lint eder.
 * @param {string}      code
 * @param {LintService} lintService
 * @param {number}      [delayMs=900]
 * @returns {{ errors: LintError[], linting: boolean }}
 */
export function useLinter(code, lintService, delayMs = 900) {
  const [errors,  setErrors]  = useState(/** @type {LintError[]} */ ([]));
  const [linting, setLinting] = useState(false);

  const debouncedCode = useDebounce(code, delayMs);

  useEffect(() => {
    if (!debouncedCode.trim()) { setErrors([]); return; }

    let cancelled = false;
    setLinting(true);

    lintService.lintWithClaude(debouncedCode).then((result) => {
      if (!cancelled) setErrors(result);
    }).finally(() => {
      if (!cancelled) setLinting(false);
    });

    return () => { cancelled = true; };
  }, [debouncedCode, lintService]);

  return { errors, linting };
}

// ─── useFileManager ───────────────────────────────────────────────────────────

/** @typedef {import('../types/index.js').SourceFile} SourceFile */

/**
 * Çoklu dosya sekmelerini yönetir.
 * @param {SourceFile[]} initial
 * @returns {{
 *   files:        SourceFile[],
 *   activeFile:   SourceFile|undefined,
 *   switchTab:    (id:number)=>void,
 *   newFile:      (name?:string, content?:string)=>void,
 *   closeFile:    (id:number)=>void,
 *   updateActive: (content:string)=>void,
 * }}
 */
export function useFileManager(initial) {
  const [files,  setFiles]  = useState(initial);
  const nextId = useRef(initial.length + 1);

  const activeFile = files.find((f) => f.active);

  const switchTab = useCallback((/** @type {number} */ id) => {
    setFiles((prev) => prev.map((f) => ({ ...f, active: f.id === id })));
  }, []);

  const newFile = useCallback((
    name    = `File${nextId.current}.cs`,
    content = '// Yeni dosya\n',
  ) => {
    const id = nextId.current;
    nextId.current += 1;
    setFiles((prev) => [
      ...prev.map((f) => ({ ...f, active: false })),
      { id, name, content, active: true },
    ]);
  }, []);

  const closeFile = useCallback((/** @type {number} */ id) => {
    setFiles((prev) => {
      if (prev.length <= 1) return prev;
      const remaining = prev.filter((f) => f.id !== id);
      const wasActive = prev.find((f) => f.id === id)?.active ?? false;
      if (!wasActive) return remaining;
      // son dosyayı aktif yap (pop kullanılmaz — slice ile son eleman)
      const last = remaining[remaining.length - 1];
      return remaining.map((f) => ({ ...f, active: f.id === last.id }));
    });
  }, []);

  const updateActive = useCallback((/** @type {string} */ content) => {
    setFiles((prev) => prev.map((f) => (f.active ? { ...f, content } : f)));
  }, []);

  return { files, activeFile, switchTab, newFile, closeFile, updateActive };
}

// ─── useGitState ──────────────────────────────────────────────────────────────

/** @typedef {import('../types/index.js').GitState}  GitState  */
/** @typedef {import('../types/index.js').GitFile}   GitFile   */
/** @typedef {import('../types/index.js').GitCommit} GitCommit */

/** @type {GitState} */
const INITIAL_GIT = {
  branch:   'main',
  branches: ['main', 'develop', 'feature/agent-support'],
  commits: [
    { hash: 'a3f9c2', msg: 'feat: MAF agent panel eklendi',      author: 'Dev', date: '2026-04-28', fileCount: 3 },
    { hash: 'b71e84', msg: 'fix: import manager null ref hatası', author: 'Dev', date: '2026-04-27', fileCount: 1 },
    { hash: 'c90d11', msg: 'init: C# Shell IDE başlangıç',       author: 'Dev', date: '2026-04-25', fileCount: 8 },
  ],
  staged:   [],
  unstaged: [],
};

/**
 * Git durumunu yönetir.
 * @param {string[]} fileNames — izlenen dosya isimleri
 * @returns {{
 *   git:          GitState,
 *   stageFile:    (name:string)=>void,
 *   unstageFile:  (name:string)=>void,
 *   stageAll:     ()=>void,
 *   commit:       (msg:string)=>void,
 *   switchBranch: (branch:string)=>void,
 * }}
 */
export function useGitState(fileNames) {
  const [git, setGit] = useState(() => ({
    ...INITIAL_GIT,
    unstaged: fileNames.map((name) => ({ name, status: /** @type {'unstaged'} */ ('unstaged') })),
  }));

  const stageFile = useCallback((/** @type {string} */ name) => {
    setGit((prev) => ({
      ...prev,
      unstaged: prev.unstaged.filter((f) => f.name !== name),
      staged:   [...prev.staged, { name, status: 'staged' }],
    }));
  }, []);

  const unstageFile = useCallback((/** @type {string} */ name) => {
    setGit((prev) => ({
      ...prev,
      staged:   prev.staged.filter((f) => f.name !== name),
      unstaged: [...prev.unstaged, { name, status: 'unstaged' }],
    }));
  }, []);

  const stageAll = useCallback(() => {
    setGit((prev) => ({
      ...prev,
      staged:   [...prev.staged, ...prev.unstaged.map((f) => ({ ...f, status: /** @type {'staged'} */ ('staged') }))],
      unstaged: [],
    }));
  }, []);

  const commit = useCallback((/** @type {string} */ msg) => {
    setGit((prev) => {
      if (prev.staged.length === 0) return prev;
      /** @type {GitCommit} */
      const newCommit = {
        hash:      Math.random().toString(36).slice(2, 8),
        msg,
        author:    'Dev',
        date:      new Date().toISOString().slice(0, 10),
        fileCount: prev.staged.length,
      };
      return { ...prev, commits: [newCommit, ...prev.commits], staged: [] };
    });
  }, []);

  const switchBranch = useCallback((/** @type {string} */ branch) => {
    setGit((prev) => ({ ...prev, branch }));
  }, []);

  return { git, stageFile, unstageFile, stageAll, commit, switchBranch };
}
