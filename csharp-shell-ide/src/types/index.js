/**
 * @file Uygulama genelinde kullanılan tip tanımları (JSDoc)
 * Kural: Bu dosyadaki typedef'ler dışında "any" kullanılmaz.
 */

/**
 * @typedef {'user'|'assistant'} MessageRole
 */

/**
 * @typedef {Object} ApiMessage
 * @property {MessageRole} role
 * @property {string}      content
 */

/**
 * @typedef {Object} ClaudeConfig
 * @property {string} model
 * @property {number} maxTokens
 * @property {string} [systemPrompt]
 */

/**
 * @typedef {Object} OutputLine
 * @property {'output'|'error'|'system'|'cmd'|'info'|'user'|'ai'|'warning'} type
 * @property {string} text
 */

/**
 * @typedef {Object} LintError
 * @property {number}              line
 * @property {number}              col
 * @property {string}              msg
 * @property {'error'|'warning'|'info'} severity
 */

/**
 * @typedef {Object} SourceFile
 * @property {number}  id
 * @property {string}  name
 * @property {string}  content
 * @property {boolean} active
 */

/**
 * @typedef {Object} GitCommit
 * @property {string} hash
 * @property {string} msg
 * @property {string} author
 * @property {string} date
 * @property {number} fileCount
 */

/**
 * @typedef {Object} GitFile
 * @property {string}             name
 * @property {'staged'|'unstaged'} status
 */

/**
 * @typedef {Object} GitState
 * @property {string}     branch
 * @property {string[]}   branches
 * @property {GitCommit[]} commits
 * @property {GitFile[]}  staged
 * @property {GitFile[]}  unstaged
 */

/**
 * @typedef {Object} NuGetPackage
 * @property {string} id
 * @property {string} version
 * @property {string} [desc]
 */

/**
 * @typedef {Object} AppSettings
 * @property {number}  fontSize
 * @property {number}  tabSize
 * @property {boolean} wordWrap
 * @property {boolean} lineNumbers
 * @property {'dark'|'monokai'|'solarized'} theme
 * @property {boolean} autoSave
 */

/**
 * @typedef {Object} Snippet
 * @property {string} label
 * @property {string} code
 * @property {string} [category]
 */

/**
 * @typedef {'mobile'|'tablet'|'desktop'} Breakpoint
 */

export {};
